define(['./base', './brwsr'],

function(base, Brwsr) {

var
Cobrowser = Brwsr.extend({
    urlRoot: '/cobrowsers'
}),
Cobrowsers = base.Collection.extend({
    model: Cobrowser,
    url: '/cobrowsers'
});

return {
    Cobrowser: Cobrowser,
    Cobrowsers: Cobrowsers
};

});
