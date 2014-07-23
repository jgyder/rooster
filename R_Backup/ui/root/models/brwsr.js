define(['async', './base', 'common/const'],

function(async, base, C) {

var
Model = base.Model,
Collection = base.Collection,
Brwsr = Model.extend({
  readyTimeout: 30000,
  getHost: function() {
    return this.get('host');
  },
  isReady: function() {
    return this.get('host') != null && this.get('state') == C.STATE_READY;
  },
  onReady: function(callback) {
    var self = this, readyTimeout = this.readyTimeout, start = Date.now();

    async.whilst(
      function test() {
        return !self.isReady() && ((Date.now() - start) < readyTimeout);
      },
      function fn(callback) {
        setTimeout(function() {
          //console.log('check if ready');
          self.fetch({
            error: function() { callback('e_req'); },
            success: function() {callback(); }
          });
        }, 2000)
      },
      function(err) {
        var err2;
        if(self.get('host') == null)
          err2 = 'e_brwsr:timeout';
        else if(self.get('state') != C.STATE_READY)
          err2 = 'e_brwsr:'+self.get('state');

        if(err || err2) {
          callback(err||err2);
        } else {
          callback();
        }
      }
    );
  }
});

return Brwsr;

});
