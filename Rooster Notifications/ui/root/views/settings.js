define(['jquery', 'underscore', 'async', 'domo', 'i18n', 'moment', 'backbone',
  'common/const', 'common/msg', 'common/view', 'common/editor', 'supports',
  'service'],

function($, _, async, domo, i18n, moment, Backbone, C, Msg, View, Editor,
  Supports, Service) {
  // TODO Create sign in/settings view for webapp and for addon.

var

CheckPlugin = Editor.Plugin.extend({
  // URL to the API ot check for attribute's availability
  urlCheck: '',
  checkValue: function(value) {
    var self = this;

    this.indicator.removeClass('hide');
    this.msg.addClass('hide');
    Api.api(this.urlCheck, 'POST', { value: value }, function(err, res) {
      self.indicator.addClass('hide');
      self.msg.removeClass('hide');

      if(res.available) {
        self.editor.$el.addClass('success').removeClass('error');
        self.msg.text('Available! ');     // i18n
      } else {
        self.editor.$el.addClass('error').removeClass('success');
        self.msg.text('Not available!');  // i18n
      }
    });
  },
  load: function(param, editor) {
    this.listenTo(editor, 'change', _.bind(this.onChange, this));
  },
  onChange: function(editor, value) {
    this.checkValue(value);
  },
  render: function() {
    var indicator, msg;
    $(this.editor.field).after(
      indicator = SPAN({ 'class': 'help-inline hide' },
        I({ 'class': 'icon-refresh icon-spin' }),
        'Checking availability'
      ),
      msg = SPAN({ 'class': 'help-inline hide' })
    );
    this.indicator = $(indicator);
    this.msg = $(msg);
  }
}),

CheckEmailPlugin = CheckPlugin.extend({
  urlCheck: '/isavailable/email'
}),

CheckNamePlugin = CheckPlugin.extend({
  urlCheck: '/isavailable/name'
}),

// TODO For now we redirect to distil.io/register. Do not redirect once we
// have fully integration user management actions in the extension.
RegisterForm = View.SimpleForm.extend({

  name: 'RegisterForm',

  fields: [{
    must: true,
    name: 'full_name',
    type: 'text'
  }, {
    must: true,
    name: 'email',
    type: 'email',
    plugins: [CheckEmailPlugin]
  }, {
    must: true,
    name: 'name',
    type: 'text',
    plugins: [CheckNamePlugin]
  }, {
    must: true,
    name: 'password',
    type: 'password'
  }],

  postInit: function() {
    this.model = new Backbone.Model();
    Register.__super__.postInit.apply(this, arguments);
  },

  submit: function() {
    var
      self = this,
      btn = this.$el.find('[type=submit]'),
      model = this.model;

    console.log('form data:', model.toJSON());

    btn.button('loading');
    Api.api('/users', 'POST', model.toJSON(), function(err, res, xhr) {
      btn.button('reset');
      if(err) {
        // TODO Show error message
      } else {
        self.trigger('done', user, model, this);
      }
    });
    return false;
  }

}),

SignInForm = View.SimpleForm.extend({

  name: 'SignInForm',

  fields: [{
    must: true,
    name: 'name',
    type: 'text',
    label: 'l_name'
  }, {
    must: true,
    name: 'password',
    type: 'password',
    label: 'l_password'
  }],

  render: function() {
    SignInForm.__super__.render.call(this);
    this.$el.append(
      DIV({ 'class': 'control-group' },
        this.msg = SMALL({ 'class': 'help' })
      )
    );
    return this;
  },

  showMsg: function(msg, error) {
    if(!msg) {
      this.msg.textContent = '';
    } else {
      this.msg.textContent = i18n.gettext(msg);
    }

    $(this.msg)[error ? 'addClass' : 'removeClass']('error');
  },

  submit: function() {
    this.trigger('submit');
    return false;
  }

}),

SignInModal = View.SaveDiscardModal.extend({

  name: 'SignInModal',

  action_discard: function() {
    this.remove();
    //this.options.onCancel();
  },

  action_save: function() {
    this.view.onSubmit();
  },

  checkLogin: function(callback) {
    var
    self = this,
    params = {
      name: this.model.get('name'),
      password: this.model.get('password')
    };

    if(_.isEmpty(params.name) || _.isEmpty(params.password)) return;

    this.showProgress(true);
    // TODO Clear previous messages
    self.view.showMsg('l_loading');
    Service.auth.check(params, function(err, user) {
      self.showProgress(false);
      if(err) {
        console.error('checkLogin:err?', err);
        self.view.showMsg(err.msg||err.messag||'e_signin_invalid', true);
      } else {
        self.view.showMsg('m_login_success');
      }
      callback && callback(err, _.extend(params, user));
    });
  },

  initialize: function(options) {
    var model = this.model = new Backbone.Model({
      name: Service.auth.getName()
    });

    this.listenTo(this.view, 'submit', this.saveLogin);
  },

  renderFooter: function() {
    var footer = SignInModal.__super__.renderFooter.call(this);
    footer.appendChild(
      A({
        href: Service.CFG.URL.ROOT + '/register?client=chrome',
        // Style to offset font-size:0 due to .btn-toolbar
        style: 'font-size: 14px;margin-left:5px;vertical-align:middle;',
        target: '_blank'
      }, i18n.gettext('a_register'))
    );
    return footer;
  },

  saveLogin: function() {
    var self = this;
    this.checkLogin(function(err, res) {
      if(!err && res) {
        self.showProgress(true);
        Service.auth.save(res, function(err) {
          self.showProgress(false);
          if(err) {
            self.view.showMsg(err.msg||err.messag||'e_signin_invalid', true);
          } else {
            self.remove();
            self.options.onSignIn && self.options.onSignIn();
          }
        });
      }
    });
  }

}),

Settings = View.ActionProvider.extend({

  tagName: 'form',

  actions: {
    'settings signin': { fn: 'action_signin' }
  },

  action_signin: function() {
    new SignInModal({
      parent: this,
      onSignIn: this.showCred
    }).show();
  },

  onSave: function() {
    this.saveValues();
    this.trigger('save');
  },

  render: function() {
    this.$el.empty().append(
      FIELDSET(
        LEGEND(i18n.gettext('l_account')),
        this.elCred = A({ href: '#', 'data-action': 'settings signin' })
      ),

      FIELDSET(
        LEGEND(i18n.gettext('l_actions')),
        LABEL({ 'class': 'checkbox' },
          INPUT({ type: 'checkbox', name: 'actions.popup' }),
          'Enable Popup Notification'
        ),
        LABEL({ 'class': 'checkbox' },
          INPUT({ type: 'checkbox', name: 'actions.audio' }),
          'Enable Audio Notification'
        )
      )
    );
    this.setValues();
    return this;
  },

  saveValues: function() {
    this.$el.find('.checkbox').each(function() {
      var el = this.children[0];
      Service.store.Prefs.set(el.name, el.checked);
    });
  },

  setValues: function() {
    this.$el.find('.checkbox').each(function() {
      var el = this.children[0];
      el.checked = Service.store.Prefs.get(el.name, true);
    });
    this.showCred();
  },

  showCred: function() {
    var self = this;
    Service.auth.get(function(err, cred) {
      if(cred) {
        $(self.elCred).empty().append(
          SPAN(i18n.sprintf(i18n.gettext('l_signed_in_as'), cred.name))
        );
      } else {
        $(self.elCred).empty().append(B(i18n.gettext('a_signin')));
      }
    });
  }

}),

SettingsModal = View.SaveDiscardModal.extend({

  action_discard: function() {
    this.remove();
    //this.options.onCancel();
  },

  action_save: function() {
    this.view.onSave();
  },

  initialize: function(options) {
    _.defaults(options, {
      title: 'l_settings',
      width: 500,
      view: new Settings({ parent: options.parent })
    });
    SettingsModal.__super__.initialize.call(this, options);

    this.listenTo(this.view, 'save', this.remove);
  }
})
;

return {
  SignInModal: SignInModal,
  SettingsModal: SettingsModal
}

});
