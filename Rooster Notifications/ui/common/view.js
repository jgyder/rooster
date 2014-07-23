define(['domo', 'jquery', 'backbone', 'i18n', 'common/core'],

function(domo, $, Backbone, i18n, Core) {

// Base class of all views. Enable a hierarchy of views.
var
Base = Backbone.View.extend({

  name: 'Base',

  domo: domo,

  bubbleEvent: function(name) {
    this.parent && this.parent.trigger(name);
  },

  bubbleAddEvent: function() {
    this.bubbleEvent('child:add');
  },

  bubbleRemoveEvent: function() {
    this.bubbleEvent('child:remove');
  },

  getRoot: function() {
    if(this.parent) {
      return this.parent.getRoot();
    }
    return this;
  },

  grabFocus: function() {
    // Focus first field
    this.$el.find('[value=""], input:not([value])').first().focus();
  },

  initialize: function(options) {
    options || (options = {});
    this.options = options;
    // TODO Use selective bind calls?
    _.bindAll.apply(_, [this].concat(_.functions(this)));
    this.children = [];
    this.name = options.name || this.name;
    options.parent && this.setParent(options.parent);
    this.listenTo(this, 'child:add', this.bubbleAddEvent);
    this.listenTo(this, 'child:remove', this.bubbleRemoveEvent);
    this.model && this.$el.attr('data-id', this.model.id);

    this.$el.attr('viewclass', this.name);

    this.postInit(options);
  },

  postInit: function(options) { },

  remove: function() {
    if(!this._removed) {
      this._removed = true;
      this.setParent(null);
      this.removeChildren();
      this.trigger('remove', this);
      Backbone.View.prototype.remove.call(this);
    }
  },

  removeChildren: function() {
    _.each(this.children.slice(0), function(child) {
      child.remove();
      this.trigger('child:remove');
    }, this);
  },

  setParent: function(parent) {
    if(this.parent) {
      // Remove from old parent
      this.parent.children = _.without(this.parent.children, this);
      this.parent.trigger('child:remove', this);
    }
    this.parent = parent;
    if(this.parent) {
      // Add to new parent
      this.parent.children.push(this);
      this.parent.trigger('child:add', this);
    }
  }

}),

Activable = Base.extend({

  name: 'Activable',

  active: true,

  setActive: function(active) {
    if(this.active != active) {
      this.active = active;
      this.trigger('active', active);
    }
  }
}),

/**
 * Most commonly used base class for views.
 */
ActionProvider = Activable.extend({

  name: 'ActionProvider',

  /**
   * Statically defined actions.
   */
  actions: {},

  /**
   * Returns cumulative actions with context
   */
  getActions: function() {
    if(this.active) {
      return _.reduce(this.children, function(memo, child) {
        return _.extend(memo, child.getActions && child.getActions());
      }, contextify(this));
    }

    function contextify(view) {
      return _.reduce(view.actions, function(memo, action, name) {
        memo[name] = _.extend({ context: view }, action);
        return memo;
      }, {});
    }
  }
}),

Form = ActionProvider.extend({

  name: 'Form',

  tagName: 'form',

  events: {
    'submit':   'event_submit',
    'keypress': 'event_keypress'
  },

  event_keypress: function(e) {
    if(e.keyCode == '\r'.charCodeAt(0)) {
      return this.onSubmit();
    }
  },

  event_submit: function(e) {
    return this.onSubmit();
  },

  // Clear value of all fields in this form
  clear: function() {
    this.$el.find('input').val('');
    // TODO Unckeck checkboxes, radios and deselect selects.
  },

  onError: function(errors) { },

  onSubmit: function() {
    var errors = this.validateFields();
    if(!_.isEmpty(errors)) {
      this.onError(errors);
      return false;
    }
    return this.submit();
  },

  /**
   * Subclass should override this method to submit form via ajax and return
   * false to prevent default handling.
   */
  submit: function() {
    return true;
  },

  validateFields: function() {
    return null;
  }

}),

SimpleForm = Form.extend({

  name: 'SimpleForm',

  className: 'form-horizontal',

  fields: [],

  afterRender: function() {},

  onError: function(errors) {
    _.each(this.editors, function(editor) {
      editor.validate();
    });
  },

  render: function() {
    this.$el.attr({
      action: this.options.action||'',
      method: this.options.method||'post'
    });
    this.renderEditors();
    return this;
  },

  renderEditors: function() {
    var self = this;
    require(['common/editor'], function(Editor) {
      self.editors = _.map(self.fields, function(field) {
        var editor = Editor.create(field.type, {
          param: field,
          parent: self,
          model: self.model,
          label: field.label,
          form: true
        });
        self.el.appendChild(editor.render().el);
        return editor;
      });
      self.afterRender();
    })
  },

  validateFields: function() {
    var errors = _.filter(this.editors, function(editor) {
      return !editor.isValid();
    }, this);
    return errors;
  }

}),

FramedApp = ActionProvider.extend({

  name: 'FramedApp',

  getAppURL: function() {
    return this.model.get('host') + '/' + this.name + '#' + this.model.id;
  },

  initialize: function(options) {
    ActionProvider.prototype.initialize.call(this, options);
    this.options = options;
    this.responseHandlers = {};
  },

  initializeFrame: function() {
    window.addEventListener('message', _.bind(this.onMessage, this));
  },

  onMessage: function(e) {
    if(e.source != this.iframe.contentWindow ||
      this.model.get('host') != e.origin) return;

    // Type check for different versions of IE
    var data = (typeof e.data === 'string') ? JSON.parse(e.data) : e.data;
    if(data.type == 'response') {
      var handler = this.responseHandlers[data._id];
      if(handler) {
        delete this.responseHandlers[data._id];
        handler(data.err, data.data);
      }/* else {
        // Somebody else's handler
      }*/
    } else if(data.type == 'event') {
      this.trigger('app', data.data, this);
      if(typeof this['on_' + data.data.type] == 'function') {
        this['on_' + data.data.type](data.data);
      }
    } else {
      console.error('Unhandled message type:', data);
    }
  },

  request: function(path, data, callback) {
    var _id = Core.ID();
    callback || (callback = function(){});
    this.responseHandlers[_id] = callback;
    var msg = {
      _id: _id,
      type: 'request',
      path: path,
      data: data
    };
    window.IE && (msg = JSON.stringify(msg));
    this.iframe.contentWindow.postMessage(msg, this.model.get('host'));
  },

  render: function() {
    this.rendered = true;
    this.iframe = domo.IFRAME({
      frameborder: 0,
      src: this.getAppURL(),
      style: 'width: 100%;'
    });
    this.iframe.onload = _.bind(this.initializeFrame, this);
    this.$el.append(this.iframe);
    return this;
  }

}),

Routed = ActionProvider.extend({

  name: 'Routed',

  getRouter: function() {
    return this.parent.getRouter();
  },

  /**
   * Route prefix.
   */
  routePrefix: function() {
    var prefix = this.options.routePrefix;
    return _.isUndefined(prefix) ? this.name : prefix;
  },

  /**
   * Call to route to a fragment. Any new view that should be stored in 
   * application's state should be opened using application router.
   */
  route: function(frags) {
    frags = _.toArray(arguments);
    frags.unshift(_.result(this, 'routePrefix'));
    this.parent.route(frags.join('/'));
  },

  /*
   * Usually called by application router after navigating to a new URL. A
   * view's state is determined by location. As a result, it should always be
   * possible to arrive at a view given a location.
   */
  show: function(id) {
    if(this.model) {
      if(this.model.id == id) {
        return;
      }
      this.removeModelView();
    }
    this.model = this.collection.get(id);
    if(this.model) {
      // XXX Why do we call it here? Do clients need to implement it?
      return this.showModelView(this.model);
    } else {
      return this.show404();
    }
  },

  show404: function() {
    return false;
  },

  showModelView: function() {
    throw new Error(this.name + ' does not support showModelView.');
  }

}),

RoutedRoot = Routed.extend({
  name: 'RoutedRoot',

  postInit: function() {
    var self = this;
    this.on('child:add child:remove', _.debounce(this.updateActions, 10));
  },

  route: function(fragment) {
    //console.log('route:', fragment, this.name);
    this.router.navigate((fragment || ''), true);
  },

  getRouter: function() {
    return this.router;
  },

  setRouter: function(router) {
    this.router = router;
  },
  
  updateActions: function() {
    Core.Acts.setActions(this.getActions());
  }

}),

Dropdown = ActionProvider.extend({

  name: 'Dropdown',

  tagName: 'ul',

  className: 'dropdown-menu',

  hide: function() {
    this.$el.remove();
    this.removeChildren();
    this.stopListening();
    $(window).off('click', this.onAClick).off('keypress', this.onAKeypress);
    this.id = null;
  },

  onAClick: function(e) {
    var target = e.target;
    // 1. Ignore click events on the `a, a > .caret`
    // 2. Ignore clicks on nodes that were removed.
    // 3. Ignore clicks within another dropdown-popup
    if(($.contains(document.documentElement, target) ||
        document.documentElement == target
      ) &&
      !$.contains(this.el, target) &&
      $(target).parents('.dropdown-menu').length == 0) {
      this.hide();
    }
  },

  onAKeypress: function(e) {
    if(e.key == 'Esc') {
      this.hide();
    }
  },

  renderMenu: function() {
    // Render menu body
  },

  show: function() {
    var
    ref = this.ref,
    offset = $(ref).offset();

    $(this.el).css({
      display: 'block',
      left: 0
    }).css({
      top: offset.top + ref.offsetHeight,
      left: Math.min(offset.left,
        $('body').width() - this.el.offsetWidth)
    });

  },

  toggle: function(id, ref) {
    if(this.id === id) {
      this.hide();
      return;
    }

    if(this.id) this.hide();

    this.id = id;
    this.ref = ref;

    this.renderMenu();
    this.$el.appendTo('body');
    this.show();

    _.defer(function(self) {
      $(window).click(self.onAClick).keypress(self.onAKeypress);
    }, this);
  }

}),

// A Panel is a view with three components: toolbar, body and footer.
Panel = ActionProvider.extend({

  name: 'Panel',

  className: 'xpanel',

  bodyClass: 'xpanel-body',

  headerClass: 'xpanel-header',

  title: 'Title',

  postInit: function(options) {
    _.extend(this, _.pick(options, 'toolbarActions', 'title', 'view'));
    this.view && this.listenTo(this.view, 'remove', this.remove);
  },

  remove: function() {
    this.view && this.view.remove();
    ActionProvider.prototype.remove.call(this);
  },

  render: function() {
    var
    views = [],
    header = this.renderHeader(),
    view = this.renderView(),
    footer = this.renderFooter();

    if(header) views.push(DIV({ 'class': this.headerClass}, header));
    views.push(view);
    if(footer) views.push(footer);
    this.$el.append(views);

    return ActionProvider.prototype.render.call(this);
  },

  renderHeader: function() {
    var extraEl, actions;

    header = DIV(
      actions = DIV({ 'class': 'xtbar pull-right' }),
      H3(i18n.gettext(this.title), (extraEl = SMALL()))
    );

    _.each(this.toolbarActions, function(action, index){
      actions.appendChild(
        A(_.extend({
          'class': index == 0 ? 'btn btn-primary' : 'btn'
        }, action.attrs), i18n.gettext(action.label))
      );
    });

    this.options.titleEx && 
      (extraEl.innerHTML = i18n.gettext(this.options.titleEx));

    return header;
  },

  renderFooter: function() {},

  renderView: function() {
    return this.view.render().el;
  }

}),

Modal = Panel.extend({

  name: 'Modal',

  actions: { 'modal close': { fn: 'action_discard' } },

  toolbarActions: [
    {
      label: '✕',
      attrs: {
        'data-action': 'modal close',
        'class': 'close',
        title: i18n.gettext('a_window_close')
      }
    }
  ],

  action_discard: function() {
    this.remove();
  },

  initialize: function(options) {
    // XXX We set parent as root to order actions.
    options.parent = options.parent.getRoot();
    Modal.__super__.initialize.call(this, options);
  },

  remove: function() {
    Modal.__super__.remove.call(this);
  },

  render: function() {
    Modal.__super__.render.call(this);
    var
    opts = this.options,
    top = opts.top === void 0 ? 50 : opts.top,
    wrapped = this.el,
    parent = this.el.parentNode,
    wrap = domo.DIV({ 'class': 'xmodal' },
      wrapped,
      domo.DIV({ 'class': 'xbg' })
    );

    parent && parent.appendChild(wrap);
    this.el = wrap;
    this.$el = Backbone.$(this.el);
    $(wrapped).css(_.pick(opts, 'height', 'width')).addClass('xraised');
    if(opts.position == 'fixed') {
      this.$el.css({ position: 'fixed', top: top });
    } else {
      this.$el.css('top', $(window).scrollTop()+top);
    }
    return this;
  },

  /**
   * Render and show this modal.
   */
  show: function() {
    $('body').append(this.render().el);
    this.grabFocus();
  }

}),

SaveDiscardModal = Modal.extend({

  action_discard: function() {
    this.trigger('discard');
  },

  action_save: function() {
    this.trigger('save');
  },

  renderFooter: function() {
    var footer = DIV({ 'class': 'form-actions btn-toolbar centered' },
      this.save = BUTTON({
        'class': 'btn btn-primary',
        'data-loading-text': i18n.gettext('l_loading')
      }, i18n.gettext(this.options.a_save || 'a_save')
      ),
      this.discard = BUTTON({ 'class': 'btn' }, i18n.gettext('a_discard'))
    );
    this.discard.onclick = this.action_discard;
    this.save.onclick    = this.action_save;
    return footer;
  },

  showProgress: function(show) {
    if(show === false) {
      $(this.save).button('reset');
    } else {
      $(this.save).button('loading');
    }
  }

}),

PromptModal = SaveDiscardModal.extend({

  title: i18n.gettext('l_prompt'),

  a_save: 'a_save',

  toolbarActions: null,

  action_discard: function() {
    this.trigger('discard');
    this.remove();
  },

  renderView: function() {
    return DIV({ 'class': 'form-horizontal' },
      LABEL({ 'class': 'control-label'}, this.options.msg||'Enter value'),
      DIV({ 'class': 'controls'},
        this.view.render().el,
        this.alert = DIV({ 'class': 'alert alert-error hide' })
      )
    )
  },

  showAlert: function(msg) {
    //console.log('alert:', msg);
    if(msg) {
      $(this.alert).html(msg).removeClass('hide').removeClass('invisible');
    } else {
      $(this.alert).addClass('invisible');
    }
  }

}),

Collection = Routed.extend({

  name: 'Collection',

  /**
   * Add an item to the list of items to be previewed and return the view.
   */
  addOne: function(model) {
    throw new Error('addOne not implemented!');
  },

  initialize: function(options) {
    var self = this;

    this.collection = options.collection || options.model;
    this.views = {};

    this.listenTo(this.collection, 'add', function(model) {
      self.views[model.id] = self.addOne(model);
    });
    this.listenTo(this.collection, 'remove', this.removeOne);
    this.listenTo(this.collection, 'reset', this.onReset);

    Routed.prototype.initialize.call(this, options);
  },

  onReset: function(collection, options) {
    this.resetList(options.previousModels);
    if(this.rendered) {
      this.renderList();
    }
  },

  removeOne: function(model) {
    var view = this.views[model.id];
    if(view) {
      view.remove();
      delete this.views[model.id];
    }
  },

  render: function() {
    this.renderBase();
    this.renderList();
    this.rendered = true;
    return this;
  },

  renderBase: function() {
    // By deafault do nothing. Clients may override to create custom scaffolding
  },

  renderList: function() {
    var self = this;

    this.views = this.collection.reduce(function(memo, model) {
      memo[model.id] = self.addOne(model);
      return memo;
    }, this.views);

  },

  resetList: function(oldModels) {
    _.each(oldModels, this.removeOne);
  }

}),

// A special class that shows an item's detail view in addition to the list.
Entities = Collection.extend({

  name: 'Entities',

  ViewClass: Base,

  /**
   * Removes window and associated data with current window
   */
  removeModelView: function() {
    if(this.modelView) {
      this.modelView.remove();
    }
    this.modelView = this.model = null;
  },

  // Render the view at appropriate position.
  renderModelView: function(model, view) {
    throw new Error('Override renderModelView()');
  },

  showModelView: function(model) {
    if(!this.ViewClass) {
      throw new Error('ViewClass not set.', model);
    }
    if(this.modelView) {
      if(this.modelView.model == model) {
        return;
      }
      this.removeModelView();
    }
    // Currently active model's view
    this.modelView = new this.ViewClass({
      model: model,
      parent: this
    });

    this.renderModelView(model, this.modelView);
  }

}),

/**
 */
Summary = Base.extend({

  name: 'Summary',

  className: 'xsummary',

  initialize: function(options) {
    Base.prototype.initialize.call(this, options);
  },

  render: function() { with(domo) {
    this.$el.append(
      DIV(CLS('xmask')),
      DIV(CLS('xinfo'))
    );
  }}

});

return {
  ActionProvider: ActionProvider,
  Activable: Activable,
  Base: Base,
  Collection: Collection,
  Dropdown: Dropdown,
  Entities: Entities,
  Form: Form,
  FramedApp: FramedApp,
  Modal: Modal,
  PromptModal: PromptModal,
  Panel: Panel,
  Routed: Routed,
  RoutedRoot: RoutedRoot,
  SaveDiscardModal: SaveDiscardModal,
  SimpleForm: SimpleForm,
  Summary: Summary
};

});
