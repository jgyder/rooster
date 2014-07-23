define(['require', './base', 'paginator', 'i18n', 'common/rules',
  'common/core', 'common/const', 'common/editor', 'common/view'],

function(require, base, Paginator, i18n, Rules, Core, Const, Editor, View) {

var
REQUEST_NEW =       0,
REQUEST_INVITING =  10,
REQUEST_INVITED =   20,
REQUEST_ACCEPTED =  30,
REQUEST_ERROR =     40,

InviteRequest = base.Model.extend({
  getStatusText: function() {
    var status = this.get('status');
    switch(status) {
      case REQUEST_NEW:
      return 'new';

      case REQUEST_INVITING:
      return 'inviting';

      case REQUEST_INVITED:
      return 'invited';

      case REQUEST_ACCEPTED:
      return 'accepted';

      case REQUEST_ERROR:
      return 'error';

      default:
      return 'unknown state'
    }
  },

  urlRoot: '/admin/invite_requests'
}),

InviteRequests = base.PagedCollection.extend({

  model: InviteRequest,

  paginator_ui: {
    currentPage: 0,
    perPage: 50
  },

  url: '/admin/invite_requests'

})

return {
  REQUEST_NEW: REQUEST_NEW,
  REQUEST_INVITING: REQUEST_INVITING,
  REQUEST_INVITED: REQUEST_INVITED,
  REQUEST_ACCEPTED: REQUEST_ACCEPTED,
  REQUEST_ERROR: REQUEST_ERROR,
  InviteRequests: InviteRequests
}

});
