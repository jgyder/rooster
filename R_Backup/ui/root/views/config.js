define(['jquery', 'underscore', 'async', 'domo', 'i18n', 'moment', 'backbone',
  'common/const', 'common/msg', 'common/view', 'common/editor', 'common/rules',
  'common/rect', 'common/overview', 'root/models/base', 'root/models/sieve'],

function($, _, async, domo, i18n, moment, Backbone, C, Msg, View, Editor, Rules,
  Rect, Overview, ModelBase, Model) {

var
SieveLocator = View.Base.extend({

  name: 'SieveLocator',

  onTypeChange: function() {
    this.model.set('type', this.selType.value);
    this.renderParams();
  },

  postInit: function() {
    this.model.on('change', this.updateDOM);
  },

  render: function() {
    var
    elParams,
    selOpts =  _.map(Model.LocatorDescList, function(item) {
      return OPTION({ value: item.type }, i18n.gettext(item.label))
    });

    this.$el.append(
      this.selType = SELECT({ style: 'margin:0 5px 0 0;width: auto;' }),
      elParams = DIV({ 'class': 'inline'})
    );
    this.$elParams = $(elParams);

    $(this.selType).append(selOpts).change(this.onTypeChange);

    this.updateDOM();
    return this;
  },

  renderParams: function() {
    var
    $elParams = this.$elParams,
    type = this.selType.value,
    desc = _.findWhere(Model.LocatorDescList, { type: type });

    $elParams.empty();

    var els = _.map(desc.params, function(param) {
      return Editor.create(param.type, {
        param: param,
        parent: this,
        model: this.model
      }).render().el;
    }, this);

    $elParams.append(els);
  },

  updateDOM: function() {
    this.selType.value = this.model.get('type');
    this.renderParams();
  }

}),

SieveLocators = View.Collection.extend({

  name: 'SieveLocators',

  addOne: function(model) {
    var view = new SieveLocator({
      model: model,
      parent: this
    });
    this.list.appendChild(view.render().el);
    this.header.textContent = this.options.op == 'EXCLUDE' ? 'Ignored' : 'Watched';
    return view;
  },

  removeOne: function() {
    SieveLocators.__super__.removeOne.apply(this, arguments);
    if(this.collection.length == 0) {
      this.header.textContent = '';
    }
  },

  renderBase: function() {
    this.$el.append(
      this.header = H6(),
      this.list = DIV()
    );
  }

}),

SieveConfigFrame = View.Base.extend({

  name: 'SieveConfigFrame',

  render: function() {
    var
    attrs = this.model.attributes;

    this.$el.append(
      H5(attrs.index > 0 ? 'Selections in child frame ' + attrs.index : ''),
      (this.includes = new SieveLocators({
        model: attrs.includes,
        parent: this,
        op: 'INCLUDE'
      }).render()).el,
      (this.excludes = new SieveLocators({
        model: attrs.excludes,
        parent: this,
        op: 'EXCLUDE'
      }).render()).el
    );
    return this;
  }

}),

SieveConfigFrames = View.Collection.extend({

  name: 'SieveConfigFrames',

  addOne: function(model) {

    var view = new SieveConfigFrame({
      model: model,
      parent: this
    });
    this.$list.append(view.render().el);
    return view;
  },

  renderBase: function() {
    // TODO Show frame info
    this.$list = this.$el;
    return this;
  }

}),

SieveConfigPage = View.Base.extend({

  name: 'SieveConfigPage',

  render: function() {
    this.frames = new SieveConfigFrames({
      model: this.model.get('frames'),
      parent: this
    });

    this.$el.append(
      this.frames.render().el
    );

    return this;
  }

}),

SieveConfigPages = View.Collection.extend({

  name: 'SieveConfigPages',

  addOne: function(model) {
    var view = new SieveConfigPage({
      model: model,
      parent: this
    });
    this.$list.append(view.render().el);
    return view;
  },

  renderBase: function() {
    this.$list = this.$el;
  }

}),

// Edits a SieveConfig model object that holds selections for a sieve. 
SieveConfigHTML = View.Base.extend({

  name: 'SieveConfigHTML',

  postInit: function(options) {
    SieveConfigHTML.__super__.postInit.call(this, options);
    this.pages = this.model.get('selections');
    this.viewPages = new SieveConfigPages({
      model: this.pages,
      parent: this
    });

    //console.log('regexp:', this.model.get('regexp'), this.model.toJSON());
    this.regexpEditor = Editor.create('regexp', {
      param: {
        label: 'l_regexp_filter',
        help: 'h_regexp_filter',
        must: false,
        name: 'regexp',
        type: 'regexp'
      },
      label: 'l_regexp_filter',
      parent: this,
      model: this.model,
    });

    this.listenTo(this.pages, 'all', this.renderSummary);
  },

  render: function() {
    this.$el.append(
      this.summary = DIV(),
      this.regexpEditor.render().el,
      this.viewPages.render().el
    );

    this.renderSummary();
    return this;
  },
  
  renderSummary: function() {
    $(this.summary).empty();
    if(this.pages.length == 0) {
      $(this.summary).append(
        // TODO i18n
        'Select elements using visual selector. See tutorial: ',
        A({
          href: 'http://help.distill.io/tutorials/getting-started.html',
          target: '_blank'
          // TODO i18n
        }, 'Getting Started.')
      );
    }
  }

});


return {
  SieveConfigHTML: SieveConfigHTML
};

});
