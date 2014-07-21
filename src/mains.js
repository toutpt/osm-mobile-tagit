/*jshint strict:false */
/*global angular:false */
/*global L:false */


angular.module('osm').config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'partials/main.html',
        controller: 'MainRelationController'
    });
    $routeProvider.otherwise({redirectTo: '/'});
}]);

angular.module('osm.controllers').controller('MainRelationController',
	['$scope', '$routeParams', 'settingsService', 'osmService', 'leafletService',
	function($scope, $routeParams, settingsService, osmService, leafletService){
        $scope.settings = settingsService.settings;
        $scope.relationID = $routeParams.mainRelationId;
        $scope.members = [];
        $scope.loading = {};
        var pointToLayer = function (feature, latlng) {
            return L.marker(latlng);
        };
        var onEachFeature = function(feature, layer) {
            //load clicked feature as '$scope.currentNode'
            layer.on('click', function () {
                $scope.currentNode = feature;
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
        $scope.displayLayer = function(){
            $scope.loading.layer = true;
            leafletService.getBBox().then(function(bbox){
                var amenity = '<?xml version="1.0" encoding="UTF-8"?>';
                amenity += '<osm-script output="json" timeout="10">';
                amenity += '<union>';
                amenity += '<query type="node">';
                amenity += '  <has-kv k="amenity"/>';
                amenity += '  <bbox-query ' + bbox + '/>';
                amenity += '</query>';
                amenity += '<query type="way">';
                amenity += '  <has-kv k="amenity"/>';
                amenity += '  <bbox-query ' + bbox + '/>';
                amenity += '</query>';
                amenity += '<query type="relation">';
                amenity += '  <has-kv k="amenity"/>';
                amenity += '  <bbox-query ' + bbox + '/>';
                amenity += '</query>';
                amenity += '</union>';
                amenity += '<print mode="body"/>';
                amenity += '<recurse type="down"/>';
                amenity += '<print mode="skeleton" order="quadtile"/>';
                amenity += '</osm-script>';
                console.log(amenity);
                osmService.overpassToGeoJSON(amenity, filter).then(function(geojson){
                    $scope.geojsonAmenity = geojson;
                    leafletService.addGeoJSONLayer('amenity', geojson, options);
                    $scope.amenity = true;
                    if ($scope.shop){
                        $scope.loading.layer = false;
                    }
                });
                var shop = '<?xml version="1.0" encoding="UTF-8"?>';
                shop += '<osm-script output="json" timeout="10">';
                shop += '<union>';
                shop += '<query type="node">';
                shop += '  <has-kv k="shop"/> ';
                shop += '  <bbox-query ' + bbox + '/>';
                shop += '</query>';
                shop += '<query type="way">';
                shop += '  <has-kv k="shop"/> ';
                shop += '  <bbox-query ' + bbox + '/>';
                shop += '</query>';
                shop += '<query type="relation">';
                shop += '  <has-kv k="shop"/> ';
                shop += '  <bbox-query ' + bbox + '/>';
                shop += '</query>';
                shop += '</union>';
                shop += '<print mode="body"/>';
                shop += '<recurse type="down"/>';
                shop += '<print mode="skeleton" order="quadtile"/>';
                shop += '</osm-script>';
                console.log(shop);
                osmService.overpassToGeoJSON(shop, filter).then(function(geojson){
                    $scope.geojsonShop = geojson;
                    leafletService.addGeoJSONLayer('shop', geojson, options);
                    $scope.shop = true;
                    if ($scope.amenity){
                        $scope.loading.layer = false;
                    }
                });
            });
        };
        $scope.hideLayer = function(){
            leafletService.getMap().then(function(map){
                map.removeLayer('amenity');
                map.removeLayer('shop');
                map.removeLayer('building');
                $scope.amenity = false;
                $scope.shop = false;
                $scope.building = false;
            });
        };
        $scope.displayBuildingLayer = function(){
            $scope.loading.layer = true;
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
                console.log(query);
                osmService.overpassToGeoJSON(query, filter).then(function(geojson){
                    $scope.geojsonBuilding = geojson;
                    $scope.building = true;
                    console.log(JSON.stringify(geojson));
                    leafletService.addGeoJSONLayer('building', geojson, options);
                });
            });
        };
        var initialize = function(){
            $scope.loggedin = $scope.settings.credentials;
        };
        initialize();
	}]
);
