define(['jquery', 'underscore', 'root/api', 'backbone', 'common/msg',
  'common/view2', 'common/editor'],

function($, _, Api, Backbone, Msg, View, Editor) {

var
Profile = View.PreRenderedForm.extend({

  name: 'Profile',

  fields: [{
    must: true,
    name: 'full_name',
    type: 'text'
  }, {
    name: 'bio',
    type: 'text'
  }, {
    name: 'website',
    type: 'text'
  }],

  submit: function() {
    var
      self = this,
      btn = this.$el.find('[type=submit]');

    Msg.reset();
    btn.button('loading');

    Api.api('/users', 'PATCH', this.model.toJSON(), function(err, res) {
      btn.button('reset');
      if(err) {
        Msg.error('Failed to save profile. ' + res.msg||res);
        self.trigger('error');
      } else {
        Msg.info('Profile saved.');
        self.trigger('done');
      }
    });

    return false;
  }

});

return Profile;

});

