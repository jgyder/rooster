(function() {

var
DBG = 1,
EVT = document.createEvent('Event'),
ID_BRIDGE = 'sentinel-bridge',
attrs = {
  id: ''+(Math.random() * 10000000)|0,
  uri: location.href,
  root: top == window,
  size: {
    width: innerWidth,
    height: innerHeight
  }
},
port;

//console.log('PORT:LOADER:new', attrs, attrs.uri);
window.attrs = attrs;

// Add event listener first so that events from child ports are not missed.
addEventListener('message', onMessage, false);

if(attrs.root) {
  connect();
} else {
  // Associate child frames with parent frames and connect once we receive
  // response.
  parent.postMessage({ distillchildport: attrs }, '*');
}

function attachScript(script) {
  //console.log('PORT:LOADER:attachScript:', attrs.uri, script);

  var el = document.createElement('script');
  if(script.src) {
    el.src = chrome.runtime.getURL(script.src);
    el.async = false;
  }
  if(script.textContent) el.textContent = script.textContent;
  (document.head || document.body || document.documentElement).appendChild(el);
}

function connect() {
  //console.log('PORT:LOADER:loader:connect', attrs.uri);
  port = chrome.extension.connect({
    name: 'loader:' + JSON.stringify(attrs)
  });

  port.onMessage.addListener(function(msg) {
    //console.log('-> PORT:LOADER:message', msg, attrs.uri);

    switch (msg.type) {
      case 'content':
      sendContentMessage(msg.data);
      break;

      case 'content:load':
      // loadContent on document-ready.
      loadContent(msg);
      break;

      default:
      console.error('PORT:LOADER: Unhandled message:', msg, attrs.uri);
      break;
    }
  });

  port.onDisconnect.addListener(function() {
    //console.log('PORT:LOADER:disconnect', attrs.uri);

    removeEventListener('message', onMessage);
    removeEventListener('DistillEventWeb', onContentMessage);
    removeEventListener('DistillEventWebReady', onContentReady);
  });
}

function init() {
  EVT.initEvent('DistillEventExt', true, true);
  addEventListener('DistillEventWeb', onContentMessage);
  addEventListener('DistillEventWebReady', onContentReady);
}

function loadContent(params) {
  //console.log('PORT:LOADER:loadContent:', params, document.readyState, attrs.uri);
  init();

  if(document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', onLoad, false);
  } else {
    onLoad();
  }

  function onLoad() {
    //console.log('PORT:LOADER:document.DOMContentLoaded:', params, attrs.uri);
    (params.scripts || []).forEach(attachScript);
    document.removeEventListener('DOMContentLoaded', onLoad, false);
  }
}

function onContentMessage(event) {
  //console.log('<- PORT:LOADER:onContentMessage', event, attrs.uri);

  var data = JSON.parse(document.getElementById(ID_BRIDGE).textContent);
  port.postMessage({ type: 'content', data: data });
}

function onContentReady() {
  //console.log('PORT:LOADER:onContentReady', attrs.uri);

  port.postMessage({
    type: 'port:ready',
    data: {
      title: document.title
    }
  });
}

function onMessage(event) {
  //console.log('PORT:LOADER:onMessage', event, attrs.uri);

  var
  data = event.data || {},
  childAttrs = data.distillchildport,
  parentAttrs = data.distillparentport;

  if(childAttrs) {
    event.source.postMessage({ distillparentport: attrs, forChild: childAttrs }, '*');
  } else if(parentAttrs) {
    if(event.data.forChild.id == attrs.id) {
      // Received message from parentAttrs port. Connect port.
      attrs.parent = parentAttrs;
      connect();
    } else {
      // Response message from a different port-loader instance loaded later.
      removeEventListener('message', onMessage);
    }
  }
}

function sendContentMessage(msg) {
  //console.log('PORT:LOADER:sendContentMessage', event, attrs.uri);

  document.getElementById(ID_BRIDGE).textContent = JSON.stringify(msg);
  dispatchEvent(EVT);
}

})();
