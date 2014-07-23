var
DBG = 1,
USER = {id: '0'},
ROUTE_ROOT = chrome.runtime.getURL('inbox.html'),
PUSH_STATE = false;

require.config({ baseUrl: "ui" });
require(['rcfg'], function() {
  require(['service', 'root/index'], function(Service, App) {
  });

  require(['root/views/settings'], function(Settings) {
    $('#a_settings').click(function() {
      new Settings.SettingsModal({
        parent: App.root
      }).show();
    });
  });
});

// Google Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-40922518-3']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
