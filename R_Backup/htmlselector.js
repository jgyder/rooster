var
DBG = 1,
ROUTE_ROOT = chrome.runtime.getURL('htmlselector.xhtml'),
PUSH_STATE = false;

require.config({ baseUrl: chrome.runtime.getURL('ui') });
require(['rcfg'], function() { require(['selector/html']) });

