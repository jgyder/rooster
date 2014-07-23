// Mock Firebase API proxy for Firefox addon
define(['underscore', 'service'],
function(_, Service) {

var
URI_ROOT = 'https://sieve.firebaseio.com/events/0/sieves/',
list = [];

function listen(topic, listener) {
  // We execute updates after a natural delay
  function delayedExecutor() {
    var args = _.toArray(arguments);
    setTimeout(function() {
      listener.apply(this, args);
    }, 50);
  }
  Service.gEvents.on(topic, delayedExecutor);
  window.addEventListener('unload', function() {
    Service.gEvents.off(topic, delayedExecutor);
  });
}

listen('store:create:sieve_data', onSieveDataCreate);
listen('store:update:sieves', onSieveUpdate);
listen('worker:sieve:state', onWorkerSieveState);

function find(url) {
  //console.log('firebase:find:', url, list)
  return _.filter(list, function(fb) {
    return url.indexOf(fb.url) == 0;
  });
}

function onSieveDataCreate(doc) {
  // Find firebase and send message
  var list = find(URI_ROOT + doc.sieve_id);
  //console.log('firebase:find:list:', list);
  _.each(list, function(fb) {
    fb.trigger('value', { rel: 'sieve_data', doc: doc });
  });
}

function onSieveUpdate(doc) {
  //console.log('onSieveUpdate:', doc);
  // Find firebase and send message

  setTimeout(function() {
    var list = find(URI_ROOT + doc.id);
    //console.log('firebase:find:list:', list);

    _.each(list, function(fb) {
      fb.trigger('value', { rel: 'sieves', doc: doc });
    });
  }, 100);
}

function onWorkerSieveState(event) {
  var list = find(URI_ROOT + event.id);
  //console.log('firebase:find:list:', list);

  _.each(list, function(fb) {
    fb.trigger('value', { rel: 'events', doc: event });
  });
}

function Firebase(url) {
  this.url = url;
  //console.log('firebase:', this, url);
}

_.extend(Firebase.prototype, {

  child: function(fragment) {
    return new Firebase(this.url + '/' + fragment);
  },

  off: function() {
    this.callback = null;
    list.splice(_.indexOf(list, this), 1);
  },

  on: function(name, callback) {
    // XXX For now, we only support name: 'value'
    list.push(this);
    this.callback = callback;
  },
  
  trigger: function(name, event) {
    this.callback({
      val: function() { return event }
    });
  }
});

return Firebase;

});

