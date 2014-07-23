define(['jquery', 'underscore', 'root/api', 'backbone', 'common/msg',
  'common/view2', 'common/editor'],

function($, _, Api, Backbone, Msg, View, Editor) {

var
ChangePassword = View.PreRenderedForm.extend({

  name: 'ChangePassword',

  fields: [{
    must: true,
    name: 'password_old',
    type: 'password'
  }, {
    must: true,
    name: 'password_new',
    type: 'password'
  }],

  submit: function() {
    var
      self = this,
      btn = this.$el.find('[type=submit]');

    Msg.reset();
    btn.button('loading');

    $.ajax({
      url: '/change_password',
      type: 'POST',
      data: this.model.toJSON(),
      error: function(jqXHR, statusText, error) {
        btn.button('reset');
        console.log('error:', statusText);
        var msg = jqXHR.responseText;
        try { msg = JSON.parse(msg).msg } catch(e){}
        Msg.error('Failed to change password. ' + msg);
      },
      success: function() {
        btn.button('reset');
        Msg.info('Password changed.');
        self.trigger('done');
        self.clear();
      }
    });
    return false;
  }

}),
ForgotPassword = View.PreRenderedForm.extend({

  name: 'ForgotPassword',

  fields: [{
    must: true,
    name: 'email',
    type: 'email'
  }],

  submit: function() {
    var
      self = this,
      btn = this.$el.find('[type=submit]');

    Msg.reset();
    btn.button('loading');

    $.ajax({
      url: '/account/forgot_password',
      type: 'POST',
      data: this.model.toJSON(),
      error: function(jqXHR, statusText, error) {
        btn.button('reset');
        console.log('error:', statusText);
        var msg = jqXHR.responseText;
        try { msg = JSON.parse(msg).msg } catch(e){}
        Msg.error('Failed to request new password. ' + msg);
      },
      success: function() {
        btn.button('reset');
        // TODO Show alert.success?
        Msg.info('Requested password reset. You should receive an email with instructions soon.');
        self.trigger('done');
      }
    });
    return false;
  }

}),
ResetPassword = View.PreRenderedForm.extend({

  name: 'ResetPassword',

  fields: [{
    must: true,
    name: 'code',
    type: 'hidden'
  }, {
    must: true,
    name: 'password',
    type: 'password'
  }],

  submit: function() {
    var
      self = this,
      btn = this.$el.find('[type=submit]');

    Msg.reset();
    btn.button('loading');

    $.ajax({
      url: '/account/reset_password',
      type: 'POST',
      data: this.model.toJSON(),
      error: function(jqXHR, statusText, error) {
        btn.button('reset');
        console.log('error:', statusText);
        var msg = jqXHR.responseText;
        try { msg = JSON.parse(msg).msg } catch(e){}
        Msg.error('Failed to reset password. ' + msg);
      },
      success: function() {
        btn.button('reset');
        Msg.info('Password changed successfully!');
        self.trigger('done');
      }
    });
    return false;
  }

})
;

return {
  ChangePassword: ChangePassword,
  ForgotPassword: ForgotPassword,
  ResetPassword: ResetPassword
};

});

