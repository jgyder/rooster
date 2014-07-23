define(['jquery', 'underscore', 'domo', 'i18n', 'firebase'],
function($, _, domo, i18n, Firebase) {

var rooms = new Firebase('https://chat-brwsr.firebaseio.com/rooms')

var Room = Backbone.View.extend({

  className: 'xwin mini',

  events: {
    'click    .btn-mini':   'action_toggleChat',
    'keypress   .xinput':     'action_keypress'
  },

  action_keypress: function(e) {
    if(e.keyCode == 13) {
      this.room.push({
        msg: $(e.currentTarget).val(),
        user: this.options.user.name
      });
      $(e.currentTarget).val('');
    }
  },
  
  action_toggleChat: function() {
    this.$el.toggleClass('mini');
  },

  initialize: function(options) {
    var self = this,
      room = rooms.child(options.brwsr.id);

    _.bindAll(this);
    this.room = room;
  },

  addOne: function(snapshot) {
    var data = snapshot.val();
    with(domo) {
      this.$el.find('.xbody').append(DIV(
        SPAN({ 'class': 'xname' }, data.user + ': '),
        SPAN({ 'class': 'xmsg' }, data.msg)
      ));
    }
  },

  remove: function() {
    Room.prototype.remove.call(this);
    this.room.off('child_added', this.addOne);
  },

  render: function() {
    with(domo) {
      this.$el.append(DIV({ 'class': 'xwin-inner' },
        DIV({ 'class': 'xheader' },
          SPAN(i18n.gettext('Chat')),
          BUTTON({ 'class': 'btn btn-mini pull-right' }, '_')
        ),
        DIV({ 'class': 'xbody' }),
        INPUT({
          'class': 'xinput',
          type: 'text',
          placeholder: i18n.gettext('Enter message...')
        })
      ));
    }
    this.room.on('child_added', this.addOne);
    return this;
  }
});

return { Room: Room };
});

