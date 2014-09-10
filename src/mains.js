/*jshint strict:false */
/*global angular:false */
/*global L:false */


angular.module('osmMobileTagIt').config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'partials/main.html',
        controller: 'MainRelationController'
    });
    $routeProvider.otherwise({redirectTo: '/'});
}]);

angular.module('osmMobileTagIt.controllers').controller('MainRelationController',
	['$scope', '$routeParams', 'settingsService', 'overpassAPI', 'leafletService',
	function($scope, $routeParams, settingsService, overpassAPI, leafletService){
        $scope.settings = settingsService.settings;
        $scope.relationID = $routeParams.mainRelationId;
        $scope.members = [];
        $scope.loading = {};

        var pointToLayer = function (feature, latlng) {
            return L.marker(latlng);
        };
        var onEachFeature = function(feature, layer) {
            //load clicked feature as '$scope.currentElement'
            layer.on('click', function () {
                $scope.currentElement = feature;
            });
            if (feature.properties) {
                var html = '<ul>';
                for (var propertyName in feature.properties) {
                    html += '<li>'+ propertyName + ' : ' + feature.properties[propertyName] + '</li>';
                }
                html += '</ul>';
                layer.bindPopup(html);
            }
        };
        var options = {
            pointToLayer: pointToLayer,
            onEachFeature: onEachFeature
        };
        $scope.amenity = false;
        $scope.shop = false;
        var filter = function(feature){
            return feature.properties === undefined;
        };
        $scope.toggleAmenityAndShopLayer = function(){
            var query = '';
            if ($scope.amenity && $scope.shop && $scope.currentElement){
                if ($scope.currentElement.geometry.type === 'Point'){
                    $scope.currentElement = undefined;
                }
            }
            if ($scope.amenity){
                leafletService.hideLayer('amenity');
                $scope.amenity = false;
            }else{
                leafletService.getBBox().then(function(bbox){
                    query = '<?xml version="1.0" encoding="UTF-8"?>';
                    query += '<osm-script output="json" timeout="10">';
                    query += '<union>';
                    query += '<query type="node">';
                    query += '  <has-kv k="amenity"/>';
                    query += '  <bbox-query ' + bbox + '/>';
                    query += '</query>';
                    query += '<query type="way">';
                    query += '  <has-kv k="amenity"/>';
                    query += '  <bbox-query ' + bbox + '/>';
                    query += '</query>';
                    query += '<query type="relation">';
                    query += '  <has-kv k="amenity"/>';
                    query += '  <bbox-query ' + bbox + '/>';
                    query += '</query>';
                    query += '</union>';
                    query += '<print mode="body"/>';
                    query += '<recurse type="down"/>';
                    query += '<print mode="skeleton" order="quadtile"/>';
                    query += '</osm-script>';
                    overpassAPI.overpassToGeoJSON(query, filter).then(function(geojson){
                        $scope.geojsonAmenity = geojson;
                        leafletService.addGeoJSONLayer('amenity', geojson, options);
                        $scope.amenity = true;
                    });
                });
            }
            if ($scope.shop){
                leafletService.hideLayer('shop');
                $scope.shop = false;
            }else{
                leafletService.getBBox().then(function(bbox){
                    query = '<?xml version="1.0" encoding="UTF-8"?>';
                    query += '<osm-script output="json" timeout="10">';
                    query += '<union>';
                    query += '<query type="node">';
                    query += '  <has-kv k="shop"/> ';
                    query += '  <bbox-query ' + bbox + '/>';
                    query += '</query>';
                    query += '<query type="way">';
                    query += '  <has-kv k="shop"/> ';
                    query += '  <bbox-query ' + bbox + '/>';
                    query += '</query>';
                    query += '<query type="relation">';
                    query += '  <has-kv k="shop"/> ';
                    query += '  <bbox-query ' + bbox + '/>';
                    query += '</query>';
                    query += '</union>';
                    query += '<print mode="body"/>';
                    query += '<recurse type="down"/>';
                    query += '<print mode="skeleton" order="quadtile"/>';
                    query += '</osm-script>';
                    overpassAPI.overpassToGeoJSON(query, filter).then(function(geojson){
                        $scope.geojsonShop = geojson;
                        leafletService.addGeoJSONLayer('shop', geojson, options);
                        $scope.shop = true;
                        if ($scope.amenity){
                            $scope.loading.layer = false;
                        }
                    });
                });
            }
        };
        $scope.toggleBuildingLayer = function(){
            if ($scope.building){
                leafletService.hideLayer('building');
                $scope.building = false;
                if ($scope.currentElement && $scope.currentElement.geometry.type === 'Polygon'){
                    $scope.currentElement = undefined;
                }
            }else{
                leafletService.getBBox().then(function(bbox){
                    var query = '<?xml version="1.0" encoding="UTF-8"?>';
                    query += '<osm-script output="json" timeout="10">';
                    query += '<query type="way">';
                    query += '  <has-kv k="building"/>';
                    query += '  <bbox-query ' + bbox + '/>';
                    query += '</query>';
                    query += '<print mode="body"/>';
                    query += '<recurse type="down"/>';
                    query += '<print mode="skeleton" order="quadtile"/>';
                    query += '</osm-script>';
                    overpassAPI.overpassToGeoJSON(query, filter).then(function(geojson){
                        var feature;
                        for (var i = 0; i < geojson.features.length; i++) {
                            feature = geojson.features[i];
                            feature.geometry.type = 'Polygon';
                            feature.geometry.coordinates = [feature.geometry.coordinates];
                        }
                        $scope.geojsonBuilding = geojson;
                        $scope.building = true;
                        leafletService.addGeoJSONLayer('building', geojson, options);
                    });
                });
            }
        };
        var initialize = function(){
            $scope.loggedin = $scope.settings.credentials;
        };
        initialize();
	}]
);
