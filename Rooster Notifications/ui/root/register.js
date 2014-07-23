require([
'jquery',
'backbone', 
'async', 
'common/const',
'common/core',
'common/msg',
'root/api',
'root/views/register',
'bootstrap'
],

function($, Backbone, async, C, Core, Msg, Api, Register) {
  var reg = new Register({
    el: $('#register')[0]
  });
  reg.$el.find('[value=""], input:not([value])').first().focus();

  reg.on('done', function(user) {
    // Show post registration message
    reg.remove();
    if(user.email_state == C.STATE_ATTR_VERIFY) {
      $('#post-register-verify').removeClass('hide');
    } else {
      $('#post-register-login').removeClass('hide');
    }
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

