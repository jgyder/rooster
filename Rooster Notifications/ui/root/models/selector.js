define(['./base', 'paginator', './brwsr'],

function(base, Paginator, Brwsr) {

var
Selector = Brwsr.extend({
  urlRoot: '/selectors'
}),
Selectors = base.Collection.extend({
  model: Selector,
  url: '/selectors'
});

return {
  Selector: Selector,
  Selectors: Selectors
};

});
