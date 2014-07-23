define(['qs', 'jquery', 'underscore', 'async', 'common/router', 'service'],
function(qs, $, _, async, Router, Service) {

var
// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
methodMap = {
  'create': 'POST',
  'update': 'PUT',
  'patch':  'PATCH',
  'delete': 'DELETE',
  'read':   'GET'
},
Api = {
  version: '0.0.1',
  api: api,
  batch: batch,
  init: init
},
// TODO How do we store data for server and local data?
router = new Router({
  routes: [{
    list: true,
    path: '/sieves',
    store: Service.store.SieveStore
  }, {
    path: '/sieves/:id',
    store: Service.store.SieveStore
  }, {
    list: true,
    path: '/sieves/:sieve_id/actions',
    store: Service.store.ActionStore
  }, {
    path: '/sieves/:sieve_id/actions/:id',
    store: Service.store.ActionStore
  }, {
    list: true,
    path: '/sieves/:sieve_id/data',
    store: Service.store.SieveDataStore
  }, {
    path: '/sieves/:sieve_id/data/:id',
    store: Service.store.SieveDataStore
  }, {
    list: true,
    path: '/sieves/:key/works',
    store: Service.store.WorkStore
  }, {
    list: true,
    path: '/rules',
    store: Service.store.RuleStore
  }, {
    path: '/rules/:id',
    store: Service.store.RuleStore
  }, {
    list: true,
    path: '/tags',
    store: Service.store.TagStore
  }, {
    list: true,
    path: '/tags/:id',
    store: Service.store.TagStore
  }, {
    list: true,
    path: '/users/attrs',
    store: Service.store.AttrStore
  }, {
    path: '/users/attrs/:id',
    store: Service.store.AttrStore
  }]
});

function api(url, method, json, callback) {
  var
  json = json || {},
  method = methodMap[method] || method || 'GET';

  var route = router.find(url);
  //console.log('API:request', url, method, json, route);

  if(route) {
    return handleStoreQuery(route, method, json, callback);
  } else {
    // Call remote api.
    return Service.api(url, method, json, callback);
  }
}

function batch(requests, callback) {
  // Decompose and call apis asynchronously.
  async.mapSeries(requests, function(request, callback) {
    api(request.url, request.method, request.body, function(err, res) {
      if(err) console.error('Error handling request:', request);
      callback(err, res);
    });
  }, callback);
}

function handleStoreQuery(route, method, json, _callback) {
  var
  path = route.path,
  callback = function(err, result) {
    if(err) console.error('API:err', path, method, err);
    //else console.log('API:response ', path, method, result);
    // NOTE Objects coming from background seems to be immutable. Return a deep
    // copy of objects.
    result && (result = JSON.parse(JSON.stringify(result)));
    _callback(err, result);
  }
  switch(method) {
    case 'DELETE':
    route.store.destroy(route.params, callback);
    break;

    case 'GET':
    if(route.list) {
      var
      query = _.extend(_.omit(json, '_opt'), route.params),
      opts = json._opt;
      route.store.find(query, opts, callback);
    } else {
      route.store.findOne(route.params, callback);
    }
    break;

    case 'PATCH':
    case 'PUT':
    var
    query = route.params,
    doc = json;
    route.store.update(query, doc, callback);
    break;

    case 'POST':
    var
    doc = _.extend(json, route.params);
    route.store.create(doc, callback);
    break;

    default:
    callback({
      msg: 'API: Unknown method:' + method
    });
  }
}

function init(callback) {
  callback();
}

return Api;

});
