require.config({
  paths: {
    async: '../lib/async',
    backbone: '../lib/backbone',
    bootstrap: '../lib/bootstrap',
    domo: '../lib/domo',
    es5shim: '../lib/es5-shim',
    // XXX Why is Firebase located at a separate path? The need to override?
    firebase: 'lib/firebase',
    htmldiff: '../lib/htmldiff',
    jquery: "../lib/jquery",
    jstorage: "../lib/jstorage",
    moment: "../lib/moment",
    noVNCinputs: '../lib/noVNC-inputs',
    noVNCutil: '../lib/noVNC-util',
    paginator: 'root/backbone.paginator',
    Piwik: 'http://views.brw.sr/piwik',
    qs: "../lib/qs",
    sockjs: "../lib/sockjs",
    stacktrace: '../lib/stacktrace',
    underscore: '../lib/underscore'
  },
  shim: {
    async: { exports: 'async' },
    backbone: { deps: ['jquery', 'underscore'], exports: 'Backbone' },
    bootstrap: ['jquery'],
    domo: {
      exports: 'domo',
      init: function() {
        domo.CLS = function(name) { return { 'class': name } }
      }
    },
    firebase: { exports: 'Firebase' },
    htmldiff: { exports: 'htmldiff' },
    jquery: { init: function() { return $.noConflict(); } },
    jstorage: { deps: ['jquery'], init: function() { return $.jStorage; } },
    moment: { exports: 'moment' },
    noVNCinputs: { deps: ['noVNCutil'] },
    noVNCutil: { exports: 'Util' },
    Piwik: { exports: 'Piwik' },
    qs: { exports: 'qs' },
    sockjs: { exports: 'SockJS' },
    stacktrace: { exports: 'printStackTrace' },
    underscore: {
      exports: '_',
      init: function() {
        _.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };
      }
    }
  }
});

