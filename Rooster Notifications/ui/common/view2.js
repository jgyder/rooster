define(['domo', 'underscore', 'jquery', 'backbone', 'i18n', 'common/view',
  'common/editor'],

function(domo, _, $, Backbone, i18n, View, Editor) {

var 
PreRenderedForm = View.Form.extend({

  name: 'PreRenderedForm',

  fields: [],

  postInit: function() {
    this.model || (this.model = new Backbone.Model());
    this.initEditors();
  },

  getFieldEl: function(field) {
    var selectorValue = field.name.replace('[', '\\[').replace(']', '\\]');
    return this.$el.find('[name=' + selectorValue + ']')
  },

  initEditors: function() {
    this.editors = _.map(this.fields, function(field) {
      var editor = Editor.create(field.type, {
        param: field,
        parent: this,
        model: this.model,
        el: this.getFieldEl(field).parent()[0]
      }).acquire();

      return editor;
    }, this);
  },

  validateFields: function() {
    var errors = _.filter(this.editors, function(editor) {
      return !editor.isValid();
    }, this);
    return errors;
  }

});

return {
  PreRenderedForm: PreRenderedForm
}

});
