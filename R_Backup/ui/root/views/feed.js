define(['domo', 'async', 'common/const', 'common/core', 'common/msg',
  'common/view'],
function(domo, async, C, Core, Msg, View) {

var

FeedEntry = View.Base.extend({

  name: 'FeedEntry',

  render: function() {
    var
    attrs = this.model.attributes,
    preview;

    this.$el.append(
      H4(A({ href: attrs.link }, attrs.title)),
      preview = DIV({ 'class': 'summary' })
    );
    $(preview).html(attrs.summary);
    return this;
  }
}),

FeedEntryList = View.Collection.extend({
  name: 'FeedEntryList',

  addOne: function(model) {
    var view = new FeedEntry({
      parent: this,
      model: model
    }).render();
    this.$el.append(view.el);
    return view;
  }
}),

Feed = View.Base.extend({

  name: 'Feed',

  render: function() {
    var attrs = this.model.attributes;

    this.$el.append(
      H3(A({ href: attrs.link }, attrs.title)),
      DIV(attrs.summary),
      new FeedEntryList({
        parent: this,
        collection: this.model.get('entries')
      }).render().el
    );
    return this;
  }
});


return {
  Feed: Feed,
  FeedEntry: FeedEntry,
  FeedEntryList: FeedEntryList
}

});
