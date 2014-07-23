
/*
NOTE: Do not edit. This is an auto-generated file. All changes will be lost!
*/


var
// FIXME Update build script to set DEV to false
DEV = 0,
CFG = {
  URL: {
    ROOT: DEV ? 'http://brwsr.local' : 'http://distill.io',
    API: DEV ? 'http://api.brwsr.local/v1' : 'http://api.distill.io/v1',
    STATIC: DEV ? 'http://brwsrcdn.local' : 'http://brwsrcdn.com',
    BASE: chrome.runtime.getURL(''),
    WELCOME: 'http://distill.freshdesk.com/support/solutions/articles/188306-getting-started-with'
  },
  VERSION: "0.0.7"
};

;
const ID = (function(x) {
  return function () {
    return x++;
  }
})(1);

var DBG = 1;

// Generate four random hex digits.
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

function makeURLChecker(baseUrl) {
  var parts = baseUrl.split('/');
  parts[0] = '^(http|https):';
  var re = new RegExp(parts.join('\\/'), 'i');
  return function check(href) {
    return re.test(href);
  }
}

var isUs = makeURLChecker(CFG.URL.ROOT);

const Supports = {
  tabForXFrame: true
};

CFG.URL.BASE = chrome.runtime.getURL('');

;
const C = {
  TYPE_ERR:   0,
  TYPE_TEXT:  1,
  TYPE_HTML:  2,
  TYPE_JSON:  3,
  TYPE_XML:   4,
  TYPE_FEED:  5,

  TYPE_RULE:        1,
  TYPE_RULE_GROUP:  2,

  OP_AND:   1,
  OP_OR:    2,

  CONTENT_TYPE_TEXT:          1,
  CONTENT_TYPE_CHANGED_TEXT:  2,

  RULE_NOT_EMPTY:       1,
  RULE_HAS_TEXT:        2,
  RULE_HAS_TEXT_NOT:    3,
  RULE_HAS_NUMBER_LT:   4,
  RULE_HAS_NUMBER_GT:   5,
  RULE_HAS_NUMBER_DECR_MIN:  6,
  RULE_HAS_NUMBER_INCR_MIN:  7,

  STATE_DEFAULT: 0,
  STATE_NEW: 10,
  STATE_INIT: 20,
  STATE_READY: 40,
  STATE_DISCARD: 90,
  STATE_DONE: 100,

  STATE_ATTR_VERIFY: 10,

  ACTION_EMAIL:       1,
  ACTION_SMS:         2,
  ACTION_PUSH:        3,
  ACTION_MACRO:       4,

  ACTION_LOCAL_AUDIO: 101,
  ACTION_LOCAL_POPUP: 102,

  RUN_STATE_INIT: 1,
  RUN_STATE_WAIT: 2,
  RUN_STATE_WIP: 3,

  LOCAL_STATE_SYNCED:   0,
  LOCAL_STATE_POST:     1,
  LOCAL_STATE_PUT:      2,
  LOCAL_STATE_DEL:      3,

  TIME_INFINITE: 2592000  // Roughly 30 days
};
;
// Service level configurations
_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

function Err(code, msg, defaults) {
  var
  tpl = _.template(msg),

  maker = function(data) {
    _.defaults(data, defaults);
    var err = { code: code, msg: tpl(data), data: data };
    return err;
  };

  // Checks if err is made by maker
  maker.si = function(err) {
    return code === err.code;
  }

  return maker;
}

_.extend(Err, {

  ABORT: Err('ABORT', 'Activity aborted!'),

  NOT_FOUND: Err('NOT_FOUND', '{{type}} not found with {{param}} {{id}}.', {
    param: 'id'
  }),

  PARAM_INVALID: Err('PARAM_INVALID', 'Invalid {{param}}, got: {{value}}'),

  PARAM_NOT_FOUND: Err('PARAM_INVALID', '{{param}} not found.'),

  PORT_WEB_REQUEST_NA: Err('PORT_WEB_REQUEST_NA', 
    'Request cannot be served.'),

  TIMEOUT: Err('TIMEOUT', 'Task: {{type}} timedout after {{time}} seconds.'),

  TYPE_UNNOWN: Err('TYPE_UNNOWN', '{{type}} of unknown type: {{value}}'),

  UNHANDLED: function(e) {
    return {
      code: 'UNHANDLED',
      msg: e.toString(),
      data: e.stack
    }
  },

  AUTH_NA: Err('TIMEOUT', 'Account authenticatin details are not available.'),

});

;
/**
 * Global object to trigger and subscribe to events.
 *
 * Namespacing events:
 *  ns_1:ns_x:name, event
 *
 * All arduments to a trigger should be serializable into JSON.
 */
const gEvents = _.extend({}, Backbone.Events);

;
const REGEX_CHARS_SPECIAL = '*.?^$[]{}()\/+,:|!'.split('').map(function (chr) {
  return [new RegExp('\\' + chr, 'g'), '\\' + chr];
});

function wildcardMatch(pattern, str) {
  var expr = pattern.split('*').map(function(block) {
    REGEX_CHARS_SPECIAL.forEach(function(replacer) {
      block = block.replace(replacer[0], replacer[1]);
    });
    return block;
  }).join('.*');
  var regex = new RegExp('^' + expr + '$');
  return regex.test(str);
}

function getHostname(url) {
  return url.split('/')[2];
}

;
var NotifyAudio = (function() {
  function defaultSrc() {
    // TODO read values from preferences
    return '/skin/media/bell_strike.ogg';
  }

  return {
    play: function(cfg) {
      console.log('NotifyAudio:', cfg);
      var player = new Audio;
      player.src = (cfg && cfg.config && cfg.config.tone) || defaultSrc();
      player.play();
    }
  }
})();

var NotifyPopup = (function() {
  var popup;
  return {
    hide: function() {
      popup && popup.cancel();
      popup = null;
    },
    show: function(cfg, context) {
      console.log('Actions:popup:show', cfg, context);

      // Add message to list of messages to be shown to user. Once popup is
      // shown, it will pull message and display it to the user.

      popup && popup.cancel();

      PopupMessageStore.create({
        rel: SieveStore.name,
        key: context.sieve.id,
        uri: context.sieve.uri,
        title: context.sieve.name,  // TODO Add a snippet of diff from context?
      }, function(err, msg) {
        var
        title = context.sieve.name,
        body = context.sieve_data.text;

        body = body.length > 70 ? body.substring(0, 70) + '...' : body;
        popup = webkitNotifications.createNotification('/ui/img/distill_48.png',
          title, body);
        popup.onclose = function() {
          if(popup) {
            popup.onclose = popup.onclick = null;
            popup = null;
          }
        }
        popup.onclick = function()  {
          service.show(context.sieve.id, function() {
            popup.cancel();
          });
        }
        popup.show();
      });
    }
  }
})();

;
const DATE_0 = new Date(0);
const DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

TypeDescriptors = {
  DURATION: {
    desc: 'Duration expressed in milliseconds',
    validate: function(value, cb) {
      if(_.isNumber(value) && !_.isNaN(value)) cb(null);
      else cb({
        code: 'ADEX00X',
        data: 'Value is not a number:' + value
      });
    },
    type: 'Number'
  },
  JavaScript: {
    desc: 'JavaScript code',
    validate: function(value, cb) {
      // TODO use a JavaScript parser to validate a script.
      return cb({
        code: 'ADEX0000000X',
        desc: 'Not implemented'
      });
    },
    type: 'String'
  },
  REGEX: {
    desc: 'Regular Expression definition',
    // descriptors for Object types
    descriptors: [{
      desc: 'Regular expression',
      must: true,
      name: 'expression',
      type: 'String'
    }, {
      'default': 'im',
      desc: 'Regular expression flags',
      must: false,
      name: 'flags',
      type: 'String'  // XXX a string type or a flag type?
    }],
    validate: function(value, cb) {
      // TODO validate the value
      return cb({
        code: 'ADEX0000000X',
        desc: 'Not implemented'
      });
    },
    type: 'Object'
  },
  URL: {
    desc: 'Specifies a valid URL',
    validate: function(value, cb) {
      return cb({
        code: 'ADEX0000000X',
        desc: 'Not implemented'
      });
    },
    type: 'String'
  },
  WEBPAGE_LOCATOR: {
    desc: 'A locator is used to pick elements from a webpage',
    descriptors: [{
      desc: 'Index of window wrt to root window for evaluating locator',
      must: false,
      name: 'windowIndex',
      type: 'Number'
    }, {
      desc: 'Type of locator',
      must: true,
      name: 'type',
      type: 'String'
    }, {
      desc: 'Locator expression',
      must: true,
      name: 'expr',
      type: 'String'
    }],
    validate: function(value, cb) {
      // TODO validate different types of locator expressions
      return cb({
        code: 'ADEX0000000X',
        desc: 'Not implemented'
      });
    },
    type: 'Object'
  },
  WEEKLY_SCHEDULE: {
    desc: 'Represents time in a week wrt. from Sunday',
    descriptors: [{
      desc: 'Day in a week',
      many: true,
      must: true,
      name: 'days',
      type: 'DAY',
      vals: DAYS
    }, {
      desc: 'Time since beginning of the day',
      must: true,
      name: 'time',
      type: 'TIME'
    }],
    validate: function(value, cb) {
      // TODO invoke DAY and TIME validators to check their validity.
      cb(null);
    },
    type: 'Object'
  }
};

ActionDescriptors = {};

ActionDescriptors[C.ACTION_EMAIL] = {
  descriptors: [{
    desc: 'Template for subject',
    name: 'subject',
    type: 'STRING_TEMPLATE'
  }, {
    desc: 'Template for email body',
    name: 'body',
    type: 'HTML_TEMPLATE'
  }],
  /**
   * Dispatches the alert.
   *
   * @cfg Configuration parameters. Must conform to descriptor.
   * @data Data generated by an alert.
   * @cb Callback to call when done.
   */
  act: function alert_email(cfg, context, cb) {
    ActionEmail.send(cfg, context, cb);
  }
},

ActionDescriptors[C.ACTION_LOCAL_POPUP] = {
  descriptors: [],
  act: function(cfg, context, cb) {
    if(Prefs.get('actions.popup', true)) {
      NotifyPopup.show(cfg, context);
    }
    cb();
  }
};
ActionDescriptors[C.ACTION_SMS] = {
  descriptors: [{
  }],
  act: function(cfg, context, cb) {
    cb({
      code: 'ADEX00X',
      data: 'SMS alerts not implemented'
    });
  }
};
ActionDescriptors[C.ACTION_LOCAL_AUDIO] = {
  descriptors: [{
    desc: 'Name or URL of the file to play audio',
    must: true,
    name: 'src',
    type: 'SRC'
  }, {
    desc: 'Playback duration',
    must: false,
    name: 'duration',
    type: 'DURATION'
  }],
  act: function(cfg, context, cb) {
    if(Prefs.get('actions.audio', true)) {
      NotifyAudio.play(cfg, context);
    }
    cb();
  }
};

ScheduleDescriptors = {
  undefined: {
    getSchedule: function(cfg, logs) {
      return -1;
    }
  },
  /*
  A simple interval based task schedule descriptor.
  */

  INTERVAL: {
    descriptors: [
      {
        desc: 'The interval at which task should be scheduled.',
        name: 'interval',
        type: 'DURATION'
      }
    ],
    /*
    Returns time in seconds at which the next update check will be made.
    
    @cfg Configuration data used when defining the alert.
    @logs A log of previous task in descending order of time.
    */

    getSchedule: function(cfg, logs) {
      var
      checkedOn, lastCheckedOn,
      interval = cfg.interval, // in sec
      now = Date.now()/1000 | 0;

      if(_.isUndefined(interval)) {
        return -1;
      }

      if(interval >= C.TIME_INFINITE) {
        return -1;
      }

      if(logs.length > 0 && logs[0].err) {
        // Previously there was an error. Reschedule after 120 secs
        var
        errs = _.pluck(logs, 'errs'),
        indexNull = _.indexOf(errs, null);
        errs = errs.slice(0, indexNull);
        if(errs.length < 6) {
          return now + 120;
        }
      }

      checkedOn = _.map(logs, function(log) {
        return new Date(log.ts);
      });

      lastCheckedOn = (_.max(checkedOn) || DATE_0).valueOf()/1000 | 0;

      return Math.max(now, lastCheckedOn + interval) + 1; // +1 offsets |0
    }
  },
  /*
  Scheduler to trigger job to run at a specific time of day in a week.
  */

  WEEKLY: {
    descriptors: [
      {
        desc: 'A set of times at which the task will be executed.',
        many: true,
        must: true,
        name: 'triggers',
        type: 'WEEKLY_SCHEDULE'
      }
    ],
    // Returns time in seconds
    getSchedule: function(cfg, logs) {
      var checkedOn, dateNextWeek, datePrevWeek, lastCheckedOn, nextCheckDate, now, now0, prevCheckDate, scheduleDates;
      now = new Date();
      now0 = new Date(now);
      now0.setHours(0);
      now0.setMinutes(0);
      now0.setSeconds(0);
      checkedOn = _.map(logs, function(log) {
        return new Date(log.ts);
      });
      scheduleDates = _.reduce(cfg.triggers, function(all, trigger) {
        var time0;
        time0 = new Date(now0);
        time0.setSeconds(trigger.time / 1000);
        _.each(trigger.days, function(day) {
          var time;
          time = new Date(time0);
          time.setDate(time.getDate() + day - time.getDay());
          return all.push(time);
        });
        return all;
      }, []);
      scheduleDates.sort();
      dateNextWeek = _.first(scheduleDates);
      dateNextWeek.setDate(dateNextWeek.getDate() + 7);
      scheduleDates.push(dateNextWeek);
      datePrevWeek = _.last(scheduleDates);
      datePrevWeek.setDate(datePrevWeek.getDate() - 7);
      scheduleDates.unshift(datePrevWeek);
      lastCheckedOn = _.first(checkedOn) || DATE_0;
      nextCheckDate = _.detect(scheduleDates, function(date) {
        return date >= now;
      });
      scheduleDates.reverse();
      prevCheckDate = _.detect(scheduleDates, function(date) {
        return date < nextCheckDate;
      });
      scheduleDates.reverse();
      if (lastCheckedOn < prevCheckDate) {
        return (now.valueOf()/1000 | 0) + 1;
      } else {
        return (nextCheckDate.valueOf()/1000 | 0) + 1;
      }
    }
  }
};

/**
 * Data from various sources are collected here and stored.
 */
ResultProcessors = {
  WEBPAGE: {
    DOM: {
      descriptors: [{
        'default': true,
        desc: 'Filter content text',
        name: 'filtertext'
      }],
      /**
       * Lists the changes in old and new data.
       */
      changes: function(dold, dnew, cb) {
        // TODO Refactor most of this to a generic function
        var seq1 = _.filter(dold.data.split(/\s/), filterEmpty),
          seq2 = _.filter(dnew.data.split(/\s/), filterEmpty),
          matcher = new difflib.SequenceMatcher(seq1, seq2),
          opcodes = matcher.get_opcodes(),
          changes = opcodes.length == 0 ? null : getChanges();

        //console.log('EXTN: diff: \n', changes, opcodes);
        cb(null, changes);

        function filterEmpty(x) { return !!x }

        function getChanges() {
          var ins = [], del = [], summ = [];
          _.each(opcodes, function(op) {
            var _n = seq2.slice(op[3], op[4]).join(' '),
              _o = seq1.slice(op[1], op[2]).join(' ');
            if(op[0] == 'replace') {
              del.push(_o);
              ins.push(_n);
              summ.push('<ins>', _.escape(_n), '</ins>');
            } else if(op[0] == 'insert') {
              ins.push(_n);
              summ.push('<ins>', _.escape(_n), '</ins>');
            } else if(op[0] == 'delete') {
              del.push(_o);
            } else {
              // equal
              summ.push(_o);
            }
          });
          // XXX should we leave out summ? It will be required only
          // when showing alert. YAGNI? IMO, we do need it NOW.
          return { del: del, ins: ins, summ: summ.join(' ')}
        }
      }
    }
  }
};

;

function matchRule(context) {
  var
  rule = context.rule,
  config = rule && JSON.parse(rule.config);

  //console.log('matchRule for inserts, text: %s: %s: with rule: %j', context.inserts, context.items[0].text, rule);

  return !config || matchRuleConfig(config,
                                    context.inserts,
                                    context.items[0].text,
                                    (context.items[1] || {}).text||'');
}

function matchRuleConfig(config, inserts, text, oldText) {
  if(config.type == C.TYPE_RULE) {
    return matchRule_RULE(config, inserts, text, oldText);
  } else if(config.type == C.TYPE_RULE_GROUP) {
    return matchRule_RULE_GROUP(config, inserts, text, oldText);
  } else {
    console.error('unknown type of rule config: ', config);
    return false;
  }
}

function matchRule_RULE(config, inserts, text, oldText) {
  var
  content = text,
  matched = false,
  numbers,
  oldNumbers,
  rule = config.rule,
  params = rule.params;

  if(config.contentType == C.CONTENT_TYPE_CHANGED_TEXT) {
    content = inserts;
  }

  //console.log('matchRule_RULE: params in content: %j:%s', params, config);

  switch(rule.type) {
    case C.RULE_NOT_EMPTY:
    matched = !_.isEmpty(content);
    break;

    case C.RULE_HAS_TEXT:
    matched = content.indexOf(params.input) >= 0;
    break;

    case C.RULE_HAS_TEXT_NOT:
    matched = !content.indexOf(params.input) >= 0;
    break;

    case C.RULE_HAS_NUMBER_LT:
    numbers = findNumbers(content);
    matched = _.any(numbers, function(num) {
      return num < params.input;
    });
    break;

    case C.RULE_HAS_NUMBER_GT:
    numbers = findNumbers(content);
    matched = _.any(numbers, function(num) {
      return num > params.input;
    });
    break;

    case C.RULE_HAS_NUMBER_DECR_MIN:
    numbers = findNumbers(content);
    // NOTE We do not have oldInserts when content type is CHANGED_TEXT.
    // Match numbers at same indices.
    oldNumbers = findNumbers(oldText);
    for(var i = Math.min(numbers.length, oldNumbers.length) - 1; i >= 0; i-=1) {
      if((oldNumbers[i] - numbers[i]) > params.input) {
        matched = true;
        break;
      }
    }
    break;

    case C.RULE_HAS_NUMBER_INCR_MIN:
    numbers = findNumbers(content);
    // NOTE We do not have oldInserts when content type is CHANGED_TEXT.
    // Match numbers at same indices.
    oldNumbers = findNumbers(oldText);
    for(var i = Math.min(numbers.length, oldNumbers.length) - 1; i >= 0; i-=1) {
      if((numbers[i] - oldNumbers[i]) > params.input) {
        matched = true;
        break;
      }
    }
    break;

    default:
    return false;
  }
  return matched;
}

function matchRule_RULE_GROUP(config, inserts, text, oldText) {
  //console.log('matchRule_RULE_GROUP:  ', config);

  return _[config.op == C.OP_AND ? 'all' : 'any'](config.rules, function(ruleConfig) {
    return matchRuleConfig(ruleConfig, inserts, text, oldText);
  });
}

function findNumbers(text) {
  var matches = text.match(/([0-9,.\s])*/g);
  var numbers = [];
  for(var i = 0, len = matches.length; i < len; i += 1) {
    var a_num = matches[i];
    if(a_num.length > 0) {
      a_num = parseFloat(a_num.replace(/([\s,]*)/g, ''));
      if(!isNaN(a_num)) {
        numbers.push(a_num);
      }
    }
  }
  return numbers;
}

;
/**
 * A wrapper around native port to enable requests and response with any
 * content loaded in browser. Even the once in iframes in a background page.
 */
const
MSG_INIT = 1,
MSG_EVENT = 2,
MSG_REQUEST = 3,
MSG_RESPONSE = 4,
MSG_LOG = 5;

// A simple port interface supporting request/response cycle.
function SimplePort(port) {
  var
  self = this,
  callbacks = {},
  id = ID(),
  requestHandler;

  _.extend(self, Backbone.Events);

  self.id = id;
  self.port = port;

  self.destroy = destroy;
  self.postMessage = postMessage;
  self.sendEvent = sendEvent;
  self.sendRequest = sendRequest;
  self.setRequestHandler = setRequestHandler;

  port.onMessage.addListener(onMessage);
  port.onDisconnect.addListener(onUnload);

  function destroy() {
    if(!self) return;   // nothing to do if already destroyed.
    //console.log('EXTN:SimplePort:destroy', new Error().stack);

    _.each(callbacks, function(cb, id) {

      try {
        DBG && console.warn('EXTN:SimplePort: Request did not complete.', id, cb.msg);
        cb.fn('Callback request did not complete.');
      } catch (e) {
        console.error('EXTN:SimplePort: error in callback: -- ', self.id, e, e.stack);
        console.error(e);
      }

      delete callbacks[id];
    });

    self.trigger('disconnect', self);
    self.off();

    callbacks = null;
    self = null;

    port && port.disconnect();
  }

  function onMessage(msg) {
    //console.log('EXTN:SimplePort:onMessage:', msg);

    if(msg.type == MSG_REQUEST) {
      var
      id = msg._id,
      input = msg.data,
      path = msg.path;

      if(requestHandler) {
        requestHandler(path, input, function(err, data) {
          if(!port) return;

          port.postMessage({
            _id: id,
            type: MSG_RESPONSE,
            data: data,
            err: err
          });
        });
      } else {
        // error response
        port.postMessage({
          _id: id,
          type: MSG_RESPONSE,
          err: Err.UNHANDLED(new Error('Request handler not set'))
        });
      }
    } else if(msg.type == MSG_RESPONSE) {
      //console.log('EXTN:SimplePort:response: -> ', self.id, msg._id, msg);

      var
      id = msg._id,
      cb = callbacks[id];

      delete callbacks[id];
      cb.fn(msg.err, msg.data);
    } else if(msg.type == MSG_EVENT) {
      var
      event = msg.data,
      newType = 'port:' + event.type;
      //console.log('EXTN:SimplePort: event: <- ', id, event.type, event);
      self.trigger(newType, _.extend({}, event, {
        type: newType
      }));

    } else {
      console.error('EXTN:SimplePort:Unhandled message: <- ', id, msg);
    }
  }

  function onUnload() {
    //console.log('EXTN:SimplePort:onUnload:', id, self);

    port = null;
    destroy();
  }

  function postMessage(msg) {
    port.postMessage(msg);
  }

  function sendEvent(name, event) {
    //console.log('EXTN: SimplePort: sendEvent: -> ', id, name, event);

    port.postMessage({
      data: { event: event, type: name },
      type: MSG_EVENT
    });
  }

  // Send request to content.
  function sendRequest (path, data, cb) {
    if(typeof data == 'function') {
      cb = data;
      data = null;
    }

    var
    msg = {
      _id: ID(),
      data: data,
      path: path,
      type: MSG_REQUEST
    };

    //console.log('EXTN:SimplePort: sendRequest: -> ', id, path, msg._id, msg);

    callbacks[msg._id] = {
      fn: cb, 
      msg: msg
    };

    port.postMessage(msg);
  }

  function setRequestHandler(handler) {
    requestHandler = handler;
  }

}

// Port wrapper for ports loaded in a content frames.
function LoaderPort(port, attrs) {
  var
  self = this,
  callbacks = {};

  _.extend(self, Backbone.Events);

  self.attrs = attrs;
  self.id = ID();
  self.port = port;
  self.name = port.name;
  self.ready = false;
  self.uri = attrs.uri;

  self.destroy = destroy;
  self.isRoot = isRoot;
  self.sendEvent = sendEvent;
  self.sendRequest = sendRequest;

  port.onMessage.addListener(onMessage);
  port.onDisconnect.addListener(onUnload);

  port.postMessage({
    type: 'content:load',
    scripts: [{
      textContent: 'var URL_CDN = ' + JSON.stringify(chrome.runtime.getURL('content'))
    }, {
      src: 'lib/underscore.js'
    }, {
      src: 'content/content.js'
    }, {
      src: 'content/port-ready.js'
    }]
  });
  
  function destroy() {
    if(!self) return;   // nothing to do if already destroyed.
    //console.log('EXTN:LoaderPort:destroy', attrs.uri);//, new Error().stack);

    _.each(callbacks, function(cb, id) {

      try {
        console.warn('PORT: Request did not complete.', attrs.uri, id, cb.msg);
        cb.fn('Callback request did not complete.');
      } catch (e) {
        console.error('PORT: error in callback: -- ', self.id, e, e.stack);
      }

      delete callbacks[id];
    });

    self.trigger('disconnect', self);
    self.off();

    callbacks = null;
    self = null;

    port && port.disconnect();
  }

  function isRoot() {
    return attrs.root || (attrs.parent && attrs.parent.id === 'BG')
  }

  function onContentMessage(msg) {
    // Add extra info for debugging.
    msg.uri = self.attrs.uri;

    if(msg.type == MSG_RESPONSE) {
      //console.log('EXTN:LoaderPort: response: <- ', self.id, msg._id, msg, attrs.uri);
      var
      id = msg._id,
      cb = callbacks[id];

      //console.log('callbacks:', callbacks, id, cb);

      delete callbacks[id];
      cb.fn(msg.err, msg.data);

    } else if(msg.type == MSG_EVENT) {
      var
      event = msg.data,
      newType = 'window:' + event.type;
      //console.log('EXTN:LoaderPort: event: <- ', id, event.type, event, attrs.uri);
      self.trigger(newType, _.extend({}, event, {
        type: newType
      }));

    } else {
      console.error('PORT: Unhandled message: <- ', id, msg);
    }
  }

  function onMessage(msg) {
    //console.log('EXTN:LoaderPort:onMessage:', msg, attrs.uri);

    switch(msg.type) {
      case 'port:ready':
      self.ready = true;
      self.title = msg.data.title;
      self.trigger('ready', self);
      break;

      case 'content':
      onContentMessage(msg.data);
      break;

      default:
      console.error('EXTN:LoaderPort:Unhandled message:', msg);
      break;
    }
  }

  function onUnload() {
    //console.log('PORT: onUnload:', attrs.uri);
    port = null;
    destroy();
  }

  function postMessage(msg) {
    port.postMessage({
      type: 'content',
      data: msg
    });
  }

  function sendEvent(name, event) {
    //console.log('EXTN:LoaderPort: sendEvent: -> ', self.id, name, event);

    postMessage({
      data: { event: event, type: name },
      type: MSG_EVENT
    });
  }

  // Send request to content.
  function sendRequest(path, data, cb) {
    if(typeof data == 'function') {
      cb = data;
      data = null;
    }

    var
    msg = {
      _id: ID(),
      data: data,
      path: path,
      type: MSG_REQUEST
    };

    //console.log('EXTN:LoaderPort: sendRequest: -> ', self.id, msg._id, path, msg, attrs.uri);

    callbacks[msg._id] = {
      fn: cb, 
      msg: msg
    };

    postMessage(msg);
  }

}


;
chrome.tabs.query || (chrome.tabs.query = function(qi, callback) {
  chrome.windows.getAll({ populate: true }, function(windows) {
    callback(windows.reduce(function(redux, window) {
      return redux.concat(window.tabs.filter(function(tab) {
        return filterTab(window, tab);
      }));
    }, []));
  });

  function filterTab(window, tab) {
    return ((qi.selected === undefined || qi.selected === tab.selected)
      &&  (qi.pinned === undefined || qi.pinned === tab.pinned)
      &&  (qi.highlighted === undefined || qi.highlighted === tab.highlighted)
      &&  (qi.status === undefined || qi.status === tab.status)
      &&  (qi.title === undefined || wildcardMatch(qi.title, tab.title))
      &&  (qi.url === undefined || wildcardMatch(qi.url, tab.url))
      &&  (qi.windowId === undefined || qi.windowId === window.id)
      &&  (qi.windowType === undefined || qi.windowType === window.type)
      );
  }
}
);

;
const DEFAULT_LIMIT = 20;

function SimpleStore(name) {
  this.name = name;
  var store = this.storage.getItem(this.name);
  this.data = (store && JSON.parse(store)) || {};
}

_.extend(SimpleStore.prototype, {
  defaults: {},

  storage: localStorage,

  del: function(key) {
    var value = this.data[key];
    delete this.data[key];
    this.save();
    return value;
  },

  getDefault: function(key) {
    return this.defaults[key];
  },

  get: function(key, defaultValue) {
    var value = this.data[key];
    return value !== void 0 ? value : 
      (defaultValue !== void 0 ? defaultValue : this.getDefault(key));
  },

  save: function() {
    this.storage.setItem(this.name, JSON.stringify(this.data));
  },

  set: function(key, value) {
    var oldValue = this.data[key];
    if(oldValue !== value) {
      this.data[key] = value;
      this.save();
      gEvents.trigger('change:pref:'+key, value, key);
    }
  }
});

Prefs = new SimpleStore('prefs');
Prefs.defaults = {
  active: true,
  nworkers: 3,
  'service.url': CFG.URL.API,
};

if(!Prefs.get('since')) 
  Prefs.set('since', { time: new Date(), version: CFG.VERSION });

function execQuery(sql, values, options, callback) {
  //DBG && console.log('STORE: QUERY:', sql, values);

  if(_.isFunction(options)) {
    callback = options;
    options = null;
  }

  if(_.isFunction(values)) {
    callback = values;
    options = null;
    values = null;
  }

  options || (options = {});

  var
  rows = [],
  isSelect = sql.slice(0, 6) == 'SELECT';

  // Web SQL API
  SQLStore.db.transaction(function(tx) {
    tx.executeSql(sql, values, function (tx, result) {
      // TODO 
      if(options.count) {
        callback(null, result.rows.item(0));
      } else if(isSelect) {
        var
        rows = result.rows,
        len = rows.length,
        newRows = new Array(len);

        for(var i = 0; i < len; i += 1) {
          newRows[i] = _.clone(rows.item(i));
        }
        callback(null, newRows);
      } else {
        callback(null, _.pick(result, 'length'));
      }
    }, function(tx, err) {
      callback({
        code: 'SQL:' + err.code,
        message: err.message
      });
    });
  })
}

function openConnection(name) {
  // Some people have 100s of alerts requiring large amount of storage data.
  SQLStore.db = openDatabase(name, 1, 'Distill data store', 1000 * 1024 * 1024);
}

;
function convertTS(doc) {
  var newDoc = _.extend({}, doc);
  _.each(doc, function(value, key) {
    if(key === 'ts' || key.indexOf('ts_') === 0) {
      if(_.isString(value)) {
        value = new Date(value);
      }
      value != null && (newDoc[key] = value.valueOf());
    }
  });
  return newDoc;
}

function SQLStore(options) {

  var self = this;

  _.extend(this, {
    primaryKey: 'id',
    tableName: options.name
  }, options, {
    fields: _.flatten(_.pluck(options.versions, 'fields'))
  });

  this.create = create;
  this.destroy = destroy;
  this.destroyWithSubQuery = destroyWithSubQuery;
  this.tableInit = tableInit;
  this.find = find;
  this.findOne = findOne;
  this.update = update;

  // $api
  function create(doc, callback) {
    doc = convertTS(doc);
    var
    id = doc.id || (doc.id = guid()),
    outValues = [],
    sql = Statements.insert(self, doc, outValues);

    callback || (callback = function() {});

    execQuery(sql, outValues, function(err, doc) {
      if(err) {
        callback(err);
      } else {
        findOne(id, function(err, doc) {
          callback(err, doc);
          !err && doc && gEvents.trigger('store:create:'+self.name, doc);
        });
      }
    });
  }

  // $api
  function destroy(query, callback) {
    query || (query = {});
    if(_.isString(query)) query = { id: query };

    callback || (callback = function() {});

    async.series({
      list: function(callback) {
        find(query, { only: ['id'] }, callback);
      },
      destroys: function(callback) {
        var
        outValues = [],
        sql = Statements.destroy(self, query, outValues);
        
        execQuery(sql, outValues, callback);
      }
    }, function(err, result) {
      callback(err, result.destroys);

      if(!err && result.list.count > 0) {
        result.list.data.forEach(function(row) {
          gEvents.trigger('store:destroy:' + self.name, row);
        });
      }
    });

  }

  // Need a special function to delete fields using a select from the same
  // table that requires LIMIT and OFFSET.
  // XXX Why not make it the default destroy implementation?
  function destroyWithSubQuery(query, options, callback) { 
    options || (options = {});

    var ids;

    _.extend(options, {
      only: ['id'],    // XXX Assuming that in our case, all tables have id.
    });

    async.waterfall([
      function(callback) {

        var
        outValues = [],
        subQuery = Statements.select(self, query, options, outValues);

        execQuery(subQuery, outValues, options, callback);
      },
      function(rows, callback) {
        ids = _.pluck(rows, 'id');

        var
        outValues = [],
        destroyQuery = Statements.destroy(self, {
          'id.in': ids
        }, outValues);

        execQuery(destroyQuery, outValues, callback);
      }
    ], function(err, result) {
      callback(err, result);
      
      if(!err) {
        _.each(ids, function(id) {
          gEvents.trigger('store:destroy:' + self.name, { id: id });
        });
      }
    });
  }

  // $api
  function find(query, options, callback) {
    if(_.isFunction(options)) {
      callback = options;
      options = {};
    }

    query || (query = {});
    options || (options = {});
    callback || (callback = function() {});

    _.defaults(options, {
      limit: DEFAULT_LIMIT,
      offset: 0,
      order: ['-ts']
    });

    //console.log('store:find:options:', self.name, options);

    async.parallel({
      data: function(callback) {
        var
        outValues = [],
        sql = Statements.select(self, query, options, outValues);

        execQuery(sql, outValues, options, callback);
      },
      total_count: function(callback) {
        var
        outValues = [],
        countOptions = { count: 1 },
        sql = Statements.select(self, query, countOptions, outValues);

        execQuery(sql, outValues, countOptions, callback);
      }
    }, function(err, result) {
      if(err) {
        console.error('ERR:STORE:', err);
        callback(err);
      } else {

        result.count = result.data.length;
        result.offset = options.offset;
        result.total_count = result.total_count.count;
        //DBG && console.log('STORE:FIND:result', result);

        callback(null, result);
      }
    });
  }

  function findOne(query, options, callback) {
    if(_.isFunction(options)) {
      callback = options;
      options = {};
    }

    query || (query = {});
    if(_.isString(query)) query = { id: query };

    options || (options = {});
    callback || (callback = function() {});

    if(_.isFunction(options)) {
      callback = options;
      options = {};
    }

    _.extend(options, {
      limit: 1,
    });

    var
    outValues = [],
    sql = Statements.select(self, query, options, outValues);

    execQuery(sql, outValues, options, function(err, result) {
      callback(err, result ? result[0] : null);
    });
  }

  function tableInit(callback) {
    //console.log('tableInit:', self.tableName);
    // Steps to initialize tables:
    // 1. Check if table exits, and if so, which version.
    // 2. If table does not exist, create a new table.
    // 3. If table exists, start upgrade for each version sequentially.
    execQuery(
      'SELECT name FROM sqlite_master WHERE name = ?',
      [self.tableName],
      function(err, result) {
        if(err) {
          console.error('failed to fetch data from sqlite_master', err);
          callback(err)
        } else {
          if(result.length == 1) {
            tableCheckForUpgrade(callback);
          } else {
            tableCreate(callback);
          }
        }
      }
    )
  }

  function tableCheckForUpgrade(callback) {
    //console.log('tableCheckForUpgrade:', self.tableName);
    // TODO Query metadata for table's currently installed version
    // TODO Add entries to maint_logs when we create a new table or upgrade
    // it to the latest version.
    var
    currentVersion = self.versions[0].version,
    latestVersion = self.versions[self.versions.length - 1].version;

    MaintLog.findOne({
      name: self.tableName
    }, {
      limit: 1,
      order: ['-ts']
    },
    function(err, doc) {
      //console.log('tableCheckForUpgrade: findOne in maint_logs:', err, doc);
      err && console.error('err:', err);
      if(doc) {
        currentVersion = doc.version;
      }
      if(latestVersion > currentVersion) {
        tableUpgradeFromVersion(currentVersion, callback);
      } else {
        callback();
      }
    });
  }

  function tableCreate(callback) {
    //console.log('tableCreate:', self.tableName, self.fields);
    var sql = Statements.createTable(self);
    execQuery(sql, function(err) {
      if(err) {
        callback(err);
      } else {
        MaintLog.create({
          name: self.tableName,
          version: self.versions[self.versions.length - 1].version
        }, callback);
      }
    });
  }

  function tableUpgrade(versionDelta, callback) {
    //console.log('tableUpgrade:', self.tableName, versionDelta.version);
    var
    sqls = _.map(versionDelta.fields, function(field) {
      return Statements.alterTableAddColumn(self, field);
    });

    async.eachSeries(sqls, execQuery, callback);
  }

  function tableUpgradeFromVersion(currentVersion, callback) {
    //console.log('tableUpgradeFromVersion:', self.tableName, currentVersion);
    var
    versions = self.versions,
    indexCurrent = _.indexOf(versions, _.findWhere(versions, {
      version: currentVersion
    })),
    newVersions = _.rest(versions, indexCurrent+1);

    if(indexCurrent < 0 || newVersions.length == 0) {
      throw new Error('Incorrect version to upgrade from: ' + currentVersion);
    }

    async.eachSeries(newVersions, tableUpgrade, function(err) {
      MaintLog.create({
        name: self.tableName,
        version: newVersions[newVersions.length - 1].version
      }, callback);
    });
  }

  function update(query, doc, callback) {
    query || (query = {});
    if(_.isString(query)) query = { id: query };

    doc = convertTS(doc);
    doc.ts_mod || (doc.ts_mod = Date.now());
    callback || (callback = function() {});

    //DBG && console.log('STORE: UPDATE:', query, doc);

    async.series({
      list: function(callback) {
        find(query, {
          only: ['id']
        }, callback);
      },
      updates: function(callback) {
        var
        outValues = [],
        sql = Statements.update(self, query, doc, outValues);
        
        execQuery(sql, outValues, callback);
      }
    }, function(err, result) {
      callback(err, result.updates);

      if(!err && result.list.count > 0) {
        result.list.data.forEach(function(row) {
          gEvents.trigger('store:update:' + self.name, _.extend(row, doc));
        });
      }
    });

  }

}

openConnection('distill.sqlite');

var MaintLog = new SQLStore({
  tableName: 'maint_logs',
  versions: [{
    version: 1,
    fields: [
      { name: 'id',       type: 'string', primaryKey: 1 },
      { name: 'name',     type: 'string', },
      { name: 'version',  type: 'integer', },
      { name: 'ts',       type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
    ]
  }]
});

var ClientStore = new SQLStore({
  name: 'clients',
  versions: [{
    version: 1,
    fields: [
      { name: 'id',           type: 'string', primaryKey: 1 },
      { name: 'user_id',      type: 'string' },
      { name: 'type',         type: 'integer' },
      { name: 'name',         type: 'string' },
      { name: 'desc',         type: 'string' },
      { name: 'state',        type: 'integer', default: C.STATE_DEFAULT },
      { name: 'ts_mod',       type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: 'ts',           type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: '_state',       type: 'integer', default: C.LOCAL_STATE_SYNCED },
    ]
  }],
  onCreate: function(callback) {
    // TODO Perform one time initialization of the table
    //this.create({ name: '', type: '' }, callback);
  }
});

var SieveStore = new SQLStore({
  name: 'sieves',
  versions: [{
    version: 1,
    fields: [
      { name: 'id',           type: 'string', primaryKey: 1 },
      { name: 'user_id',      type: 'string' },
      { name: 'name',         type: 'string' },
      { name: 'uri',          type: 'string' },
      { name: 'rule_id',      type: 'string' },
      { name: 'content_type', type: 'integer' },
      { name: 'config',       type: 'string' },
      { name: 'schedule',     type: 'string' },
      { name: 'state',        type: 'integer', default: C.STATE_READY },
      { name: 'text',         type: 'string' },
      { name: 'tags',         type: 'string' }, // de-normalized tag data
      // Timestamp when sievedata changed.
      { name: 'ts_data',      type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      // When it was last viewed by user
      { name: 'ts_view',      type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: 'ts_mod',       type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: 'ts',           type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: '_state',       type: 'integer', default: C.LOCAL_STATE_SYNCED },
    ]
  }, {
    version: 2,
    fields: [
      { name: 'client_id',    type: 'string' },
    ]
  }]
});

var TagStore = new SQLStore({
  name: 'tags',
  versions: [{
    version: 1,
    fields: [
      { name: 'id',           type: 'string', primaryKey: 1 },
      { name: 'name',         type: 'string' },
      { name: 'ts_mod',       type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: 'ts',           type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: '_state',       type: 'integer', default: C.LOCAL_STATE_SYNCED },
    ]
  }, {
    version: 2,
    fields: [
      { name: 'user_id',      type: 'string' },
      { name: 'client_id',    type: 'string' },
      { name: 'state',        type: 'integer', default: C.STATE_DEFAULT},
    ]
  }]
});

var SieveDataStore = new SQLStore({
  name: 'sieve_data',
  versions: [{
    version: 1,
    fields: [
      { name: 'id',           type: 'string', primaryKey: 1 },
      { name: 'sieve_id',     type: 'string' },
      { name: 'data_type',    type: 'integer' },
      { name: 'data',         type: 'string' },
      { name: 'text',         type: 'string' },
      { name: 'ts_mod',       type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: 'ts',           type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: '_state',       type: 'integer', default: C.LOCAL_STATE_SYNCED },
    ]
  }, {
    version: 2,
    fields: [
      { name: 'state',        type: 'integer', default: C.STATE_DEFAULT},
    ]
  }]
});

var ActionStore = new SQLStore({
  name: 'actions',
  versions: [{
    version: 1,
    fields: [
      { name: 'id',           type: 'string', primaryKey: 1 },
      { name: 'sieve_id',     type: 'string' },
      { name: 'type',         type: 'integer' },
      { name: 'config',       type: 'string' },
      { name: 'state',        type: 'integer', default: C.STATE_DEFAULT},
      { name: 'ts_mod',       type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: 'ts',           type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: '_state',       type: 'integer', default: C.LOCAL_STATE_SYNCED },
    ]
  }, {
    version: 2,
    fields: [
      { name: 'user_id',      type: 'string' },
      { name: 'client_id',    type: 'string' },
    ]
  }]
});

var RuleStore = new SQLStore({
  name: 'rules',
  versions: [{
    version: 1,
    fields: [
      { name: 'id',           type: 'string', primaryKey: 1 },
      { name: 'user_id',      type: 'string' },
      { name: 'name',         type: 'string' },
      { name: 'config',       type: 'string' },
      { name: 'ts_mod',       type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: 'ts',           type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: '_state',       type: 'integer', default: C.LOCAL_STATE_SYNCED },
    ]
  }, {
    version: 2,
    fields: [
      { name: 'client_id',    type: 'string' },
      { name: 'state',        type: 'integer', default: C.STATE_DEFAULT},
    ]
  }]
});

var AttrStore = new SQLStore({
  name: 'attrs',
  versions: [{
    version: 1,
    fields: [
      { name: 'id',           type: 'string', primaryKey: 1 },
      { name: 'user_id',      type: 'string' },
      { name: 'name',         type: 'string' },
      { name: 'value',        type: 'string' },
      { name: 'state',        type: 'integer' },
      { name: 'ts_mod',       type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: 'ts',           type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: '_state',       type: 'integer', default: C.LOCAL_STATE_SYNCED },
    ]
  }]
});

// Stores errors related to activities that should be reviewed manually.
var ErrorStore = new SQLStore({
  name: 'errors',
  versions: [{
    version: 1,
    fields: [
      { name: 'id',           type: 'string', primaryKey: 1 },
      // Context name describes the context in which this error occurred.
      { name: 'context',      type: 'string' },
      // Human readable error message (template?). 
      { name: 'msg',          type: 'string' },
      // Contextual data when this error happened.
      { name: 'data',         type: 'string' },
      // Actual error message received.
      { name: 'err',          type: 'string' },
      { name: 'ts_mod',       type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: 'ts',           type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: '_state',       type: 'integer', default: C.LOCAL_STATE_SYNCED },
    ]
  }]
});

var WorkStore = new SQLStore({
  name: 'works',
  versions: [{
    version: 1,
    fields: [
      { name: 'id',           type: 'string', primaryKey: 1 },
      { name: 'rel',          type: 'string' },
      { name: 'key',          type: 'string' },
      { name: 'err',          type: 'string' },
      { name: 'data',         type: 'string' },
      { name: 'duration',     type: 'integer' },
      { name: 'ts_mod',       type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: 'ts',           type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: '_state',       type: 'integer', default: C.LOCAL_STATE_SYNCED },
    ]
  }]
});

var PopupMessageStore = new SQLStore({
  name: 'popup_messages',
  versions: [{
    version: 1,
    fields: [
      { name: 'id',           type: 'string', primaryKey: 1 },
      { name: 'rel',          type: 'string' },
      { name: 'key',          type: 'string' },
      { name: 'uri',          type: 'string' },
      { name: 'title',        type: 'string' },
      { name: 'ts_mod',       type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: 'ts',           type: 'integer', default: "(strftime('%s', 'now')*1000.0)" },
      { name: '_state',       type: 'integer', default: C.LOCAL_STATE_SYNCED },
    ]
  }]
});

async.eachSeries([MaintLog, ClientStore, SieveStore, TagStore, SieveDataStore,
ActionStore, RuleStore, AttrStore, ErrorStore, WorkStore, PopupMessageStore, ],
function(store, callback) {
  //console.log('to call tableInit:', store.tableName);
  store.tableInit(function(err) {
    err && console.error('err:', err);
    callback(err);
  });
}, function(err) {
  if(err) {
    console.error('Tables init error:', err);
    gEvents.trigger('store:init:err', err);
  } else {
    gEvents.trigger('store:init');
  }
});
;
const
TIMEOUT_FIND_LOADER = 5000,
TIMEOUT_LOAD = 30000;

/**
 * List of public APIs and events.
 *
 * APIs:
 *  - id
 *  - ports
 *  - uri
 *  - destroy
 *  - getPort
 *  - getPortIndex
 *  - load
 *  - port_request
 *
 * Events:
 *  - reset
 *  - port:connect
 *  - port:<port_events>
 *  - load_error
 *  - load:root
 *  - load
 *  - 
 */
function WebpageLoader(options) {
  var self = this;
  this.options = _.extend({}, this.options, options);
  this.ports = [];
  this.id = WebpageLoader.ID++;
  WebpageLoader.INSTANCES.push(this);

  this.createView(function() {
    self.options.url && self.load(self.options.url);
  });
}

_.extend(WebpageLoader.prototype, Backbone.Events, {

  rootPort: null,

  timeout: 60000,

  uri: null,

  addPort: function(port) {
    port.bind('ready', this.onPortReady, this);
    port.bind('disconnect', this.onPortDisconnect, this);

    // Add port to the list of ports
    if(port.isRoot()) { // Is a root port.
      //console.log('LOADER: root port set.', port.uri, this.id);
      this.rootPort = port;
      // XXX A hack to set root port with index 1. This can lead to errors if
      // clients are using ports and index before root port is added to loader.
      this.ports.unshift(port);
      this.uri = port.uri;
      this.trigger('reset');
    } else {
      this.ports.push(port);
    }
  },

  addPortEvents: function(aPort) {
    var self = this;

    aPort.bind('all', forwardEvent);
    function forwardEvent(eventName, event) {
      var newType = 'port:' + eventName;
      self.trigger(newType, _.extend({}, event, {
        portId: aPort.id,
        type: newType
      }), aPort);
    }
  },

  // Sub-classes create frames to load documents, either in an iframe or in a 
  // tab.
  createView: function(options) {
    throw new Error('Not implemented');
  },

  destroy: function() {
    if(this.destroyed) return;   // nothing to do if already destroyed.

    _.each(this.ports.splice(0), function (port) {
      port.destroy();
    });

    this.destroyed = true;

    WebpageLoader.INSTANCES.splice(WebpageLoader.INSTANCES.indexOf(this), 1);

    this.off();
    this.rootPort = null;
    this.destroy2 && this.destroy2();
  },

  findPorts: function(portSelector) {
    var filter = function() { return false };

    if(portSelector.id && portSelector.uri) {
      return [portSelector];
    } else if(portSelector == '<root>') {
      return [this.rootPort];
    } else if(portSelector == '<all>') {
      filter = function(port) { return true; }
    } else if(_.isNumber(portSelector)) {
      filter = function(port, index) { return index === portSelector; }
    } else if(portSelector.href) {
      if(typeof portSelector.href == 'object') {
        var regex = new RegExp(portSelector.href.pattern,
                     portSelector.href.flags || 'i');
        filter = function(port) {
          return regex.test(port.data.href);
        }
      } else {  // a string
        filter = function(port) { return port.data.href == portSelector.href; }
      }
    } else if(portSelector.indices != undefined) {
      filter = function(port, index) {
        return portSelector.indices.indexOf(index) >= 0;
      }
    }
    // XXX support more ways of finding ports
    return _.filter(this.ports, filter);
  },

  getPort: function(portId) {
    for(var i = 0; i < this.ports.length; i += 1) {
      if(this.ports[i].id == portId) {
        return this.ports[i];
      }
    }
  },

  getPortIndex: function(portId) {
    for(var i = 0; i < this.ports.length; i += 1) {
      if(this.ports[i].id == portId) {
        return i;
      }
    }
    return -1;
  },

  load: function(url, cb, timeoutPeriod) {
    //console.log('EXTN:LOADER:load():', url);

    var
    self = this,
    timeoutPeriod = timeoutPeriod || TIMEOUT_LOAD,
    timeoutId = setTimeout(timeout, timeoutPeriod);

    this.bind('port:connect', onPortConnect);

    // TODO Call function to load URL using the root object holding ports.
    this.setURL(url);
    cb && cb();

    function done() {
      self.unbind('port:connect', onPortConnect);
      clearTimeout(timeoutId);
    }

    function onPortConnect(aPort, aLoader) {
      if(aPort == this.rootPort) {
        done();
      }
    }

    function timeout() {
      console.error('ERR:LOADER:timeout', self, self.uri);

      done();
      self.trigger('load_error', self);
    }
  },

  onPortDisconnect: function(aPort) {
    //console.log('EXTN:LOADER:onPortDisconnect:', aPort);

    if(aPort == this.rootPort) {
      this.rootPort = null;
    }
    var index = this.ports.indexOf(aPort);
    this.ports.splice(index, 1);
  },

  onPortReady: function(aPort) {
    //console.log('EXTN:LOADER:onPortReady:', aPort);

    this.addPortEvents(aPort);

    this.trigger('port:connect', aPort, this); 

    // NOTE Emit load event only if it is a none about:blank for root port
    if(aPort != this.rootPort || aPort.uri != 'about:blank') {
      if(aPort == this.rootPort) {
        this.trigger('load:root', aPort, this);
      }
      this.trigger('load', aPort, this);
    }
  },

  port_request: function(portSelector, input, cb) {
    //console.log('EXTN:loader:port_request:', portSelector, input, cb);
    var matchingPorts = this.findPorts(portSelector);

    if(matchingPorts.length == 0) {
      cb(Err.NOT_FOUND({
        type: 'port',
        param:'selector',
        id: JSON.stringify(portSelector),
        data: portSelector,
        loader: this.id
      }));
    } else {
      matchingPorts[0].sendRequest(input.path, input.data, cb);
    }
  },

  setURL: function(url) {
    throw new Error('setURL not implelemented by WebpageLoader subclass:',
      this.constructor);
  }

});

WebpageLoader.ID = 1;
WebpageLoader.INSTANCES = [];

WebpageLoader.get = function WL_get(id) {
  return _.detect(WebpageLoader.INSTANCES, function(loader) {
    return loader.id == id;
  });
}


function FrameLoader(options) {
  WebpageLoader.call(this, options);
}

_.extend(FrameLoader.prototype, WebpageLoader.prototype, {

  createView: function(callback) {
    var
    // We use height as a way to encode id of the frame. This id is sent back
    // by port to bg on connection. We use the height to match that port to this
    // loader.
    height = this.height = this.id % 200 + 600,
    iframe = this.iframe = document.createElement('iframe');

    iframe.width = this.width;
    iframe.height = this.height;
    iframe.src = 'about:blank';

    document.body.appendChild(iframe);
    callback();
  },

  destroy2: function() {
    this.iframe.parentNode.removeChild(this.iframe);
    delete this.iframe;
  },

  setURL: function(url) {
    this.iframe.src = url;
  }

});

function TabLoader(options) {
  WebpageLoader.call(this, options);
}

_.extend(TabLoader.prototype, WebpageLoader.prototype, {

  options: {
    pinned: true,
    openIn: 'tab',   // valid values: tab, window
    active: false,
  },

  tabId: null,

  url: 'about:blank',

  createView: function(callback) {
    var self = this;

    if(self.options.tabId) {
      chrome.tabs.get(self.options.tabId, function(tab) {
        if(!tab) { 
          console.error('EXTN: loader.js: tab to attach to not found');
          return self.destroy();
        }
        self.tabId = tab.id;
        // If the loader is being attached to an existing tab, load port script.
        chrome.tabs.executeScript(tab.id, {
          allFrames: true,
          file: 'port-loader.js',
          runAt: 'document_start'
        });
      });
      callback();
    } else if('window' == self.options.openIn) {
      chrome.windows.create({
        focused: self.openActive,
        url: self.options.url || chrome.extension.getURL('blank.html')
      }, function(win) {
        self.tabId = win.tabs[0].id;
        chrome.tabs.update(self.tabId, {
          pinned: self.pinned
        });
        callback();
      });
    } else {
      // create tab in current window
      var info = _.pick(self.options, 'active', 'index', 'pinned');
      info.url = self.options.url || chrome.extension.getURL('blank.html');

      chrome.tabs.getSelected(function(activeTab) {
        if(self.options.after == 'activeTab') {
          info.index = activeTab.index + 1;
        }
        chrome.tabs.create(info, function(tab) {
          self.tabId = tab.id;
          callback();
        });
      });
    }
  },

  destroy2: function() {
    // Remove tab if we created it. do not remove if we didnt create it.
    if(!this.options.tabId && this.tabId) {
      try {
        var id = this.tabId;
        chrome.tabs.remove(id, function() {
          // A delayed call to remove pinned tab for Opera since pinned tabs
          // cant be closed in Opera. This is unnecessary for Chrome.
          setTimeout(function() {
            chrome.tabs.update(id, { pinned: false }, function() {
              chrome.tabs.remove(id)
            });
          }, 50);
        });
      } catch(e) {/*ignore, tab removed*/}
    }
  },

  setURL: function(url) {
    chrome.tabs.update(this.tabId, {
      url: url
    });
  }
});

function loaderFindFrameLoader(attrs) {
  return _.find(WebpageLoader.INSTANCES, function(loader) {
    return (attrs.parent.id === 'BG' && loader.height == attrs.size.height)
      || _.any(loader.ports, function(port) {
        return port.attrs.id === attrs.parent.id
      });
  })
}

function createLoader(options, callback) {
  if(options.type == 'tab') {
    callback(null, new TabLoader(options.info));
  } else {
    // TODO Determine type of loader to use based on server type.
    callback(null, new FrameLoader(options.info));
  }
}

function loaderAttachPort(port, callback) {
  var
  name = port.name,
  attrs = JSON.parse(name.substring('loader:'.length)),
  tab = port.sender.tab,
  loader = (tab && _.findWhere(WebpageLoader.INSTANCES, { tabId: tab.id }))
    || (!tab && loaderFindFrameLoader(attrs));

  //console.log('EXTN:loaderAttachPort:', attrs);

  loader && loader.addPort(new LoaderPort(port, attrs));
  return !!loader;
}

/*
chrome.tabs.onCreated.addListener(function(tab) {
  console.log('EXTN: tabs.onCreated:', tab.id, tab);
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  console.log('EXTN: tabs.onActivated:', activeInfo);
});

chrome.tabs.onAttached.addListener(function(tabId, attachInfo) {
  console.log('EXTN: tabs.onAttached:', tabId, attachInfo);
});

chrome.tabs.onDetached.addListener(function(tabId, detachInfo) {
  console.log('EXTN: tabs.onDetached:', tabId, detachInfo);
});

chrome.tabs.onUpdated.addListener(function(tabId, tab) {
  console.log('EXTN: tabs.onUpdated:', tabId, tab);
});
*/

chrome.tabs.onReplaced.addListener(function(added, removed) {
  console.log('EXTN: tabs.onReplaced:', added, removed);
  _.each(WebpageLoader.INSTANCES, function(loader) {
    if(loader.tabId === removed) {
      loader.tabId = added;
    }
  });
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  console.log('EXTN: tabs.onRemoved:', tabId, removeInfo);

  var loaders = _.where(WebpageLoader.INSTANCES, { tabId: tabId });
  loaders.forEach(function(loader) {
    loader.destroy()
  });
});

;
function VisualSelector(options, resultCallback) {
  var
  self = this,
  id = ID(),
  loader = options.loader,
  model = options.model,
  port,
  state = _.extend({
    selectorOn: false,
    expanded: false
  }, Prefs.get('visualselector.uistate'), options.state);

  _.extend(self, Backbone.Events);

  self.id = id;
  self.loader = loader;
  self.destroy = destroy;
  self.setPort = setPort;

  VisualSelector.INSTANCES.push(self);

  // 1. Store application state in a model.
  // 2. Open a visual selector port in tab content and connect the port to this
  //    selector instance.
  // 3. Load selector UI in an iframe in the content tab or in a separate window.
  // 4. Set the model and start editing selections.

  // If the loader is ready already, load visual selector now.
  if(loader.rootPort) load();
  self.listenTo(loader, 'reset', load);

  function destroy() {
    if(!self) return;

    VisualSelector.INSTANCES.splice(VisualSelector.INSTANCES.indexOf(self), 1);

    self.off();
    self = null;
  }

  function initPort() {
    port.on('disconnect', function() {
      self && (self.port = port = null);
    });

    port.on('port:close', onClose);
    port.on('port:save', onSave);
    port.on('port:uistate', onUIState);
    
    port.listenTo(loader, 'load', onLoaderPortLoad);
    port.listenTo(loader, 'reset', onLoaderReset);

    port.listenTo(loader, 'port:window:select:close', function(event, aPort) {
      port.postMessage({
        type: 'loader:port:window:select:close',
        data: _.extend({
          index: loader.getPortIndex(event.portId),
          title: aPort.title,
          uri: aPort.uri
        }, event)
      });
    });

    port.listenTo(loader, 'port:window:select:display', function(event, aPort) {
      port.postMessage({
        type: 'loader:port:window:select:display',
        data: _.extend({
          index: loader.getPortIndex(event.portId),
          title: aPort.title,
          uri: aPort.uri
        }, event)
      });
    });

    port.listenTo(loader, 'port:window:select:new', function(event, aPort) {
      port.postMessage({
        type: 'loader:port:window:select:new',
        data: _.extend({
          index: loader.getPortIndex(event.portId),
          title: aPort.title,
          uri: aPort.uri
        }, event)
      });
    });

    port.setRequestHandler(requestHandler);

    // Set model and state variables
    port.postMessage({
      type: 'load',
      data: {
        model: model,
        state: state
      }
    });

    // Perform init if loader has already been loaded.
    if(loader.rootPort) {
      onLoaderReset();
    }
    _.each(loader.ports, onLoaderPortLoad);

    function onLoaderReset() {
      if(!port) return;

      port.postMessage({
        type: 'loader:reset',
        data: _.pick(loader.rootPort, 'title', 'uri')
      });
    }

    function onLoaderPortLoad(loaderPort) {
      if(!port) return;

      if(loaderPort.ready) {
        port.postMessage({
          type: 'loader:load',
          data: {
            index: loader.getPortIndex(loaderPort.id)
          }
        });
      }
    }
  }

  function load() {
    chrome.tabs.executeScript(loader.tabId, {
      file: 'port-selector.js',
      runAt: 'document_start'
    });
  }

  function onClose(event) {
    chrome.tabs.executeScript(loader.tabId, {
      code: 'remove()'
    });
    resultCallback();
    destroy();
  }

  function onSave(event) {
    //console.log('EXTN:VisualSelector:onSave', event);
    chrome.tabs.executeScript(loader.tabId, {
      code: 'remove()'    // Close visual selector ui
    });
    resultCallback(null, event.data);
    destroy();
  }

  function onUIState(event) {
    state = event.data;
    Prefs.set('visualselector.uistate', event.data);
  }

  function requestHandler(path, input, sendResponse) {
    switch(path) {
      case 'loader/port_request':
      loader.port_request(input.portSelector, input.data, sendResponse);
      break;

      default:
      break;
    }
  }

  function setPort(_port) {
    if(port) port.destroy();
    self.port = port = _port;
    initPort();
    self.trigger('port:connect', port);
  }

}

VisualSelector.INSTANCES = [];

function selectorAttachPort(port) {
  var
  tabId = port.sender.tab.id,
  vs = _.find(VisualSelector.INSTANCES, function(vs) {
    return vs.loader.tabId == tabId;
  });

  //console.log('selectorAttachPort?', !!vs, tabId, VisualSelector.INSTANCES);

  vs && vs.setPort(new SimplePort(port));
  return !!vs;
}

;
const
TYPE_FORM_ENCODED = 'application/x-www-form-urlencoded',
TYPE_JSON = 'application/json',
RE_XML = /((\/xml)|(\+xml))$/;

function encodeParams(params) {
  return _.map(params, function(value, name) {
    return name+'='+encodeURIComponent(value);
  }).join('&')
}

const HTTP = {
  request: function(options, callback) {
    var
    xhr,
    params = options.params,
    json = options.json || {},
    contentType = params ? TYPE_FORM_ENCODED : TYPE_JSON ,
    str = contentType == TYPE_JSON ? JSON.stringify(json) : encodeParams(params),
    method = options.method || 'GET',
    url = options.url;

    DBG && console.log('XHR:', method, url);

    if(method == 'GET' && !_.isEmpty(json)) {
      // TODO Install dependency querystring
      url += (url.indexOf('?') < 0 ? '?' : '&') + qs.stringify(json);
    }

    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = onreadystatechange;
    xhr.open(method, url, true);
    setHeaders();

    if(method == 'GET') {
      // null for GET with native object
      xhr.send(null);
    } else {
      xhr.send(str);
    }

    function onreadystatechange() {
      if(xhr.readyState == 4) {
        var
        text = xhr.responseText,
        contentType = xhr.getResponseHeader('content-type') || 'text',
        isJSON = contentType.indexOf(TYPE_JSON) == 0,
        isXML = RE_XML.test(contentType),
        response = isJSON ? JSON.parse(text) : isXML ? xhr.responseXML : text,
        status = xhr.status;

        //DBG && console.log('HTTP:response:(type?', contentType, ')-', xhr.status,  xhr, xhr.responseText);

        callback(status !=200 ? { status: status } : null, response, xhr);
      }
    }

    function setHeaders() {
      xhr.withCredentials = true;
      if(method != 'GET') {
        xhr.setRequestHeader('Content-type', contentType);
      }
      _.each(options.headers, function(value, key) {
        xhr.setRequestHeader(key, value);
      });
    }

    return xhr;
  },
  del: function(options, callback) {
    _.extend(options, { method: 'DELETE' });
    return HTTP.request(options, callback);
  },
  head: function(options, callback) {
    _.extend(options, { method: 'HEAD' });
    return HTTP.request(options, callback);
  },
  get: function(options, callback) {
    _.extend(options, { method: 'GET' });
    return HTTP.request(options, callback);
  },
  post: function(options, callback) {
    _.extend(options, { method: 'POST' });
    return HTTP.request(options, callback);
  },
  put: function(options, callback) {
    _.extend(options, { method: 'PUT' });
    return HTTP.request(options, callback);
  }
};

;
function api(url, method, json, callback, retriedOn401) {
  if(url.indexOf('http:') != 0 && url.indexOf('https:') != 0) {
    url = CFG.URL.API + url;
  }

  return HTTP.request({
    url: url,
    method: method,
    json: json,
    headers: {
      Authorization: Prefs.get('service.auth_token')
    }
  }, function(err, res, xhr) {
    // Handle authorization errors
    if(err && err.status == 401 && !retriedOn401) {
      // Get new auth token
      auth.save(auth.get(), function(err, res) {
        api(url, method, json, callback, true);
      });
    } else {
      callback(err, res, xhr);
    }
  });
}
;
const auth = {
  check: function(params, callback) {
    HTTP.post({
      url: CFG.URL.API + '/users/auth_check',
      params: params
    }, callback);
  },

  clear: function(callback) {
    var token = Prefs.del('service.auth_token');
    Prefs.del('service.name');
    if(token) {
      HTTP.post({
        url: CFG.URL.API + '/users/auth_token_expire',
        params: { token: token }
      }, callback);
    } else {
      callback();
    }
  },

  // Returns saved credentials
  get: function(callback) {
    var
    name = Prefs.get('service.name'),
    password = Prefs.get('service.password'),
    cred = password ? {
      name: name,
      password: password
    } : null;
    callback && callback(null, cred);
    return cred;
  },

  getName: function() {
    return Prefs.get('service.name');
  },

  save: function(params, callback) {
    // 1. Validate params using auth_check
    // 2. If successful, get auth_token and save to DB

    auth.check(params, function(err, res) {
      if(err) {
        Prefs.set('service.password', null);
        Prefs.set('service.auth_token', null);
        callback(err);
      } else {
        Prefs.set('service.name', params.name);
        Prefs.set('service.password', params.password);
        // Store email address in internal storage, currently we can have only one
        // email address

        HTTP.post({
          url: CFG.URL.API + '/users/auth_token',
          params: params
        }, function(err, res) {
          if(err) {
            callback(err);
          } else {
            Prefs.set('service.auth_token', res.token);
            callback();

            // TODO Initiate sync manager to sync data from remote server.
            // Get user attributes and save them to DB.
            api('/users/attrs', 'GET', null, function(err, res) {
              AttrStore.destroy({}, function() {
                async.each(res.data, function(attr, callback) {
                  AttrStore.create(attr, callback);
                }, callback);
              });
            });
          }
        });
      }
    });
  }
};


;
;
const ActionEmail = {
  send: function(config, context, callback) {
    //console.log('ActionEmail:send:', config, context);

    auth.get(function(err, cred) {
      //console.log('ActionEmail:send:auth cred:', err, cred);

      if(err || !cred) {
        callback(err||Err.AUTH_NA());
      }

      api('/agents/actions/email', 'POST', {
        config: config,
        sieve: _.pick(context.sieve, 'id', 'name', 'uri', 'ts'),
        sieve_data: _.pick(context.sieve_data, 'id', 'text', 'data', 'ts')
      }, callback);
    });
  }
}
;
/*1
 * Feed parser
 * Parses raw XML feeds and converts them to so called Item objects (see below).
 * By qFox, 2010, http://qfox.nl
 */

var Feed = {
  domParser: new DOMParser(),

  /**
   * Detect the type of the feed and let type specific functions
   * parse the feed. The result is an array containing FeedItem 
   * objects representing the items from the feed.
   * @param XML xml The actual feed, as an XML tree
   * @param string name Name of the feed, passed on to plugins
   * @param string group Name of group of the feed, passed on to plugins
   * @return array Contains Item objects
   */
  parse: function(xml, name, group){
    var root, result;
    
    // rss 1.0 ("rdf")
    if (xml.getElementsByTagName('rdf:RDF').length || xml.getElementsByTagName('RDF').length) {
      return Feed.parseRss1(xml, name, group);
    }
  
    // rss (2.0)
    if ((root = xml.getElementsByTagName('rss')) && root.length) { // RSS feed
      if (root[0].getAttribute('version') === '2.0') { // rss 2.0
        return Feed.parseRss2(root[0], name, group);
      }
      if (root[0].getAttribute('version') === '0.91') { // rss 0.91
        return Feed.parseRss091(root[0], name, group);
      }
      throw new Error(" unknown rss version...");
    }
  
    // atom 
    if (xml.getElementsByTagName('feed').length) {
      return Feed.parseAtom(xml, name, group);
    }
  
    throw new Error("unsupported feed");
    return false;
  },
  
  /**
   * Retrieve the node value for given attribute or an empty string on failure.
   * When the third parameter is given, it returns that attribute value of the node.
   * @param xml root The root node to search through
   * @param string name The node name we're looking for
   * @param string atr=false If given, the attribute of node we want returned
   * @return mixed
   */
  getNodeValue: function(root, name, atr){
    var node;
    try {
      node = root.getElementsByTagName(name)[0];
      if (atr) return node.getAttribute(atr);
  
      return Feed.sanitize(node.childNodes[0].nodeValue);
    } catch(er) {
      return '';
    }
  },

  sanitize: function(text) {
    if(!/<\w.*>/.test(text)) return text;

    var
    doc = Feed.domParser.parseFromString(text, 'text/html'),
    kachra = doc && doc.querySelectorAll('script,noscript,frame,iframe,object');

    if(!doc || !doc.body) return text;
    
    _.toArray(kachra).forEach(function(el) {
      var parent = el.parentNode;
      parent && parent.removeChild(el);
    });

    // Clean on* attributes for all elements
    Feed.sanitizeAttributes(doc.documentElement);

    return doc.body.innerHTML;
  },

  sanitizeAttributes: function(el) {
    var
    attrs = _.toArray(el.attributes);

    _.each(attrs, function(attr) {
      if(attr.nodeName.indexOf('on') == 0) {
        el.removeAttribute(attr);
      }
    });

    _.each(el.childNodes, Feed.sanitizeAttributes);
  },
    
  /**
   * Parse a RSS 1.0 feed
   * Returns an array with FeedItem objects.
   *
   * @param document xmlRoot
   * @param string name Name of the feed we're fetching, passed on to plugins
   * @param string group Name of the group this feed belongs to, passed on to plugins
   * @return array
   */
  parseRss1: function(xmlRoot, name, group){
    var
    result = [], 
    channel = xmlRoot.getElementsByTagName('channel')[0],
    items = xmlRoot.getElementsByTagName('item'),
    item, 
    i;
  
    for (i=0; i < items.length; i+=1) {
      item = items[i];
      //throw new Error("Parsing item "+i+" ("+item+")");
      // title, link, description dc:creator, dc:date, dc:subject 
      try {
        result[result.length] = FeedItem(
          Feed.getNodeValue(item, 'title'),
          Feed.getNodeValue(item, 'description'),
          Feed.getNodeValue(item, 'link'),
          Feed.getNodeValue(item, 'dc:date') || Feed.getNodeValue(item, 'pubDate') || Feed.getNodeValue(item, 'date') || '',
          item
        );
      } catch (er) {
        throw new Error("Unable to parse item "+i+": "+er.message);
      }
    }
    // return the items
    return {
      title: Feed.getNodeValue(channel, 'title'),
      link: Feed.getNodeValue(channel, 'link'),
      summary: Feed.getNodeValue(channel, 'description'),
      published: Feed.getNodeValue(channel, 'pubDate') || Feed.getNodeValue(channel, 'dc:date') || Feed.getNodeValue(channel, 'date') || '',
      entries: result
    };
  },
  
  /**
   * Parse an RSS 2.0 feed
   * Returns an array containing FeedItem objects.
   *
   * @param document xmlRoot
   * @param string name Name of the feed we're fetching, passed on to plugins
   * @param string group Name of the group this feed belongs to, passed on to plugins
   * @return array
   */
  parseRss2: function(xmlRoot, name, group){
    var 
    i, 
    result = [], 
    item, // one 
    channel = xmlRoot.getElementsByTagName('channel')[0],
    items = xmlRoot.getElementsByTagName('item'); // collection of  nodes
    
    for (i=0; i < items.length; i+=1) {
      item = items[i];
      // now add the FeedItem
      try {
        result[result.length] = FeedItem(
          Feed.getNodeValue(item, 'title'),
          Feed.getNodeValue(item, 'description'),
          Feed.getNodeValue(item, 'link'),
          Feed.getNodeValue(item, 'pubDate') || Feed.getNodeValue(item, 'dc:date') || Feed.getNodeValue(item, 'date') || '',
          item
        );
      } catch(er) {
        throw new Error("Feed.parseRss2 fail for "+i+" "+j+" ("+er.message+")");
      }
    }
    
    return {
      title: Feed.getNodeValue(channel, 'title'),
      link: Feed.getNodeValue(channel, 'link'),
      summary: Feed.getNodeValue(channel, 'description'),
      published: Feed.getNodeValue(channel, 'pubDate') || Feed.getNodeValue(channel, 'dc:date') || Feed.getNodeValue(channel, 'date') || '',
      entries: result
    };
  },
  
  /**
   * Parse a RSS 0.91 feed
   * Returns an array with FeedItem objects
   *
   * @param document xmlRoot
   * @param string name Name of the feed we're fetching, passed on to plugins
   * @param string group Name of the group this feed belongs to, passed on to plugins
   * @return array
   */
  parseRss091: function(xmlRoot, name, group){
    var
    i, 
    result = [], 
    item, // single  FeedItem
    channel = xmlRoot.getElementsByTagName('channel')[0],
    items = xmlRoot.getElementsByTagName('item'); // get items for this feed
  
    for (i=0; i < items.length; i+=1) {
      item = items[i];
      // now add the FeedItem
      try {
        result[result.length] = FeedItem(
          Feed.getNodeValue(item, 'title'),
          Feed.getNodeValue(item, 'description'),
          Feed.getNodeValue(item, 'link'),
          Feed.getNodeValue(item, 'pubDate') || Feed.getNodeValue(item, 'dc:date') || Feed.getNodeValue(item, 'date') || '',
          item
        );
      } catch(er) {
        throw new Error("Feed.parseRss2 fail for "+i+" ("+er.message+")");
      }
    }
  
    return {
      title: Feed.getNodeValue(channel, 'title'),
      link: Feed.getNodeValue(channel, 'link'),
      summary: Feed.getNodeValue(channel, 'description'),
      published: Feed.getNodeValue(channel, 'pubDate') || Feed.getNodeValue(channel, 'dc:date') || Feed.getNodeValue(channel, 'date') || '',
      entries: result
    };
  },
  
  /**
   * Parse an Atom feed
   * Returns an array with FeedItem objects.
   *
   * @param document xmlRoot
   * @param string name Name of the feed we're fetching, passed on to plugins
   * @param string group Name of the group this feed belongs to, passed on to plugins
   * @return array
   */
  parseAtom: function(xmlRoot, name, group){
    var
    result = [], 
    i,
    item, // one  FeedItem
    channel = xmlRoot.getElementsByTagName('channel')[0],
    items = xmlRoot.getElementsByTagName('entry');
  
    for (i=0; i < items.length; i+=1) {
      item = items[i];
      // title, link, summary, published
      try {
        result[result.length] = FeedItem(
          Feed.getNodeValue(item, 'title'),
          Feed.getNodeValue(item, 'summary'),
          Feed.getNodeValue(item, 'link', 'href'),
          Feed.getNodeValue(item, 'published') || Feed.getNodeValue(item, 'published') || '',
          item
        );
      } catch (er) {
        throw new Error("Unable to parse item "+i+": "+er.message);
      }
    }
    
    return {
      title: Feed.getNodeValue(channel, 'title'),
      link: Feed.getNodeValue(channel, 'link'),
      summary: Feed.getNodeValue(channel, 'description'),
      published: Feed.getNodeValue(channel, 'published') || Feed.getNodeValue(channel, 'updated') || '',
      entries: result
    };
  },

  fetch: function(url, callback) {
    var xhr = HTTP.get({
      url: url,
      headers: { 'X-Moz': 'livebookmarks' }
    }, function(err, response) {
      if(err) {
        console.error('error getting feed from: ' + url);
        callback(err);
      } else {
        if(response.nodeType === Node.DOCUMENT_NODE) {
          Feed.fromXML(response, callback);
        } else {
          // Default to a string type. If we have a JSON, callback.
          Feed.fromString(response, callback);
        }
      }
    });
  },

  // calls callback with the retrieved result
  fromString: function(text, callback) {
    var
    parser = new DOMParser(),
    doc = parser.parseFromString(text, 'application/xml');

    Feed.fromXML(doc, callback);
  },

  fromXML: function(doc, callback) {
    if(doc) {
      callback(null, Feed.parse(doc));
    } else {
      callback(ERR.PARAM_INVALID({ param: 'feed', value: 'EMPTY' }));
    }
  },

  getText: function(feed) {
    var buff = [feed.title];

    feed.entries.forEach(function(entry, index){
      buff.push(entry.title, entry.summary);
    });

    return buff.join('\n');
  }

};

function FeedItem(title, summary, url, date, dom){
  return {
    title: title,       // string
    link: url,          // string
    summary: summary,   // string (not sanatized)
    published: date,         // timestamp (as found in the feed...)
  }
};


;
function Runner(sieve) {
  var
  TIMEOUT = 60000,  // in ms
  MAX_RETRY_COUNT_ON_EMPTY_TEXT = 4,
  MAX_RETRY_COUNT_ON_EMPTY_TEXT_FOR_HTML = 1,
  RETRY_DELAY_ON_EMPTY_TEXT = 5000, // in ms

  self = this,
  startedOn = Date.now(),
  type = sieve.content_type,
  config = JSON.parse(sieve.config),
  context = new RunnerContext({
    //openin: 'tab',  // FIXME remove opeinin
    // List of modules to load in pages
    pageMods: ['locator']
  }),
  event = context,
  resultCallback,
  timeoutId;

  this.run = run;
  this.abort = abort;

  // Call to abnormally interrupt execution. This could be done to reset it.
  function abort() {
    cleanUp(Err.ABORT({
      type: SieveStore.name,
      id: sieve.id
    }));
  }

  // A proxy to APIs defined in RunnerContext
  function cmd(name, input, callback) {
    //console.log('RUNNER:cmd:', name, input);
    if(typeof input == 'function') {
      callback = input;
      input = null;
    }
    input || (input = {});
    callback || (callback = function(err, data) { err && error(err) });
    context[name](input, callback);
  }

  function cleanUp(err, data) {
    //console.log('RUNNER:cleanUp:', err, data, new Error().stack);
    clearTimeout(timeoutId);

    try {
      context._close();
    } catch(e) {
      console.error('RUNNER: error closing context:', e);
    }

    try {
      // Fitler text using regexp
      var re = config.regexp;
      if(!err && re) {
        var matches = data.text.match(new RegExp(re, 'gim'));
        if(matches && matches.length > 0) {
          data.text = matches.join(' ');
        } else {
          data.text = '';
        }
      }
      resultCallback(err, data, getMetrics());
    } catch(e) {
      console.error('RUNNER: ERROR calling callback:', e);
      // Log this error to ErrorStore for user's review
      ErrorStore.create({
        context: 'runner',
        msg: 'Failed to call result callback after running job',
        data: JSON.stringify(sieve),
        err: JSON.stringify(Err.UNHANDLED(e))
      });
    }

    resultCallback = null;
  }

  function getMetrics() {
    var endedOn = Date.now();
    return {
      on: startedOn,
      duration: endedOn - startedOn
    }
  }

  function run(callback) {
    switch(type) {
      case C.TYPE_HTML:
      run_html(callback);
      break;

      case C.TYPE_FEED:
      run_feed(callback);
      break;

      default:
      callback(Err.PARAM_INVALID({
        param: 'config_type',
        value: type
      }));
      break;
    }
  }

  function run_feed(callback) {
    //console.log('run_feed', sieve, type, config);
    resultCallback = callback

    Feed.fetch(config.uri, function(err, feed) {
      cleanUp(err, err ? null : {
        data_type: C.TYPE_FEED,
        data: JSON.stringify(feed),
        text: Feed.getText(feed)
      });
    })
  }

  function run_html(callback) {
    var result = {
      data_type: C.TYPE_HTML,
      /* data and text modified after filter-ing each frame*/
      data: '',
      text: ''
    };
    resultCallback = callback

    /**/
    timeoutId = setTimeout(function() {
      console.error('RUNNER:timeout');

      cleanUp(Err.TIMEOUT({
        type: SieveStore.name,
        time: TIMEOUT/1000,
        id: sieve.id
      }));
    }, TIMEOUT);
    /**/

    if(!config.selections) {
      return resultCallback(new Error('Invalid selections'));
    }

    function done(err) {
      //console.log('RUNNER:done:', err, result);
      cleanUp(err, result);
    }

    function debug() {
      //console.log.apply(console, ['RUNNER:'].concat(_.toArray(arguments)));
    }

    function error() {
      console.error.apply(console, ['ERR:RUNNER'].concat(_.toArray(arguments)));
    }

    function log() {
      //console.log.apply(console, ['RUNNER:LOG:'].concat(_.toArray(arguments)));
    }


    //  // NOTE Function copied verbatim from web/worker/workers/sieve.js
    // Should keep the two copies in sync.

    // config.selections: [pages: [frames: { includes, excludes}]]
    async.mapSeries(config.selections, filterPage, function pageDone(err) {
      if(done) {
        done(err);
      } else {
        // Callback from a timedout job.
        error("result after timeout: err:%j\nresult:%j", err, result);
      }
    });

    function filterPage(pageSelection, pageDone) {
      debug('runner:filterPage:%j', pageSelection);
      var page;

      async.waterfall([
        function _newPage(callback) {
          cmd('page_new', { uri: pageSelection.uri }, callback);
        },
        function _load(res, callback) {
          page = res;
          var frameIndices = _.pluck(pageSelection.frames, 'index');

          cmd('page_load', { page_id: res.page_id, uri: pageSelection.uri });

          event.on('load', onLoad);
          event.on('load_error', onLoadError);

          // Wait for all frames to be loaded.
          function onLoad(e) {
            log('event:load:%j', e);

            // We wait for all frames to finish loading before we begin content
            // retrieval
            frameIndices = _.without(frameIndices, e.frame.index);
            if(frameIndices.length == 0) {
              event.off('load', onLoad)
              event.off('load_error', onLoadError)
              callback();
            }
          }

          function onLoadError(e) {
            error('event:load_error:%j', e);
            event.removeListener('load', onLoad)
            event.removeListener('load_error', onLoadError)
            callback(e);
          }
        },
        function _select(frameDone) {
          // Filter innermost frame first. Usually that means that frame
          // with highest index should be filtered first.
          var frames = _.sortBy(pageSelection.frames, function(frame) {
            return -frame.index;
          });
          async.mapSeries(frames, filterFrame, frameDone);
        }
      ], pageDone);

      function filterFrame(frameSelection, frameDone, retryCount) {
        retryCount || (retryCount = 0);
        debug('runner:filterFrame:', frameSelection);

        var includes = frameSelection.includes,
          excludes = frameSelection.excludes || [];

        if(config.includeScript) {
          // XXX Only include scripts with text?
          includes.push(
            { type: 'xpath', expr: '//script[not(@src)]' }
          );
        } else {
          excludes.push(
            { type: 'xpath', expr: '//script' },
            { type: 'xpath', expr: "//@*[starts-with(name(), 'on')]" }
          );
        }
        if(config.includeStyle) {
          includes.push(
            { type: 'xpath', expr: "/html/head/style" },
            { type: 'xpath', expr: "/html/head/link[@rel='stylesheet']" }
          );
        } else {
          excludes.push(
            { type: 'xpath', expr: "//style" },
            { type: 'xpath', expr: "//link[@rel='stylesheet']" },
            { type: 'xpath', expr: "//@*[name() ='style']" }
          );
        }
        excludes.push(
          { type: 'xpath', expr: "//frame" },
          { type: 'xpath', expr: "//iframe" }
        );
        // Include base URL. It will help us get
        includes.push({ type: 'xpath', expr: "//base" });

        async.waterfall([
          function(callback) {
            debug('runner:filterHTML');

            cmd('page_frame_request', {
              page_id: page.page_id,
              frame: frameSelection.index,
              input: {
                // TODO Not limited to HTML here. We will need extensions.
                //
                // Consider the case of alerts. For an alert, any piece of
                // text can be used to check for change and raise alert.
                path: 'filterHTML',
                data: { includes: includes, excludes: excludes }
              }
            }, callback);
          },
          function(ignore, callback) {
            debug('runner:getHTML');
            cmd('page_frame_request', {
              page_id: page.page_id,
              frame: frameSelection.index,
              input: { path: 'getHTML' }
            }, callback);
          },
          function(html, callback) {
            debug('runner:getText');
            result.data += html;
            cmd('page_frame_request', {
              page_id: page.page_id,
              frame: frameSelection.index,
              input: { path: 'getText' }
            }, callback);
          }
        ], function(err, text) {
          if(err) {
            frameDone(err);
          } else if(text) {
            result.text += text;
            frameDone(null);
          } else if(retryCount > MAX_RETRY_COUNT_ON_EMPTY_TEXT ||
                    // For cases when looking for full HTML retry once more
                    (config.dataAttr === 'data' &&
                    retryCount > MAX_RETRY_COUNT_ON_EMPTY_TEXT_FOR_HTML)) {
            // Text was empty and max number of retries finished.
            frameDone(null);
          } else {
            // Text was empty. Retry after some time.
            setTimeout(function() {
              retryCount += 1;
              filterFrame(frameSelection, frameDone, retryCount);
            }, RETRY_DELAY_ON_EMPTY_TEXT);
          }
        });
      }
    }

  }

};

// TODO Add API to wait for a condition. It will help create smart tasks.

function RunnerContext(options) {
  this.options = _.defaults(options||{}, { openin: 'bg' });
  this.pageMods = options.pageMods;
  this.pages = [];
}

_.extend(RunnerContext.prototype, Backbone.Events, {

  _addLoader: function(loader) {
    //DBG && console.log('RUNNER:_addLoader', loader.id, loader.on);

    loader.on('all', function(name, data) {
      //DBG && console.log('RUNNER:LOADER:event', name, data);
    });

    this.pages.push(loader);
    this.listenTo(loader, 'load', this._onLoad);
  }

  , _close: function() {
    this.off();

    this.pages.forEach(function(loader) {
      loader.destroy();
    });
  }

  , _onLoad: function(aPort, aLoader) {
    var
    self = this,
    event = {
      page_id: aLoader.id,
      frame: {
        index: aLoader.ports.indexOf(aPort),
        uri: aPort.uri
      }
    };

    //DBG && console.log('RUNNER:_onLoad', event);

    aLoader.port_request(aPort, {
      path: 'require',
      data: this.pageMods
    }, function(err) {
      self.trigger('load', event);
    })

    //DBG && console.log('RUNNER:_onLoad:end', event);

  }

  , _removeLoader: function(loader) {
    _.remove(self.pages, loader);
  }

  , page_close: function(input, cb) {
    var self = this;
    with_loader(input.page_id, function(err, loader) {
      if(err) return cb(err);

      loader.destroy();
      cb();

      self._removeLoader(loader);
    });
  }

  , page_eval: function(input, cb) {
    with_loader(input.page_id, function(err, loader) {
      if(err) return cb(err);

      loader.eval(input.script, function(err, data) {
        if(err) return cb(err);
        cb(null, {
          page_id: input.page_id
          , data: data
        });
      });
    });
  }

  , page_load: function(input, cb) {
    if(_.isEmpty(input.uri)) {
      return Err.PARAM_INVALID({
        param: 'uri',
        value: 'empty'
      });
    }
    with_loader(input.page_id, function(err, loader) {

      if(err) return cb(err);

      loader.load(input.uri, function (err, data) {
        if(err) return cb(err);

        cb(null);
      });
    });
  }

  , page_new: function(input, cb) {
    var self = this;

    //input.type = 'tab'; // FIXME
    if(Supports.tabForXFrame && input.uri && input.type === void 0) {
      var
      hostname = getHostname(input.uri),
      prefName = 'x-frame-options.'+hostname,
      openInTab = Prefs.get(prefName);

      if(openInTab !== void 0) {
        openInTab && setOpenInTab();
        create();
      } else {
        // Check website preferences to guess where to open the page
        HTTP.get({ url: input.uri }, function(err, res, xhr) {
          if(err) {
            cb(err);
          } else {
            checkResponseAndCreate(res, xhr)
          }
        });
      }

      function checkResponseAndCreate(res, xhr) {
        openInTab = xhr.getResponseHeader('x-frame-options') || /x-frame-options/i.test(res);
        Prefs.set(prefName, openInTab);
        openInTab && setOpenInTab();
        create();
      }

      function setOpenInTab() {
        // TODO Save preference for this domain in global registry list.
        _.defaults(input, {
          type: 'tab',
          info: _.defaults(input.info||{}, {
            active: false,
            index: 0,
            pinned: true,
          })
        });
      }
    } else {
      create();
    }
    function create() {
      console.log('page_new:create:', input);
      createLoader(input, function(err, loader) {
        if(err) {
          callback(err);
        } else {
          self._addLoader(loader);

          // Call after a delay of few seconds to handle cases where js loads
          // content dynamically?
          _.delay(cb, 2000, null, { page_id: loader.id });
        }
      });
    }
  }

  , page_frame_request: function(input, cb) {
    with_loader(input.page_id, function(err, loader) {
      if(err) return cb(err);

      loader.port_request(input.frame, input.input, cb);
    });
  }

  , http_request: HTTP.request

});

/**
 * Finds browser and give it back to the caller if browser is found.
 */
function with_loader(page_id, callback) {
  var loader = WebpageLoader.get(page_id);
  callback(!loader && Err.NOT_FOUND({
    type: 'loader',
    param: 'id',
    id: page_id
  }), loader);
}


;
const DATE_START = new Date();


const Scheduler = (function() {
  var
  timeouts = {},
  runners = {},
  checkInetervalId,
  q = [],
  nActive = 0,
  initialized = false;

  function checkQueue() {
    // Check queue for schedule jobs and runs them when its their turn. Run it
    // only if there is an empty slots.
    if(nActive < Prefs.get('nworkers') && q.length > 0) {
      SieveStore.findOne(q.shift(), function(err, sieve) {
        if(!sieve) {
          // We do not have this sieve anymore. It may have been deleted. Skip.
          //DBG && console.log('Scheduler:checkQueue:findOne:not found');
          return;
        }

        //DBG && console.log('Scheduler:checkQueue:findOne:', sieve);

        run(sieve, function(err) {
          //console.log('Scheduler:run:callback:', err, sieve.id);
          err && console.error('Error running:', sieve, err);

          nActive -= 1;

          if(!(err && Err.ABORT.si(err))) {
            // Schedule again iff it has not been aborted by Scheduler.this
            schedule(sieve);
          } else {
            // Ignore errors that are ABORTs since they are called by
            // scheduler
          }

        });

        // Increment counter iff the worker started successfully.
        nActive += 1;
      });
    }
  }

  function deSchedule(sieve) {
    //DBG && console.log('deSchedule:sieve:', sieve);

    var
    id = _.isString(sieve) ? sieve : sieve.id,
    timeoutId = timeouts[sieve.id];

    if(timeoutId) {
      delete timeouts[sieve.id];
      clearTimeout(timeoutId);
    }
    // What if the sieve is already being run? Let that run and finish.
  }

  function getSchedule(sieve, callback) {
    var
    schedule = JSON.parse(sieve.schedule);

    WorkStore.find({
      rel: SieveStore.name,
      key: sieve.id
    }, {
      limit: 10,
      only: ['id', 'err', 'ts'],
      order: ['-ts']
    }, function(err, result) {
      if(err) {
        callback(err);
      } else {
        var scheduler = ScheduleDescriptors[schedule.type];
        if(!scheduler) {
          callback(Err.TYPE_UNNOWN({
            type: 'scheduler',
            value: schedule.type
          }));
        } else {
          callback(null, scheduler.getSchedule(schedule.params, result.data));
        }
      }
    });
  }

  function onUpdate(sieve) {
    //console.log('onUpdate:', sieve);
    var state = sieve.state;
    if((state != void 0) && (state != C.STATE_READY)) {
      //console.log('onUpdate:deSchedule', sieve);
      deSchedule(sieve);
    } else if(state == C.STATE_READY) {
      //console.log('onUpdate:schedule', sieve);
      schedule(sieve.id);
    } else if('schedule' in sieve) {
      //console.log('onUpdate:schedule', sieve);
      schedule(sieve);
    }
  }

  function processResult(sieve, result, doneCallback) {
    //console.log('processResult:result:', result);
    var dataAttr = JSON.parse(sieve.config).dataAttr || 'text';
    SieveDataStore.findOne({
      sieve_id: sieve.id
    }, {
      only: [dataAttr],
      order: ['-ts']
    }, function(err, lastData) {
      if(err) {
        console.error('Scheduler:failed to find sieve data', err);
        doneCallback(err);
      } else {
        var
        RE_SPLIT = /\s+|\b/g,
        equal = lastData &&
          _.isEqual(lastData[dataAttr].split(RE_SPLIT),
                    result[dataAttr].split(RE_SPLIT));
        if(equal) {
          // Do nothing.
          doneCallback();
        } else {
          saveData(lastData);
        }
      }
    });

    function saveData(lastData) {
      // Save data
      async.parallel({
        sieve_data: function(callback) {
          SieveDataStore.create(_.extend({
            sieve_id: sieve.id
          }, result), callback);
        },
        sieve: function(callback) {
          SieveStore.update(sieve.id, {
            text: result.text,
            ts_data: Date.now()
          }, callback);
        }
      }, function(err, results) {
        doneCallback(err);

        if(lastData) {
          ActionManager.computeActions({
            sieve: sieve,
            sieve_data: results.sieve_data
          });

          // Prune old data that is outside of storage units
          SieveDataStore.destroyWithSubQuery({
            sieve_id: sieve.id
          }, {
            limit: 10,
            offset: 10,
            order: ['-ts']
          }, function(err) {
            if(err) {
              console.error('Scheduler:SieveDataStore:destroyWithSubQuery', err);
            }
          });
        }
      });
    }
  }

  function qNow(id) {
    deSchedule(id);
    q.push(id);

    gEvents.trigger('worker:sieve:state', {
      id: id,
      state: C.RUN_STATE_WAIT
    });

  }

  function resetAll() {
    _.each(_.values(timeouts), deSchedule);
    _.each(_.values(runners), stop);
    scheduleAll();
  }

  function run(sieve, callback) {
    // TODO Create a queue of scheduled jobs waiting for their turn for 
    // execution. Use it to control job's retry behavior.
    //console.log('Scheduler:run:', sieve);
    var runner = new Runner(sieve);
    
    stop(sieve);

    // Keep reference for control.

    runners[sieve.id] = runner;

    runner.run(function(errRun, result, metrics) {
      //console.log('Scheduler:run:runner.run:', errRun, result, metrics);
      delete runners[sieve.id];

      var work = {
        rel: SieveStore.name,
        key: sieve.id,
        duration: metrics.duration
      };

      if(errRun) {
        _.extend(work, {
          err: JSON.stringify(errRun)
        });
      }
      WorkStore.create(work, function(errSaveWork) {
        if(errSaveWork) {
          console.error('Scheduler: failed to save work result to DB');
        } 
        
        if (errRun) {
          callback(errRun);
        } else {
          processResult(sieve, result, callback);
        }

        // Delete old entries from work log.
        // TODO Collect metrics into a stats table to summarize activity.
        WorkStore.destroyWithSubQuery({
          rel: SieveStore.name,
          key: sieve.id
        }, {
          limit: 10,
          offset: 10,
          order: ['-ts']
        }, function(err) {
          if(err) {
            console.error('Scheduler:WorkStore:create:destroy:err', err);
            // A case of unhandled error.
          }
        });
      });

      gEvents.trigger('worker:sieve:state', {
        id: sieve.id,
        state: C.RUN_STATE_INIT
      });

    });

    gEvents.trigger('worker:sieve:state', {
      id: sieve.id,
      state: C.RUN_STATE_WIP
    });

  }

  function schedule(sieve, callback) {
    callback || (callback = function(err) { if(err) throw err;});
    
    var id = _.isString(sieve) ? sieve : sieve.id;

    SieveStore.findOne(id, function(err, sieve) {
      deSchedule(sieve);

      getSchedule(sieve, function(err, scheduleOn) {
        if(err) {
          console.error('Error getting schedule:', sieve, err);
          callback(err);
        } else if(scheduleOn < 0) {
          // There is no need to schedule it according to its parameters.
          //DBG && console.log('Scheduler:not scheduled:', sieve.id, sieve.name);
          callback();
        } else {
          //console.log('Scheduler: schedule:', sieve.id, sieve.name, scheduleOn-Date.now()/1000);

          // XXX Limit interval to 2^32-1 since timers store delay as 32 bits
          var intervalInMs = Math.min(scheduleOn*1000-Date.now(), 0x7FFFFFFF);
          timeouts[sieve.id] = setTimeout(function() {
            // XXX There could be a subtle bug when the timeout for this sieve is
            // set after it was scheduled.
            qNow(sieve.id);
          }, intervalInMs);

          callback();
        }
      });
    });
  }

  function scheduleAll() {
    SieveStore.find({
      state: C.STATE_READY
    }, {
      limit: 1000,
      only: ['id', 'schedule', 'ts'],
      order: ['-ts']
    }, function(err, result) {
      if(err) {
        console.error('Failed to schedule.');
        // TODO Severe error. Notify user of the same.
      } else {
        async.eachSeries(result.data, schedule, function(err) {
          if(err) {
            console.error('Error scheduling:', err);
          }
        });
      }
    });
  }

  function stop(sieve) {
    // TODO Stop current runner and remove that from list of references.
    var oldRunner = runners[sieve.id];
    delete runners[sieve.id];

    if(oldRunner) {
      oldRunner.abort();
    }
  }

  return {
    isBusy: function() {
      return _.size(runners) > 0;
    },

    checkNow: function(ids) {
      _.each(ids, qNow);
    },

    init: function() {
      _.delay(scheduleAll, 6000);
      checkInetervalId = setInterval(function() {
        checkQueue()
      }, 1000);

      gEvents.on('store:create:'+SieveStore.name, schedule);
      gEvents.on('store:update:'+SieveStore.name, onUpdate);
      gEvents.on('store:destroy:'+SieveStore.name, deSchedule);

      initialized = true;
    },

    uninit: function() {
      initialized = false;

      clearInterval(checkInetervalId);

      gEvents.off('store:create:'+SieveStore.name, schedule);
      gEvents.off('store:update:'+SieveStore.name, onUpdate);
      gEvents.off('store:destroy:'+SieveStore.name, deSchedule);

      _.each(_.values(runners), function(runner) { runner.abort() });

      _.each(timeouts, clearTimeout);
      timeouts = {};
    
      q.splice(0);
    }
  }
})();

const ActionManager = (function() {

  function find_diffs(text_old, text_new) {
    var
    dmp = new diff_match_patch(),
    a = dmp.diff_wordsToChars_(text_old, text_new),
    diffs = dmp.diff_main(a.chars1, a.chars2, false);

    dmp.diff_charsToLines_(diffs, a.wordArray);
    return diffs;
  }

  function computeActions(context) {
    async.waterfall([
      function(callback) {
        async.parallel({
          items: function(callback) {
            SieveDataStore.find({
              sieve_id: context.sieve.id,
            }, {
              only: ['id', 'text'],
              limit: 2,
              order: ['-ts']
            }, callback);
          },
          rule: function(callback) {
            if(context.sieve.rule_id) {
              RuleStore.findOne(context.sieve.rule_id, callback);
            } else {
              callback(null);
            }
          },
          actions: function(callback) {
            ActionStore.find({ sieve_id: context.sieve.id}, callback);
          }
        }, callback)
      }, 

      function(result, callback) {
        context.actions = result.actions.data;
        context.items = result.items.data;
        context.rule = result.rule;

        //console.log('computeActions: context: %j', context);

        var items = context.items;
        if(items.length > 1) {
          context.diffs = find_diffs(items[1].text, items[0].text);
          context.inserts = _.reduce(context.diffs, function(buff, aDiff) {
            if(aDiff[0] == DIFF_INSERT) {
              buff.push(aDiff[1]) 
            }
            return buff;
          }, []).join(' ');
          // XXX Match rule only when we have more than 1 item in history
          if(matchRule(context)) {
            takeActions(context);
          } else {
            // Mark item as read
            SieveStore.update(context.sieve.id, { ts_view: Date.now() });
          }
        }
        callback();
      }
    ]);
  }

  function takeActions(context) {
    //console.log('takeActions:', context);
    async.each(context.actions, function(action, callback) {
      var desc = ActionDescriptors[action.type];
      if(!desc) {
        console.error('Invalid action type', action);
        callback(Err.NOT_FOUND({
          type: 'action:desc',
          id: action.type
        }));
      } else {
        //console.log('ActionManager:takeAction:', action);
        action.config && (action.config = JSON.parse(action.config));
        desc.act(action, context, callback);
      }
    });
  }

  return {

    computeActions: computeActions,

    init: function() {
      // Start listening to events that result in actions.
      //gEvents.on('store:create:'+SieveDataStore.name, onSieveData);
    },

    uninit: function() {
      //gEvents.off('store:create:'+SieveDataStore.name, onSieveData);
    }
  }
})();

function Service(options) {
  _.extend(this, Backbone.Events);
  this.options = _.extend({}, this.OPTIONS, options);
  this.state = new Backbone.Model({ unread: 0 });
  this.state.on('change:unread', function(event) {
    gEvents.trigger('change:unread', this.state.get('unread'));
  }, this);

}

_.extend(Service.prototype, {

  // default options

  // FIXME Use platform (Chrome or Firefox) specific values.
  appUrl: CFG.URL.BASE + 'inbox.html',

  Scheduler: Scheduler,

  checkNow: function(ids) {
    Scheduler.checkNow(ids);
  },

  markRead: function() {
    SieveStore.update({
      state: C.STATE_READY,
      'ts_view.lt': { name: 'ts_data', type: 'field' }
    }, {
      ts_view: Date.now()
    });
  },

  pause: function() {
    Scheduler.uninit();
    ActionManager.uninit();
    // SyncManger.uninit();

    gEvents.off('store:create:'+SieveStore.name, this.onSieveCreate, this);
    gEvents.off('store:destroy:'+SieveStore.name, this.onSieveDestroy, this);
    gEvents.off('store:update:'+SieveStore.name, this.onSieveUpdate, this);
  },

  onSieveCreate: function (doc) {
    this.updateState();
  },

  onSieveDestroy: function (doc) {
    //console.log('onSieveDestroy');
    this.updateState();
  },

  onSieveUpdate: function (doc) {
    //console.log('main:onseiveupdate:', doc);
    this.updateState();
  },

  resume: function() {
    Scheduler.init();
    ActionManager.init();
    // SyncManger.init();

    gEvents.on('store:create:'+SieveStore.name, this.onSieveCreate, this);
    gEvents.on('store:destroy:'+SieveStore.name, this.onSieveDestroy, this);
    gEvents.on('store:update:'+SieveStore.name, this.onSieveUpdate, this);

    this.updateState();
  },

  open: function(id, callback) {

    SieveStore.findOne(id, function(err, sieve) {
      if(err) {
        callback(Err.NOT_FOUND({
          type: 'sieve',
          id: id
        }));
      } else {
        // Look for open weapps. Request and focus one of them to show
        // sieve in inbox. If none is open, create and open a new tab.

        var url = this.appUrl + '/' + id;

        chrome.tabs.query({
          url: this.appUrl + '*'
        }, function(tabs) {
          if(tabs && tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, {
              active: true,
              url: url
            }, function(tab) {
              callback(null, tab);
            });
          } else {
            chrome.tabs.create({
              url: url
            }, function(tab) {
              callback(null, tab);
            });
          }
        });
      }
    });

  },

  // Called and managed by service creator
  setActive: function(active) {
    this.active = active;
    this[active ? 'resume' : 'pause']();
  },

  show: function(id, callback) {
    chrome.tabs.create({
      active: true,
      url: this.appUrl + '#inbox/' + id
    }, function() {
      callback && callback();
    });
  },

  updateState: function () {
    // Update following parameters:
    // 1. Unread count
    var self = this;
    SieveStore.find({
      state: C.STATE_READY,
      'ts_view.lt': { name: 'ts_data', type: 'field' }
    }, {
      only: ['id'],
      limit: 1
    }, function(err, result) {
      self.state.set('unread', result.total_count);
    });
  }

});

;
function test_store_sieve_list() {

  console.log('TEST: test_store_sieve_list');

  async.waterfall([
    function (callback) {
      SieveStore.create({
        config: '{ "test": "value" }',
        name: 'Test Sieve',
        schedule: '{}',
      }, callback);
    },
    function (sieve, callback) {
      console.log('TEST: sieve:', sieve);

      SieveStore.findOne(sieve.id, callback);
    },
    function(sieve, callback) {
      console.log('TEST: sieve:', sieve);

      SieveStore.find(null, {
        limit: 2,
        offset: 2,
        only: ['id', 'name']
      }, callback);
    }
  ], function(err, result) {
    if(err) {
      console.error('TEST: ERR!', err);
    } else {
      console.log('TEST: counts:total_count offset count', result.total_count, result.offset, result.count);
      console.log('TEST: rows:', result.rows);
    }
  });

}

//test_store_sieve_list();

function test_store_sieve_update() {
  console.log('TEST: test_store_sieve_update');

  var subject;
  async.waterfall([
    function (callback) {
      SieveStore.create({
        config: '{ "test": "value" }',
        name: 'Test Sieve',
        schedule: '{}',
      }, callback);
    },
    function (sieve, callback) {
      console.log('TEST: sieve:', sieve);
      subject = sieve;

      SieveStore.update(sieve.id, {
        name: 'My New Name'
      }, callback);
    },
    function (res, callback) {
      console.log('TEST:update:sieve:', res);

      SieveStore.findOne(subject.id, callback);
    }
  ], function(err, result) {
    if(err) {
      console.error('TEST: ERR!', err);
    } else {
      console.log('TEST:update:result:', result);
    }
  });
}

function test_store_sieve_delete() {
  console.log('TEST: test_store_sieve_delete');

  var subject;
  async.waterfall([
    function (callback) {
      SieveStore.destroy(null, callback);
    },
    function (ignore, callback) {
      SieveStore.create({
        config: '{ "test": "value" }',
        name: 'Delete Sieve!',
        schedule: '{}',
      }, callback);
    },
    function (sieve, callback) {
      console.log('TEST: sieve:', sieve);
      subject = sieve;

      SieveStore.destroy(sieve.id, callback);
    },
    function (res, callback) {
      console.log('TEST:delete:sieve:', res);

      SieveStore.findOne(subject.id, callback);
    }
  ], function(err, result) {
    if(err) {
      console.error('TEST: ERR!', err);
    } else {
      console.log('TEST:delete:result:', result);
    }
  });
}


//test_store_sieve_delete();

function test_store_work_data_prune() {
  async.waterfall([
    function(callback) {
      WorkStore.find({
        rel: 'sieves'
      }, callback);
    },
    function(result, callback) {
      console.log('test_store_work_data_prune:count', result.count, result);
      WorkStore.destroyWithSubQuery({
        rel: 'sieves'
      }, {
        limit: 2,
        offset: 0,
        ts: ['ts']  // delete from old
      }, callback);
    },
    function(result, callback) {
      WorkStore.find({
        rel: 'sieves'
      }, callback);
    }
  ], function(err, result) {
    console.log('test_store_work_data_prune:pruned:count', result.count, result);
  });
}

//test_store_work_data_prune();

function test_runner() {
  console.log('TEST:test_runner');

  var runner = new Runner({
    id: 'A_SIEVE_ID',
    content_type: C.TYPE_HTML,
    config: JSON.stringify({
      includeStyle:true,
      includeScript:false,
      selections: [{
        frames:[{
          uri:"https://twitter.com/TechCrunch",
          excludes: [],
          includes: [{
            expr: "//ol[@id='stream-items-id']",
            type:"xpath"
          }],
          index:0
        }],
        title:"TechCrunch (TechCrunch) on Twitter",
        uri:"https://twitter.com/TechCrunch"
      }]
    }),
    schedule: JSON.stringify({
      type: 'INTERVAL',
      params: { interval: 60 }
    }),
    uri:"https://twitter.com/TechCrunch"
  });

  runner.run(function(err, result) {
    if(err) {
      console.error('ERR!TASKS:', err);
    } else {
      console.log('TASKS:result:text:', result.text);
      console.log('TASKS:result:data:', result.data);
    }
  });
}

//setTimeout(test_runner, 2000);

function add_sieve() {
  DBG && console.log('add_sieve');

  async.waterfall([
    function(callback) {
      TagStore.create({
        name: 'News'
      }, callback)
    },
    function (tag, callback) {
      SieveStore.create({
        name: 'Distill Homepage',
        config: JSON.stringify({
          "includeStyle":true,
          "includeScript":false,
          "selections": [{
            "frames":[{
              "uri":"http://brwsr.local",
              "excludes": [],
              "includes": [{
                "expr": "//body/div[@class='container']",
                "type":"xpath"
              }],
              "index":0
            }],
            "title":"Distill",
            "uri":"http://brwsr.local"
          }]
        }),
        schedule: JSON.stringify({
          type: 'INTERVAL',
          params: { interval: 60 }
        }),
        tags: tag.id,
        "uri":"http://brwsr.local"
      }, callback);
    }
  ], function(err, sieve) {
    // TODO Create actions
    ActionStore.create({
      sieve_id: sieve.id,
      type: C.ACTION_LOCAL_AUDIO,
      config: "{}",
      state: 0,
    })
    ActionStore.create({
      sieve_id: sieve.id,
      type: C.ACTION_LOCAL_POPUP,
      config: "{}",
      state: 0,
    })
  });

}

//add_sieve();

// TODO
// 1. Load URL, get load notifications.
// 2. Load 404 URL, get load_error notifications.
// 3. Load page with iframe with errors.



