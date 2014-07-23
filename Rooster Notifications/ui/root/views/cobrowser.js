define(['jquery', 'underscore', 'async', 'domo', 'backbone', 'i18n',
  'common/msg', 'common/view', './common'],

function($, _, async, domo, Backbone, i18n, Msg, View, CommonView) {

var CobrowserPreview = Backbone.View.extend({
  tagName: 'li',

  initialize: function(options) {
    View.Base.prototype.initialize.call(this, options);
    this.model.on('all', this.render);
  },

  render: function() {
    var host = this.model.eget('host'),
      src = host ? 
        host + '/brwsrs/' + this.model.get('brwsr_id') + '/120x90.png' : '';
    $(this.el).html(_.template($('#t-thumbbrwsr').text(), {
      id: this.model.id,
      title: this.model.get('title'),
      src: src
    }));
    return this;
  },

  setPreview: function(preview) {
    this.$el.find('img').attr('src', preview.data);
  },

  setTitle: function(title) {
    this.$el.find('.xtitle').text(title);
  }

});

var BrowserWindow = View.Modal.extend({

  className: 'modal xwin-browser',

  title: i18n.gettext('l_brwsr'),

  initialize: function(options) {
    View.Modal.prototype.initialize.call(this, options);
    this.view = new CommonView.Browser({
      model: this.model,
      parent: this
    });
    this.listenTo(this.view, 'change:title', this.updateTitle);
  },

  updateTitle: function(event) {
    this.$el.find('h3').text(event.data + ' - ' + this.title);
  }
});

var Cobrowsers = View.Entities.extend({
  name: 'cobrowsers',

  actions: {
    'cobrowser close': {
      fn: 'action_CobrowserClose',
      doc: 'Close cobrowser'
    },
    'cobrowser new': {
      fn: 'action_CreateNew',
      doc: 'Create a new brwsr'
    },
    'window show': {
      fn: 'action_WindowShow',
      doc: 'Shows brwsr window'
    },
    'window close': {
      fn: 'action_WindowClose',
      doc: 'Close brwsr window'
    }
  },

  ViewClass: BrowserWindow,

  action_CobrowserClose: function(id) {
    this.collection.get(id).destroy();
    return true;
  },

  action_CreateNew: function() {
    var self = this,
      $btn = this.$el.find('.btn.new');
    $btn.button('loading');

    Msg.start('brwsr_new', 'l_loading');
    this.collection.create({
      properties: {
        subscriptions: ['create', 'close', 'open', 'paint', 'state']
      },
      title: 'brwsr'
    }, {
      wait: true,
      error: function(model, err) {
        $btn.button('reset');
        Msg.stop('brwsr_new', { error: 'cobrowser:create:fail' });
        console.error(err);
      },
      success: function(model) {
        waitTillReady(model);
      }
    });

    function waitTillReady(model) {
      async.whilst(
        function test() {
          return model.getHost() == null; // => ready
        },
        function fn(callback) {
          setTimeout(function() {
            model.fetch({
              error: function() { callback('ajax:fail'); },
              success: function() { callback(); }
            });
          }, 4000)
        },
        function cb(err) {
          $btn.button('reset');
          if(err) {
            console.error('cobrowser:create:fail:', err);
            Msg.stop('brwsr_new', { error: 'cobrowser:create:fail' });
          } else {
            Msg.stop('brwsr_new');
            App.router.navigate(self.name + '/' + model.id, true);
          }
        }
      );
    }
  },

  action_WindowShow: function(id) {
    var model = this.collection.get(id);
    if(!model || !model.get('host')) {
      alert('Cobrowser is being started. Please try again later.');
      return;
    }
    this.route(id);
  },

  action_WindowClose: function() {
    this.removeModelView();
    App.router.navigate(this.name + '/', true);
  },

  addOne: function(model) {
    var view = this.views['thumbnail-' + model.id] = 
      new CobrowserPreview({ model: model }).render();
    this.$list.prepend(view.el);
  },

  initialize: function(options) {
    View.Entities.prototype.initialize.call(this, options);
    this.views = {};
  },

  removeOne: function(model) {
    this.views['thumbnail-' + model.id].remove();
    delete this.views['thumbnail-' + model.id];
    if(this.model && this.model.id == model.id) {
      this.removeModelView();
    }
  },

  removeModelView: function() {
    if(self.chatRoom) {
      self.chatRoom.close();
    }
    View.Entities.prototype.removeModelView.call(this);
  },

  renderBase: function() {
    this.$el.html($('#t-browser').text());
    this.$list = this.$el.find('.list');
  },

  renderModelView: function(model, view) {
    var browser = this.modelView.view;

    this.listenTo(browser, 'change:title', this.updateTitle);
    this.listenTo(browser, 'change:preview', this.updatePreview);

    this.modelView.render().showModal();

    this.renderChat();
  },

  renderChat: function() {
    var self = this;
    require(['root/views/demo-chat'], function(Chat) {
      self.chatRoom = new Chat.Room({
        brwsr: self.model, 
        user: App.user
      }).render();
      self.modelView.$el.append(domo.DIV({ 'class': 'xchat' }, self.chatRoom.el ));
    });
  },

  show: function(id) {
    if(View.Entities.prototype.show.call(this, id)) {
      _.each(this.views, function(view) {
        view.$el.removeClass('active');
      });
      this.views['thumbnail-' + id].$el.addClass('active');
    }
  },

  show404: function() {
    Msg.error("err_brwsr_na");
    console.log('TODO show404');
  },

  showDefault: function() {
    this.removeModelView();
  },

  updateTitle: function(event) {
    var view = this.views['thumbnail-' + this.model.id];
    view && view.setTitle(event.data);
  },

  updatePreview: function(event) {
    var view = this.views['thumbnail-' + this.model.id];
    view && view.setPreview(event.data);
  }
});

return {
  Cobrowsers: Cobrowsers
};

});
