/*jshint strict:false */
/*global angular:false */

angular.module('osmMobileTagIt.controllers').controller('DebugController',
	['$scope', function($scope){
		$scope.displayDebugPanel = false;
		$scope.toggleDebugPanel = function(){
			$scope.displayDebugPanel = !$scope.displayDebugPanel;
		};
	}]
);