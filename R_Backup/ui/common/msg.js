define(['jquery', 'underscore', 'backbone', 'domo', 'i18n'],
function($, _, Backbone, domo, i18n) {

var Msg = Backbone.View.extend({
  events: {
    'click a':  'onClick'
  },

  actions: null,

  addActions: function($container, actions) {
    if(!_.isArray(actions)) actions = [actions];

    this.actions = actions;
    _.each(actions, function(action, index) {
      $container.append('&nbsp;').append(domo.A({
        'class': 'xaction',
        'data-index': index,
        'href': '#'
      }, i18n.gettext(action.name)));
    }, this);
  },

  error: function(msg, action) {
    var key = msg.msg || msg;
    this.$info.text('').hide();
    this.$error.html(i18n.gettext(key));
    this.$error.show();
    action && this.addActions(this.$error, action)
  },

  findAction: function(el) {
    var index = parseInt(el.getAttribute('data-index'));
    if(!isNaN(index)) {
      return this.actions && this.actions[index];
    }
  },

  info: function(msg, action) {
    var key = msg.msg || msg;
    this.$error.text('').hide();
    this.$info.html(i18n.gettext(key));
    this.$info.show();
    action && this.addActions(this.$info, action)
  },

  onClick: function(e) {
    var action = this.findAction(e.currentTarget);
    if(action) {
      action.callback(action);
    } else {
      DBG && console.warn('unhandled action click');
    }
  },

  render: function() {
    this.$error = this.$el.find('.xerror');
    this.$info = this.$el.find('.xmsg');
    this.reset();
    return this;
  },

  reset: function() {
    this.$error.empty().hide();
    this.$info.empty().hide();
  },

  setMsg: function(options) {
    options || (options = {});
    if(_.isString(options)) {
      options = { info: options };
    }
    if(options.error) {
      this.error(options.error);
    } else if(options.info) {
      this.info(options.info);
    }
  },

  start: function(name, options) {
    this.setMsg(options);
  },

  stop: function(name, options) {
    // Clear old message
    this.$info.empty();
    this.$info.hide();
    this.setMsg(options);
  }

});

Msg = new Msg({
  el: $('#msg')[0]
}).render();

Msg.start('init', { info: 'Loading' });

return Msg;

});
