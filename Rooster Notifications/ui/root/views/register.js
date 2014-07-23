define(['jquery', 'underscore', 'root/api', 'backbone', 'common/msg',
  'common/view2', 'common/editor'],

function($, _, Api, Backbone, Msg, View, Editor) {

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

Register = View.PreRenderedForm.extend({

  name: 'Register',

  fields: [{
    name: 'invite_id',
    type: 'hidden'
  }, {
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
    this.model || (this.model = new Backbone.Model());
    Register.__super__.postInit.apply(this, arguments);
  },

  submit: function() {
    var
    self = this,
    btn = this.$el.find('[type=submit]'),
    model = this.model,
    data = model.toJSON();

    console.log('register form data:', data);

    btn.button('loading');
    Msg.info('l_loading');
    $.ajax({
      url: _.isEmpty(data.invite_id) ?  '/register' : '/register_invite',
      type: 'POST',
      data: data,
      error: function() {
        btn.button('reset');
        console.log('error:', arguments);
        Msg.error('Registration failed. Please check input parameters and try again.');  // TODO i18n
      },
      success: function(user) {
        Msg.reset();
        btn.button('reset');
        console.log('success');
        self.trigger('done', user, model, this);
      }
    });
    return false;
  }

});

return Register;

});

