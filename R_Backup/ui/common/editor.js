define(['jquery', 'underscore', 'async', 'domo', 'i18n', 'moment', 'backbone',
  'common/view', 'common/types'],

function($, _, async, domo, i18n, moment, Backbone, View, Types) {

var Base = View.Base.extend({

  initialize: function(options) {
    var param = this.param = options.param || { name: 'param' };

    var type = (options.type && Types.get(options.type)) || this.type;
    this.type = type;
    if(this.type == null) {
      console.error('editor type error:', options);
      throw new Error('Editor with unknown type: ' + this.type);
    }
    //why? YAGNI.
    //this.$el.attr('type', this.type.type);

    this.model || (this.model = new Backbone.Model());

    this.listenTo(this.model, 'change:' + param.name, this.resetValue);
 
    Base.__super__.initialize.call(this, options);

    this.plugins = _.map(param.plugins, function(cls) {
      return new cls(type, param, this);
    }, this);
  },

  /**
   * Instead of rendering new elements, this method binds to existing elements.
   */
  acquire: function() {
    this.acquireRefs();
    this.renderPlugins();
    this.postRender();
    return this;
  },

  /**
   * Set references to fields from pre rendered elements.
   */
  acquireRefs: function() {},

  isValid: function() {
    var rawValue = this.getRawValue();
    return !(this.param.must && _.isEmpty(rawValue))
      && this.type.isValid(rawValue, this.param);
  },

  getValue: function(){
    var raw = this.getRawValue();
    return this.type.parse(raw);
  },

  // Best place to add event handlers
  postRender: function() { },

  remove: function() {
    Base.__super__.remove.call(this);
    _.each(this.plugins, function(plugin) { plugin.unload(); });
  },

  render: function() {
    this.renderBase();
    this.renderPlugins();
    this.postRender();
    return this;
  },

  renderBase: function() { },

  renderPlugins: function() {
    _.each(this.plugins, function(plugin) { plugin.render(); });
  },

  /**
   * Resets(?) value from model into the view.
   * XXX Ambiguous name/usage!
   */
  resetValue: function() {
    var value = this.model.get(this.param.name);
    if(this.getValue() !== value) {
      this.setValue(value);
    }
  },

  setValue: function(){}

}),

Formatted = Base.extend({

  name: 'Formatted',

  // XXX Generic impl. Find all types of form fields. Special cases override.
  acquireRefs: function() {
    var $field = this.$el.find('input,textarea,select');
    this.field = $field[0];
    this.help = $field.next('.help')[0];

    if(!this.field) {
      console.error('Failed to acquire refs for:', this);
      throw new Error('Editor failed to acquire refs');
    }

    // XXX Prepopulating model from value set in dom
    var modelValue = this.model.get(this.param.name);
    if(_.isUndefined(modelValue)) {
      var value = this.getValue();
      if(!_.isEmpty(value)) {
        this.model.set(this.param.name, value);
      }
    }
  },

  getRawValue: function() {
    return this.field.value;
  },

  getFormatted: function(value) {
    return /*this.type.isValid(value, this.param)*/ value !== void 0 ? this.type.format(value) : void 0;
  },

  setFormattedValue: function(text) {
    this.field.value = text;
  },

  setValue: function(value) {
    // We should call getFormatted as getDisplayValue
    var formatted = value && this.getFormatted(value);
    if(formatted !== void 0) this.setFormattedValue(formatted);
    if(this.model.get(this.param.name) != value) {
      this.model.set(this.param.name, value);
    }
  }

}),

Hidden = Formatted.extend({
  name: 'Hidden',
  type: Types.get('text')
}),

BaseFieldEdit = Formatted.extend({

  tagName: 'span',

  type: Types.get('text'),

  hideError: function() {
    this.$el.removeClass('error');
    if(this.options.showHelp === false) {
      $(this.help).addClass('invisible');
    }
  },

  onBlur: function() {
    this.validate();
  },

  onChange: function() {
    if(this.isValid()) {
      var value = this.getValue();

      this.hideError();
      this.model.set(this.param.name, value);
      this.trigger('change', this, value);
    } else {
      this.showError();
      this.model.set(this.param.name, null);
    }
  },

  onFocus: function() {
    if(this.options.showHelp !== false) {
      $(this.help).removeClass('invisible');
    }
  },

  postRender: function() {
    this.$el.addClass('xeditor control-group');
    $(this.field).change(this.onChange).focus(this.onFocus).blur(this.onBlur);
    this.resetValue();
  },

  renderBase: function() {
    var label = this.options.label, isForm = this.options.form;
    this.$el.empty();
    if(label) {
      this.$el.append(
        SPAN({ 'class': 'control-label' }, i18n.gettext(label))
      );
    }
    this.$el.append(
      // Add controls class when it has a field.
      DIV({ 'class': isForm ? 'controls' : 'inline' },
        this.field = this.renderField(),
        this.help = SMALL({ 'class': 'help invisible' },
          this.param.help ? i18n.gettext(this.param.help) : ''
        )
      )
    );
  },

  showError: function() {
    $(this.help).removeClass('invisible');
    this.$el.addClass('error');
  },

  validate: function() {
    if(this.isValid()) {
      $(this.help).addClass('invisible');
    } else {
      this.showError();
    }
  }

}),

TextEdit = BaseFieldEdit.extend({

  name: 'TextEdit',

  className: 'xtext',

  inputClass: '',

  inputType: 'text',

  renderField: function() {
    var label = this.param.label;
    return INPUT({
      placeholder: label ? i18n.gettext(label) : '',
      type: this.inputType,
      'class': this.inputClass + ' inline'
    });
  }

}),

PasswordEdit = TextEdit.extend({

  name: 'PasswordEdit',

  inputType: 'password'

}),

EmailEdit = TextEdit.extend({

  name: 'EmailEdit',

  className: 'xemail',

  type: Types.get('email')

}),

IntegerEdit = TextEdit.extend({

  name: 'IntegerEdit',

  className: 'xnumber',

  type: Types.get('integer')

}),

NumberEdit = TextEdit.extend({

  name: 'NumberEdit',

  className: 'xnumber',

  type: Types.get('number')

}),

// TODO Create a rich duration editor. Add it in a separate module.
// We could use a slider to edit durations.
DurationEdit = IntegerEdit.extend({

  name: 'DurationEdit',

  className: 'xduration',

  type: Types.get('duration')

}),

PhoneEdit = TextEdit.extend({
  // TODO Convert it to a select2 input box
  name: 'TextEdit',

  className: 'xphone',

  type: Types.get('phone')

}),

RegExpEdit = TextEdit.extend({
  name: 'RegExpEdit',

  className: 'xregexp',

  type: Types.get('regexp')
}),

TextTplEdit = TextEdit.extend({

  name: 'TextTplEdit',

  className: 'xtpltext',

  type: Types.get('tpl:text')

}),

RichTextEdit = TextEdit.extend({

  name: 'RichTextEdit',

  className: 'xrichtext',

  renderField: function() {
    return TEXTAREA({
      placeholder: i18n.gettext(this.param.label||'')
    })
  }

}),

HTMLTplEdit = RichTextEdit.extend({

  name: 'HTMLTplEdit',

  className: 'xhtmltext',

  type: Types.get('tpl:html')

}),

URLEdit = TextEdit.extend({

  name: 'URLEdit',

  className: 'xurl',

  inputClass: 'input-xxlarge',

  type: Types.url

}),

MacroEdit = Base.extend({

  name: 'MacroEdit',

  type: Types.get('macro'),

  getValue: function() {
    return this.value;
  },
  setValue: function(value) {
    this.value = value || {};
  },

  acquireRefs: function() {
    throw new Error('Not supported');
  },

  renderBase: function() {
    // TODO Create macro editor when supported.
    throw new Error('Not implemented');
  }
}),

XPathEdit = TextEdit.extend({

  name: 'XPathEdit',

  className: 'xxpath',

  inputClass: 'input-xxlarge',

  type: Types.get('xpath')

}),

CSSEdit = TextEdit.extend({

  name: 'CSSEdit',

  className: 'xcss',

  type: Types.get('css')

}),

JSEdit = RichTextEdit.extend({

  name: 'JSEdit',

  className: 'xjs',

  type: Types.get('js')

}),

JSONEdit = RichTextEdit.extend({

  name: 'JSONEdit',

  className: 'xjson',

  type: Types.get('json')

}),

EnumEdit = BaseFieldEdit.extend({

  name: 'EnumEdit',

  className: 'xenum',

  type: Types.get('enum'),

  renderField: function() {
    var options = _.map(this.param.list, function(aItem) {
      return OPTION({ value: aItem.value }, i18n.gettext(aItem.label));
    });
    return SELECT(options);
  }

})

;

var views = {
  'css': CSSEdit,
  'duration': DurationEdit,
  'email': EmailEdit,
  'enum': EnumEdit,
  'hidden': Hidden,
  'integer': IntegerEdit,
  'js': JSEdit,
  'json': JSONEdit,
  'macro': MacroEdit,
  'number': NumberEdit,
  'password': PasswordEdit,
  'phone': PhoneEdit,
  'regexp': RegExpEdit,
  'text': TextEdit,
  'tpl:text': TextTplEdit,
  'tpl:html': HTMLTplEdit,
  'url': URLEdit,
  'xpath': XPathEdit
};

function Plugin(type, param, editor) {
  this.type = type;
  this.param = param;
  this.editor = editor;
  this.load(param, editor);
}

_.extend(Plugin.prototype, Backbone.Events, {
  /**
   * Called when editor is loaded.
   */
  load: function(param, editor) {},
  /**
   * Called after editor is rendered.
   */
  render: function() {},
  /**
   * Called when editor is removed.
   */
  unload: function() {
    this.off(); // Remove all event listeners
  }
});

Plugin.extend = View.Base.extend;

SelectOptionsPlugin = Plugin.extend({

  attrLabel: 'value',
  attrValue: 'value',

  loadData: function(collection) {
    //console.log('options collection:', collection.toJSON());
    $(this.separator).attr('label', '');

    collection.each(function(model) {
      this.select.appendChild(this.renderOption(model));
    }, this);

    this.editor.resetValue();
    if(_.isEmpty(this.editor.getValue()) && collection.length > 0) {
      this.editor.setValue(collection.at(0).get(this.attrValue));
    }
  },

  render: function() {
    var self = this;
    $(this.editor.field).wrap(DIV({
      'class': 'xwrap'
    })).addClass('hide').before(this.select = SELECT());

    this.editor.field = this.select;
    this.renderDefaults();
    this.renderActions();
    this.separator = OPTGROUP()
    this.select.appendChild(this.separator);

    $(this.select).change(function() {
      var value = self.select.value;
      if(value.indexOf('action:') == 0) {
        self[value.replace(':', '_')]();
        self.reset();
      }
    });
  },

  renderActions: function() { },

  renderDefaults: function() {
    this.select.appendChild(
      OPTION({ value: '', tag: 'defaults' },
        i18n.sprintf(
          i18n.gettext('a_action_object'),
          i18n.gettext('a_select'),
          i18n.gettext(this.param.label||'')
        )
      )
    )
  },

  renderOption: function(model) {
    return OPTION({
      value: model.get(this.attrValue)
    }, model.get(this.attrLabel))
  },

  reset: function() {
    if(this.attrs.length > 0) {
      // TODO Set option to previous selection.
      this.select.value = '';
    } else {
      this.select.value = '';
    }
  }

});

return {
  create: function(type, options) {
    var Cls = views[type];
    if(Cls == null) throw new Error('View type not registered: ' + type);
    return new Cls(options);
  },
  get: function(type) {
    return views[type];
  },
  reg: function(type, Cls) {
    views[type] = Cls;
  },
  Plugin: Plugin,
  SelectOptionsPlugin: SelectOptionsPlugin
}

});

