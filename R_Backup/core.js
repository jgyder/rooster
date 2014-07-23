const ID = (function(x) {
  return function () {
    return x++;
  }
})(1);

var DBG = 1;

// Generate four random hex digits.
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

function makeURLChecker(baseUrl) {
  var parts = baseUrl.split('/');
  parts[0] = '^(http|https):';
  var re = new RegExp(parts.join('\\/'), 'i');
  return function check(href) {
    return re.test(href);
  }
}

var isUs = makeURLChecker(CFG.URL.ROOT);

