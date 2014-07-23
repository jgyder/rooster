define(function() {

function CookieStore(prefix) {
  prefix || (prefix = '_s');

  this.del = function(key) {
    key = prefix+key;
    document.cookie = escape(key) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }

  this.get = function(key) {
    key = prefix+key;
    var val = unescape(document.cookie.replace(new RegExp("(?:(?:^|.*;\\s*)" + escape(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*)|.*"), "$1"));
    return val ? JSON.parse(val) : undefined;
  }

  this.set = function(key, val) {
    key = prefix+key;
    document.cookie = escape(key) + '=' + escape(JSON.stringify(val)) +
      '; expires=Fri, 31 Dec 9999 23:59:59 GMT';
  }
}

return CookieStore;

});
