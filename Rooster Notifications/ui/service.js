define(['backbone'], function(Backbone) {
  try {
    return chrome.extension.getBackgroundPage()
  } catch(e) {
    // Not in extension process. We return a dummy object that does nothing
    return {
      store: {},
      gEvents: Backbone
    }
  }
});

