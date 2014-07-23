require([
'jquery',
'backbone', 
'async', 
'common/const',
'common/core',
'common/msg',
'root/api',
'root/views/login',
'bootstrap'
],

function($, Backbone, async, C, Core, Msg, Api, Login) {
  var login = new Login({
    el: $('#login')[0]
  });
  login.$el.find('[value=""], input:not([value])').first().focus();

  login.on('done', function(user) {
    // Show post registration message
    reg.remove();
  });

  // Start history and demo after document load (for iframes in IE).
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

