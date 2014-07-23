define(['root/models/base', 'common/const'],
function(Model, C) {

var

FeedEntry= Model.Model.extend(),

FeedEntryCollection = Model.Collection.extend({
  model: FeedEntry
}),

Feed = Model.Model.extend({
  parse: function(response) {
    console.log(response, response.entries);
    response.entries = new FeedEntryCollection(response.entries);
    return response;
  }
});

return {
  Feed: Feed,
  FeedEntry: FeedEntry,
  FeedEntryCollection: FeedEntryCollection
}

});

