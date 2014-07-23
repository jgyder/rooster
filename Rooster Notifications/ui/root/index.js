define([
'async',
'jquery',
'backbone', 
'common/core',
'common/store',
'common/msg',
'common/view',
'root/api', 
'root/models/label',
'root/models/sieve',
'root/views/search',
'root/views/label',
'root/views/sieve',
'bootstrap'
],

function(async, $, Backbone, Core, Store, Msg, View, Api, LabelModel, Models,
  SearchForm, LabelView, Sieve) {

var
sieves = new Models.Sieves(null, {
  comparator: function(model) {
    return -model.get('ts_data');
  }
}),
labels = new LabelModel.Labels(),
user = window.USER,
store = new Store();

function render() {
  Msg.start('init', { info: 'l_loading' });

  labels.fetch({
    data: {
      _opt: {
        order: ['name'],
        limit: 1000
      }
    },
    success: function() {
      $('#content').removeClass('hide');
      Backbone.history.start({ root: ROUTE_ROOT, pushState: PUSH_STATE });
      Msg.stop('init');
    },
    error: function() {
      Msg.stop('init', { error: 'err:fetch' });
    }
  });
}

var Root = View.RoutedRoot.extend({
  actions: {
    'sieve add': {
      fn: 'action_add'
    }
  },

  action_add: function() {
    App.sieveList.action_new();
  }
});

function Inbox(options) {

  var Router = Backbone.Router.extend({

    routes: {
      '':                     'index',
      'inbox(/:id)':          'inbox',
      'label/:name(/:id)':    'label',
      'search/':              'search',
      'search/:query(/:id)':  'search',
      'trash(/:id)':          'trash',
      'unlabeled(/:id)':      'unlabeled',
      'unread(/:id)':         'unread'
    },

    index: function() {
      this.navigate('/inbox', { trigger: true });
    },

    inbox: function(id) {
      //console.log('route:inbox');
      sieveList.showInbox(id);
      showView(sieveList);

      labelNavList.highlight('inbox');
    },

    label: function(name, id) {
      //console.log('route:label');
      var result = labels.where({ name: name });
      if(result.length > 0) {
        sieveList.showLabel(result[0], id);
        showView(sieveList);

        labelNavList.highlight('label/'+name);
      } else {
        Msg.error('e_label_na');
      }
    },

    search: function(query, id) {
      //console.log('route:search', query);
      if(query == void 0) {
        this.navigate('/inbox', { trigger: true });
        return;
      }
      sieveList.showSearch(query, id);
      showView(sieveList);

      labelNavList.highlight('search');
    },

    trash: function(id) {
      //console.log('route:trash');
      sieveList.showTrash(id);
      showView(sieveList);

      labelNavList.highlight('trash');
    },

    unlabeled: function(id) {
      //console.log('route:unlabeled', id);
      sieveList.showUnlabeled(id);
      showView(sieveList);

      labelNavList.highlight('unlabeled');
    },

    unread: function(id) {
      //console.log('route:unread', id);
      sieveList.showUnread(id);
      showView(sieveList);

      labelNavList.highlight('unread');
    }
  });

  this.sieves = sieves;
  this.labels = labels;
  this.store = store;
  this.user = user;
  this.router = new Router();

  $('.btn').button();

  var root = this.root = new Root({ el: document.body });
  root.setRouter(this.router);

  var search = new SearchForm({
    el: $('.form-search')[0]
  });

  var sieveList = this.sieveList = new Sieve.Sieves({
    collection: sieves,
    labels: labels,
    el: $('#list')[0],
    parent: root,
    routePrefix: 'inbox'
  }).render();

  var labelNavList = this.labelNavList = new LabelView.LabelNavList({
    collection: labels,
    el: $('.xsidebar > ul')[0],
    parent: root
  }).render();

  root.on('child:add child:remove', _.debounce(function() {
    Core.Acts.setActions(root.getActions());
  }, 100));

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

window.App = new Inbox();

// Start history and app after document load (for iframes in IE).
$(function() {
  Api.init(function(err, api) {
    if(err) {
      Msg.stop('init', { error: { msg: 'err:api_load' } });
      throw new Error('Failed to init api:' + err);
    } else {
      Msg.stop('init');
      render();
    }
  });
});

return window.App;
});
