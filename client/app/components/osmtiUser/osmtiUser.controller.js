class OsmtiUserController {
  constructor(osmAuthService) {
    this.name = 'osmtiUser';
    this.service = osmAuthService
  }
  login() {
    var $ctrl = this;
    this.service.authenticate().then(function () {
      if ($ctrl.service.authenticated()) {
        $ctrl.authenticated = true;
        $ctrl.service.xhr({
            method: 'GET',
            path: '/api/0.6/user/details'
        }).then(onUserDetails, onError);
      } else {
        $ctrl.authenticated = false;
      }
    });
    function onUserDetails(res) {
      $ctrl.data = res;
    }
    function onError(err) {
      $ctrl.err = err;
    }
  }

}
OsmtiUserController.$inject = ['osmAuthService'];
export default OsmtiUserController;
