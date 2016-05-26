function loadUserDetails($ctrl) {
  function onUserDetails(res) {
    $ctrl.data = res;
    console.log(res);
  }
  function onError(err) {
    $ctrl.err = err;
  }
  if ($ctrl.oauth.authenticated()) {
    $ctrl.authenticated = true;
    $ctrl.api.setOauth($ctrl.oauth);
    $ctrl.api.getUserDetails()
    .then(onUserDetails, onError);
  } else {
    $ctrl.authenticated = false;
  }
}

class OsmtiUserController {
  constructor(osmAuthService, osmAPI) {
    this.name = 'osmtiUser';
    this.oauth = osmAuthService;
    this.api = osmAPI;
    this.authenticated = false;
    loadUserDetails(this);
  }
  login() {
    var $ctrl = this;
    this.oauth.authenticate().then(function () {
      loadUserDetails($ctrl);
    });
  }

}
OsmtiUserController.$inject = ['osmAuthService', 'osmAPI'];
export default OsmtiUserController;
