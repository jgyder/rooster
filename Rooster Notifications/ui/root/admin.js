require([
'async',
'jquery',
'backbone', 
'common/const',
'common/core',
'common/store',
'common/msg',
'common/view',
'root/api', 
'root/models/admin',
'root/views/admin',
'bootstrap'
],

function(async, $, Backbone, Const, Core, Store, Msg, View, Api, AdminModel,
  AdminView) {

var user = window.USER;
var root = new View.RoutedRoot({ el: $('#content') });

function App(options) {

  var Router = Backbone.Router.extend({

    routes: {
      '':                     'index',
      'invite_requests/':     'invite_requests',
      'invite_requests/:id':  'invite_requests'
    },

    index: function() {
      this.invite_requests();
    },

    invite_requests: function(id) {

      if(!viewInviteRequests) {
        viewInviteRequests = new AdminView.InviteRequests({
          collection: new AdminModel.InviteRequests(),
          el: $('div#InviteRequests')[0],
          parent: root,
          routePrefix: 'invite_requests'
        }).render();
      }
      id ? viewInviteRequests.show(id) : viewInviteRequests.showDefault();
      showView(viewInviteRequests);
    }

  });

  var viewInviteRequests, viewUsers;

  this.store = new Store();
  this.router = new Router();

  $('#topbar li.admin').addClass('active');
  $('.btn').button();

  root.setRouter(this.router);

  var currentView = null;

  function showView(view) {
    if(view == currentView) return;

    $('#' + view.name).show();

    $('.xsubnav li')
      .removeClass('xactive')
        .filter('.'+view.name)
        .addClass('xactive');

    if(currentView) {
      currentView.setActive(false);
      $(currentView.el).addClass('hide');
    }
    view.setActive(true);
    $(view.el).removeClass('hide');
    currentView = view;

    Core.Acts.setActions(root.getActions());
  }

}

window.App = new App();

// Start history and demo after document load (for iframes in IE).
$(function() {
  Api.init(function(err, api) {
    if(err) {
      Msg.stop('init', { error: { msg: 'err:api_load' } });
      throw new Error('Failed to init api:' + err);
    } else {
      Msg.stop('init');
      Backbone.history.start({ root: '/admin/', pushState: true });
    }
  });
});

});
