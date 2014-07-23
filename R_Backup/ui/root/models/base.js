define(['underscore', 'backbone', 'root/api', 'paginator'],
function(_, Backbone, Api, Paginator) {

function sync(method, model, options) {
  var
  url = _.result(model, 'url') || urlError(),
  data = options.data;

  if(data == null && model && 
    (method === 'create' || method === 'update' || method === 'patch')) {
    data = options.attrs || model.toJSON(options);
  }
  var xhr = options.xhr = Api.api(url, method, data, function(err, data) {
    if(err) {
      options.error && options.error(err);
    } else {
      //console.log('api:result:', url, method, data);
      options.success && options.success(data);
    }
  });

  model.trigger('request', model, xhr, options);
  return xhr;
}

function syncBatch(changes, callback) {
  var
    dels = _.map(changes.dels, function(model) {
      return {
        method: 'DELETE',
        url: _.result(model, 'url') || urlError()
      }
    }),
    posts = _.map(changes.posts, function(model) {
      return {
        method: 'POST',
        url: _.result(model, 'url') || urlError(),
        body: model.toJSON()
      }
    }),
    puts = _.map(changes.puts, function(model) {
      return {
        method: 'PUT',
        url: _.result(model, 'url') || urlError(),
        body: _.pick.apply(_, [model.toJSON()].concat(_.keys(model.changedAttributes())) )
      }
    }),
    requests = [].concat(dels, posts, puts);

  if(requests.length == 0) {
    console.log('empty batch request');
    return false;
  }

  DBG && console.log('syncBatch: requests:', requests);

  return Api.batch(requests, callback);
}

// Throw an error when a URL is needed, and none is supplied.
var urlError = function() {
  throw new Error('A "url" property or function must be specified');
};

return {

  sync: sync,

  syncBatch: syncBatch,
    
  Model: Backbone.Model.extend({

    sync: sync,

    encodedFields: [],

    parse: function(response) {
      _.each(this.encodedFields, function(name) {
        var text = response[name];
        if(_.isString(text)) {
          var obj = null;
          try {
            obj = JSON.parse(text);
          } catch(e) {
            console.error('Invalid model json attribute:', name, text, e);
          }
          response[name] = obj;
        }
      });
      return response;
    },

    // Temporary set of properties set on a model to facilitate temporal state
    // management. An example is to manage selection of models in a list.
    tattr: function(name, value) {
      this.props || (this.props = {});

      if(arguments.length == 2) {
        var oldVal = _.result(this.props, name);
        if(oldVal === value) return;
        this.props[name] = value;
        this.trigger('tattr', name, value, oldVal);
        this.trigger('tattr:'+name, name, value, oldVal);
      } else {
        return _.result(this.props, name);
      }
    },

    toJSON: function() {
      var json = Backbone.Model.prototype.toJSON.call(this);
      _.each(this.encodedFields, function(name) {
        var obj = json[name];
        if(!_.isEmpty(obj)) {
          json[name] = JSON.stringify(obj);
        }
      });
      return json;
    }

  }),

  Collection: Backbone.Collection.extend({
    parse: function(res) {
      return res.data;
    },
    sync: sync
  }),

  PagedCollection: Paginator.requestPager.extend({

    model: Backbone.Model.extend(),

    paginator_core: { },

    paginator_ui: {
      currentPage: 0,
      perPage: 2
    },

    server_api: {
      _opt: function() {
        return {
          limit: this.perPage,
          offset: this.currentPage * this.perPage
        }
      }
    },

    parse: function(res) {
      this.offset = res.offset;
      this.totalPages = Math.ceil(res.count / this.perPage);
      this.totalRecords = res.total_count;
      return res.data;
    }

  })

};

});
