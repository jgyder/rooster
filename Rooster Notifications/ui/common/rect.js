define(function() {
function Rect(x, y, width, height) {
  var self = this;
  // Support for creation using function call without a new.
  if(self == window) return new Rect(x, y, width, height);
  if(typeof x == 'object') {
    height = x.height;
    width = x.width;
    y = x.top;
    x = x.left;
  }

  //this._x = x; this._y = y; this._w = width; this._h = height;

  this.x = function() { return x }
  this.y = function() { return y }
  this.width = function() { return width }
  this.height = function() { return height }
  this.add = add;
  this.area = function() { return width*height }
  this.clipTo = clipTo;
  this.clone = clone;
  this.delta = delta;
  this.subtract = subtract;

  function add(aRect) {
    var
      ax = aRect.x(),
      ay = aRect.y(),
      awidth = aRect.width(),
      aheight = aRect.height(),
      nx = Math.min(x, ax),
      ny = Math.min(y, ay),
      nw = Math.max(ax+awidth, x+width) - nx,
      nh = Math.max(ay+aheight, y+height) - ny;
    return new Rect(nx, ny, nw, nh);
  }

  function clipTo(aRect) {
    var
      ax = aRect.x(),
      ay = aRect.y(),
      awidth = aRect.width(),
      aheight = aRect.height(),
      nx = clip(ax, x, ax + awidth),
      ny = clip(ay, y, ay + aheight),
      nw = clip(ax, x + width, ax + awidth) - nx,
      nh = clip(ay, y + height, ay + aheight) - ny;
    return new Rect(nx, ny, nw, nh);

    function clip(x1, x2, x3) {
      return x2 > x1 ? (x2 < x3 ? x2 : x3) : x1;
    }
  }

  function clone() {
    return new Rect(x, y, width, height);
  }

  function delta(top, right, bottom, left) {
    var
      nx = x - left,
      ny = y - top,
      nw = width + 2*left + right,
      nh = height + 2*top + bottom;
    return new Rect(nx, ny, nw, nh);
  }

  // Returns a list of rectangles after stripping aRect
  function subtract(aRect) {
    aRect = aRect.clipTo(self);
    if(aRect.area() == 0) return [self];

    var
      rects = [],
      ax = aRect.x(),
      ay = aRect.y(),
      awidth = aRect.width(),
      aheight = aRect.height(),
      nx, ny, nw, nh;

    nx = x; ny = y; nw = width; nh = ay - y;
    nw*nh > 0 && rects.push(new Rect(nx, ny, nw, nh));

    nx = ax + awidth; ny = ay; nw = x + width - (ax + awidth); nh = y + height - ay;
    nw*nh > 0 && rects.push(new Rect(nx, ny, nw, nh));

    nx = x; ny = ay + aheight; nw = ax + awidth - x; nh = y + height - ay - aheight;
    nw*nh > 0 && rects.push(new Rect(nx, ny, nw, nh));

    nx = x; ny = ay; nw = ax - x; nh = aheight;
    nw*nh > 0 && rects.push(new Rect(nx, ny, nw, nh));

    return rects;
  }

  this.toString = function() {
    return '[' + ([x, y, width, height].join(', ')) + ']';
  }

  this.toJSON = function() {
    return [x, y, width, height];
  }
}

return Rect;
})

