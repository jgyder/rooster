require(['underscore', 'service', 'qs', 'domo', 'async', 'common/const',
  'common/core', 'common/msg', 'common/view', 'root/models/feed',
  'root/views/feed'],
function(_, Service, qs, domo, async, C, Core, Msg, ViewBase, Model, View) {

var
feed,
url = qs.parse(location.search.substring(1)).url,

Root = ViewBase.RoutedRoot.extend({

  name: 'Root',

  actions: {
    'add': { fn: 'action_add' }
  },

  action_add: function() {
    Msg.start('save', { info: 'l_saving'});
    // TODO Create a common function in Service to create these given input
    // parameters.
    Service.store.SieveStore.create({
      content_type: C.TYPE_FEED,
      name: feed ? feed.attributes.title : 'Untitled',
      uri: feed ? feed.attributes.link : url, // URL to the page
      config: JSON.stringify({ uri: url }), // URL to fetch feed
      schedule: JSON.stringify({
        type: 'INTERVAL',
        params: { interval: 1800 }
      }),
      state: C.STATE_READY
    }, function(err, doc) {
      if(err) {
        console.error('err adding rss:', err);
        Msg.stop('save', {
          error: 'Failed to add item due to error:' + (err.message||err.msg)
        });
      } else {
        Msg.stop('save');
        async.series([
          function(callback) {
            Service.store.ActionStore.create({
              sieve_id: doc.id,
              type: 101
            }, callback);
          }, 
          function(callback) {
            Service.store.ActionStore.create({
              sieve_id: doc.id,
              type: 102
            }, callback);
          }
        ], function(err) {
          location.href = 'inbox.html';
        });
      }
    });
  }

}),

root = new Root({
  el: document.body
});

root.updateActions();

if(!url) {
  Msg.error('Invalid url parameter, cannot get feed for the page.');
  return;
}

function fetchFeed(url) {
  Service.Feed.fetch(url, onLoadFeed);
}

function findFeeds(htmlDoc, callback) {
  if(!htmlDoc) {
    return callback({
      code: 'NULL',
      msg: 'HTML document is null'
    });
  }

  var
  result = htmlDoc.querySelectorAll('link[type="application/rss+xml"],link[type="application/atom+xml"]'),
  feeds = _.map(result, function(link) {
    return {
      title: link.getAttribute('title'),
      href: link.getAttribute('href')
    }
  });

  console.log('Feeds found:', feeds);

  callback(null, feeds);
}

function onFindFeeds(err, feeds) {
  Msg.reset();
  if(feeds.length == 0) {
    Msg.error('No feed found in page.');
  } else if(feeds.length == 1) {
    location.href = 'feed.html?url='+feeds[0].href;
  } else {
    // Display list of feeds
    $('#list').empty().append(H4('Found multiple feeds in the page:'))
      .append(_.map(feeds, function(feed) {
        return H5(A({ href: 'feed.html?url=' + feed.href}, feed.title));
      }))
      .append(H5('Click link to view a feed. Once loaded, you can add it to your watchlist.'));
  }
}

function onLoadFeed(err, result) {
  console.log('Feed fetch result:', err, result);

  Msg.reset();
  if(err) {
    Msg.error('Reload page to try later. Failed to fetch feed content.');
  } else {
    feed = new Model.Feed(result, { parse: true });
    $('[data-action="add"]').show();
    new View.Feed({
      el: $('#feed')[0],
      model: feed,
      parent: root
    }).render();
  }
}

Service.HTTP.get({ url: url }, function(err, res, xhr) {
  var contentType = xhr.getResponseHeader('content-type');
  console.log('content:', contentType, res);
  contentType = contentType.split(';')[0];
  switch(contentType) {
    case 'text/html':
    case 'application/xhtml+xml':
    // Find feeds defined in html docs.
    //console.log('to parse html', res);
    var
    parser = new DOMParser(),
    doc = parser.parseFromString(res, contentType);
    console.log('html:', doc);
    if(!doc) {
      var htmlFramgment = res.match(/<link.*\/>/gim).join('');
      console.log('fragment:', htmlFramgment);
      doc = parser.parseFromString(htmlFramgment, contentType);
    }
    console.log('html:', doc);
    findFeeds(doc, onFindFeeds);
    break;

    case 'application/xml':
    case 'text/xml':
    case 'application/rss+xml':
    case 'application/atom+xml':
    if(res.nodeType === Node.DOCUMENT_NODE) {
      Service.Feed.fromXML(res, onLoadFeed);
    } else {
      Service.Feed.fromString(res, onLoadFeed);
    }
    break;

    default:
    Msg.error('Unknown content type:' + contentType)
    break;
  }
});

});
