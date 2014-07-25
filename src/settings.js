/*jshint strict:false */
/*global angular:false */

angular.module('osm.services').factory('settingsService',
    ['$localStorage', function($localStorage){
        return {
            settings: $localStorage.$default({
                username: '',
                userid: '',
                credentials: '',
                nodes: [],
                changeset: '',
                changesetID: '',
                geojsonLayers:[]
            })
        };
    }]
);
