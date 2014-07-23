var Service = chrome.extension.getBackgroundPage();

// Used as global state variable.
var
SCRIPT_LIST_RSS = 'document.querySelectorAll(\'[type="application/rss+xml"]\').length',
options;

function checkAllForChanges() {
  $('.xrefresh i').addClass('icon-spin');
  Service.store.SieveStore.find({
    state: 40
  }, {
    only: ['id']
  }, function(err, result) {
    if(!err) {
      Service.service.checkNow(_.pluck(result.data, 'id'));
    }
    setTimeout(checkWorkerState, 2000);
  });

  function checkWorkerState() {
    // Check nworkers and update button 
    if(Service.service.Scheduler.isBusy()) {
      setTimeout(checkWorkerState, 2000);
    } else {
      $('.xrefresh i').removeClass('icon-spin');
    }
  }
}

function checkFeeds() {
  chrome.tabs.executeScript(options.tab.id, {
    allFrames: false,
    code: SCRIPT_LIST_RSS
  }, function(results) {
    console.log('checkFeeds:results:', results);
    if(results && results[0] > 0) {
      $('.xfeed').show();
    } else {
      $('.xfeed').hide();
    }
  })
}

function init(_options) {
  options = _options;
  var tab = options.tab;
  $('#tab-title').text(tab.title || tab.url)
  checkFeeds();
  loadAlerts();
  loadUpdates();
  setState();
  $('body').on('click', '.xsieve', showAlert);
}

function loadAlerts() {
  var
  url = options.tab.url,
  el = $('#alert-list');
  el.append('Loading...');
  Service.store.SieveStore.find({
    uri: url,
    state: 40,//C.STATE_READY,
  }, function(err, result) {
    el.empty();
    if(err) {
      el.text('Error getting alerts:', err);
    } else {
      if(result.count == 0) {
        el.text('None.');
      } else {
        var list = _.map(result.data, function(sieve) {
          return LI(
            A({ href: '#', id: sieve.id , 'class': 'nowrap xsieve'}, sieve.name)
          )
        });
        el.append(list);
      }
    }
  });
}

function loadUpdates() {
  var el = $('#update-list').empty();
  Service.store.SieveStore.find({
    state: 40,//C.STATE_READY,
    'ts_view.lt': { type: 'field', name: 'ts_data' }
  }, {
    limit: 3
  }, function(err, result) {
    if(err) {
      el.text('Error getting updates:', err);
    } else {
      //$('#update-count').text(result.total_count);
      if(result.count == 0) {
        el.text('There are no unread updates.');
      } else {
        var list = _.map(result.data, function(sieve) {
          return LI(
            A({ href: '#', id: sieve.id, 'class': 'nowrap xsieve' }, sieve.name)
          )
        });
        el.append(list);
      }
    }
  })
}

function markRead() {
  Service.service.markRead();

  setTimeout(loadUpdates, 100);
}

function openSelector() {
  Service.openSelector();
  hidePopup()
}

function watchPage() {
  Service.watchTab();
  setTimeout(loadAlerts, 200);
}

function setState() {
  var active = Service.store.Prefs.get('active');
  $('#btn-active')[0].className = 'btn ' + (active ? 'active' : 'inactive');
}

function showInbox() {
  // TODO 
  chrome.tabs.create({
    active: true,
    url: Service.service.appUrl
  });
  hidePopup();
}

function showAddFeed() {
  Service.addFeedForTab();
  setTimeout(hidePopup, 50);
}

function showAlert(e) {
  var id = e.target.id;
  Service.service.show(id, function(err, data) {
    if(err) {
      console.error('Error showing alert:', err, id);
      alert('Failed to show watch item');
    } else {
      hidePopup();
    }
  });
  //console.log('showAlert:', e);
}

function toggleService(btn) {
  Service.store.Prefs.set('active', !Service.store.Prefs.get('active'));
  setState();
}

function hidePopup() {
  close();
}

chrome.tabs.getSelected(function(tab) {
  init({ tab: tab });
});

$('.xfeed').click(showAddFeed);
$('.xinbox').click(showInbox);
$('.xsel').click(openSelector);
$('.xwatch').click(watchPage);
$('.xtoggle').click(toggleService);
$('.xmarkread').click(markRead);
$('.xrefresh').click(checkAllForChanges);

