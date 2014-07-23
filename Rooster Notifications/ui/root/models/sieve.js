define(['backbone', './base', 'paginator', 'i18n', 'moment', 'common/rules',
  'common/core', 'common/msg', 'common/const', 'common/editor', 'common/view',
  'root/api', 'supports'],

function(Backbone, base, Paginator, i18n, moment, Rules, Core, Msg, C, Editor,
  View, Api, Supports) {

var
Model = base.Model,
Collection = base.Collection,

Schedule = Backbone.Model.extend({
  defaults: function () {
    return {
      // Type of schedule
      type: 'INTERVAL',
      // Input parameters for schedule
      params: {
        interval: 1800  // Interval in seconds
      }
    }
  },

  getShortDisplayText: function() {
    // TODO Return human readable text in shortest possible length of chars.
    var attrs = this.attributes,
      interval = attrs.params && attrs.params.attributes.interval;
    if(!interval) {
      return i18n.gettext('m_never');
    }
    var unit, value;
    if(interval < 60) {
      unit = 'second';
      value = interval;
    } else if(interval < 3600) {
      unit = 'minute';
      value = interval/60;
    } else if(interval < 86400) {
      unit = 'hour';
      value = interval/3600;
    } else if(interval < 2592000) {
      unit = 'day';
      value = interval/86400;
    } else {
      return i18n.gettext('m_never');
    }
    value = Math.round(value);
    return i18n.translate('m_1_'+unit)
      .ifPlural(value, i18n.gettext('m_n_'+unit))
      .fetch(value);
  },

  parse: function(response) {
    response.params = new Backbone.Model(response.params, { parse: true });
    return response;
  },

  toJSON: function() {
    var json = Schedule.__super__.toJSON.call(this);
    json.params = json.params.toJSON();
    return json;
  }

}),

LocatorDescList = [
{
  type: 'css',
  label: 'l_css_selector',
  params: [{
    label: 'l_css_selector',
    help: 'h_css_selelctor',
    must: true,
    name: 'expr',
    type: 'css'
  }]
},
{
  type: 'js',
  label: 'l_js',
  params: [{
    label: 'l_js',
    help: 'h_js',
    must: true,
    name: 'expr',
    type: 'js'
  }]
},
{
  type: 'xpath',
  label: 'l_xpath',
  params: [{
    label: 'l_xpath',
    help: 'h_xpath',
    must: true,
    name: 'expr',
    type: 'xpath'
  }]
}
],

Locator = Backbone.Model.extend({
  defaults: {
    type: 'xpath'
  }
}),

Locators = Backbone.Collection.extend({
  model: Locator,
  initialize: function(attrs, options) {
    this.frame = options.frame;
  }
}),

Frame = Backbone.Model.extend({
  parse: function(response) {
    response.excludes = new Locators(response.excludes, {
      parse: true,
      frame: this
    });
    response.includes = new Locators(response.includes, {
      parse: true,
      frame: this
    });
    return response;
  },

  toJSON: function() {
    var json = Frame.__super__.toJSON.call(this);
    json.excludes = json.excludes.toJSON();
    json.includes = json.includes.toJSON();
    return json;
  }
}),

Frames = Backbone.Collection.extend({
  model: Frame
}),

Page = Backbone.Model.extend({
  addLocator: function(frameConfig, op, attrs) {
    var
    frames = this.get('frames'),
    frame = frames.findWhere({ index: frameConfig.index }),
    locator = new Locator(attrs);

    if(!frame) {
      frame = new Frame(frameConfig, { parse: true });
      frames.add(frame);
    }

    if(op == 'EXCLUDE') {
      frame.get('excludes').add(locator);
    } else {
      frame.get('includes').add(locator);
    }
    return locator;
  },

  getLocator: function(frameIndex, id) {
    var
    frames = this.get('frames'),
    frame = frames.findWhere({ index: frameIndex });

    return frame.get('excludes').get(id) || frame.get('includes').get(id);
  },
  
  parse: function(response) {
    response.frames = new Frames(response.frames, { parse: true });
    return response;
  },

  removeLocator: function(frameIndex, id) {
    var
    frames = this.get('frames'),
    frame = frames.findWhere({ index: frameIndex }),
    excludes = frame.get('excludes'),
    includes = frame.get('includes'),
    model;

    if((model = excludes.get(id))) {
      excludes.remove(model);
    } else if((model = includes.get(id))) {
      includes.remove(model);
    } else {
      throw new Error('Frame does not contain selection with id: ' + id);
    }
  },

  toJSON: function() {
    var json = Page.__super__.toJSON.call(this);
    json.frames = json.frames.toJSON();
    return json;
  }
}),

Pages = Backbone.Collection.extend({
  model: Page
}),

SieveConfigFeed = Backbone.Model.extend(),

SieveConfigHTML = Backbone.Model.extend({
  __structure__: {
    includeStyle: false,
    includeScript: false,
    selections: [{
      title: 'Distill',
      uri: 'http://distill.io',
      frames: [{
        // Frame's load index in page used to find the frame to interact.
        index: 0, 
        // Frame's uri, to be used as matching criteria when index is variable.
        uri: 'http://distill.io',
        // List of expressions used to remove elements from page
        excludes: [{
          // Type of locator
          type: 'xpath',
          // Input to the locator
          expr: ''
        }],
        // List of expressions used to include elements in page
        includes: [{
        }]
      }]
    }]
  },

  defaults: {
    includeStyle: false,
    dataAttr: 'text'
  },

  getExcludes: function() {
    var selections = this.get('selections').toJSON();
    return _.chain(selections)
      .pluck('frames')
      .flatten()
      .pluck('excludes')
      .flatten()
      .value();
  },

  getIncludes: function() {
    var selections = this.get('selections').toJSON();
    return _.chain(selections)
      .pluck('frames')
      .flatten()
      .pluck('includes')
      .flatten()
      .value();
  },

  isEmpty: function() {
    return this.getIncludes().length == 0;
  },

  parse: function(response) {
    response.selections = new Pages(response.selections, { parse: true });
    return response;
  },

  toJSON: function() {
    var json = SieveConfigHTML.__super__.toJSON.call(this);
    json.selections = json.selections.toJSON();
    return json;
  }
}),

Sieve = Model.extend({

  encodedFields: ['config', 'schedule'],

  urlRoot: '/sieves',

  clone: function() {
    // XXX Using a hammer for now. Later, nest clone calls for child models.
    return new Sieve(this.toJSON(), { parse: true });
  },

  getExcludes: function() {
    // XXX Valid only in a webpage's context.
    var config = this.get('config');
    return (config && config.getExcludes()) || [];
  },

  getIncludes: function() {
    // XXX Valid only in a webpage's context.
    var config = this.get('config');
    return (config && config.getIncludes()) || [];
  },

  // Returns list of label ids
  getTags: function(fromTags) {
    var
    tag,
    tags = [],
    tagIds = (this.get('tags') || '').split(',');

    _.each(tagIds, function(id) {
      tag = fromTags.get(id);
      tag && tags.push(tag);
    });
    return tags;
  },

  isEmpty: function() {
    return this.get('content_type') == C.TYPE_HTML && this.getIncludes().length == 0;
  },

  isRead: function() {
    return moment(this.get('ts_view')) > moment(this.get('ts_data'));
  },

  // Override parse to create models for nested properties.
  parse: function(response) {
    response = Sieve.__super__.parse.call(this, response);

    if(response.config) {
      if(response.content_type == C.TYPE_FEED){
        response.config = new SieveConfigFeed(response.config);
      } else if(response.content_type == C.TYPE_HTML) {
        response.config = new SieveConfigHTML(response.config, { parse: true });
      } else {
        throw new Error('Unknow content type: ', response.content_type);
      }
    }

    if(response.schedule) {
      response.schedule = new Schedule(response.schedule, { parse: true });
    }
    return response;
  }
  // NOTE No need to override toJSON since encodedFields takes care of the rest.

}),

Sieves = base.PagedCollection.extend({

  model: Sieve,

  paginator_ui: {
    currentPage: 0,
    perPage: 50
  },

  url: '/sieves'

}),

SieveDataPager = base.PagedCollection.extend({

  initialize: function(models, options) {
    this.parent = options.parent;
  },

  url: function() {
    return ['/sieves', this.parent.id, 'data'].join('/');
  }
}),

SieveRule = Model.extend({
  encodedFields: ['config'],
  urlRoot: '/rules',

  defaults: function() {
    return {
      config: {
        type: Rules.TYPE_RULE_GROUP,
        op: Rules.OP_AND,
        rules: [/*{
          type: Rules.TYPE_RULE,
          contentType: Rules.CONTENT_TYPE_TEXT,
          rule: {
            type: Rules.RULE_HAS_TEXT,
            params: { input: '' }
          }
        }*/]
      }
    }
  }
}),

Work = Model.extend({

  encodedFields: ['err', 'data']

}),

Works = Collection.extend({

  model: Work,

  initialize: function(models, options) {
    this.parent = options.parent;
    this.on('add', this.onAdd, this);
  },

  onAdd: function(model) {
    model.parent = this.parent;
  },

  url: function() {
    return ['/sieves', this.parent.id, 'works'].join('/');
  }

}),

UserAttr = Model.extend({
  urlRoot: '/users/attrs'
}),

UserAttrs = Collection.extend({
  model: UserAttr,
  url: '/users/attrs'
}),

// TODO Move to view class
AttrEditor = View.PromptModal.extend({

  name: 'AttrEditor',

  initialize: function(options) {
    var
      attrs = this.attrs = options.attrs,
      param = this.param = options.param,
      model = this.model = new Backbone.Model(),

      editor = Editor.create(param.type, {
        model: model,  // populate a pre-existing value
        param: param
      });

    _.extend(options, {
      msg: i18n.sprintf(
        i18n.gettext('a_action_object'),
        i18n.gettext('a_add'),
        i18n.gettext(this.param.label)
      ),
      view: editor
    });

    AttrEditor.__super__.initialize.call(this, options);

    this.on('save', this.onSave);
  },

  onSave: function() {
    // Perform validations etc.
    var self = this, name = this.param.name, value = this.model.get(name);

    var attr = this.attrs.where({ name: name, value: value });
    if(attr.length > 0 && this.param.multi !== true) {
      alert('Err! Entered ' + name + ' already exists.');
      return;
    }

    this.attrs.create({
      name: name,
      value: value
    }, {
      error: function() {
        alert('Err! Failed to add ' + this.param.name);
      },
      success: function(model) {
        //console.log('attr.save() success', model.toJSON());

        if(model.get('state') == 10) {  // STATE_ATTR_VERIFY
          // Prompt verification dialog
          self.showVerificationPrompt(model);
        }
        self.remove();
      }
    })
  },

  showVerificationPrompt: function(model) {
    //console.log('showVerificationPrompt()');

    var
    codeEditor = Editor.create('text', {
      param: {
        label: 'l_verification_code',
        must: true,
        name: 'code'
      },
      parent: this.parent
    }),

    modal = new View.PromptModal({
      a_save: 'a_verify',
      title: 'l_verification_req',
      msg: i18n.sprintf(
        i18n.gettext('m_verification_code'),
        model.get('name')
      ),
      parent: this.parent.getRoot(),
      width: 500,
      top: this.options.top,
      view: codeEditor
    });

    modal.on('save', function() {
      modal.showProgress();

      Api.api('/users/verify/'+model.id+'/'+codeEditor.getValue(), 'POST', null,
      function(err, res) {
        modal.showProgress(false);
        modal.showAlert(false);
        if(err) {
          var msg = typeof res == 'object' ? res.msg : res
          console.error('err:', err);
          modal.showAlert('Verification Failed! '+msg);
        } else {
          modal.remove();
        }
      });
    });

    modal.show();
  }

}),

// TODO Move plugin to a separate module? We are mixing models and views.
UserAttrOptionsPlugin = Editor.SelectOptionsPlugin.extend({

  action_add: function() {
    //console.log('action_add');

    var attrEditor = new AttrEditor({
      attrs: this.attrs,
      param: _.omit(this.param, 'plugins'),
      parent: this.editor.getRoot(),
      width: 400,
      top: $(this.editor.field).offset().top - 100
    }),

    self = this;

    attrEditor.show();
  },

  fetch: function() {
    this.attrs.fetch({ data: { name: this.param.name } });
  },

  load: function() {
    this.attrs = new UserAttrs();

    this.listenTo(this.editor, 'reset', _.bind(this.fetch, this));
    this.listenTo(this.attrs, 'sync', _.bind(this.loadData, this));

    this.fetch();
    $(this.separator).attr('label', i18n.gettext('l_loading'));
  },

  renderActions: function() {
    // Currently disable ability to add a new email
    if(this.param.name == 'email') return;

    this.select.appendChild(
      OPTION({ value: 'action:add', tag: 'action', style:'font-style:italics' },
        i18n.sprintf(
          i18n.gettext('a_action_object'),
          i18n.gettext('a_add'),
          i18n.gettext(this.param.label)
        )
      )
    );
  },

  unload: function() {
    UserAttrOptionsPlugin.__super__.unload.call(this);
    this.attrs.reset();
  }
}),

UserSignInCheckPlugin = Editor.Plugin.extend({

  onSignIn: function() {
    // TODO Initiate sign in process
    var self = this;
    require(['root/views/settings'], function(SettingsViews) {
      var view = new SettingsViews.SignInModal({
        parent: self.editor.getRoot(),
        onSignIn: function() {
          $(self.editor.field).show();
          $(self.a).hide();
          self.editor.trigger('reset');
        }
      });

      view.show();
    });
  },

  render: function() {
    if(Supports.agents.local && !Supports.isSignedIn()) {
      this.a = A({ href: 'javascript:void 0'}, B(' Sign in '), 'to continue');  // TODO i18n
      $(this.editor.field).hide().after(this.a);
      this.a.onclick = _.bind(this.onSignIn, this);
    }
  }
}),

AudioPlayer = Editor.Plugin.extend({
  render: function() {
    var
    field = this.editor.field,
    a = A({ href: 'javascript:void 0' }, i18n.gettext('a_play'));

    $(field).after(' ', a);
    a.onclick = function() {
      var audio = AUDIO({ src: field.value });
      $(field).after(audio);
      audio.play();
    }
  }
}),

SieveActionDescList = [
{
  type: C.ACTION_LOCAL_POPUP,
  label: 'l_action_local_popup',
  'default': true,
  single: true, // single == true <= params == []
  isSupported: function(Supports) { return Supports.agents.local },
  params: []
},
{
  type: C.ACTION_LOCAL_AUDIO,
  label: 'l_action_local_audio',
  'default': true,
  single: true, // single == true <= params == []
  isSupported: function(Supports) { return Supports.agents.local },
  params: [{
    label: 'l_tone',
    help: 'h_tone',
    name: 'tone',
    type: 'enum',
    must: true,
    list: [{
      label: 'l_bell_strike',
      value: '/skin/media/bell_strike.ogg'
    }],
    plugins: [AudioPlayer]
  }]
},
{
  type: C.ACTION_PUSH,
  label: 'l_action_push',
  'default': true,
  single: true, // params == [] => single == true and a boolean
  isSupported: function(Supports) { return Supports.user && Supports.agents.web },
  params: []
},
{
  type: C.ACTION_EMAIL,
  label: 'l_action_email',
  // If this action should be added to the default list of actions.
  single: true,
  'default': true,
  // Check to know if the action is supported in current context. 
  isSupported: function(Supports) { return Supports.user && Supports.email },
  params: [{
    label: 'l_email_addr',
    help: 'h_email_addr',
    must: true,
    name: 'email',
    type: 'email',
    plugins: [UserAttrOptionsPlugin, UserSignInCheckPlugin]
  }]
},
{
  type: C.ACTION_SMS,
  label: 'l_action_sms',
  single: true,
  isSupported: function(Supports) { return Supports.user && Supports.phone },
  params: [{
    label: 'l_phone',
    help: 'h_phone',
    must: true,
    name: 'phone',
    type: 'phone',
    plugins: [UserAttrOptionsPlugin]
  }]
}
/*
,
{
  type: C.ACTION_MACRO,
  label: 'l_action_macro',
  isSupported: function(Supports) { return Supports.agents.web },
  params: [{
    label: 'l_macro',
    help: 'h_macro',
    must: true,
    name: 'input',
    type: 'macro'
  }]
}
*/
],

SieveAction = Model.extend({

  encodedFields: ['config'],

  /**
   * A reference to parent (sieve).
   */
  parent: null,

  defaults: function() {
    return { type: this.desc && this.desc.type }
  },

  initialize: function(attrs, options) {
    this.parent = options && options.parent;
  },
  
  urlRoot: function() {
    var parent = this.parent;
    if(parent == null) throw new Error('Parent sieve not set for action');
    return '/sieves/' + parent.id + '/actions';
  }

}),

SieveActions = Collection.extend({

  initialize: function(models, options) {
    this.parent = options.parent;
    this.on('add', this.onAdd, this);
  },

  onAdd: function(action) {
    action.parent = this.parent;
  },

  // Create action model based on action type.
  parse: function(response) {
    response = SieveActions.__super__.parse.call(this, response);
    return _.map(response, function(attrs) {
      return new SieveAction[attrs.type](attrs, {
        parse: true,
        parent: this.parent
      });
    }, this);
  },

  url: function() {
    return ['/sieves', this.parent.id, 'actions'].join('/');
  }

});

_.each(SieveActionDescList, function(desc) {
  SieveAction[desc.type] = SieveAction.extend({ desc: desc },  { desc: desc });
});

return {
  LocatorDescList: LocatorDescList,
  Frame: Frame,
  Frames: Frames,
  Page: Page,
  Pages: Pages,
  Schedule: Schedule,
  Sieve: Sieve,
  SieveConfigFeed: SieveConfigFeed,
  SieveConfigHTML: SieveConfigHTML,
  Sieves: Sieves,
  SieveDataPager: SieveDataPager,
  SieveRule: SieveRule,
  SieveActionDescList: SieveActionDescList,
  SieveAction: SieveAction,
  SieveActions: SieveActions,
  Works: Works,

  // Action Type constants
  
  ACTION_EMAIL: C.ACTION_EMAIL,
  ACTION_SMS: C.ACTION_SMS,
  ACTION_PUSH: C.ACTION_PUSH
  /*
  ,
  ACTION_MACRO: ACTION_MACRO
  */
};

});
