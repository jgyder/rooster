define(['jquery', 'underscore', 'root/api', 'backbone', 'common/msg',
  'common/view2', 'common/editor'],

function($, _, Api, Backbone, Msg, View, Editor) {

var
AccountSettings = View.PreRenderedForm.extend({

  name: 'AccountSettings',

  fields: [{
    must: true,
    name: 'email',
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
        Msg.error('Failed to save account settings. ' + res.msg||res);
        self.trigger('error');
      } else {
        Msg.info('Settings saved.');
        self.trigger('done');
      }
    });

    return false;
  }

});

return AccountSettings;

});

