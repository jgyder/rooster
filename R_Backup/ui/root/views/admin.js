define([
'async',
'jquery',
'backbone', 
'i18n', 
'common/const',
'common/core',
'common/store',
'common/msg',
'common/view',
'root/api', 
'root/models/base',
'root/models/admin'
],
function(async, $, Backbone, i18n, Const, Core, Store, Msg, View, Api,
  BaseModel, AdminModel) {

var

InviteRequestDetail = View.ActionProvider.extend({
  name: 'Invite'
}),

InviteRequestRow = View.Base.extend({

  className: 'xitem',

  tagName: 'li',

  postInit: function(options) {
    this.listenTo(this.model, 'change', this.render);
    this.listenTo(this.model, 'destroy', this.remove);
    this.listenTo(this.model, 'remove', this.remove);
  },

  isSelected: function() {
    return !!this.$('[type=checkbox]').is(':checked');
  },

  removeDetail: function() {
    this.$el.removeClass('active');
    this.detail && this.detail.remove();
    delete this.detail;
  },

  render: function() {
    this.$el.empty();
    var
      id = this.model.id,
      attrs = this.model.attributes,
      ts_text = formatTime(attrs.ts) || '';

    var el = DIV( { 'class': 'row-fluid xrow' },

      SPAN({ 'class': 'span1' },
        LABEL({ 'class': 'checkbox pull-left', style: 'margin-left: 5px;' },
          INPUT({ type: 'checkbox' })
        )
        /*
        , ' ',
        A({ 'class': 'xbtn', href: 'javascript:void 0' },
          I({ 'class': 'icon-caret-down' })
        )
        */
      ),

      DIV({ 'class' : 'span11', 'data-action': 'invite view',
        'data-action-param': '$parents [data-id]@data-id' },

        SPAN({ 'class': 'row-fluid' },

          SPAN({ 'class': 'xtitle span3' }, attrs.email),
          SMALL({ 'class': 'span1' }, this.model.getStatusText()),
          SMALL({ 'class': 'span2' }, ts_text)
        )
      )
    );
    this.$el.append(el);
    this.detail && this.showDetail(this.detail);
    return this;
  },

  showDetail: function(view) {
    this.listenTo(view, 'remove', function() {
      if(this.detail == view) {
        delete this.detail;
        this.removeDetail();
      }
    }, this);
    this.detail = view;
    this.$el.addClass('active');
    this.$el.append(view.el);
  }
}),

InviteRequests = View.Entities.extend({

  name: 'InviteRequests',

  actions: {
    'invite': { fn: 'action_invite' },
    'invite fetch': { fn: 'action_fetch' },
    'invite view': { fn: 'action_view' },
    'nav next': { fn: 'action_next' },
    'nav prev': { fn: 'action_prev' },
    'select toggle': { fn: 'action_toggle' }
  },

  ViewClass: InviteRequestDetail,

  postInit: function() {
    _.defer(this.action_fetch);
  },

  getRequestParams: function() {
    var type = parseInt(this.select_type.value);
    return !isNaN(type) ? {status: type} : null;
  },

  action_fetch: function() {

    this.collection.perPage = parseInt(this.select_limit.value);
    this.collection.currentPage = 0;

    Msg.start('invite:fetch', { info: 'loading' });

    this.collection.fetch({
      data: this.getRequestParams(),
      error: function() {
        Msg.stop('invite:fetch', { error: 'e_req' } );
      },
      success: function(collection, resp, options) {
        Msg.stop('invite:fetch');

        _.each(options.previousModels, function(model) {
          model.trigger('remove');
        });
      }
    });
  },

  action_invite: function() {
    var ids = this.getSelection();
    if(ids.length == 0) return;
    var
      collection = this.collection,
      models = _.map(ids, function(id) {
        var model = collection.get(id);
        model.set('status', AdminModel.REQUEST_INVITING);
        console.log(model.attributes, model.changedAttributes());
        return model;
      });

    BaseModel.syncBatch({
      puts: models
    }, function(err, results) {
      if(err) {
        console.error('error inviting users:', err);
      } else {
        console.log('invited users:', results);
      }
    });
  },

  action_next: function() {
    this.collection.nextPage({
      data: this.getRequestParams(),
      success: function(collection, resp, options) {
        _.each(options.previousModels, function(model) {
          model.trigger('remove');
        });
      }
    });
  },

  action_prev: function() {
    this.collection.prevPage({
      data: this.getRequestParams(),
      success: function(collection, resp, options) {
        _.each(options.previousModels, function(model) {
          model.trigger('remove');
        });
      }
    });
  },

  action_toggle: function() {
    this.selectAll(this.toggle.checked);
    return false;
  },

  action_view: function(id) {
    if(this.modelView && this.modelView.model.id == id) {
      this.route();
    } else {
      this.route(id);
    }
  },

  addOne: function(model, top) {
    var view = new InviteRequestRow({ model: model, parent: this });
    this.$list[top === true ? 'prepend' : 'append'](view.render().el);
  },

  getRow: function(model) {
    return _.find(this.children, function(child) {
      return child.model.id == model.id
    });
  },

  getSelection: function() {
    var ids = this.$list.find('.xitem input[type=checkbox]:checked')
      .map(function() {
        return $(this).parents('.xitem').attr('data-id');
      });
    return ids;
  },

  removeOne: function(model) {
    if(this.model && this.model.id == model.id) {
      this.removeModelView();
    }
  },

  renderBase: function() {
    var
      toggle,
      list = UL({ 'class': 'nav xlist' });

    this.$el.append(
      DIV({ 'class': 'xtbar xalt' },
        toggle = INPUT({
          'data-action': 'select toggle',
          type: 'checkbox',
          style: 'margin: 5px 50px 5px 5px;'
        }),
        A({
          'data-action': 'invite',
          'class': 'btn btn-primary',
          style:'width: 100px; padding: 6px 60px;'
        }, 'Invite'),
        DIV({ 'class': 'pagination pagination-small pull-right', style: 'margin: 0' },
          UL(
            LI(A({ href: '#', 'data-action': 'nav prev' }, 'Prev')),
            //LI(A({ href: '#', 'data-action': 'nav page' }, 1)),
            LI(A({ href: '#', 'data-action': 'nav next'  }, 'Next'))
          )
        ),
        DIV({ 'class': 'pull-right' },
          this.select_limit = SELECT({ 'style': 'width:auto;height:auto;margin:0;' },
            OPTION({ value: '50' }, '50'),
            OPTION({ value: '100' }, '100'),
            OPTION({ value: '200', selected: true }, '200')
          ),
          this.select_type = SELECT({ 'style': 'width:auto;height:auto;margin:0;'},
            OPTION({ value: AdminModel.REQUEST_NEW}, 'new'),
            OPTION({ value: AdminModel.REQUEST_INVITED}, 'sent'),
            OPTION({ value: AdminModel.REQUEST_ACCEPTED}, 'accepted'),
            OPTION({ value: ''}, 'all')
          ),
          BUTTON({ 'data-action': 'invite fetch', 'class': 'btn btn-small', style: '' }, 'Go')
        )
      ),
      DIV({ 'class': 'row-fluid' }, list)
    );
    this.$list = $(list);
    this.toggle = toggle;
  },

  renderModelView: function(model, view) {
    var row = this.getRow(model);
    row && row.showDetail(view.render());
  },

  resetList: function() {
  },

  selectAll: function(select) {
    this.$list.find('.xitem input[type=checkbox]').prop('checked', select);
  },

  show404: function() {
    Msg.error('e_404');
    return false;
  },

  showDefault: function() {
    this.removeModelView();
  }

})

return {
  InviteRequests: InviteRequests
}

// TODO Move to a util module
function formatTime(ts) {
  if(!ts) return '';

  var
    then = moment(ts),
    now = moment(),
    diff = now.diff(then);

  if(diff < 60000) {
    //return then.fromNow(true);
    return then.format('h:mm A');
  } else if(diff < 24 * 3600000 && now.date == then.date) {
    return then.format('h:mm A');
  } else {
    return then.format('MMM DD, h:mm A');
  }
}


});
