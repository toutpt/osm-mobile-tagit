/*jshint strict:false */
/*global angular:false */

angular.module('osmMobileTagIt.services').factory('settingsService',
    ['$localStorage', function($localStorage){
        return {
            settings: $localStorage.$default({
                geojsonLayers:[]
            })
        };
    }]
);
