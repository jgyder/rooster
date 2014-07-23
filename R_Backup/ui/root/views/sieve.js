define(['jquery', 'underscore', 'async', 'domo', 'i18n', 'moment', 'backbone',
  'common/const', 'common/msg', 'common/view', 'common/editor', 'common/rules',
  'common/rect', 'common/overview', 'root/models/base', 'root/models/sieve',
  'root/models/feed', 'root/views/feed', './selector', 'firebase', 'supports'],

function($, _, async, domo, i18n, moment, Backbone, C, Msg, View, Editor, Rules,
  Rect, Overview, ModelBase, Model, ModelFeed, ViewFeed, Selector, Firebase,
  Supports) {

// TODO Move to a config module.
var
URI_FIREBASE = 'https://sieve.firebaseio.com/',

SieveRuleEditor = View.Base.extend({

  postInit: function() {
    // XXX We need to do this since the model is not a backbone model but a
    // simple JSON object.
    this.paramsModel = new Backbone.Model(this.model.rule.params);
  },

  getConfig: function() {
    return {
      type: Rules.TYPE_RULE,
      contentType: this.getContentType(),
      rule: {
        type: this.getRuleType(),
        params: this.getParams()
      }
    }
  },

  getContentType: function() {
    return parseInt(this.selContentType.value);
  },

  getParams: function() {
    var
      keys = _.pluck(this.getRuleDesc().params, 'name'),
      json = this.paramsModel.toJSON();
    return  _.pick.apply(_, [json].concat(keys));
  },

  getRuleDesc: function() {
    return _.findWhere(Rules.DescList, { type: this.getRuleType() });
  },

  getRuleType: function() {
    return parseInt(this.selRuleType.value);
  },

  onTypeChange: function() {
    this.renderParams();
  },

  render: function() {
    var elParams;

    this.$el.append(
      this.selContentType = SELECT.apply(window,
        _.map(Rules.ContentList, function(item) {
          return OPTION({ value: item.type }, i18n.gettext(item.label))
        })
      ),
      this.selRuleType = SELECT.apply(window,
        _.map(Rules.DescList, function(item) {
          return OPTION({ value: item.type }, i18n.gettext(item.label))
        })
      ),
      elParams = SPAN()
    );

    this.selContentType.value = this.model.contentType;
    this.selRuleType.value = this.model.rule.type;

    this.$elParams = $(elParams);
    this.renderParams();

    $(this.selRuleType).change(this.onTypeChange);

    return this;
  },

  renderParams: function() {
    var
      elParams = this.$elParams,
      model = this.paramsModel,
      desc = this.getRuleDesc();

    if(!desc) throw new Error('Unknown rule desc:' + this.getRuleType());

    elParams.empty();

    var els = _.map(desc.params, function(param) {
      return Editor.create(param.type, {
        param: param,
        parent: this,
        model: model,
        showHelp: false
      }).render().el;
    }, this);
    elParams.append(els);
  }

}),

// Edits a JSON config object
SieveRuleGroupEditor = View.Base.extend({

  name: 'SieveRuleGroupEditor',

  tagName: 'fieldset',

  className: 'xrulegroup',

  postInit: function() {
    this.editors = [];
  },

  addOne: function(config) {
    if(config.type == Rules.TYPE_RULE) {
      this.addRule(config);
    } else if(config.type == Rules.TYPE_RULE_GROUP) {
      this.addRuleGroup(config);
    }
  },

  addEditor: function(editor, isGroup) {
    var btn, wrapper, self = this;

    this.$list.append(wrapper = DIV(
      btn = BUTTON({
        'class': 'btn xbtn-light',
        style: 'vertical-align: top;' + (isGroup ? 'margin-top:13px;' : '' )
      }, I({ 'class': 'icon-trash' })
      ),
      DIV({ 'class': 'inline-block' }, editor.el)
    ));
    $(btn).click(function() {
      editor.remove();
      wrapper.remove();
      self.editors.splice(_.indexOf(self.editors, editor), 1);
    });
    this.editors.push(editor);
  },

  addRule: function(ruleConfig) {
    ruleConfig || (ruleConfig = this.defaultRule());

    var editor = new SieveRuleEditor({
      model: ruleConfig,
      parent: this
    }).render();

    this.addEditor(editor, false);
  },

  addRuleGroup: function(ruleGroupConfig) {
    ruleGroupConfig || (ruleGroupConfig = this.defaultRuleGroup());

    var btn, el, self = this;

    var editor = new SieveRuleGroupEditor({
      model: ruleGroupConfig,
      parent: this
    }).render();

    this.addEditor(editor, true);
  },

  defaultRule: function() {
    return {
      type: Rules.TYPE_RULE,
      contentType: Rules.CONTENT_TYPE_TEXT,
      rule: {
        type: Rules.RULE_HAS_TEXT,
        params: { input: '' }
      }
    }
  },

  defaultRuleGroup: function() {
    return {
      type: Rules.TYPE_RULE_GROUP,
      op: Rules.OP_AND,
      rules: [this.defaultRule()]
    }
  },

  getConfig: function() {
    return {
      type: Rules.TYPE_RULE_GROUP,
      op: parseInt(this.selOp.value),
      rules: _.map(this.editors, function(editor) { return editor.getConfig() })
    }
  },

  onAddClick: function(e) {
    var tag = e.target.getAttribute('tag');
    if(!tag) return;

    if(tag == Rules.TYPE_RULE) {
      this.addRule();
    } else if(tag == Rules.TYPE_RULE_GROUP) {
      this.addRuleGroup();
    } else {
      console.error('onAddClick: Unknown tag:', tag);
    }
    e.preventDefault();
    e.stopPropagation();
  },

  render: function() {
    var list, actions;

    this.$el.append(
      LEGEND(
        i18n.gettext('l_rule_true_if_matches_x') + ' ',
        this.selOp = SELECT(
          OPTION({ value: Rules.OP_AND }, i18n.gettext('l_all')),
          OPTION({ value: Rules.OP_OR }, i18n.gettext('l_any'))
        ),
        ' ' + i18n.gettext('l_x_of_following_rules') + ':',

        actions = DIV({ 'class': 'btn-group xadd-rule right' },
          BUTTON({ 'class': 'btn btn-mini', tag: Rules.TYPE_RULE },
            I({ 'class': 'icon-plus' }),
            sprintf('a_action_object', 'a_add', 'l_rule')),
          BUTTON({ 
            'class': 'btn btn-mini dropdown-toggle',
            'data-toggle': 'dropdown'
          }, SPAN({ 'class': 'caret' })),
          UL({ 'class': 'dropdown-menu', role: 'menu' },
            LI(
              A({
                tag: Rules.TYPE_RULE,
                tabindex: -1,
                href: 'javascript:void 0'
              }, sprintf('a_action_object', 'a_add', 'l_rule'))
            ),
            LI(
              A({
                tag: Rules.TYPE_RULE_GROUP,
                tabindex: -1,
                href: 'javascript:void 0'
              }, sprintf('a_action_object', 'a_add', 'l_rule_group'))
            )
          )
        )
      ),
      list = DIV()
    );
    this.selOp.value = this.model.op;
    $(actions).click(this.onAddClick);

    this.$list = $(list);

    // this.model is json config objet
    _.each(this.model.rules, this.addOne);

    return this;
  }
}),

SieveRulesEditor = View.ActionProvider.extend({

  name: 'SieveRulesEditor',

  actions: {
    'rule discard': { fn: 'action_discard' },
    'rule save':    { fn: 'action_save' }
  },

  callback: null,

  action_discard: function() {
    this.callback();
  },

  action_save: function() {
    var config = this.ruleView.getConfig();
    this.model.set('config', config);
    this.callback(null, this.model);
  },

  postInit: function(options) {
    this.callback = options.callback;
    if(!this.model.isNew()) {
      this.loading = true;
      this.model.fetch({
        success: this.onLoad,
        error: this.onError
      });
    }
  },

  onError: function() {
    this.loading = false;
    this.$body.empty();
    this.$body.append( i18n.gettext('e_req'), ' ', i18n.gettext('h_try_later'));
  },

  onLoad: function() {
    this.loading = false;
    this.renderRules();
  },

  render: function() {
    var body;
    this.$el.append(
      body = DIV({ 'class': 'xpanel-body' }),
      DIV({ 'class': 'form-actions btn-toolbar centered' }, 
        A({ 'class': 'btn btn-primary',
          'data-action': 'rule save' }, i18n.gettext('a_save')),
        A({ 'class': 'btn', 'data-action': 'rule discard' }, 
          i18n.gettext('a_discard')
        )
      )
    );
    this.$body = $(body);
    if(this.loading) {
      this.$body.text(i18n.gettext('l_loading'));
    } else {
      this.renderRules();
    }
    return this;
  },

  renderRules: function() {
    this.$body.empty();
    var view = this.ruleView = new SieveRuleGroupEditor({
      parent: this,
      model: this.model.get('config')
    }).render();
    this.$body.append(view.el);
  }

}),

SieveActionEditor = View.Base.extend({

  name: 'SieveActionEditor',

  postInit: function() {
    this.listenTo(this.model, 'remove', this.remove);
    this.paramsModel = new Backbone.Model(this.model.get('config'));
    this.listenTo(this.paramsModel, 'change', this.onEditParams);
  },

  onDelete: function() {
    // Remove model from collection. Do not destroy yet.
    this.model.collection.remove(this.model);
  },

  onEditParams: function() {
    //console.log('onEditParams:', this.model);
    this.model.set('config', this.paramsModel.toJSON());
  },

  render: function() {with(domo) {
    var
      desc = this.model.desc,
      paramsEl;

    this.$el.append( paramsEl = DIV({}))
      .css({ position: 'relative', overflow: 'visible' });

    if(!desc.single) {
      this.$el.append(
        SPAN({ 'class': '', style: '' },
          del = A({
            'class': 'btn icon-trash xbtn-light',
            href: 'javascript:void 0',
            title: i18n.gettext('h_del_action')
          })
        )
      )
      del.onclick = this.onDelete;
    }


    this.paramEditors = _.map(desc.params, function(param) {
      var paramEditor = Editor.create(param.type, {
        param: param,
        parent: this,
        model: this.paramsModel,
        showHelp: false
      });

      paramsEl.appendChild(paramEditor.render().el);

      if(!param.must) {
        // TODO Lazy load instead?
        //paramEditor.$el.hide();
      }
      return paramEditor;
    }, this);

    return this;
  }}

}),

SieveActionGroup = View.Base.extend({

  name: 'SieveActionGroup',

  postInit: function(options) {
    this.desc = options.desc;
    this.actions = options.actions;
    // XXX model is a collection
    this.listenTo(this.actions, 'add', this.addOne);
    this.listenTo(this.actions, 'remove', this.onActionRemove);
  },

  addOne: function(action) {
    if(action.desc.type == this.desc.type) {
      var view = new SieveActionEditor({
        model: action,
        parent: this,
        showHelp: false
      }).render();
      this.$list.append(view.el);
    }
  },

  isVoid: function() {
    return this.desc.single || this.desc.params.length == 0;
  },

  onActionRemove: function(action, actionGroup) {
    if(this.actions.where({ type: this.desc.type }).length == 0) {
      this.remove();
    }
  },

  onDelete: function() {
    var action, actions = this.actions.where({ type: this.desc.type });
    _.each(actions, function(action) {
      this.actions.remove(action);
    }, this);
  },

  /*
  onAddAction: function() {
    this.actions.add(new Model.SieveAction[this.desc.type]);
  },
  */

  render: function() {with(domo) {
    var desc = this.desc, del;

    this.$list = $(DIV({ style: 'margin-left: 30px' }));

    if(desc.single) {
      this.$el.append(
        SPAN({ 'class': '', style: '' },
          del = A({
            'class': 'btn icon-trash xbtn-light',
            href: 'javascript:void 0',
            title: i18n.gettext('h_del_action')
          })
        )
      )
      del.onclick = this.onDelete;
    }

    this.$el.append(
      SPAN({ style: '' },
        SPAN(i18n.gettext(desc.label) ),
        this.$list[0]
      )
    ).css({
      overflow: 'auto',
      position: 'relative'
    });

    this.actions.each(this.addOne);
    return this;
  }}
}),

SieveActionsEditor = View.ActionProvider.extend({

  name: 'SieveActionsEditor',

  postInit: function(options) {
    this.actionGroups = {};
    this.dels = [];

    this.sieve = options.sieve;
    this.actions = new Model.SieveActions(null, { parent: this.sieve });

    if(this.sieve.isNew()) {
      _.each(Model.SieveActionDescList, function(desc) {
        // Add defalt actions when we are given an empty collection.
        if(desc['default'] && desc.isSupported(Supports)) {
          this.add(new Model.SieveAction[desc.type]());
        }
      }, this.actions);
    } else {
      // Fetch data
      this.actions.fetch();
    }
    this.listenTo(this.actions, 'add', this.addOne);
    this.listenTo(this.actions, 'remove', this.onActionRemove);
    this.listenTo(this.actions, 'reset', this.render);
  },

  addOne: function(action) {
    var
      desc = action.desc,
      type = desc.type;

    if(!this.actionGroups[type]) {
      // Create new view for new desc
      var view = this.actionGroups[type] = new SieveActionGroup({
        actions: this.actions,
        desc: desc, // Action group filters actions based on desc
        parent: this
      }).render();

      this.listenTo(view, 'remove', function() {
        delete this.actionGroups[type];
      }, this);

      this.$list.append(view.el);
    }
  },

  getChanges: function() {
    //console.log('looking for changes in: ', this.actions.toJSON());
    return {
      dels:  this.dels,
      posts: this.getPosts(),
      puts:  this.getPuts()
    }
  },

  getPosts: function() {
    return this.actions.filter(function(action) {
      return action.isNew()
    })
  },

  getPuts: function() {
    return this.actions.filter(function(action) {
      return !action.isNew() && action.hasChanged()
    })
  },

  onAddActionMenuClick: function(e) {
    var
    type = e.target.getAttribute('tag'),
    Type = Model.SieveAction[type];

    if(Type.desc.single && this.actions.where({ type: Type.desc.type }).length > 0) {
      // i18n
      Msg.info('Action already added. Cannot add another.');
      return;
    }

    this.actions.add(new Type(null, {
      parent: this.sieve
    }));
    e.preventDefault();
  },

  onActionRemove: function(action) {
    if(!action.isNew()) {
      this.dels.push(action);
    }
    //DBG && console.log('onActionRemove:', !action.isNew(), action, this.dels);
  },

  render: function() {
    var menu;

    this.reset();

    this.$list = $(DIV());
    this.$el.empty().append(
      DIV(
        this.$list[0]
      ),
      DIV({ style: 'position: relative;margin-top:10px;' },
        A({
          id: 'menu_add_action',
          'class': 'dropdown-toggle',
          'data-toggle': 'dropdown',
          href: 'javascript:void 0'
        }, i18n.gettext('a_add_action')/*, ' ', B({ 'class': 'caret' })*/),
        menu = UL({
          'class': 'dropdown-menu',
          role: 'menu',
          'aria-labelledby': 'menu_add_action'
        })
      )
    );
    _.each(Model.SieveActionDescList, function(desc) {
      if(desc.isSupported(Supports)) {
        menu.appendChild(LI(
          A({ tag: desc.type, tabindex: -1, href: 'javascript:void 0' }, i18n.gettext(desc.label))
        ));
      }
    });
    $(menu).click(this.onAddActionMenuClick);
    this.actions.each(this.addOne);
    return this;
  },

  reset: function() {
    // Remove all child views
    _.each(this.actionGroups, function(view) {
      view.remove();
    });
    this.actionGroups = {};
    this.dels = [];
  }

}),

SieveScheduleEditor = View.ActionProvider.extend({

  name: 'SieveScheduleEditor',

  // Convert model vaue to slider value
  convertToSlider: function(v) {
    return Math.log(v); 
  },

  // Convert slider vaue to model value
  convertToModel: function(v) {
    return Math.round(Math.pow(Math.E, v)); 
  },

  getSliderValue: function() {
    return this.convertToModel(this.$slider.val());
  },

  postInit: function() {
  },

  render: function() {
    var schedule = this.model.get('schedule');
    var params = schedule.get('params');

    this.$el.empty().append(
      this.slider = INPUT({
        style: 'width: 360px',
        value: this.convertToSlider(params.get('interval'))
      }),
      this.preview = SPAN()
    );
    this.$slider = $(this.slider).slider({
      min: 1.6,   // Math.log(10)
      max: 14.78, // Math.log(3600 * 24 * 30)
      step: .1,
      tooltip: 'hide',
      value: this.convertToSlider(params.get('interval'))
    });

    this.$slider.on('slide', this.updateValue)
      .on('slideStop', this.updateModel);

    this.updateValue();

    return this;
  },

  updateModel: function() {
    // XXX Very often value set on stop is different (slider!). Do not edit now.
    //this.updateValue();

    // XXX Always get schedule ref from model since it can change later
    var schedule = this.model.get('schedule');
    this.model.trigger('change');
    this.model.trigger('change:schedule', schedule);
  },

  updateValue: function() {
    var
    seconds = this.getSliderValue(),
    schedule = this.model.get('schedule'),
    params = schedule.get('params');

    params.set('interval', seconds);
    $(this.preview).text(schedule.getShortDisplayText());
  }

}),

SieveSourceEditor = View.ActionProvider.extend({

  name: 'SieveSourceEditor',

  actions: {
    'selector config show': {
      fn: 'action_config_show'
    },
    'selector edit': {
      fn: 'action_selector_edit'
    },
  },

  action_config_show: function() {
    var
    model = this.model,
    view = Editor.create('json', {
      param: {
        label: 'l_selection_config',
        showLabel: false,
        must: false,
        name: 'config',
        type: 'json'
      },
      parent: this,
      model: new Backbone.Model({
        config: model.get('config').toJSON()
      })
    }),

    modal = new View.SaveDiscardModal({
      name: 'SieveOptions$ConfigModal',
      // Add to appropriate parent to have action context with priority
      parent: this,
      top: this.$el.offset().top - 20,
      width: 600,
      title: gettext('l_selection_config'),
      view: view
    });
    modal.show();
    modal.on('save', function() {
      var
      config = view.model.get('config'),
      uri = config.selections.length > 0 ? config.selections[0].uri : null;

      model.set({
        config: new Model.SieveConfigHTML(config, {
          parse: true
        }),
        uri: uri
      });
      modal.remove();
    });
    modal.on('discard', function() {
      modal.remove();
    });
    view.$el.find('textarea').css('height', 300);
  },

  action_selector_edit: function() {
    this.selectorModal = new Selector.Modal({
      callback: this.onSelectorSave,
      model: this.model.clone(),
      parent: this
    });

    this.selectorModal.show();
  },

  onSelectorSave: function(err, model) {
    //console.log('onSelectorSave:', err, model);

    if(err) {
      // TODO Show error to user that it failed
    } else if(!model) {
      // When selector is discarded for a new model, discard options view too.
      if(this.model.isNew() && this.model.isEmpty()) {
        this.parent.action_discard();
      }
    } else {
      this.model.set(model.pick('uri', 'name', 'config', 'content_type'));
      this.selectorModal.remove();
    }
  },

  postInit: function() {
    if(this.model.isEmpty()) {
      _.defer(this.action_selector_edit);
    }
    this.listenTo(this.model, 'change:config', this.render);
  },

  render: function() {
    var type = this.model.get('content_type');
    if(type == C.TYPE_HTML) {
      this.render_HTML();
    } else {
      this.render_FEED();
    }
    return this;
  },

  render_HTML: function() {
    this.$el.empty().append(
      A({
        'class': 'btn',
        'data-action': 'selector edit',
        'title': i18n.gettext('h_selector_edit')
      }, i18n.gettext('a_visual_selection')+' '),
      ' [',
      SPAN((this.model.getExcludes().length+
        this.model.getIncludes().length)+' selection'),
      ', ',
      A({ 
        'data-action': 'selector config show',
        href: 'javascript:void 0'
      }, i18n.gettext('h_config_show')),
      ']'
    )
  },

  render_FEED: function() {
    var config = this.model.get('config');
    this.$el.empty().append(
      SPAN(config.get('uri'))
    )
  }

}),

TagDeleter = View.Base.extend({

  name: 'TagsEditor',

  tagName: 'span',

  className: '',

  render: function() {
    var
    self = this,
    i;

    this.$el.append({},
      SPAN({ 'class': 'label label-info xlabel'}, this.model.get('name')),
      i = I({
        'class': 'icon-remove label label-inverse xlabel',
        style: 'margin-left: -4px;font-weight:100;'
      })
    );
    $(i).click(function() {
      self.trigger('delete', self.model);
      self.remove();
    });
    return this;
  }
}),

TagsEditor = View.Base.extend({

  name: 'TagsEditor',

  delTag: function(tag) {
    this.tags = _.without(this.tags, tag);
    this.model.set('tags', _.pluck(this.tags, 'id').join(','));
  },

  postInit: function() {
    this.tags = this.model.getTags(App.labels);
  },

  render: function() {
    var self = this;

    this.$el.append(_.map(this.tags, function(tag) {
      var tagDeleter = new TagDeleter({
        parent: self,
        model: tag
      });
      self.listenTo(tagDeleter, 'delete', self.delTag);
      return tagDeleter.render().el;
    }));
    return this;
  }

}),

SieveOptions = View.ActionProvider.extend({

  name: 'SieveOptions',

  actions: {
    'sieve discard': {
      fn: 'action_discard'
    },
    'sieve save': {
      fn: 'action_save'
    }
  },

  /* @sandeep this functions discards the options config box */
  action_discard: function() {
    this.options.callback();
  },

  action_save: function() {
    var self = this;

    Msg.start('sieve:save', { info: 'saving' });

    var changes = self.actionEditor.getChanges();

    async.series([

      // Sync to /sieves so that the model has appropriate ids setup if its new.
      function(callback) {
        // Save changes to name
        self.model.save(null, {
          silent: true,
          wait: true,
          error: function() {
            Msg.stop('sieve:save', { error: 'Failed to save changes to server' });
            callback({ msg: '' });
          },
          success: function(model) {
            Msg.stop('sieve:save');
            callback(null);
          }
        })
      },

      // Sync to /sieves/:sieve_id/actions
      function(callback) {
        //console.log('syncing changes:', changes);
        if(!ModelBase.syncBatch(changes, callback)) {
          callback();
        }
      }
    ], function(err, results) {
      //DBG && console.log('action_save results:', results);
      self.options.callback(err, self.model);
    });

  },

  onEditRule: function(e) {
    this.editRuleModal = new View.Modal({
      name: 'SieveOptions$RuleModal',
      parent: this,
      top: this.parent.$el.offset().top - 20,
      width: 860,
      title: 'l_condition',
      view: new SieveRulesEditor({
        callback: this.onRulesCallback,
        model: new Model.SieveRule({
          id: this.model.get('rule_id') || undefined
        }),
        parent: this
      })
    });
    this.editRuleModal.show();
    e.preventDefault();
  },

  onRulesCallback: function(err, rule) {
    if(err) {
      console.error('error in rule popup:', err);
      Msg.error('Programming error while fetching data from rules popup:' + err);
    } else if(rule) {
      var self = this;
      Msg.start('sieve:rule:save', { info: 'l_loading' });
      rule.save(null, {
        error: function() {
          Msg.stop('sieve:rule:save', { error: 'e_req' });
        },
        success: function(rule) {
          Msg.stop('sieve:rule:save');
          self.model.set({ rule_id: rule.id });
          self.editRuleModal.remove();
        }
      });
    } else {
      this.editRuleModal.remove();
    }
  },

  postInit: function() {
    this.actionEditor = new SieveActionsEditor({
      sieve: this.model,
      parent: this
    }).render();

    this.sourceEditor = new SieveSourceEditor({
      model: this.model,
      parent: this,
      className: 'controls'
    }).render();

    this.scheduleEditor = new SieveScheduleEditor({
      model: this.model,
      parent: this
    }).render();

    this.nameEditor = Editor.create('text', {
      model: this.model,
      param: {
        label: 'l_name',
        must: true,
        name: 'name',
        showLabel: false,
        type: 'text'
      },
      parent: this
    }).render();

    this.tagsEditor = new TagsEditor({
      model: this.model,
      parent: this
    }).render();
  },

  remove: function() {
    this.selectorModal && this.selectorModal.remove();
    View.ActionProvider.prototype.remove.call(this);
  },

  render: function() {
    var tags = this.model.getTags(App.labels);
    this.$el.empty().append(
      DIV({ 'class': 'form-horizontal' },
        DIV({ 'class': 'control-group' }, 
          LABEL({ 'class': 'control-label' }, gettext('l_source')),
          this.sourceEditor.el
        ),
        DIV({ 'class': 'control-group' }, 
          LABEL({ 'class': 'control-label', 'for': 'sieve-name' },
            i18n.gettext('l_name')
          ),
          DIV({ 'class': 'controls' }, this.nameEditor.el)
        ),
        DIV({ 'class': 'control-group' }, 
          LABEL({ 'class': 'control-label', 'for': 'sieve-name' },
            i18n.gettext('l_schedule')
          ),
          DIV({ 'class': 'controls' },
            this.scheduleEditor.el
          )
        ),
        DIV({ 'class': 'control-group' }, 
          LABEL({ 'class': 'control-label' },
            i18n.gettext('l_actions')
          ),
          DIV({ 'class': 'controls' },
            editRule = A({ href: '#' },
              sprintf('a_action_object', 'a_edit', 'l_rule')),
            this.actionEditor.el
          )
        ),
        tags.length > 0 ?
        DIV({ 'class': 'control-group' }, 
          LABEL({ 'class': 'control-label' },
            i18n.gettext('l_label')
          ),
          DIV({ 'class': 'controls' },
            this.tagsEditor.el
          )
        )
        :
        DIV(),
        DIV({ 'class': 'form-actions btn-toolbar' }, 
          A({ 'class': 'btn btn-primary',
            'data-action': 'sieve save' }, i18n.gettext('a_save')),
          A({ 'class': 'btn', 'data-action': 'sieve discard' }, 
            i18n.gettext('a_discard')
          )
        )
      )
    );
    $(editRule).click(this.onEditRule);
    return this;
  }

}),

SievFeedView = View.Base.extend({

  name: 'SievFeedView',

  toggle_diff: function() {
    alert('Diff for RSS feed will be available soon. Get in touch at ' +
      'ajit@distill.io to send us your feedback.');
  },

  postInit: function() {
    var feedJSON = JSON.parse(this.model.get('data'));
    this.feed = new ModelFeed.Feed(feedJSON, { parse: true });
  },

  render: function() {
    this.$el.append(
      new ViewFeed.FeedEntryList({
        model: this.feed.get('entries'),
        parent: this
      }).render().el
    );
    return this;
  }
}),

SieveHTMLView = View.Base.extend({
  name: 'SieveHTMLView',

  attributes: {
    // XXX about:blank doesn't work in IE
    src: window.IE ? "javascript:document.write('<script>document.open();document.domain=\""+document.domain+"\";document.close();</script>')" : 'about:blank',
    frameborder: 0,
    width: '100%',
    height: 100
  },

  tagName: 'iframe',

  fetchAndShowDiff: function() {
    console.log('fetchAndShowDiff');
    var
    self = this,
    model = this.model, tmpCollection = new Model.SieveDataPager(null, {
      parent: this.modelCollection.parent
    });

    Msg.start('fetch', { info: 'l_loading' });
    tmpCollection.fetch({
      data: {
        'ts.lt': model.get('ts'),
        _opt: { limit: 1 }
      },
      error: function(err) {
        console.error('Error getting older sibling', err);

        Msg.stop('fetch', { error: 'e_req' });
      },
      success: function() {
        console.log('Fetched older sibling', tmpCollection);

        Msg.stop('fetch');
        if(tmpCollection.length == 1) {
          self.showDiff(tmpCollection.at(0));
        } else {
          Msg.info('m_sieve_data_na');
        }
      }
    });
  },

  toggle_diff: function() {
    this.showingDiff = !this.showingDiff;
    if(this.showingDiff) {
      this.fetchAndShowDiff()
   } else {
      this.onFrameLoad();
    }
  },

  postInit: function() {
    this.showingDiff = false;
    this.el.onload = this.onFrameLoad;
    this.modelCollection = this.model.collection;
  },

  onFrameLoad: function() {
    this.renderHTML(this.model.get('data'));
  },

  renderHTML: function(html) {
    var
    self = this,
    id = this.model.id,

    host = this.el,
    win = host.contentWindow,
    doc = win.document,
    el = doc.documentElement,
    body,
    base =  doc.createElement('base'),
    // Find baseURI
    baseURIMatch =  html.match(/<base\s*href=\"(.*?)\"/),
    baseURI = baseURIMatch && baseURIMatch[0],
    syncIntervalId;

    baseURI && base.setAttribute('href', baseURI);
    doc.head.appendChild(base);

    // Strip html tags for IE
    html = html.match(/^<html.*?>([\s\S]*)<\/html>$/)[1];
    window.IE ? $(el).html(html) : (el.innerHTML = html);
    async.map($(el).find('link[rel=stylesheet]').toArray(), function(link, callback) {
      var img = doc.createElement('img');
      img.onerror = function() { callback(); }
      img.src = link.href;
    }, function(err, res) {
      syncIntervalId = setInterval(function syncSize() {
        try {
          if(!win || !win.document) {
            clearInterval(syncIntervalId);
            return;
         }
          var
          iframeRoot = body || doc.documentElement;
          height = Math.max(el.scrollHeight, iframeRoot.scrollHeight),
          width = Math.max(el.scrollWidth, iframeRoot.scrollWidth);
          if(height > win.innerHeight) {
            host.height = height;
          }
          if(width > win.innerWidth) {
            host.width = width;
          }
          nSyncs += 1;
          if(nSyncs > 10) clearInterval(syncIntervalId);
        } catch(e) {
          clearInterval(syncIntervalId);
          throw e;
        }
      }, 100);
    });
    body = doc.body;
    //$(el).find('host,frame').remove();
    //$(el).css('overflow-y', 'hidden');

    setTimeout(function show() {
      self.$('span').css({left: 0, position: 'relative'});
      $(el).find('a[href]').attr('target', '_blank');
    }, 200);

    var nSyncs = 0;


  },

  showDiff: function(oldModel) {
    var self = this, model = this.model;

    //console.log('comparing:', model.id, oldModel.id);
    Msg.start('diff', { info: 'l_loading' });
    require(['htmldiff'], function(htmldiff) {
      var
      html = model.get('data'),
      oldHtml = oldModel.get('data'),
      diff = htmldiff(oldHtml, html);
      diff = diff.replace(/<ins/g, '<ins style="background-color:#8f7"');
      self.renderHTML(diff);
      Msg.stop('diff');
    });
  }

}),

SieveDataView = View.Base.extend({

  name: 'SieveDataView',

  className: 'xsieve-data-item',

  postInit: function() {
    this.listenTo(this.model, 'change', this.render);
    this.listenTo(this.model, 'destroy', this.remove);
  },

  render: function() {
    var btnDiff, view, type = this.model.get('data_type');

    switch(type) {
      case C.TYPE_HTML:
      view = new SieveHTMLView({
        parent: this,
        model: this.model
      });
      break;

      case C.TYPE_FEED:
      view = new SievFeedView({
        parent: this,
        model: this.model
      });
      break;

      default:
      view = new Backbone.View({
        el: SPAN('ERR! Unknown data tyep: ' + type)
      })
      break;
    }
    this.$el.empty().append(
      DIV({ 'class': 'xtbar', style: 'border-top: solid 1px #ddd' },
        B(formatTime(this.model.get('ts_mod'))),
        btnDiff = BUTTON({
          'class': 'btn btn-mini pull-right',
        }, i18n.gettext('a_toggle_changes'))
      ),
      DIV(view.render().el)
    );
    this.$('span').css({ position: 'relative', left: 10000});

    btnDiff.onclick=function() {
      view.toggle_diff();
    };

    this.view = view;

    return this;
  }
}),

Work = View.Base.extend({
  name: 'Work',

  render: function() {
    var
    attrs = this.model.attributes,
    err = attrs.err;

    if(err) {
      this.$el.append(
        SPAN(formatTime(attrs.ts)),
        '  ',
        SPAN('ERR'),
        ':',
        SPAN(err.code||''),
        '-',
        SPAN(err.msg||err.message||err)
      ).addClass('error');
    } else {
      this.$el.append(
        SPAN(formatTime(attrs.ts))
      ).addClass('success');
    }
    return this;
  }

}),

Works = View.Collection.extend({
  name: 'Works',

  postInit: function() {
    this.collection.fetch();
    this.collection.on('sync', this.onSync);
  },

  addOne: function(model) {
    var view = new Work({
      model: model,
      parent: this
    });
    this.$list.append(view.render().el);
    return view;
  },

  onSync: function() {
    if(this.collection.length == 0) {
      this.$el.text(gettext('m_log_na'));
    }
  },

  renderBase: function() {
    this.$list = this.$el;
  }


}),

/*
 * The view with history.
 */
SieveDetail = View.ActionProvider.extend({

  name: 'SieveDetail',

  className: 'xview',

  actions: {
    'sieve edit': {
      fn: 'action_edit'
    },
    'sieve more data': {
      fn: 'action_more'
    },
    'sieve view close': {
      fn: 'action_close'
    }

  },

  action_close: function() {
    this.parent.route();
  },

  action_edit: function() {
    this.parent.editModel(this.model);
  },

  action_more: function() {
    var
      self = this,
      $btn = this.$('[data-action="sieve more data"]'),
      $msg = self.$('.xmsg');

    $btn.button('loading');
    $msg.find('.info > span').text('__');
    this.dataCollection.nextPage({
      error: function() {
        reset();
      },
      success: function() {
        reset();
        $msg.removeClass('hide')
          .find('.info > span').text(self.dataCollection.length);
      }
    });
    function reset() { $btn.button('reset') }
  },

  fetchData: function() {
    Msg.start('sieve:data:fetch', { info: 'l_loading' });
    this.dataCollection.pager({
      error: function() {
        Msg.stop('sieve:data:fetch', { error: 'err:sieve:data:fetch' });
      },
      success: function() {
        Msg.stop('sieve:data:fetch');
      }
    });
  },

  postInit: function(options) {
    this.dataCollection = new Model.SieveDataPager(null, {
      parent: this.model
    });

    this.listenTo(this.model, 'change:name', this.renderBase);
    this.listenTo(this.model, 'change:ts_data', this.resetData);
    this.listenTo(this.dataCollection, 'add', this.renderDataAdd)
    this.listenTo(this.dataCollection, 'reset', this.renderData)

    this.fetchData();
  },

  remove: function() {
    View.ActionProvider.prototype.remove.call(this);
  },

  render: function() {
    with(domo) {
      var
        header = HEADER(),
        data = DIV(CLS('xsieve-data')),
        actionMsg = DIV(CLS('xmsg centered hide'), 
          SPAN(CLS('info'), 'Showing ', SPAN(), ' more items.')
        ),
        actions = DIV(CLS('form-actions btn-toolbar centered'),
          BUTTON({
            'class': 'btn ',
            'data-action': 'sieve more data'
          }, i18n.gettext('Show More')),
           BUTTON({
            'class': 'btn ',
            'data-action': 'sieve view close'
          }, i18n.gettext('Close'))
        );

      this.$el.append(DIV({ 'class': 'xview-body' }, header, data), actionMsg, actions);
      this.$header = $(header);
      this.$data = $(data);
    }

    this.renderBase();
    this.renderData();
    return this;
  },

  renderBase: function() {
    var attrs = this.model.attributes,
      ts = formatTime(attrs.ts);
    with(domo) {
      this.$header.empty().append(
        H3(
          A({ href: attrs.uri || '#', target:'_blank' }, attrs.name),
          ' ',
          A({
            'class': 'right',
            'data-action': 'sieve edit',
            href: 'javascript:void 0',
            title: sprintf('a_action_object', 'a_edit', 'l_options')
          }, I({ 'class': 'icon-edit' }))
        )
      );
    }
    return this;
  },

  renderData: function() {
    this.dataCollection.each(this.renderDataAdd);
  },

  renderDataAdd: function(model) {
    this.$data.append(new SieveDataView({
      model: model,
      parent: this
    }).render().el);
  },

  resetData: function() {
    var
      self = this;

    this.dataCollection.goTo(0, {
      silent: true,
      success: function() {
        self.removeChildren();
        self.renderData();
      }
    });
  }

}),

SieveRow = View.Base.extend({

  className: 'xitem',

  tagName: 'li',

  postInit: function(options) {
    this.listenTo(this.model, 'change', this.renderRow);
    this.listenTo(this.model, 'destroy', this.remove);
    this.listenTo(this.model, 'remove', this.remove);
    this.listenTo(this.model, 'sync', this.onSync);

    this.trackSieve();
  },

  isSelected: function() {
    return this.checkbox && this.checkbox.checked;
  },

  markRead: function() {
    if(!this.model.isRead()) {
      this.model.save({
        tags: this.model.getTags(App.labels).join(','),
        'ts_view': dateToDBFormat(new Date())
      }, { patch: true });
    }
  },

  onSync: function() {
    this.render();
    if(this.parent.getSortField() == '-ts_data') {
      this.model.collection.sort();
    }
  },

  remove: function() {
    SieveRow.__super__.remove.call(this);
    this.firebase.off();
  },

  removeDetail: function() {
    this.$el.removeClass('active');
    this.detail && this.detail.remove();
    delete this.detail;
  },

  render: function() {
    this.renderRow();
    this.detail && this.showDetail(this.detail);
    this.setSelected(this.isSelected());
    return this;
  },

  renderRow: function() {
    var
    model = this.model,
    id = model.id,
    attrs = model.attributes,
    ts_text = formatTime(attrs.ts_data, true) || '',
    // FIXME There is no way to identify the reason for empty text?
    text = attrs.config ?
      (attrs.text != null ?
        (attrs.text || ('<'+i18n.gettext('h_sieve_empty')+'>'))
        :
        '<'+i18n.gettext('h_sieve_new')+'>'
      )
      :
      '<'+i18n.gettext('h_sieve_no_config')+'>',
    aLink,
    el =  DIV( { 'class': 'row-fluid xrow', 'data-action': 'sieve view',
        'data-action-param': '$parents [data-id]@data-id'},

      SPAN({ 'class': 'span1' },
        // data-action: void 0 is to mark this child as action provider
        LABEL({ 'class': 'checkbox pull-left', 'data-action': 'void 0' },
          this.checkbox = INPUT({ type: 'checkbox' })
        ), ' ',
        BUTTON({ 'class': 'btn btn-mini xbtn-light',
          style: 'margin: 0;',
          'data-action': 'sieve context menu',
          'data-action-param': '$parents [data-id]@data-id' },
          I({ 'class': 'icon-large icon-caret-down' })
        )
      ),

      DIV({ 'class' : 'span11 xcontent' },

        SPAN({ 'class': 'row-fluid' },
          SPAN({ 'class': 'span3 nowrap', style: 'overflow: hidden' },
            aLink = A({ href: attrs.uri||'#', target: '_blank' },
              //I({ 'class': 'icon-external-link small', style: 'font-size:75%' }),
              //' ',
              attrs.name || 'Untitled'/*TODO i18n*/
            ),
            DIV(
              _.map(model.getTags(App.labels), function(tag) {
                return SPAN({
                  'class': 'label label-info xlabel xlabel-small'
                }, tag.get('name'))
              })
            )
          ),
          SPAN({ 'class': 'span7' }, text),
          A({
            'class': 'span1',
            'data-action': 'sieve schedule menu',
            'data-action-param': '$parents [data-id]@data-id'
          }, SMALL(model.get('schedule').getShortDisplayText())),
          A({
            'class': 'span1',
            'data-action': 'sieve log menu',
            'data-action-param': '$parents [data-id]@data-id'
          }, this.elTs = SMALL(ts_text))
        )
      )
    );
    aLink.onclick = this.markRead;
    $(this.el.children[0]).remove();
    this.$el.prepend(el);

    if(this.model.isRead()) {
      this.$el.addClass('xfade').removeClass('xunread');
    } else {
      this.$el.addClass('xunread').removeClass('xfade');
    }
  },

  setSelected: function(selected) {
    this.checkbox.checked = selected;
  },

  showDetail: function(view) {
    this.listenTo(view, 'remove', function() {
      if(this.detail == view) {
        delete this.detail;
        this.removeDetail();
      }
    }, this);
    this.detail = view;
    this.$el.addClass('active');
    if(!view.el.parentNode) {
      this.$el.append(view.el);
    }

    // Check and mark the view as read after it is closed
    view.listenTo(view, 'remove', this.markRead);
  },

  trackSieve: function () {
    var self = this;

    this.firebase = this.parent.firebase.child(this.model.id);
    this.firebase.on('value', function(snap) {
      //console.log('trackSieve:', snap.val());

      var e = snap.val();
      switch(e.rel) {
        case 'sieve_data':
        self.model.fetch();
        break;

        case 'sieves':
        self.model.set(self.model.parse(e.doc), { silent: true });
        self.model.trigger('change');
        break;

        case 'events':
        if(e.doc.state == C.RUN_STATE_WAIT) {
          self.elTs.textContent = 'Waiting';
        } else if(e.doc.state == C.RUN_STATE_WIP) {
          self.elTs.textContent = 'Checking';
        } else {
          self.elTs.textContent = formatTime(self.model.get('ts_data'), true);
        }
        break;
      }
    });
  }

}),

LogMenu = View.Dropdown.extend({

  name: 'LogMenu',

  onSync: function() {
    this.show();
  },

  postInit: function(options) {
    this.collection = this.options.collection
  },

  renderMenu: function() {
    var model = this.collection.get(this.id);

    if(!model) {
      this.$el.text('Model not found:' + this.id);
      return this;
    }

    var works = new Model.Works(null, { parent: model });

    this.$el.empty().append(
      LI({ 'class': 'xview' },
        I(gettext('l_changed_on')),
        SPAN(formatTime(model.get('ts_data'))),
        I(gettext('l_check_log')),
        new Works({
          parent: this,
          collection: works
        }).render().el
      )
    )

    this.listenTo(works, 'sync', this.onSync);
  }

}),

ScheduleMenu = View.Dropdown.extend({

  name: 'ScheduleMenu',

  postInit: function(options) {
    this.collection = this.options.collection
  },

  onScheduleChange: _.debounce(function() {
    var model = this.collection.get(this.id);
    Msg.start('save', 'l_loading');
    model.save(null, {
      data: {
        schedule: JSON.stringify(model.get('schedule')),
        patch: true
      },
      error: function() {
        Msg.stop('save', { error: 'e_req' });
      },
      success: function() {
        Msg.stop('save', { info: 'Saved changes to schedule' });  // TODO i18n
      }
    });
  }, 300),

  renderMenu: function() {
    var model = this.collection.get(this.id);

    if(!model) {
      this.$el.text('Model not found:' + this.id);
      return this;
    }

    this.scheduleEditor = new SieveScheduleEditor({ model: model, parent: this });
    this.$el.empty().append(
      LI({ 'class': 'xview' },
        I(gettext('l_schedule')),
        this.scheduleEditor.render().el
      )
    );

    this.listenTo(model, 'change:schedule', this.onScheduleChange);
  }

}),

SieveContextMenu = View.Dropdown.extend({

  name: 'SieveContextMenu',

  actions: {
    'menu check changes': {
      fn: 'action_check_for_changes'
    },
    'menu del': {
      fn: 'action_del'
    },
    'menu del permanent': {
      fn: 'action_del_permanent'
    },
    'menu edit more': {
      fn: 'action_edit_more'
    }
  },

  action_check_for_changes: function() {
    var ids = [this.id];
    require(['service'], function(Service) {
      Service.service.checkNow(ids);
    });
    this.hide();
  },

  action_del: function() {
    var
    self = this,
    model = this.collection.get(this.id);

    Msg.start('discard', 'l_loading');
    model.save('state', C.STATE_DISCARD, {
      patch: true,
      error: function() {
        Msg.stop('discard', { error: 'e_req' });
      },
      success: function() {
        model.collection.remove(model);
        Msg.stop('discard');
        self.hide();
      }
    });
  },

  action_del_permanent: function() {
    var
    self = this,
    model = this.collection.get(this.id);

    Msg.start('destroy', 'l_loading');
    model.destroy({
      error: function() {
        Msg.stop('destroy', { error: 'e_req' });
      },
      success: function() {
        Msg.stop('destroy');
        self.hide();
      }
    });
  },

  action_edit_more: function() {
    this.parent.editModel(this.collection.get(this.id));
    this.hide();
  },

  onActionAdd: function(model) {
    if(model.id) return;  // Exising model add after fetch

    Msg.start('save', 'm_saving');
    model.save(null, {
      error: function() {
        Msg.stop('save', { error: 'e_req' });
      },
      success: function() {
        Msg.stop('save', { info: 'Saved new action'  });  // TODO i18n
      }
    });
  },

  onActionChange: function(model) {
    if(!model.id) return;  // Ignore newly added model, 

    Msg.start('save', 'm_saving');
    model.save(null, {
      silent: true,
      error: function() {
        Msg.stop('save', { error: 'e_req' });
      },
      success: function() {
        Msg.stop('save', { info: 'Saved changes to action'  });  // TODO i18n
      }
    });
  },

  onActionRemove: function(model) {
    if(!model.id) return;  // Ignore newly added model, 

    Msg.start('save', 'm_saving');
    model.destroy({
      error: function() {
        Msg.stop('save', { error: 'e_req' });
      },
      success: function() {
        Msg.stop('save', { info: 'Deleted action'  });  // TODO i18n
      }
    });
  },

  postInit: function(options) {
    this.collection = this.options.collection
  },

  renderMenu: function() {
    var model = this.collection.get(this.id);

    if(!model) {
      this.$el.text('Model not found:' + this.id);
      return this;
    }

    this.actionEditor = new SieveActionsEditor({ sieve: model, parent: this });

    this.$el.empty();
    if(Supports.agents.local) {
      this.$el.append(
        LI(A({ 'data-action': 'menu check changes' }, gettext('a_check_changes')))
      );
    }
    this.$el.append(
      LI(A({ 'data-action': 'menu edit more'}, gettext('a_edit_options'))),
      LI({ 'class': 'divider' }),
      LI({ 'class': 'xview' },
        I(gettext('l_actions')),
        this.actionEditor.render().el
      ),
      LI({ 'class': 'divider' }),
      LI(A({ 'data-action': 'menu del'}, gettext('a_move_to_trash'))),
      LI(A({ 'data-action': 'menu del permanent'}, gettext('a_del_permanent')))
    )

    this.listenTo(this.actionEditor.actions, 'add', this.onActionAdd);
    this.listenTo(this.actionEditor.actions, 'change', this.onActionChange);
    this.listenTo(this.actionEditor.actions, 'remove', this.onActionRemove);
  }

}),

SievesListDropdown = View.Dropdown.extend({

  name: 'SievesDropdown',

  postInit: function(options) {
  },

  onScheduleChange: _.debounce(function() {
    var model = this.collection.get(this.id);
    Msg.start('save', 'm_saving');
    model.save(null, {
      data: {
        schedule: JSON.stringify(model.get('schedule')),
        patch: true
      },
      error: function() {
        Msg.stop('save', { error: 'e_req' });
      },
      success: function() {
        Msg.stop('save', { info: 'Saved changes to schedule' });  // TODO i18n
      }
    });
  }, 300),

  renderMenu: function() {
    var self = this;

    this.$el.empty().append(
      LI({ 'class': 'xview' },
        DIV(
          LABEL('Sort by:'),
          this.selSort = SELECT(
            OPTION({ value: '-ts_data'}, 'Time last changed on'),
            OPTION({ value: 'name'}, 'Name')
          )
        )
      ),
      LI({ 'class': 'xview' },
        DIV(
          LABEL('Page Size:'),
          this.selPageSize = SELECT(
            OPTION({ value: 5 }, 5),
            OPTION({ value: 20 }, 20),
            OPTION({ value: 50 }, 50),
            OPTION({ value: 100 }, 100),
            OPTION({ value: 200 }, 200),
            OPTION({ value: 500 }, '500 (could be slow)')
          )
        )
      )
    );

    this.selSort.value = App.store.get('ui.list.sortby') || '-ts_data';
    this.selPageSize.value = App.store.get('ui.list.pagesize') || '50';

    $(this.selSort).change(function() {
      App.store.set('ui.list.sortby', self.selSort.value);
      self.parent.fetchAndShow();
    });

    $(this.selPageSize).change(function() {
      var size = parseInt(self.selPageSize.value);
      App.store.set('ui.list.pagesize', size);
      self.parent.fetchAndShow();
    });

  }

}),

Sieves = View.Entities.extend({

  name: 'Sieves',

  actions: {
    'sieve check for changes': {
      fn: 'action_check_for_changes'
    },
    'sieve context menu': {
      fn: 'action_context_menu'
    },
    'sieve del': {
      fn: 'action_del',
      doc: 'Delete sieve'
    },
    'sieve del permanent': {
      fn: 'action_del_permanent'
    },
    'sieve label apply': {
      fn: 'action_apply_label'
    },
    'sieve list menu': {
      fn: 'action_list_menu'
    },
    'sieve log menu': {
      fn: 'action_log_menu'
    },
    'sieve mark_read': {
      fn: 'action_mark_read',
    },
    'sieve nav next': {
      fn: 'action_next',
    },
    'sieve nav prev': {
      fn: 'action_prev',
    },
    'sieve new': {
      fn: 'action_new',
      doc: 'Create a new sieve'
    },
    'sieve restore': {
      fn: 'action_restore'
    },
    'sieve schedule menu': {
      fn: 'action_schedule_menu'
    },
    'sieve view': {
      fn: 'action_view',
      doc: 'View sieve details'
    }
  },

  events: {
    'click .xtbar > :checkbox':      'event_check'
  },

  ViewClass: SieveDetail,

  action_apply_label: function(id, target) {
    var
    self = this,
    models = this.getSelectedModels();

    Msg.info('l_loading');

    async.each(models, function(model, callback) {
      var tags = model.get('tags');

      if(tags) {
        if(tags.indexOf(id) >= 0) {
          return callback();
        }
        tags += ',' + id;
      } else {
        tags = id;
      }

      model.save('tags', tags, {
        patch: true,
        error: function() {
          callback('e_req');
        },
        success: function() {
          callback()
        }
      });
    }, function(err) {
      if(err) {
        Msg.error('e_req');
      } else {
        Msg.reset();
      }
    });
  },

  action_check_for_changes: function(target) {
    if(!Supports.agents.local) {
      Msg.error('Check cannot be scheduled for web based agent.');
      return;
    }

    var
    self = this,
    models = this.getSelectedModels(),
    ids = _.pluck(models, 'id');

    require(['service'], function(Service) {
      Service.service.checkNow(ids);
    });
  },

  action_context_menu: function(id, target) {
    this.contextMenu || (this.contextMenu = new SieveContextMenu({
      parent: this,
      collection: this.collection
    }));
    // setRef using the anchor element
    this.contextMenu.toggle(id, target.nodeName == 'I' ? target.parentNode : target);
  },

  action_del: function() {
    var
    self = this,
    models = this.getSelectedModels();

    async.map(models, function(model, callback) {
      model.save('state', C.STATE_DISCARD, {
        patch: true,
        error: function() { callback(new Error('sieve:del:err')) },
        success: function() {
          model.collection.remove(model);
          callback();
        }
      });
    }, function(err) {
      if(err) {
        Msg.error('sieve:del:err');
      } else {
        var
        value = models.length,
        msg = i18n.translate('m_del_item')
          .ifPlural(value, i18n.gettext('m_del_items'))
          .fetch(value)
        Msg.info(msg);
        self.route();
      }
    });
    return true;
  },

  action_del_permanent: function() {
    var
    self = this,
    models = this.getSelectedModels();

    async.map(models, function(model, callback) {
      model.destroy({
        error: function() { callback(new Error('sieve:del:err')) },
        success: function() { callback(); }
      });
    }, function(err) {
      if(err) {
        Msg.error('sieve:del:err');
      } else {
        Msg.info('Permanently deleted selected items.');
        self.route();
      }
    });
  },

  action_list_menu: function(param, target) {
    this.listMenu || (this.listMenu = new SievesListDropdown({
      parent: this
    }));
    // setRef using the anchor element
    this.listMenu.toggle('list', target.nodeName == 'I' ? target.parentNode : target);
  },

  action_log_menu: function(id, target) {
    this.logMenu || (this.logMenu = new LogMenu({
      parent: this,
      collection: this.collection
    }));
    // setRef using the anchor element
    this.logMenu.toggle(id, target.nodeName == 'I' ? target.parentNode : target);
  },

  action_new: function() {
    var model = new this.collection.model({
      content_type: C.TYPE_HTML,
      schedule: {
        type: 'INTERVAL',
        params: {
          interval: 1800 // In seconds
        }
      },
      /* Sandeep this is the place to add uri when opening new sieve.
       * uri:"http://www.yahoo.com", */
      version: 1
    }, { parse: true });
    this.editModel(model);
  },

  action_mark_read: function() {
    var
    self = this,
    models = this.getSelectedModels();

    async.map(models, function(model, callback) {
      model.save({
        ts_view: dateToDBFormat(Date.now())
      }, {
        patch: true,
        error: function() { callback(new Error('sieve:update:err')) },
        success: function() { callback(); }
      });
    }, function(err) {
      if(err) {
        Msg.error('sieve:update:err');
      }
    });
  },

  action_next: function() {
    this.collection.nextPage({
      data: _.extend({ _opt: { order: [this.getSortField()] } }, this.query),
      success: function(collection, resp, options) {
        _.each(options.previousModels, function(model) {
          model.trigger('remove');
        });
      }
    });
  },

  action_prev: function() {
    this.collection.prevPage({
      data: _.extend({ _opt: { order: [this.getSortField()] } }, this.query),
      success: function(collection, resp, options) {
        _.each(options.previousModels, function(model) {
          model.trigger('remove');
        });
      }
    });
  },

  action_restore: function() {
    var
    self = this,
    models = this.getSelectedModels();

    async.map(models, function(model, callback) {
      model.save('state', C.STATE_READY, {
        patch: true,
        error: function() { callback(new Error('sieve:restore:err')) },
        success: function() {
          model.collection.remove(model);
          callback();
        }
      });
    }, function(err) {
      if(err) {
        Msg.error('sieve:restore:err');
      } else {
        Msg.info('Restored selected items.');
        self.route();
      }
    });
  },

  action_schedule_menu: function(id, target) {
    this.scheduleMenu || (this.scheduleMenu = new ScheduleMenu({
      parent: this,
      collection: this.collection
    }));
    this.scheduleMenu.toggle(id, target.nodeName == 'I' ? target.parentNode : target);
  },

  action_view: function(id, originalTarget) {
    // Ignore external links
    if(originalTarget.target == '_blank') return false;

    if(this.modelView && this.modelView.model.id == id) {
      this.route();
    } else {
      this.route(id);
    }
  },

  event_check: function(e) {
    var checked = e.target.checked;
    _.each(this.views, function(view, id) {
      view.setSelected(checked);
    });
  },

  addOne: function(model, top) {
    if(!this.$list) return; // Not rendered yet
    var view = new SieveRow({ model: model, parent: this });
    this.$list[top === true ? 'prepend' : 'append'](view.render().el);
    return view;
  },

  close_edit: function() {
    this.optsPanel.remove();
    this.opts = null;
  },

  editModel: function(model) {
    this.opts && this.close_edit();

    var self = this;

    this.opts = new SieveOptions({

      callback: function(err, editedModel) {
        //console.log('editedModel:', editedModel.toJSON());
        if(err) {
          console.error('edit', self.name, err)
          Msg.error('Failed to edit sieve: ' + (err.message || err));
        } else {
          if(editedModel) {
            var add = model.isNew();
            model.set(editedModel.attributes);
            if(add) {
              self.collection.add(model);
            }
          }
          self.close_edit();
        }
      },
      model: model.clone(),
      parent: this
    });

    //console.log('model:', this.name, model);

    this.optsPanel = new View.Modal({
      name: 'Sieves$SieveOptionsModal',
      parent: this,
      width: 900,
      title: 'Options', // TODO i18n
      view: this.opts
    });

    $(document.body).append(this.optsPanel.render().el);
  },

  fetchAndShow: function(id) {
    var
    self = this,
    pageSize = App.store.get('ui.list.pagesize');

    Msg.start('fetch', { info: 'l_loading' });

    this.tbar.setAttribute('context',
      this.routePrefix + (Supports.agents.local ? ' local' : ''));

    if(this.collection.perPage != pageSize) {
      this.collection.currentPage = 0;
      this.collection.perPage = pageSize;
    }

    this.collection.fetch({
      sort: false,
      data: _.extend({ _opt: { order: [this.getSortField()] } }, this.query),
      error: function(err) {
        console.error('fetchAndShow:', err);
        Msg.stop('fetch', err && { error: 'err:fetch' });
      },
      success: function() {
        Msg.stop('fetch');
        if(id) {
          self.show(id);
        } else {
          self.removeModelView()
        }
      }
    });
  },

  getRow: function(model) {
    return _.find(this.views, function(view) {
      return view.model.id == model.id
    });
  },

  getSelectedModels: function() {
    var self = this;
    return _.chain(this.children)
    .select(function(child) { return child.isSelected && child.isSelected() })
    .map(function(child) { return self.collection.get(child.model.id) })
    .value()
  },

  getSortField: function() {
    var field = App.store.get('ui.list.sortby') || '-ts_data';
    // XXX Quick fix to set sort field. Do this when setting options.
    this.collection.sortField = field;
    // XXX Case insensitive search for local agents. For webapp, should it be
    // done automatically?
    if(field == 'name' && Supports.agents.local) {
      return 'name nocase';
    }
    return field;
  },

  labelAddOne: function(model) {
    this.$labelList.append(
      LI(
        A({
          href: '#',
          'data-action': 'sieve label apply',
          'data-action-param': model.id
        }, model.get('name'))
      )
    );
  },

  labelRemoveOne: function(model) {
  },

  labelReset: function() {
    this.$labelList.empty();
    this.labels.each(this.labelAddOne);
  },

  onSort: function() {
    // Loop through the views and insert them to the list, starting from top.
    this.collection.each(function(model) {
      var view = this.views[model.id];
      view.$el.remove().appendTo(this.$list);
    }, this);
  },

  postInit: function(options) {
    this.listenTo(this.collection, 'sort', this.onSort);
    this.listenTo(this.collection, 'sync', this.updatePageInfo);
    this.labels = options.labels;

    this.firebase = new Firebase(URI_FIREBASE+'events/'+
      (USER ? USER.id : '0') + '/sieves');

    this.labels.on('add', this.labelAddOne);
    this.labels.on('remove', this.labelRemoveOne);
    this.labels.on('reset', this.labelReset);
  },

  removeOne: function(model) {
    View.Entities.prototype.removeOne.call(this, model);

    // If the model being removed's detail is being shown, remove that.
    if(this.model && this.model.id == model.id) {
      this.removeModelView();
    }
    model.trigger('remove');
  },

  renderBase: function() {
    with(domo) {
      var
      // XXX custom style to quick fix an alignment bug. Fix properly.
      labelList = UL({ 'class': 'dropdown-menu', style: 'top:18px' }),
      list = UL({ 'class': 'nav xlist' });

      this.$el.append(
        /* Sandeep Experimenting with search box to open new sieve. 
         * DIV({ 'class': 'control-group' }, 
          LABEL({ 'class': 'control-label', 'for': 'sieve-name' },
                i18n.gettext('l_search_label')
          ),
          DIV({ 'class': 'controls' },
            INPUT({ type: 'text', id: 'sieve-name',
                value: i18n.gettext('l_search_input_label') }),
            A({ 'data-action': 'sieve new', 'class': 'btn btn-search' },
            i18n.gettext('a_load_website_in_sieve')
            )
          )
        ), */
        this.tbar = DIV({
          'class': 'xtbar xalt' + (Supports.agents.local ? ' xlocal' : '')
        },
          INPUT({ type: 'checkbox', style: 'margin: 0 10px 0 0;' }),
          A({
            'data-action': 'sieve check for changes',
            'class': 'btn',
            context: 'local notrash'
          }, i18n.gettext('a_check_changes')),
          DIV({
            'class': 'btn-group',
            context: 'all notrash'
          },
            A({ 'class': 'btn dropdown-toggle', 'data-toggle': 'dropdown' },
              sprintf('a_action_object', 'a_apply', 'l_label'),
              ' ',
              SPAN({ 'class': 'caret' })
            ),
            labelList
          ),
          A({
            'data-action': 'sieve restore',
            'class': 'btn',
            context: 'trash'
          }, i18n.gettext('a_restore')),
          A({
            'data-action': 'sieve del permanent',
            'class': 'btn',
            context: 'trash'
          }, i18n.gettext('a_del_permanent')),
          A({
            'data-action': 'sieve mark_read',
            'class': 'btn',
            context: 'all'
          }, i18n.gettext('a_mark_read')),
          A({
            'data-action': 'sieve del',
            'class': 'btn',
            context: 'all notrash'
          }, i18n.gettext('a_move_to_trash')),

          DIV({ 'class': 'btn-group pull-right' },
            A({
              'class': 'btn xbtn-light',
              'data-action': 'sieve list menu'
            },
              I({ 'class': 'icon-large icon-cog' }),
              ' ',
              SPAN({ 'class': 'caret' })
            )
          ),
          DIV({ 'class': 'pagination pagination-small pull-right', style: 'margin: 0' },
            UL(
              LI(this.pageInfo = SPAN()),
              this.pagePrev = LI(A({ href: '#', 'data-action': 'sieve nav prev' }, 'Prev')),
              this.pageNext = LI(A({ href: '#', 'data-action': 'sieve nav next'  }, 'Next'))
            )
          )
        ),
        DIV({ 'class': 'row-fluid' }, list)
      );
      this.$list = $(list);
      this.$labelList = $(labelList);
    }
  },

  renderModelView: function(model, view) {
    var row = this.getRow(model);
    row && row.showDetail(view.render());
  },

  show404: function() {
    Msg.error("err_sieve_na");
    return false;
  },

  showCollectionOverview: function () {
    if(!App.store.get('seensieve') && !this.overview) {

      var 
        self = this,
        elNew = this.$('[data-action="sieve new"]'),
        elDel = this.$('[data-action="sieve del"]');

      var markers = [{
        pos: 'right',
        rect: function() {
          return elRect(elNew).delta(2,2,-2,2);
        },
        html: '<p><b>1.</b> Add a webpage to the Watchlist.</p>'
      }, {
        pos: 'bottom',
        rect: function() {
          var $el = self.$('.xitem');
          return $el.length != 0 && elRect($el).delta(-6, -2, -2, -2);
        },
        html: "<p><b>2.</b> Preview webpage's content. To view details, click it.</p>"
      }];

      this.overview = new Overview({
        parent: this,
        markers: markers
      });

      $(document.body).append(this.overview.render().el);
      this.overview.on('close', function() {
        App.store.set('seensieve', 1);
        delete self.overview;
      });
    }
  },

  showDefault: function() {
    this.removeModelView();
    //this.showCollectionOverview();
  },

  showInbox: function(id) {
    //DBG && console.log('showInbox:', id);
    this.query = { 'state.in': [C.STATE_INIT, C.STATE_READY] };
    this.modelId = id;

    if(this.routePrefix != 'inbox') {
      this.routePrefix = 'inbox';
      this.fetchAndShow(id);
    } else {
      if(id) {
        this.show(id);
      } else {
        this.showDefault();
      }
    }
  },

  showLabel: function(label, id) {
    var path = 'label/' + label.get('name');
    this.query = {
      'state.in': [C.STATE_INIT, C.STATE_READY],
      'tags.like': '%'+label.id+'%'
    };
    this.modelId = id;

    if(this.routePrefix != path) {
      this.routePrefix = path;
      this.fetchAndShow(id);
    } else {
      if(id) {
        this.show(id);
      } else {
        this.showDefault();
      }
    }

  },

  showModelView: function(model) {
    // Mark the model as viewed
    model.save('ts_view', dateToDBFormat(new Date()), {
      patch: true,
      error: function() {
        console.error('Failed to save model:ts_view:', model.id);
      }
    });
    return Sieves.__super__.showModelView.call(this, model);
  },

  showSearch: function(query, id) {
    // FIXME Add fulltext query support to postgres to search?
    var
    routePrefix = 'search/'+query,
    query = '%'+query+'%';
    this.query = {
      'state.in': [C.STATE_INIT, C.STATE_READY],
      $or: {
        'uri.ilike': query,
        'name.ilike': query 
      }
    };
    this.modelId = id;

    if(this.routePrefix != routePrefix) {
      this.routePrefix = routePrefix;
      this.fetchAndShow(id);
    } else {
      if(id) {
        this.show(id);
      } else {
        this.showDefault();
      }
    }

  },

  showTrash: function(id) {
    this.query = { 'state': C.STATE_DISCARD };
    this.modelId = id;

    if(this.routePrefix != 'trash') {
      this.routePrefix = 'trash';
      this.fetchAndShow(id);
    } else {
      if(id) {
        this.show(id);
      } else {
        this.showDefault();
      }
    }
  },

  showUnlabeled: function(id) {
    this.query = {
      'state.in': [C.STATE_INIT, C.STATE_READY],
      'tags': null
    };
    this.modelId = id;

    if(this.routePrefix != 'unlabeled') {
      this.routePrefix = 'unlabeled';
      this.fetchAndShow(id);
    } else {
      if(id) {
        this.show(id);
      } else {
        this.showDefault();
      }
    }
  },

  showUnread: function(id) {
    this.query = {
      'state.in': [C.STATE_INIT, C.STATE_READY],
      // Get unread by getting unread items
      'ts_view.lt': { name: 'ts_data', type: 'field' }
    };
    this.modelId = id;

    if(this.routePrefix != 'unread') {
      this.routePrefix = 'unread';
      this.fetchAndShow(id);
    } else {
      if(id) {
        this.show(id);
      } else {
        this.showDefault();
      }
    }
  },

  updatePageInfo: function() {
    with(this.collection) {
      var pi = info()
      this.pageInfo.textContent =
        sprintf('m_start_end_of_total', offset+1, offset+length, totalRecords);
      $(this.pagePrev)[pi.currentPage <= 0 ? 'addClass' : 'removeClass']('disabled')
      $(this.pageNext)[pi.currentPage+1 >=  pi.totalPages ? 'addClass' : 'removeClass']('disabled')
    }
  }
});

return {
  Sieves: Sieves
};

function elRect($el) {
  var offset = $el.offset();
  return new Rect(offset.left,
                  offset.top,
                  $el.outerWidth(),
                  $el.outerHeight());
}

function formatTime(ts, trim) {
  if(!ts) return '';

  var
    then = moment(ts),
    now = moment(),
    diff = now.diff(then);

  if(diff < 60000) {
    //return then.fromNow(true);
    return then.format('h:mm a');
  } else if(diff < 24 * 3600000 && now.date() == then.date()) {
    return then.format('h:mm a');
  } else {
    return trim ? then.format('MMM DD') : then.format('MMM DD, h:mm a');
  }
}

function gettext(key) {
  return i18n.gettext(key);
}

function sprintf(format) {
  var params = _.toArray(arguments).slice(1);
  params = _.map(params, function(param) {
    return _.isString(param) ? i18n.gettext(param) : param
  });
  return i18n.sprintf.apply(i18n, [i18n.gettext(format)].concat(params))
}

function dateToDBFormat(date) {
  return Supports.agents.local ? date : moment(date).format();
}

});

