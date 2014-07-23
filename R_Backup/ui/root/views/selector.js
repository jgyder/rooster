define(['service', 'i18n', 'common/msg', 'common/view'],
function(Service, i18n, Msg, View) {

var
Selector = View.Base.extend({

  tagName: 'a',

  attributes: { href: '#' },

  events: {
    'click': 'event_click'
  },

  close: function() {
    this.loader && this.loader.destroy();
  },

  event_click: function() {
    this.loader && chrome.tabs.update(this.loader.tabId, {
      active: true
    });
  },

  render: function() {
    this.$el.text(i18n.gettext('h_opening_selector_in_new_tab')).css({
      margin: 20
    });

    setTimeout(this.renderTab, 400);

    return this;
  },

  renderTab: function() {
    var self = this;
    Service.createLoader({
      type: 'tab',
      // TODO Open a getting started page to guide new users
      info: {
        active: false,
        pinned: false,
        after: 'activeTab',
        url: self.model.get('uri') || 'https://www.google.com',
      }
    }, function(err, loader) {
      self.loader = loader;
      if(err) {
        console.error('err:', err);
        Msg.error('e_sel_na');
      } else {
        self.loader = loader;
        setTimeout(function() {
          chrome.tabs.update(loader.tabId, { active: true });
        }, 600);
        // Open selector UI for the tab.
        Service.openSelectorForTabLoader({
          loader: loader,
          model: self.model.toJSON(),
          client: document
        }, self.selectorCallback);
        self.$el.text(i18n.gettext('h_opened_selector_in_tab'));
      }
    });
  },

  selectorCallback: function(err, modelJSON) {
    console.log('selectorCallback:', err, modelJSON);

    // Parse JSON again since the object's prototype from extension is not
    // modifiable.
    modelJSON && (modelJSON = JSON.parse(JSON.stringify(modelJSON)));

    // Bring foucs back to this tab.
    chrome.tabs.getCurrent(function(tab) {
      chrome.tabs.update(tab.id, { active: true });
    });

    if(err) {
      Msg.error(err.msg || err.message || err);
    } else {
      if(!modelJSON) {
        this.trigger('discard');
        Msg.info('m_selection_discarded');
      } else {
        this.model.set(this.model.parse(modelJSON));
        this.trigger('save', this.model);
        Msg.info('m_selection_saved');
      }
    }
  }
}),

SelectorModal = View.Modal.extend({
  name: 'SelectorModal',

  actions: {
    'selector discard': {
      fn: 'action_discard'
    }
  },

  title: i18n.gettext('l_visual_selector'),

  toolbarActions: [{
    label: 'a_discard',
    attrs: {
      'data-action': 'selector discard',
      'class': 'btn'
    }
  }],

  action_discard: function() {
    this.remove();
    this.options.callback();
  },

  initialize: function(options) {
    var
    self = this,
    selector = this.selector = new Selector(_.pick(options, 'model', 'parent'));

    // Forward discard and save events/requests to host application.
    this.listenTo(this.selector, 'discard', function() {
      self.remove();
      options.callback();
    });

    this.listenTo(this.selector, 'save', function(model) {
      self.remove();
      options.callback(null, model);
    });

    _.defaults(options, {
      width: 400,
      height: 120,
      view: this.selector
    });

    View.Modal.prototype.initialize.call(this, options);
  },

  remove: function() {
    SelectorModal.__super__.remove.call(this);
    this.selector.close();
  }
});

return { Modal: SelectorModal }
});
