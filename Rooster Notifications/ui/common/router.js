define(['underscore'], function(_) {

function Route(options) {
  _.extend(this, options, this.parse(options.path));
}

_.extend(Route.prototype, {

  match: function(path) {
    var
    keys = this.keys,
    params = this.params = {},
    m = this.regexp.exec(path);

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];

      var val = 'string' == typeof m[i]
        ? decode(m[i])
        : m[i];

      if (key) {
        params[key.name] = val;
      } else {
        //params.push(val);
        throw new Error('Nameless param not supported, path:'+path);
      }
    }

    return true;
  },

  parse: function(path) {
    var keys = [], strict = true;
    path = path
      .concat(strict ? '' : '/?')
      .replace(/\/\(/g, '(?:/')
      .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?(\*)?/g,
      function(_, slash, format, key, capture, optional, star){
        keys.push({ name: key, optional: !! optional });
        slash = slash || '';
        return ''
          + (optional ? '' : slash)
          + '(?:'
          + (optional ? slash : '')
          + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
          + (optional || '')
          + (star ? '(/*)?' : '');
      })
      .replace(/([\/.])/g, '\\$1')
      .replace(/\*/g, '(.*)');
    return {
      keys: keys,
      regexp: new RegExp('^' + path + '$', 'i')
    }
  }

});


function Router(options) {
  this.routes = _.map(options.routes, function(routeOptions) {
    return new Route(routeOptions);
  }, this);

  //console.log('this.routes:', this.routes, options);
}

_.extend(Router.prototype, {

  find: function(path) {
    var route =  _.find(this.routes, function(route) {
      return route.match(path);
    });
    return route;
  }

});

function decode(str) {
  try {
    return decodeURIComponent(str);
  } catch(e) {
    return str;
  }
}

return Router;

});



