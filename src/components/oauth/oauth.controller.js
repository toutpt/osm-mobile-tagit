
OauthController.$inject = ['osmAuthService', 'osmAPI']
function OauthController(osmAuthService, osmAPI) {
    var $ctrl = this;
    this.login = function () {
        osmAuthService.authenticate().then(update);
    };
    this.logout = function () {
        osmAuthService.authenticate().then(update);
    };
    function onUserDetails(res) {
        $ctrl.data = res;
    }
    function onError(err) {
        $ctrl.err = err;
    }
    function update() {
        if (osmAuthService.authenticated()) {
            osmAPI.setOauth(osmAuthService);
            osmAPI.getUserDetails().then(function (user) {
                $ctrl.user = user.osm.user;
            });
            $ctrl.authenticated = true;
        } else {
            $ctrl.authenticated = false;
            delete $ctrl.user;
        }
    }

};
export default OauthController;