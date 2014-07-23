define(['backbone', './base', 'i18n'],
function(Backbone, base, i18n) {

var
Label = base.Model.extend({
}),

Labels = base.Collection.extend({
  model: Label,
  url: '/tags'
});

return {
  Label: Label,
  Labels: Labels
}

});
