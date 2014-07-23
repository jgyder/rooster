var
DBG = 1,
ROUTE_ROOT = chrome.runtime.getURL('feed.html'),
PUSH_STATE = false;

require.config({ baseUrl: "ui" });
require(['rcfg'], function() { require(['addfeed']) });

