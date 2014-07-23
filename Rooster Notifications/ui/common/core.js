define(['jquery', 'underscore', 'backbone', 'stacktrace'],
function($, _, Backbone, stacktrace) {

var Acts = (function() {
  var actions = null;

  function act(name, param, originalTarget) {
    // TODO Make actions work for wildcard names.
    var action = actions && actions[name];
    if(!action)
      return console.error('action not found:' + name);

    var context = action.context,
      fn = action.fn;
    if(_.isString(fn)) {
      fn = context[fn];
    }
    if(!fn)
      return console.error('Function not found: ' + action.fn);

    return fn.call(context, param, originalTarget); 
  }

  return {
    act: act

    , setActions: function(_actions) {
      actions = _actions;
    }
  }
})();

$(document).delegate('[data-action]', {
  click: function(event) {
    if(event.actDone) return;

    var
    target = event.currentTarget,
    name = $(target).attr('data-action'),
    attr = 'data-action-param',
    param = $(target).attr(attr) || '';

    // Ignore clicks on a child in a parent target.
    if(name == 'void 0') {
      event.actDone = true;
      return;
    }

    if(param.charAt(0) == '@') {
      attr = param.slice(1);
      param = $(target).attr(attr);
    } else if(param.charAt(0) == '$') {
      param = param.slice(1);
      var indexSpace = param.indexOf(' '),
      fn = param.slice(0, indexSpace),
      path = param.slice(indexSpace + 1),
      lioAt = path.lastIndexOf('@'),
      el = path.slice(0, lioAt),
      attr = path.slice(lioAt + 1);

      param = $(target)[fn](el).attr(attr);
    }
    if(Acts.act(name, param, event.target) !== false) {
      event.preventDefault();
      event.actDone = true;
      // XXX Do not stop propagation; it will affect dropdown behavior dependent
      // on event propagation.
      //event.stopPropagation();
    }
  }
  /*
  , keypress: function(event) {
    if(event.keyCode == 13) {
      Acts.act($(event.target).attr('action'));
      event.preventDefault();
    }
  }
  /**/
});

Backbone.Model.prototype.eget = function(name,v) {
  v = this.get(name);
  return v ? _.escape(v) : v;
};

if(typeof console == 'undefined') {
  window.console = {
    error: function(){
      alert('unexpected error:' + _.toArray(arguments).join(':'));
    },
    log: function(){},
    warn: function(){}
  };
}

if(!DBG) {

  console._error = console.error;

  console.error = function() {
    var args = _.toArray(arguments);
    // TODO Convert args to a printable string notation
    console._error.apply ? console._error.apply(console, args) :
      console._error('ERR', _.toArray(arguments));

    var seen = [];
    // Report console errors
    $.post('/err/console_error', {
      args: JSON.stringify(args, function(key, val) {
        if(typeof val == 'object' ) {
          if(seen.indexOf(val) > 0) {
            return '[Cyclic reference to: ' + val.constructor.name + ']';
          }
          seen.push(val)
        }
        return val;
      }),
      trace: stacktrace()
    });
  }
} else {
}

if(window.IE) {
  console._log = console.log;

  console.log = function() {
    var args = _.toArray(arguments);
    console._log(_.toArray(arguments).join(' '));
  }
}


window.onerror = function(message, url, linenumber) {
  // Log error back to console
  console.error('window_onerror:', message, url, linenumber);
};

return {
  Acts: Acts,
  ID: (function(x) { return function() { return x += 1 } })(1)
};

});
