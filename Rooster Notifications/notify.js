var TS_LOW = parseInt(window.location.hash.slice(1)||0);

//console.log('NOTIFY:POPUP:TS_LOW:', TS_LOW, ',', window.location.hash);

if(typeof chrome != 'undefined') {
  var BG = chrome.extension.getBackgroundPage();
} else if(typeof Components != 'undefined') {
  var BG = Components.classes['@ajitk.com/alertbox/alertbox;1'].
    getService().wrappedJSObject;
}

ID = (function(x) {
  return function () {
    return x++;
  }
})(1);

// TODO Add API to Webapp where the client subscribes to events.
function getMessages(cb) {
  BG.store.PopupMessageStore.find({
    'ts.gt': TS_LOW,
  }, {
    limit: 100,
    order: ['-ts']
  }, cb);
}

function init() {
  getMessages(onMessages);

  $('#messages').delegate('.list a', 'click', openMessage);

  function openMessage(e) {
    //console.log('NOTIFY:POPUP:openMessage', $(this).attr('href'));
    BG.tabs.create({ active: true, url: $(this).attr('href') });
    e.preventDefault();
  }

}

function onMessages(err, result) {

  if(err) {
    console.error('NOTIFY:failed to find list of messages', err);
  } else {
    //console.log('NOTIFY:POPUP:messages:', result);

    showMessages(result.data);

    if(messages.length === 0) {
      closeMe();
    }
  }
}

function showMessages(messages) {
  var ct = $('#messages .list').html('');
  _.each(_.groupBy(messages, 'key'), function(group) {
    var
    count = group.length,
    msg = group[0];

    ct.append(DIV(
      A({
        href: msg.uri,
        id: msg.id
      }, msg.title + (count > 1 ? ' ('+count+')': ''))
    ));
  });
}

function closeMe() {
  window.close();
  if(typeof Components != 'undefined') {
    closePopup();
  }
}

function closePopup() {
  window.frameElement.ownerDocument.defaultView.close()
}

