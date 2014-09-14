/*jshint strict:false */
/*global angular:false */
/*global L:false */


angular.module('osmMobileTagIt').config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'partials/main.html',
        controller: 'MainController'
    });
    $routeProvider.when('/:zoom/:lat/:lng', {
        templateUrl: 'partials/main.html',
        controller: 'MainController'
    });
    $routeProvider.otherwise({redirectTo: '/'});
}]);

angular.module('osmMobileTagIt.controllers').controller('MainController',
	['$scope', '$q', '$routeParams', 'settingsService', 'osmAPI', 'overpassAPI', 'leafletService',
	function($scope, $q, $routeParams, settingsService, osmAPI, overpassAPI, leafletService){
        console.log('init MainController');
        $scope.settings = settingsService.settings;
        $scope.members = [];
        $scope.loading = {data:{loading:false, ok:false,ko:false}};

        var pointToLayer = function (feature, latlng) {
            return L.marker(latlng);
        };
        var onEachFeature = function(feature, layer) {
            //load clicked feature as '$scope.currentElement'
            layer.on('click', function () {
                $scope.currentElement = feature;
            });
            if (feature.properties.tags) {
                var html = '<ul>';
                for (var propertyName in feature.properties.tags) {
                    html += '<li>'+ propertyName + ' : ' + feature.properties.tags[propertyName] + '</li>';
                }
                html += '</ul>';
                layer.bindPopup(html);
            }
        };
        var options = {
            pointToLayer: pointToLayer,
            onEachFeature: onEachFeature
        };
        $scope.poi = false;
        var filter = function(feature){
            return feature.properties === undefined;
        };
        $scope.togglePOILayerOverpass = function(){
            var query = '';
            if ($scope.poi && $scope.currentElement){
                if ($scope.currentElement.geometry.type === 'Point'){
                    $scope.currentElement = undefined;
                }
            }
            if ($scope.poi){
                leafletService.hideLayer('poi');
                $scope.poi = false;
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
                        $scope.geojsonPOI = geojson;
                        leafletService.addGeoJSONLayer('poi', geojson, options);
                        $scope.poi = true;
                    });
                });
            }
        };
        var getOSMData = function(){
            var deferred = $q.defer();
            $scope.loading.data.loading = true;
            $scope.loading.data.ok = false;
            $scope.loading.data.ko = false;
            leafletService.getBBox('osmAPI').then(function(bbox){
                osmAPI.getMapGeoJSON(bbox).then(function(geojson){
                    var nodes = [];
                    var ways = [];
                    var areas = [];
                    var feature;
                    for (var i = 0; i < geojson.features.length; i++) {
                        feature = geojson.features[i];
                        if (feature.geometry.type === 'Point'){
                            nodes.push(feature);
                        }else if (feature.geometry.type === 'LineString'){
                            ways.push(feature);
                        }else if (feature.geometry.type === 'Polygon'){
                            areas.push(feature);
                        }
                    }
                    $scope.loading.data.loading = false;
                    $scope.loading.data.ok = true;
                    $scope.loading.data.ko = false;
                    deferred.resolve({
                        nodes:nodes,
                        ways:ways,
                        areas: areas
                    });
                },function(error){
                    $scope.loading.data.loading = false;
                    $scope.loading.data.ok = false;
                    $scope.loading.data.ko = true;
                    deferred.reject(error);
                });
            },function(error){
                $scope.loading.data.loading = false;
                $scope.loading.data.ok = false;
                $scope.loading.data.ko = true;
                deferred.reject(error);
            });
            return deferred.promise;
        };
        $scope.togglePOILayer = function(){
            if ($scope.poi && $scope.currentElement){
                if ($scope.currentElement.geometry.type === 'Point'){
                    $scope.currentElement = undefined;
                }
            }
            if ($scope.poi){
                leafletService.hideLayer('poi');
                $scope.poi = false;
            }else{
                getOSMData().then(function(data){
                    $scope.geojsonPOI = {
                        type:'FeatureCollection',
                        features: data.nodes
                    };
                    leafletService.addGeoJSONLayer('poi', $scope.geojsonPOI, options);
                    $scope.poi = true;
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
                getOSMData().then(function(data){
                    $scope.geojsonBuilding = {
                        type:'FeatureCollection',
                        features: data.areas
                    };
                    leafletService.addGeoJSONLayer('building', $scope.geojsonBuilding, options);
                    $scope.building = true;
                });
            }
        };
        $scope.toggleWaysLayer = function(){
            if ($scope.ways){
                leafletService.hideLayer('ways');
                $scope.ways = false;
                if ($scope.currentElement && $scope.currentElement.geometry.type === 'Polygon'){
                    $scope.currentElement = undefined;
                }
            }else{
                getOSMData().then(function(data){
                    $scope.geojsonWays = {
                        type:'FeatureCollection',
                        features: data.ways
                    };
                    leafletService.addGeoJSONLayer('ways', $scope.geojsonWays, options);
                    $scope.ways = true;
                });
            }
        };
        $scope.toggleBuildingLayerOverpass = function(){
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
            if ($routeParams.zoom !== undefined){
                leafletService.center.lat = parseFloat($routeParams.lat);
                leafletService.center.lng = parseFloat($routeParams.lng);
                leafletService.center.zoom = parseInt($routeParams.zoom, 10);
            }
        };
        initialize();
	}]
);
