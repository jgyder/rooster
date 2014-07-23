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
'root/models/sieve',
'root/views/sieve',
'root/views/invite',
'bootstrap'
],

function(async, $, Backbone, Const, Core, Store, Msg, View, Api, Models, Sieve,
  Invite) {

var sieves = new Models.Sieves();
var user = window.USER;
var store = new Store();

function renderDemo() {
  $('#demos').removeClass('hide');
  $('.xcallto').removeClass('hide');

  DBG && console.log('renderDemo()');

  Msg.start('fetch', { info: 'l_loading' });

  // Fetch resources for demo.
  async.map([sieves], function(collection, callback) {
    collection.fetch({
      data: {
        'state.in': [Const.STATE_INIT, Const.STATE_READY]
      },
      error: function() {
        callback("Failed to fetch resource");
      },
      success: function() {
        callback()
      }
    });
  }, function(err) {
    Msg.stop('fetch', err && { error: 'err:fetch' });
    if(err) {
      console.error('fetch:', err);
    } else {
      App.render();
      Backbone.history.start({ root: '/demo/', pushState: true });
    }
  });
}

function renderDemoLogin() {
  $('#demologin').removeClass('hide').modal({
    backdrop: false,
    keyboard: false
  });
  $('#demologin button').click(login);
  setTimeout(function() {
    $('#demologin button').trigger('click').button('loading');
  }, 400);
}

function login() {
  $('#demologin button').button('l_loading');
  $('#demologin msg').removeClass('err').text();
  $.ajax({
    url: '/login',
    type: 'POST',
    data: { id: 'demo', password: 'demo' },
    error: function(jqxhr, status, error) {
      $('#demologin button').button('reset');
      $('#demologin .status').addClass('err').text(jqxhr.responseText);
      console.error('error:', status, error);
    },
    success: function(data) {
      $('#demologin button').button('reset');
      $('#demologin').remove();
      $('body').removeClass('anon').addClass('user');
      //location.reload();
      renderDemo();
    }
  });
}

function DemoApp(options) {
  var DemoRouter = Backbone.Router.extend({

    routes: {
      '':                   'sieve',
      'sieves/':            'sieve',
      'sieves/:id':         'sieve'
    },

    sieve: function(id) {
      showView(sieve);
      id ? sieve.show(id) : sieve.showDefault();
    }
  });

  this.sieves = sieves;
  this.store = store;
  this.user = user;
  this.router = new DemoRouter();

  $('#topbar li.demo').addClass('active');
  $('.btn').button();

  var root = new View.RoutedRoot({ el: $('#demo') });
  root.setRouter(this.router);

  var sieve = new Sieve.Sieves({
    collection: sieves,
    el: $('#list')[0],
    parent: root,
    routePrefix: 'items'
  }).render();

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

  // Start history and demo after document load (for iframes in IE).
  $(function() {
    Api.init(function(err, api) {
      DBG && console.log('api_init callback', api);
      if(err) {
        Msg.stop('init', {
          error: {
            msg: 'err:api_load'
          }
        });
        throw new Error('Failed to init api subsystem:' + err);
      } else {
        Msg.stop('init');
        user ? renderDemo() : renderDemoLogin();
      }
    });
    $('.xinvite').each(function() { new Invite({ el: this }); });
  });

  this.render = function() {
  }
}

// XXX main script vs. module.
window.App = new DemoApp();

});
