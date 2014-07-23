define(['common/view2'],
function(View) {

var
SearchForm = View.PreRenderedForm.extend({

  name: 'SearchForm',

  fields: [{ name: 'q', type: 'text' }],

  postInit: function() {
    this.model || (this.model = new Backbone.Model());
    SearchForm.__super__.postInit.apply(this, arguments);
  },

  submit: function() {
    Backbone.history.navigate('search/'+this.el.q.value, { trigger: true });
    return false;
  }

});

return SearchForm;
});
