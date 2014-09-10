/*jshint strict:false */
/*global angular:false */

angular.module('osmMobileTagIt.controllers').controller('LoginController',
	['$scope', 'settingsService','osmAPI', //'flash',
	function($scope, settingsService, osmAPI){//, flash){
		console.log('init logcontroller');
        $scope.loggedin = osmAPI.getCredentials();
        $scope.mypassword = '';
        $scope.settings = settingsService.settings;
        $scope.login = function(){
            osmAPI.setCredentials(
                $scope.settings.username,
                $scope.mypassword
            );
            osmAPI.validateCredentials().then(function(loggedin){
                $scope.loggedin = loggedin;
                if (!loggedin){
                    //flash('error', 'login failed');
                }else{
                    //persist credentials
                    $scope.settings.credentials = osmAPI.getCredentials();
                    //flash('login success');
                }
            });
        };
        $scope.logout = function(){
            osmAPI.clearCredentials();
            $scope.loggedin = false;
        };
        if ($scope.settings.credentials && $scope.settings.username){
            //validate credentials
            osmAPI.validateCredentials().then(function(loggedin){
                $scope.loggedin = loggedin;
            });
        }

	}]
);
