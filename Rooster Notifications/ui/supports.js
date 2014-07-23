define(['service'], function(Service) {
return {
  user: 1,
  email: 1,
  phone: 0,
  isSignedIn: function() {
    return Service.auth.get() != null
  },
  agents: {
    local: 1
  }
}
})
