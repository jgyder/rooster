require([
'jquery',
'backbone', 
'async', 
'common/core',
'common/msg',
'root/api',
'root/views/profile',
'root/views/account-settings',
'root/views/password',
'bootstrap'
],

function($, Backbone, async, Core, Msg, Api, Profile, AccountSettings,
  Password) {

var
views = {
  profile: new Profile({ el: $('#profile')[0] }),
  account: new AccountSettings({ el: $('#account')[0] }),
  password: new Password.ChangePassword({ el: $('#password')[0] })
},
currentView,

Router = Backbone.Router.extend({

  routes: {
    ':view':          'view'
  },

  view: function(name) {
    currentView && currentView.$el.addClass('hide');
    currentView = views[name];
    currentView && currentView.$el.removeClass('hide');
    $('#topbar .xsubnav li').removeClass('xactive')
      .find('a[data-action-param='+name+']').parent().addClass('xactive');
  }
}),

router = new Router() ;

window.views = views;

Core.Acts.setActions({
  nav: {
    context: window,
    fn: function(name) {
      Backbone.history.navigate(name, true);
    }
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
      Backbone.history.start({ root: '/settings', pushState: true });
    }
  });
});

});

