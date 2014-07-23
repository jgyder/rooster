(function() {

var subscriptions = [];
var ORIGIN = '*';

window.API = {};

window.notifyChange = function(name, value) {
  DBG && console.log('notifyChange', name, JSON.stringify(value));
  var msg = {
    type: 'event',
    data: {
      data: value,
      type: name
    }
  };
  window.IE && (msg = JSON.stringify(msg));
  parent.postMessage(msg, ORIGIN);
};

function noapi(data, callback) {
  callback({ msg: 'API not found' });
}

window.addEventListener('message', function(e) {
  DBG && console.log('interface:message', e);
  var data = e.data;
  if(e.source != parent || !RE_PARENT.test(e.origin)) return;

  ORIGIN = e.origin;

  if(typeof data === 'string') {
    data = JSON.parse(data);
  }

  if(data.type == 'request') {
    var api = API[data.path] || noapi;
    api(data.data, function(err, result) {
      DBG && console.log('response:', err, result);
      var msg = {
        _id: data._id,
        type: 'response',
        data: result,
        err: err ? err : null
      };
      window.IE && (msg = JSON.stringify(msg));
      parent.postMessage(msg, ORIGIN);
    });
  } else {
    throw new Error('unhandled message', data);
  }
});
window.del = function del(url, data, callback) {
  window.ajax(url, 'DELETE', data, callback);
}

window.get = function get(url, data, callback) {
  window.ajax(url, 'GET', data, callback);
}

window.post = function post(url, data, callback) {
  window.ajax(url, 'POST', data, callback);
}

window.put = function put(url, data, callback) {
  window.ajax(url, 'PUT', data, callback);
}

window.ajax = function ajax(url, method, data, callback) {
  if(typeof data == 'fuction') {
    callback = data;
    data = null;
  }
  jQuery.ajax({
    url: url,
    type: method,
    data: data,
    error: function(jqxhr, textStatus, errorThrown) {
      callback({ status: textStatus });
    },
    success: function(data) {
      callback(null, data);
    }
  });
}


})();
