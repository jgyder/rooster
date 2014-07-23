define(['jquery', 'underscore', 'async', 'domo', 'backbone', 'i18n',
  'common/msg', 'common/view'],

function($, _, async, domo, Backbone, i18n, Msg, View) {

var Browser = View.FramedApp.extend({
  name: 'browser',

  initHander: function(err, data) {
    if(err) {
      console.error(this.name + ':init:error:', err);
    } else {
      this.trigger('init', data);
    }
  },

  input: function() {
    return { id: this.model.get('brwsr_id') };
  },

  on_close: function(event) {
    this.trigger('close');
  },

  on_preview: function(event) {
    this.trigger('change:preview', event);
  },

  on_ready: function(event) {
    this.request('init', this.input(), this.initHander);
  },

  on_size: function(event) {
    this.iframe.setAttribute('height', event.data.height);
  },

  on_title: function(event) {
    this.trigger('change:title', event);
  }

});

return {
  Browser: Browser
}

});
