define(['underscore'], function(_) {
var types = {};

function Def(name, __super__, members) {
  if(typeof __super__ == 'object') {
    members = __super__;
    __super__ = undefined;
  }
  types[this.name = name] = this;
  this.__super__ = __super__;
  _.extend(this, members);
}

_.extend(Def.prototype, {
  is: function(name) {
    return this.name == name || 
      (this.__super__ && this.__super__.isType(name));
  },
  // Test if the value if valid using value and the type descriptor.
  isValid: function(value, desc) { return true; },
  format: identity,
  parse: identity
});
new Def('text'),

new Def('integer', {
  isValid: function(value, desc) {
    return !isNaN(this.parse(value));
  },
  parse: function(value) { return parseInt(value); },
}),

new Def('number', {
  isValid: function(value, desc) {
    return !isNaN(this.parse(value));
  },
  parse: function(value) { return parseFloat(value); },
}),

new Def('email', 'text', {
  isValid: function(value, desc) {
    // Perform a priliminary test
    return value.indexOf('@') > 0;
  }
}),

new Def('phone', 'text', {
  isValid: function(value, desc) {
    // International phone regex?
    return /^\+(?:[0-9] ?){6,14}[0-9]$/.test(value);
  }
}),

new Def('tpl:text', 'text', {
  params: [], // A list of parameters available to the template.
  isValid: function(value, desc) {
    // TODO Check if its a valid text with parameters.
    return true;
  }
}),

new Def('tpl:html', 'tpl:text', {
  isValid: function(value, desc) {
    // TODO Check if its a valid HTML with parameters.
    return this.__super__.isValid(value, desc);
  }
});

new Def('url', 'text', {
  isValid: function(value, desc) {
    return /^([a-z]*\:)/.test(value) && value.indexOf(' ') < 0;
  }
});

new Def('json', {
  isValid: function(value, desc) {
    try {
      JSON.parse(value)  
    } catch(e) {
      return false
    }
    return true;
  },
  format: function(value) {
    return JSON.stringify(value, null, '  ');
  },
  parse: function(text) {
    return _.isEmpty(text) ? {} : JSON.parse(text);
  }
});

new Def('macro', 'json', {
  // TODO
});

new Def('css', 'text', {
  isValid: function(value, desc) {
    try {
      document.querySelector(value);
      return true;
    } catch (e) {
      return false;
    }
  }
});

new Def('js', 'text', {
  isValid: function(value, desc) {
    // TODO Use a sandbox to test values? Alternatively use a parser.
    return true;
  }
});

new Def('xpath', 'text', {
  isValid: function(value, desc) {
    try {
      document.createExpression(value, function(prefix) {
        // Internal assumption that x namespace stands for xhtml
        if(prefix == 'x' || prefix == 'xhtml' || prefix == 'html') { 
          return 'http://www.w3.org/1999/xhtml';
        }
      });
      return true;
    } catch(e) {
      return false;
    }
  }
});

new Def('regexp', 'text', {
  isValid: function(value, desc) {
    try {
      new RegExp(value);
      return true;
    } catch (e) {
      return false;
    }
  }
});

new Def('enum', 'text', {
  isValid: function(value, desc) {
    return _.indexOf(_.pluck(desc.list, 'value'), value) >= 0;
  }
});

return {
  Def: Def,

  get: function (name) {
    return types[name];
  },

  reg: function(name, type) {
    if(typeof type == 'string') {
      type = types[type];
    }
    types[name] = type;
  }
}

function identity(value) { return value; }

});
