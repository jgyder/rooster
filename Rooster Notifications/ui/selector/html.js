// XXX Use tree to make selections and show selections

require(['underscore', 'jquery', 'backbone', 'common/const',
  'root/models/sieve', 'root/views/config'],
function(_, $, Backbone, C, Model, View) {

var
MSG_INIT = 1,
MSG_EVENT = 2,
MSG_REQUEST = 3,
MSG_RESPONSE = 4,
MSG_LOG = 5,
ID = (function(x) {
  return function() {
    return x++
  }
})(1),

PORTS = [],
EXPANDED = false,
responseHandlers = {},

// A reference to model with values for current page
currentPage,
savedCurrentpage,

savedSieveModel = new Model.Sieve({}, { parse: true }),
savedConfig = savedSieveModel.get('config'),
savedPages = savedConfig && savedConfig.get('selections'),

// Model for edit views
sieveConfigModel = new Model.SieveConfigHTML({
  selections: [],
  regexp: savedConfig ? savedConfig.get('regexp') : void 0
}, { parse: true }),

// View to edit expressions
sieveConfigView  = new View.SieveConfigHTML({
  el: $('#config')[0],
  model: sieveConfigModel
}).render(),

tree = $('#htmltree')[0],
treeExpanded = false,
selectorOn = false,
port = chrome.extension.connect({ name: 'selector:{}' });

port.onMessage.addListener(function(msg) {
  //console.log('PORT:HTML:onMessage:', msg.type, msg.data, msg);

  var data = msg.data;
  switch(msg.type) {
    case 'load':
    savedSieveModel = new Model.Sieve(data.model, { parse: true }),
    savedConfig = savedSieveModel.get('config'),
    savedPages = savedConfig && savedConfig.get('selections'),

    selectorOn = !!data.state.selectorOn;
    EXPANDED = !!data.state.expanded;
    updateState();
    break;

    case 'loader:load':
    onLoadPort(data);
    break;

    case 'loader:reset':
    onLoaderReset(data);
    break;

    case 'loader:port:window:select:close':
    onSelectClose(data);
    break;

    case 'loader:port:window:select:display':
    onSelectDisplay(data);
    break;

    case 'loader:port:window:select:new':
    onSelectNew(data);
    break;

    case MSG_EVENT:
    console.warn('Unhandled event: ', msg);
    break;

    case MSG_REQUEST:
    console.error('Unhandled request: ', msg);
    port.postMessage({
      _id: msg._id,
      type: MSG_RESPONSE,
      err: {
        msg: 'Request not handled'
      }
    });
    break;

    case MSG_RESPONSE:
    var
    id = msg._id,
    handler = responseHandlers[id];

    if(handler) {
      delete responseHandlers[id];
      handler(msg.err, msg.data);
    } else {
      console.error('Unhandled response: ', msg);
    }
    break;

    default:
    console.warn('Unhandled msg type: ', msg);

  }
});

port.onDisconnect.addListener(function() {
  //console.log('port disconnected');
});

init();

window.App = {
  close: function() {
    async.each(PORTS, portReset, function() {
      sendEvent({ type: 'close' });
    });
  },
  save: function() {
    if(sieveConfigModel.isEmpty()) {
      alert('m_save_selections_none');
      return;
    }
    savedSieveModel.set({
      name: currentPage.get('title'),
      uri: currentPage.get('uri'),
      config: sieveConfigModel,
      content_type: C.TYPE_HTML
    });
    // XXX Save config model JSON before calling reset. Reset will reset
    // selections as well.
    var modelJSON = savedSieveModel.toJSON();
    async.each(PORTS, portReset, function() {
      sendEvent({ type: 'save', data: modelJSON });
    });
  },
  toggleExpanded: function() {
    EXPANDED = !EXPANDED;
    sendUIState();
    updateState();
  },
  toggleTree: function() {
    treeExpanded = !treeExpanded;
    sendUIState();
    updateState();
  },
  toggleSelector: function() {
    selectorOn = !selectorOn;
    async.each(PORTS, portSetMode);
    updateState();
  }
};

function init() {
  updateState();

  sieveConfigModel.on('change:regexp', updatePreview);

  $('[action]').click(function() {
    var
    action = $(this).attr('action'),
    verb = App[action];
    if(verb) {
      verb()
    } else {
      console.error('action not found', action, App);
    }
  });
}


function loadFrameSelections(savedFrame) {
  var
  index = savedFrame.get('index'),
  includes = savedFrame.get('includes').models,
  excludes = savedFrame.get('excludes').models;

  includes.length > 0 && async.each(includes, function(model, callback) {
    //console.log('include:picker_select_new:', model.toJSON());
    port_request(index, {
      path: 'picker_select_new',
      data: { locator: model.toJSON(), op: 'INCLUDE' }
    }, callback);
  });
  excludes.length > 0 && async.each(excludes, function(model, callback) {
    port_request(index, {
      path: 'picker_select_new',
      data: { locator: model.toJSON(), op: 'EXCLUDE' }
    }, callback);
  });
}

function loadHTMLTree() {
  // Later maybe
}

function onLoadPort(event) {
  var
  index = event.index,
  savedFrame = savedCurrentpage && savedCurrentpage.get('frames')
    .findWhere({ index: index });

  //console.log('SELECTOR:onLoadPort:', index, savedCurrentpage, savedFrame);

  PORTS.push(index);

  port_request(index, {
    path: 'require',
    data: ["picker", "pickerui"]
  }, function(err) {
    if(err) {
      console.error('ERR:Loading picker for', event.uri, err);
    } else {
      //console.log('SELECTOR:Loaded picker for', event.uri);
      if(savedFrame) {
        loadFrameSelections(savedFrame);
      }
      portSetMode(index);
    }
  });
}

function onLoaderReset(event) {
  var
  uri = event.uri,
  pages = sieveConfigModel.get('selections');
  currentPage = pages.findWhere({ uri: uri }) ||
    new Model.Page(event, { parse: true });

  // Reset ports' list
  PORTS.splice(0);

  // Remove other pages
  pages.reset([currentPage]);
  savedCurrentpage = savedPages && savedPages.findWhere({ uri: uri });
}

function onLocatorChange(locator, options) {
  //console.log('SELECTOR:onLocatorChange', locator, options);
  // See models/sieve.js
  if(options && options.source === 'program') return;

  var frame = locator.collection.frame;
  port_request(frame.get('index'), {
    path: 'picker_select_call',
    data: {
      method: 'setLocator',
      id: locator.id,
      args: [_.pick(locator.attributes, 'expr', 'type')]
    }
  }, function(err) {
    err && console.error('Failed to setLocator:', err);

    updatePreview();
  });
}

function onSelectClose(event) {
  //console.log('onSelectClose:', event);
  currentPage.removeLocator(event.index, event.data.id);
  updatePreview();
}

// Called when select's properties change.
function onSelectDisplay(event) {
  //console.log('onSelectDisplay:', event);
  var
  locator = currentPage.getLocator(event.index, event.data.id),
  attrs = _.extend({ id: event.data.id }, event.data.locator);

  if(!_.isEqual(attrs, locator.attributes)) {
    // Use `source` to indicate that it wasn't changed by end user.
    locator.set(attrs, { source: 'program' });
    updatePreview();
  }
}

function onSelectNew(event) {
  //console.log('onSelectNew:', event);
  var
  attrs = _.extend({ id: event.data.id }, event.data.locator),
  locator = currentPage.addLocator({
    index: event.index,
    title: event.title,
    uri: event.uri
  }, event.data.op, attrs);

  Backbone.listenTo(locator, 'change', onLocatorChange);
}

function port_request(portSelector, data, callback) {
  //console.log('port_request:', portSelector, data, callback);
  sendRequest('loader/port_request', {
    portSelector: portSelector,
    data: data
  }, callback);
}

function portReset(portSelector, callback) {
  selectorOn = false;
  callback || (callback = function(err) {
    err && console.error('ERR:SELECTOR:portReset:', err);
  });
  portSetMode(portSelector, function() {
    port_request(portSelector, { path: 'picker_reset' }, callback);
  });
}

function portSetMode(portSelector, callback) {
  callback || (callback = function(err) {
    err && console.error('ERR:SELECTOR:portSetMode:', err);
  });
  port_request(portSelector, {
    path: 'picker_setMode',
    data: selectorOn ? 'SELECT' : 'NOOP'
  }, callback);
}

function sendEvent(event) {
  port.postMessage({
    type: MSG_EVENT,
    data: event
  });
}

function sendRequest(path, data, callback) {
  var id = ID();
  responseHandlers[id] = callback;

  // Send request to extension
  port.postMessage({
    _id: id,
    type: MSG_REQUEST,
    path: path,
    data: data
  });
}

function sendUIState() {
  sendEvent({
    type: 'uistate',
    data: {
      expanded: EXPANDED
    }
  });
}

function setExpanded() {
  //console.log('setExpanded', EXPANDED );
  window.parent.postMessage({
    type: 'show',
    data: EXPANDED ? 300 : 30
  }, '*');
}
function updatePreview() {
  $('#preview').val('loading...');

  async.mapSeries(currentPage.get('frames'), function(frame, callback) {
    port_request(frame.get('index'), {
      path: 'getText',
      data: {
        includes: frame.get('includes').toJSON(),
        excludes: frame.get('excludes').toJSON()
      }
    }, callback);
  }, function(err, results) {
    if(err) {
      console.error('error updating preview:', err);
      $('#preview').val(err.toString());
    } else {
      //console.log('preview:', results);

      var
      re = sieveConfigModel.get('regexp'),
      text = results.join('');

      if(re) {
        // XXX Add to a utility module as a reusable function
        var matches = text.match(new RegExp(re, 'gim'));
        if(matches && matches.length > 0) {
          text = matches.join(' ');
        } else {
          text = '';
        }

      }
      $('#preview').val(text);
    }
  });
}

//updatePreview = _.debounce(updatePreview, 300);

function updateState() {
  var
  aToggleViewSize = document.getElementById('a_expand_size'),
  iToggleTree = document.getElementById('a_expand_tree').children[0],
  iToggleSelector = document.getElementById('a_toggle_selection_mode').children[0],
  body = document.getElementsByTagName('body')[0];

  aToggleViewSize.children[0].className = EXPANDED ? 'icon-chevron-down' : 'icon-chevron-up';

  if(treeExpanded) {
    body.className = 'tree';
    iToggleTree.className = 'icon-chevron-left';
  } else {
    body.className = '';
    iToggleTree.className = 'icon-chevron-right';
  }

  if(selectorOn) {
    iToggleSelector.className = 'icon-pause';
  } else {
    iToggleSelector.className = 'icon-play';
  }

  setExpanded();
}

});

