//console.log('CONTENT:port-ready:init:', location.href);

brwsr_req(['api'], function() {
  //console.log('CONTENT:port-ready:load:', location.href);
  var event = document.createEvent('Event');
  event.initEvent('DistillEventWebReady', true, true);
  window.dispatchEvent(event);
});

