brwsr_def(['jquery', 'underscore', 'id', 'domo', 'api', 'picker'],
function($, _, ID, domo, Api, Picker) {

var
NS = Api.NS,
// Common parent for all UI elements.
parent = domo.DIV({
  'class': NS + 'ui'
}),
markers = {},
selectMarker = new SelectionMarker({});

$('body').append(parent);

// XXX Should we add listener to Api?
Picker.addListener({
  'select:close': function(event) {
    //console.log('select:close', event)
    var
    id = event.data.id,
    marker = markers[id];

    if(marker) {
      marker.close();
      delete markers[id];
    }
  },
  'select:display': function(event) {
    //console.log('select:display', JSON.stringify(event.data), event.data)
    var marker = markers[event.data.id];
    marker.update(event.data);
  },
  'select:frame_bounds': function(event) {
    //console.log('select:frame_bounds', event.data, location.href)
    // Redraw all markers
    _.each(markers, function(marker) {
      marker.update();
    });
    selectMarker.update();
  },
  'select:load': function(event) {
    // initialize
    //console.log('select:load', event)
  },
  'select:mark': function(event) {
    //console.log('select:mark', JSON.stringify(event.data), event.data)
    //console.log('select:mark', event.data)
    selectMarker.update(event.data);
    selectMarker.show(true);
  },
  'select:mark_none': function(event) {
    //console.log('select:mark_none', event)
    selectMarker.show(false);
  },
  'select:mode': function(mode) {
    //console.log('select:mode', mode)

    var show = (mode == Picker.MODE_SELECT);
    _.each(markers, function(selection) {
      selection.show(show);
    });
  },
  'select:new': function(event) {
    //console.log('select:new', event)
    markers[event.data.id] = new SelectedMarker(event.data);
  },
  'select:reset': function() {
    _.each(markers, function(marker) {
      marker.close();
      delete markers[id];
    });
    markers = {};
  }
});

function RectMarker(options) {
  var
  els = _.reduce(['left', 'top', 'right', 'bottom'], function(memo, dir) {
    memo[dir] = domo.DIV({
      'class': NS + dir + ' ' + NS + 'marker'
    })
    return memo;
  }, {});

  _.each(els, function(el) {
    parent.appendChild(el);
  });

  update();

  this.close = close;
  this.show = show;
  this.update = update;

  function close() {
    _.each(els, function(el) {
      $(el).remove()
    });
  }

  function show(show) {
    _.each(els, function(el) {
      $(el)[show ? 'show' : 'hide']();
      update();
    });
  }

  function update(newOptions) {
    _.extend(options, newOptions);

    var
    frame_bounds = Picker.frame_bounds,
    rect = _.clone(options.rect) || {
      top: frame_bounds.top, left: frame_bounds.left, width: 0, height: 0
    },
    op = options.op;

    // Shift to frame's coordinates.
    rect.left = rect.left - frame_bounds.left;
    rect.top = rect.top - frame_bounds.top;

    _.each(els, function(el) {
      el.className = NS + 'marker_' + op;
    });

    $(els.left).css({
      left: rect.left,
      top: rect.top,
      height: rect.height
    });

    $(els.top).css({
      left: rect.left,
      top: rect.top,
      width: rect.width
    });

    $(els.right).css({
      left: rect.left + rect.width,
      top: rect.top,
      height: rect.height
    });

    $(els.bottom).css({
      left: rect.left,
      top: rect.top + rect.height,
      width: rect.width
    });

  }
}

function SelectionMarker(options) {

  var
  rectMarkers = [],
  els = {
    info: domo.DIV({ 'class': NS + 'select_info' })
  };


  _.each(els, function(el) {
    parent.appendChild(el);
  });

  this.close = close;
  this.show = show;
  this.update = update;

  function close() {
    closeRectMarkers();

    _.each(els, function(el) {
      $(el).remove()
    });
  }

  function closeRectMarkers() {
    _.each(rectMarkers, function(m) { m.close() });
  }

  function show(show) {
    _.each(rectMarkers, function(m) { m.show(show) });

    _.each(els, function(el) {
      $(el)[show ? 'show' : 'hide']();
      show && update();
    });
  }

  function update(newOptions) {
    _.extend(options, newOptions);
    
    closeRectMarkers();
    
    var
    frame_bounds = Picker.frame_bounds,
    rects = options.rects,
    rect = (rects && _.clone(rects[0])) || {
      top: frame_bounds.top, left: frame_bounds.left, width: 0, height: 0
    },
    tip = options.info,
    op = options.op;

    rectMarkers = _.map(options.rects, function(rect) {
      return new RectMarker({ op: op, rect: rect })
    });

    // Shift to frame's coordinates.
    rect.left = rect.left - frame_bounds.left;
    rect.top = rect.top - frame_bounds.top;

    _.each(els, function(el) {
      el.className = NS + 'marker_' + op;
    });

    els.info.className += ' ' + NS + 'info';
    els.info.textContent = tip;

    $(els.info).css({
      left: rect.left,
      top: rect.top + rect.height
    });
  }
}

function SelectedMarker(options) {

  var
  clsHide = NS + 'hide',
  marker = new SelectionMarker({ op: options.op }),
  elExpand, elActions,
  els = {
    tbar: domo.DIV({
        'class': NS + 'vbar'
      },
      // Expand
      elExpand = domo.DIV({
        'class': NS + 'action_expand ',
        title: 'Show actions'
      }),
      // Expanded vbar
      elActions = domo.DIV({
        'class': clsHide
      },
        // Collapse
        domo.DIV({
          'class': NS + 'action_collapse',
          title: 'Hide actions'
        }),
        // Widen
        domo.DIV({
          'class': NS + 'action_widen',
          title: 'Expand selection'
        }),
        // Shorten
        domo.DIV({
          'class': NS + 'action_narrow',
          title: 'Narrow expanded selection'
        }),
        // Delete
        domo.DIV({
          'class': NS + 'action_delete',
          title: 'Discard selection'
        })
      )
    )
  };

  _.each(els, function(el) {
    parent.appendChild(el);
  });

  $(els.tbar).on('click', "[class^='xbrwsr_action']", function() {
    var action = this.className.trim().split('_').pop();

    switch(action) {
      case 'expand':
      $(elExpand).addClass(clsHide);
      $(elActions).removeClass(clsHide);
      break;

      case 'collapse':
      $(elExpand).removeClass(clsHide);
      $(elActions).addClass(clsHide);
      break;

      case 'widen':
      Api.call({
        path: 'picker_select_call',
        data: {
          id: options.id,
          method: 'widen'
        }
      }, function(err, res) {
        err && console.error('widen:', err, res);
      });
      break;

      case 'narrow':
      Api.call({
        path: 'picker_select_call',
        data: {
          id: options.id,
          method: 'narrow'
        }
      }, function(err, res) {
        err && console.error('narrow:', err, res);
      });
      break;

      case 'delete':
      Api.call({
        path: 'picker_select_call',
        data: {
          id: options.id,
          method: 'close'
        }
      }, function(err, res) {
        err && console.error('delete:', err, res);
      });
      break;

      default:
      break;
    }

  });

  this.close = close;
  this.show = show;
  this.update = update;

  function close() {
    marker.close();

    _.each(els, function(el) {
      $(el).remove();
    });
  }

  function show(show) {
    marker.show(show);

    _.each(els, function(el) { 
      $(el)[show ? 'show' : 'hide']();
    });
  }

  function update(newOptions) {
    _.extend(options, newOptions);

    marker.update(options);

    var
    frame_bounds = Picker.frame_bounds,
    rects = options.rects,
    rect = (rects && _.clone(rects[0])) || {
      top: frame_bounds.top, left: frame_bounds.left, width: 0, height: 0
    };

    // Shift to frame's coordinates.
    rect.left = rect.left - frame_bounds.left;
    rect.top = rect.top - frame_bounds.top;

    $(els.tbar).css({
      left: rect.left,
      top: rect.top
    });
  }
}

$(document).ready(function() {
  $('head').append(domo.LINK({
    rel: 'stylesheet',
    href: URL_CDN + '/css/picker.css',
    type: 'text/css',
    media: 'screen'
  }));
});

});

//console.log('pickerui:load');
