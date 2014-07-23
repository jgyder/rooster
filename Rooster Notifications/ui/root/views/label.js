define(['jquery', 'underscore', 'async', 'domo', 'i18n', 'backbone',
  'common/view', 'common/editor', 'root/models/label'],

function($, _, async, domo, i18n, Backbone, View, Editor, Model) {

var
Label = View.Base.extend({

  name: 'label',

  className: 'xlabel',

  tagName: 'li',

  postInit: function() {
    this.listenTo(this.model, 'change', this.render);
    this.listenTo(this.model, 'remove', this.remove);
  },

  render: function() {
    var name = this.model.get('name');
    this.$el.empty().append(
      DIV({ 'class': 'dropdown' },
        A({
          href: '#',
          'class': 'xlabel',
          'data-path': 'label/' + name
        }, name),
        A({
          'class': 'btn btn-mini xbtn-light right dropdown-toggle',
          'data-toggle': 'dropdown'
        }, I({ 'class': 'icon-caret-down' })),
        UL({ 'class': 'dropdown-menu' },
          LI(A({
            'data-action': 'nav label rename',
            'data-action-param': this.model.id
          }, i18n.gettext('a_rename'))),
          LI(A({
            'data-action': 'nav label del',
            'data-action-param': this.model.id
          }, i18n.gettext('a_del')))
        )
      )
    );

    return this;
  }
}),

LabelNavList = View.Entities.extend({

  name: 'LabelNavList',

  className: 'nav nav-list',

  tagName: 'ul',

  actions: {
    'nav label add': {
      fn: 'action_add'
    },
    'nav label del': {
      fn: 'action_del'
    },
    'nav label rename': {
      fn: 'action_rename'
    }
  },

  events: {
    'click a[data-path]':       'action_route'
  },

  action_add: function() {
    var
    self = this,
    view = Editor.create('text'),
    modal = new View.PromptModal({
      title: 'Label',
      msg: 'Enter label name:', // TODO i18n
      parent: this.getRoot(),
      view: view,
      width: 500
    });

    modal.show();

    $(view.field).focus();

    modal.on('save', function() {
      var value = view.getValue();
      if(_.isEmpty(value)) {
        modal.showAlert('Please enter a label to save');
      } else {
        modal.remove();
        self.collection.create({ name: value }, { wait: true });
      }

    });;
  },

  action_del: function(id) {
    var label = this.collection.get(id);
    label && label.destroy();
  },

  action_rename: function(id) {
    console.log('action_rename', id)
    var
    label = this.collection.get(id),
    editor = Editor.create('text', {
      param: {
        label: 'l_label',
        must: true,
        name: 'name'
      },
      model: label.clone(),
      parent: this
    }),
    modal = new View.PromptModal({
      title: 'l_label',
      msg: i18n.gettext('l_name'),
      parent: this.getRoot(),
      view: editor,
      width: 500
    });

    modal.on('save', function() {
      var newName = editor.getValue();

      modal.showProgress();

      label.save({
        name: newName,
      }, {
        patch: true,
        wait: true,
        error: function(model, res) {
          modal.showProgress(false);
          model.showAlert('Failed to save:' + (res.msg||res));
        },
        success: function(model, response) {
          modal.showProgress(false);
          modal.remove();
        }
      });
    });

    modal.show();
  },

  action_route: function(e) {
    var
    el = e.target,
    route = $(el).attr('data-path');

    e.preventDefault();
    e.stopPropagation();

    this.getRouter().navigate(route, { trigger: true });
  },

  addOne: function(model, top) {
    var view = new Label({
      model: model,
      parent: this
    }).render();
    this.$divider.before(view.el);
  },

  highlight: function(path) {
    this.currentPath = path;
    this.$el.find('li.active').removeClass('active');
    this.$el.find('li a[data-path="'+ path +'"]').parents('li').addClass('active');
  },

  removeOne: function(model) {
    model.trigger('remove');
  },

  renderBase: function() {
    this.$divider = this.$el.find('.divider').last();
  }

}),

LabelSelection = Label.extend({
  render: function() {
    this.$el.append(
      INPUT({ type: 'chechbox' }),
      LABEL({
      }, this.model.get('name'))
    );
  }
}),

LabelSelectionList = LabelNavList.extend({

  addOne: function() {
    var view = new LabelSelection({
      model: model,
      parent: this
    }).render();
    this.$list.append(view.el);
  },

  getSelections: function() {
    // TODO Return a list of selected labels
  },

  onAdd: function() {
    // TODO Add a new label to the list and set
  },

  postInit: function() {
    // TODO Based on context, get/set labels.
  },

  renderBase: function() {
    var input, list, btnAdd;
    this.$el.append(
      input = INPUT({ type: 'textbox', 'class': 'hide' }),
      LI({ 'class': 'divider' }),
      list = UL({ 'class': 'nav nav-list' }),
      LI({ 'class': 'divider' }),
      LI( BUTTON({ 'class': 'btn hide' }, i18n.gettext('a_add')) )
    );

    btnAdd.onclick = this.onAdd;

    this.$input = $(input);
    this.$list = $(list);
    // TODO Add behavior
  }

});

return {
  LabelNavList: LabelNavList,
  LabelSelectionList: LabelSelectionList
}

});
