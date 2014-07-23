define(['jquery', 'underscore', 'root/api', 'backbone', 'common/view', 'common/editor'],

function($, _, Api, Backbone, View, Editor) {

var
Login = View.SimpleForm.extend({

  name: 'Login',

  fields: [{
    must: true,
    name: 'name',
    type: 'text',
    label: 'l_name'
  }, {
    must: true,
    name: 'password',
    type: 'password',
    label: 'l_password'
  }],

  postInit: function() {
    this.model = new Backbone.Model();
    Login.__super__.postInit.apply(this, arguments);
  },

  submit: function() {
    var
      self = this,
      btn = this.$el.find('[type=submit]'),
      model = this.model;

    btn.button('loading');
    $.ajax({
      url: '/login',
      type: 'POST',
      data: model.toJSON(),
      error: function() {
        btn.button('reset');
        console.log('error:', arguments);
      },
      success: function(user) {
        btn.button('reset');
        console.log('success');
        self.trigger('done', user, model, this);
      }
    });
    return false;
  }

});

return Login;

});

