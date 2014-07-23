require([
'jquery',
'backbone', 
'async', 
'common/const',
'common/core',
'common/msg',
'root/api',
'root/views/password',
'bootstrap'
],

function($, Backbone, async, C, Core, Msg, Api, Password) {
  var view = new Password.ForgotPassword({
    el: $('#password')[0]
  });

  view.on('done', function(user) {
    // Show success message?
  });

  // Start after document load (for iframes in IE).
  $(function() {
    Api.init(function(err, api) {
      if(err) {
        Msg.stop('init', { error: { msg: 'err:api_load' } });
        throw new Error('Failed to init api subsystem:' + err);
      } else {
        Msg.stop('init');
      }
    });
  });

});

