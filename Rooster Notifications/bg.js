var
service = new Service(),

store = {
  SimpleStore: SimpleStore,
  Prefs: Prefs,

  ActionStore: ActionStore,
  AttrStore: AttrStore,
  ErrorStore: ErrorStore,
  PopupMessageStore: PopupMessageStore,
  RuleStore: RuleStore,
  SieveStore: SieveStore,
  SieveDataStore: SieveDataStore,
  TagStore: TagStore,
  WorkStore: WorkStore,

};

service.setActive(Prefs.get('active'));

gEvents.on('change:pref:active', function(active, name) {
  service.setActive(active);
  setActionIcon(active);
});

setActionIcon(Prefs.get('active'));

gEvents.on('change:unread', function(count) {
  chrome.browserAction.setBadgeText({
    text: count == 0 ? '' : count+''
  });
});

chrome.runtime.onConnect.addListener(function(port) {
  console.log('EXTN:onConnect:', port);

  var
  name = port.name,
  type = name.substring(0, name.indexOf(':'));

  switch(type) {
    case 'loader':
    if(!loaderAttachPort(port)) {
      port.disconnect();
    }
    break;

    case 'selector':
    if(!selectorAttachPort(port)) {
      port.disconnect();
    }
    break;

    default:
    port.disconnect();
  }
  
});

// Handles messages sent by child frames created by loaders.
addEventListener('message', function(event) {
  console.log('EXTN:message:', event);
  var
  source = event.source,
  child = (event.data || {}).distillchildport;

  if(child) {
    console.log('EXTN:message:send message to child:', child);
    source.postMessage({
      distillparentport: { id: 'BG' },
      forChild: child
    }, '*');
  } else {
    console.warn('EXTN:Unknown message', event, child);
  }

}, false);

function addFeedForTab() {
  chrome.tabs.getSelected(function(tab) {
    if(!testURL(tab.url)) {
      alert(' Page with unsupprted url:' + tab.url);
      return;
    }

    chrome.tabs.update(tab.id, {
      url: chrome.extension.getURL('feed.html?url=') + tab.url
    });
  });
}

// Miscellaneous APIs
function openSelector(callback) {
  callback || (callback = function(){});
  chrome.tabs.getSelected(function(tab) {
    if(!testURL(tab.url)) {
      alert(' Page with unsupprted url:' + tab.url);
      return;
    }

    // Create loader for the tab and call openSelectorForTabLoader
    var loader = createLoader({
      type: 'tab',
      info: {
        tabId: tab.id
      }
    }, function(err, loader) {
      if(err) return callback(err);
      else callback();

      openSelectorForTabLoader({
        loader: loader,
        state: {
          selectorOn: true
        }
      }, function(err, model) {
        loader.destroy();

        if(err) {
          console.error('Visual Selector failed to work correctly:', err);
          // TODO Log error for user to see?
        } else if(model) {
          _.defaults(model, {
            schedule: JSON.stringify({
              type: 'INTERVAL',
              params: { interval: 1800 }
            })
          });

          SieveStore.create(model, function(err, doc) {
            if(err) {
              alert('Error saving model to DB. ' + (err.msg || err.message || err));
            } else {
              ActionStore.create({ sieve_id: doc.id, type: 101 }, logger);
              ActionStore.create({ sieve_id: doc.id, type: 102 }, logger);
            }
          })
        } else {
          // noop
        }
      });
    });
  });
}

function openSelectorForTabLoader(options, resultCallback) {
  new VisualSelector(options, resultCallback);
}

function watchTab() {
  chrome.tabs.getSelected(function(tab) {
    if(!testURL(tab.url)) {
      alert('Page with unsupprted url:' + tab.url);
      return;
    }

    var model = {
      content_type: 2, // C.TYPE_HTML
      config: JSON.stringify({
        includeStyle: true,
        selections: [{
          uri: tab.url,
          frames: [{
            index: 0,
            uri: tab.url,
            excludes: [],
            includes: [{
              expr: '/html',
              type: 'xpath'
            }]
          }]
        }]
      }),
      schedule: JSON.stringify({
        type: 'INTERVAL',
        params: { interval: 1800 }
      }),
      name: tab.title || 'Untitled',
      uri: tab.url    // uri and url :/
    };
    SieveStore.create(model, function(err, doc) {
      if(err) {
        alert('Error saving model to DB. ' + (err.msg || err.message || err));
      } else {
        ActionStore.create({ sieve_id: doc.id, type: 101 }, logger);
        ActionStore.create({ sieve_id: doc.id, type: 102 }, logger);
      }
    })

  });
}

function logger(err) {
  err && console.error('Error adding action: ', err);
}

function setActionIcon(active) {
  chrome.browserAction.setIcon({
    path: active ? '/ui/img/distill_38.png' : '/ui/img/distill_disabled_38.png'
  });
}

function testURL(url) {
  return /^(http:|https:)/i.test(url);
}

// Google Analytics Code
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-40922518-3']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
