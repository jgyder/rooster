define(['jquery', 'underscore', 'domo', 'root/api', 'backbone', 'common/view'],

function($, _, domo, Api, Backbone, View) {

var Invite = View.Base.extend({
  events: {
    'click .btn':   'event_click',
    'keypress input': 'event_keypress'
  },

  event_click: function() {
    this.invite();
  },

  event_keypress: function(e) {
    if(e.charCode == 13) {
      this.invite();
    }
  },

  invite: function() {
    var self = this, email = this.$('input').val();

    if(_.isEmpty(email)) { return; }
    if(email.indexOf('@') < 0) {
      this.$el.find('.help-inline').text('Please enter a valid email address');
      return;
    }
    self.$('.btn').button('loading');
    $.post('/invite', { email: email }, function() {
      $(self.el).empty().append(
        H4('Awesome! We will email you at ', email, ' for ', BR(),
        ' early access as soon as we are ready.')
      );
    });
  }

});

return Invite;

});

