/*jshint strict:false */
/*global angular:false */
/*global L:false */


angular.module('osmMobileTagIt').config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'partials/main.html',
        controller: 'MainController'
    });
    $routeProvider.otherwise({redirectTo: '/'});
}]);

angular.module('osmMobileTagIt.controllers').controller('MainController',
	['$scope', '$routeParams', 'settingsService', 'overpassAPI', 'leafletService',
	function($scope, $routeParams, settingsService, overpassAPI, leafletService){
        $scope.settings = settingsService.settings;
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
            if ($scope.amenity && $scope.currentElement){
                if ($scope.currentElement.geometry.type === 'Point'){
                    $scope.currentElement = undefined;
                }
            }
            /* get all nodes that do not belongs to any way
                <osm-script output="json">
                  <query type="way">
                    <bbox-query {{bbox}}/>
                  </query>
                  <recurse type="way-node" into="waynodes"/>
                  <query type="node" into="allnodes">
                    <bbox-query {{bbox}}/>
                  </query>
                  <difference>
                    <item set="allnodes"/>
                    <item set="waynodes"/>
                  </difference>
                  <print/>
                </osm-script>
                */
            if ($scope.amenity){
                leafletService.hideLayer('amenity');
                $scope.amenity = false;
            }else{
                leafletService.getBBox().then(function(bbox){
                    query = '<?xml version="1.0" encoding="UTF-8"?>';
                    query += '<osm-script output="json" timeout="10">';
                    query += '<query type="way">';
                    query += '  <bbox-query ' + bbox + '/>';
                    query += '</query>';
                    query += '<recurse type="way-node" into="waynodes"/>';
                    query += '<query type="node" into="allnodes">';
                    query += '  <bbox-query ' + bbox + '/>';
                    query += '</query>';
                    query += '<difference>';
                    query += '  <item set="allnodes"/>';
                    query += '  <item set="waynodes"/>';
                    query += '</difference>';
                    query += '<print/>';
                    query += '</osm-script>';
                    overpassAPI.overpassToGeoJSON(query, filter).then(function(geojson){
                        $scope.geojsonAmenity = geojson;
                        leafletService.addGeoJSONLayer('amenity', geojson, options);
                        $scope.amenity = true;
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
