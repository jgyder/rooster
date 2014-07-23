define(['./store-localstorage', './store-cookie'],
function(LSStore, CookieStore) {
return LSStore.storage ? LSStore : CookieStore;
});

