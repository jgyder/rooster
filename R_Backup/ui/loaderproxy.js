// Runs in chrome content and acts as a proxy to a loader. Currently used in
// visual selector to load and inspect content.

define(['backbone'], function(Backbone) {

function LoaderProxy(port) {
  var self = this;

  _.extend(self, Backbone.Events);

  port.onMessage.addListener(function(msg) {
    if(msg.type == 'loader') {
      // 1. Set state
      // 2. Dispatch events
    }
  });

  port.onDisconnect.addListener(function() {
    // TODO Ask host frame to destroy this selector and shutourselves down
  });

  function LoaderPortProxy(port) {
    var self = this;
    _.extend(self, Backbone.Events);
  }

}

return LoaderProxy;
});
