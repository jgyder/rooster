define(['underscore', './rect', './view'], function(_, Rect, View) {

var Overview = View.ActionProvider.extend({

  className: 'xmodal xoverview',

  name: 'overview',

  close: function() {
    this.remove();
    this.trigger('close');
  },

  initialize: function(options) {
    View.ActionProvider.prototype.initialize.call(this, options);
    this.markers = options.markers;
    $(window).on('resize', this.render);
  },

  render: function() {with(this.domo) {
    var self = this;
    setTimeout(function() {
      self.$el.empty();
      self.$el.append(
        DIV({ 'class': 'xbg' }),
        DIV({ 'class': 'xpanel centered' })
      );
      self.contentRect = null;
      _.each(self.markers, self.renderMarker);
      self.renderButton();
    }, 0);
    return this;
  }},

  renderButton: function() {
    var top = 100; 
    if(this.options.btnTop) {
      top = this.options.btnTop;
    } else if(this.contentRect) {
      top = this.contentRect.y() + this.contentRect.height() + 40;
    }
    var btn = A({ 'class': 'btn btn-primary xlarge' }, 'Got It, Continue!');
    this.$('.xpanel').append(btn).css({ top: top });
    $(btn).click(this.close);
  },

  renderMarker: function(marker) {with(this.domo) {
    var
      pos = marker.pos,
      rect = _.result(marker, 'rect'), el, cEl, mEl, left, top; 

    if(!rect) return;

    this.$el.append(
      (el = DIV({ 'class': 'popover ' + marker.pos },
        DIV({ 'class': 'arrow' }),
        marker.title ? DIV({ 'class': 'popover-title' }, marker.title) : I(),
        (cEl = DIV({ 'class': 'popover-content' }))
      )),
      (mEl = DIV({ 'class': 'xoutline' }))
    );
    cEl.innerHTML = marker.html;
    $(mEl).css({
      left: rect.x(),
      top: rect.y(),
      width: rect.width(),
      height: rect.height()
    });

    var elWidth = $(el).outerWidth(), elHeight = $(el).outerHeight();

    if(pos == 'top' || pos == 'bottom') {
      left = rect.x() + rect.width()/2 - elWidth/2;
      top = pos == 'top' ? rect.y() - elHeight : rect.y() + rect.height();
    } else {
      left = pos == 'left' ? rect.x() - elWidth : rect.x() + rect.width();
      top = rect.y() + rect.height()/2 - elHeight/2;
    }
    $(el).css({ left: left, top: top });

    var elRect = new Rect(left, top, elWidth, elHeight);
    this.contentRect = this.contentRect ? this.contentRect.add(elRect) : elRect;
  }}

});

return Overview;

});

