/*jshint strict:false */
/*global angular:false */

'use strict';

// Declare app level module which depends on filters, and services
angular.module('osmMobileTagIt', [
    'ngRoute',
    'base64',
//    'flash',
    'leaflet-directive',
    'osm',
    'osmMobileTagIt.services',
    'osmMobileTagIt.directives',
    'osmMobileTagIt.controllers',
    'ui.bootstrap',
    'ui.keypress',
    'ngCookies',
    'ngStorage'
]);

angular.module('osmMobileTagIt.controllers', []);
angular.module('osmMobileTagIt.services', []);
angular.module('osmMobileTagIt.directives', []);


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
/*jshint strict:false */
/*global angular:false */
/*global L:false */
L.Icon.Default.imagePath = 'images/';

angular.module('osmMobileTagIt.services').factory('leafletService',
    ['$q', 'leafletData', function($q, leafletData){
        return {
            center: {lat: 47.2150, lng: -1.5551, zoom: 19},//, autoDiscover: true},
            geojson: undefined,
            layers: {
                baselayers: {
                    osm: {
                        name: 'OpenStreetMap',
                        url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        type: 'xyz',
                        visible: true,
                        layerParams: {
                            maxZoom: 20
                        }
                    }
                },
                overlays:{}
            },
            geojsonLayers: {},
            markers: {},
            getMap: function(id){
                return leafletData.getMap(id);
            },
            addGeoJSONLayer: function(id, geojson, options){
                var self = this;
                var oldLayer = this.geojsonLayers[id];
                self.geojsonLayers[id] = L.geoJson(geojson, options);
                leafletData.getMap().then(function(map){
                    if (map.hasLayer(oldLayer)){
                        map.removeLayer(oldLayer);
                    }
                    self.geojsonLayers[id].addTo(map);
                });
            },
            hideLayer: function(id){
                var oldLayer = this.geojsonLayers[id];
                leafletData.getMap().then(function(map){
                    if (map.hasLayer(oldLayer)){
                        map.removeLayer(oldLayer);
                    }
                });
            },
            displayLayer: function(id){
                console.log('display '+ id);
                var layer = this.geojsonLayers[id];
                leafletData.getMap().then(function(map){
                    if (!map.hasLayer(layer)){
                        layer.addTo(map);
                    }
                });
            },
            getBBox: function(format){
                var self = this;
                var deferred = $q.defer();
                self.getMap().then(function(map){
                    var b = map.getBounds();
                    var bbox;
                    if (format === 'osmAPI'){
                        //bbox=left,bottom,right,top
                        bbox = '' + b.getWest() + ',' + b.getSouth() + ',' + b.getEast() + ',' + b.getNorth();
                    }else{
                        // s="47.1166" n="47.310" w="-1.7523" e="-1.3718
                        bbox = 'w="' + b.getWest() + '" s="' + b.getSouth() + '" e="' + b.getEast() + '" n="' + b.getNorth() + '"';
                    }
                    deferred.resolve(bbox);
                });
                return deferred.promise;
            }
        };
    }]
);

angular.module('osmMobileTagIt.controllers').controller('LeafletController',
    ['$scope', '$location', '$q', 'leafletService', 'overpassAPI', 'settingsService',
    function($scope, $location, $q, leafletService, overpassAPI, settingsService){
        console.log('init LeafletController');
        $scope.settings = settingsService.settings;
        $scope.center = leafletService.center;
        $scope.zoomLevel = leafletService.center.zoom;
        $scope.layers = leafletService.layers;
        $scope.geojson = leafletService.geojson;
        $scope.loading = {};
        $scope.markers = leafletService.markers;
        var idIcon = L.icon({
            iconUrl: 'images/id-icon.png',
            shadowUrl: 'images/marker-shadow.png',
            iconSize:     [15, 21], // size of the icon
            shadowSize:   [20, 30], // size of the shadow
            iconAnchor:   [15, 21], // point of the icon which will correspond to marker's location
            shadowAnchor: [4, 30],  // the same for the shadow
            popupAnchor:  [-3, -20] // point from which the popup should open relative to the iconAnchor
        });
/*        $scope.overpassToLayer = function(query, filter){
            var deferred = $q.defer();
            var onError = function(error){
                deferred.reject(error);
            };
            overpassAPI.overpassToGeoJSON(query, filter).then(function(geojson){
                leafletService.getMap().then(function(map){
                    if ($scope.overpassLayer !== undefined){
                        map.removeLayer($scope.overpassLayer);
                    }
                    $scope.overpassLayer = L.geoJson(geojson, osmGEOJSONOptions);
                    $scope.overpassLayer.addTo(map);
                    deferred.resolve($scope.overpassLayer);
                }, onError);
            });
            return deferred.promise;
        };*/
        $scope.hideGeoJSON = function(uri){
            leafletService.hideLayer(uri);
        };
        $scope.displayGeoJSON = function(uri){
            console.log('display '+ uri);
            leafletService.displayLayer(uri);
        };
        $scope.updateLocationMarker = function(lat, lng){
            if (typeof(lat) !== 'number'){
                lat = parseFloat(lat);
            }
            if (typeof(lng) !== 'number'){
                lng = parseFloat(lng);
            }
            if ($scope.markers.location === undefined){
                $scope.markers.location = {
                    lat: lat,
                    lng: lng,
                    message: 'My Position',
                    tags:{}
                };
            }else{
                $scope.markers.location.lat = lat;
                $scope.markers.location.lng = lng;
            }
        };
        $scope.updateLocation = function(){
            if(navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position){
                    leafletService.getMap().then(function(map){
                        map.setView(new L.LatLng(
                            position.coords.latitude,
                            position.coords.longitude
                        ), map.getZoom());
                    });
                    $scope.updateLocationMarker(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    $scope.localised = true;
                }, function(error){
                    $scope.errorLocalisation = error;
                    console.error(error);
                });
            } else {
                $scope.disabledLocation = true;
            }
        };
        $scope.toggleNewNode = function(){
            if ($scope.markers.newNode === undefined){
                $scope.markers.newNode = {
                    lat: $scope.center.lat,
                    lng: $scope.center.lng,
                    message: 'Center',
                    tags:{}
                };
            }else{
                delete $scope.markers.newNode;
            }
        };

        //initialize
        leafletService.getMap().then(function(map){
            $scope.map = map;
            map.on('zoomend', function(){
                $scope.zoomLevel = map.getZoom();
            });
        });
        $scope.$watch('center', function(newValue, oldValue){
            if (oldValue === undefined){
                return;
            }
            if (newValue === oldValue){
                return;
            }
            var url = '/'+newValue.zoom.toString();
            url += '/'+newValue.lat.toString();
            url += '/'+newValue.lng.toString();
//            $location.path(url);
//            FIXME: use ui-router state for that, because angular reload the view
            if ($scope.markers.newNode === undefined){
                return;
            }
            $scope.markers.newNode.lat = newValue.lat;
            $scope.markers.newNode.lng = newValue.lng;
        });

    }]
);
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
        $scope.loading = {};

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
                    deferred.resolve({
                        nodes:nodes,
                        ways:ways,
                        areas: areas
                    });
                },function(error){
                    deferred.reject(error);
                });
            },function(error){
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

/*jshint strict:false */
/*global angular:false */

/*jshint strict:false */
/*global angular:false */

angular.module('osmMobileTagIt.controllers').controller('ChangesetController',
    ['$scope', '$routeParams', 'osmSettingsService', 'osmAPI',
    function($scope, $routeParams, osmSettingsService, osmAPI){
        console.log('init ChangesetController');
        $scope.comment = 'Tagging elements';
        $scope.createChangeset = function(){
            return osmAPI.createChangeset($scope.comment);
        };
        $scope.getLastOpenedChangesetId = function(){
            return osmAPI.getLastOpenedChangesetId();
        };
        $scope.closeChangeset = function(){
            osmAPI.closeChangeset();
        };
        //initialize
        if (osmSettingsService.getChangeset() !== '' && osmSettingsService.getCredentials()){
            $scope.getLastOpenedChangesetId().then(function(data){
                $scope.changesetID = data;
            });
        }
        $scope.$watch(function(){
            if ($scope.changesetID !== osmSettingsService.getChangeset()){
                $scope.changesetID = osmSettingsService.getChangeset();
                return $scope.changetsetID;
            }
        });
    }]
);

angular.module('osmMobileTagIt.controllers').controller('SaveController',
    ['$scope', '$routeParams', 'settingsService', 'osmAPI', 'osmSettingsService',
    function($scope, $routeParams, settingsService, osmAPI, osmSettingsService){
        console.log('init SaveController');
        $scope.relationID = $routeParams.lineRelationId ||
        $routeParams.masterRelationId ||
            $routeParams.mainRelationId;
        $scope.loading = {};
        $scope.loading.updateTags = {loading:false,ok:false,ko:false};
        $scope.addNode = function(){
            console.log('addNode');
            osmAPI.createNode({
                tags: $scope.markers.newNode.tags,
                lng: $scope.markers.newNode.lng,
                lat: $scope.markers.newNode.lat
            });
        };
        $scope.updateTags = function(){
            $scope.loading.updateTags.loading = true;
            $scope.loading.updateTags.ok = false;
            $scope.loading.updateTags.ko = false;
            console.log('updateTags');
            var settings = osmSettingsService;
            var geometry = $scope.currentElement.geometry.type;
            var method, tagName;
            if (geometry === 'Point'){
                if ($scope.currentElement.id.indexOf('node') === -1){
                    method = '/0.6/node/' + $scope.currentElement.id;
                }else{
                    method = '/0.6/' + $scope.currentElement.id;
                }
                tagName = 'node';
            }else if (geometry === 'Polygon' || geometry === 'LineString'){
                if ($scope.currentElement.id.indexOf('way') === -1){
                    method = '/0.6/way/' + $scope.currentElement.id;
                }else{
                    method = '/0.6/' + $scope.currentElement.id;
                }
                tagName = 'way';
            }
            osmAPI.get(method)
                .then(function(nodeDOM){
                    var source = $scope.currentElement.properties;
                    if (source.tags){ //support for osm2geojson -> properties.tags, ...
                        source = source.tags;
                    }
                    var target = nodeDOM.getElementsByTagName('tag');
                    console.log(osmAPI.serialiseXmlToString(nodeDOM));
                    var key, value;
                    for (var i = 0; i < target.length; i++) {
                        key = target[i].getAttribute('k');
                        value = source[key];
                        target[i].setAttribute('v', value);
                    }
                    var nodeElement = nodeDOM.getElementsByTagName(tagName)[0];
                    nodeElement.setAttribute('changeset', settings.getChangeset());
                    nodeElement.setAttribute('timestamp', new Date().toISOString());
                    nodeElement.setAttribute('user', settings.getUserName());
                    var content = osmAPI.serialiseXmlToString(nodeDOM);
                    console.log(content);
                    osmAPI.put(method, content)
                        .then(function(){
                            $scope.loading.updateTags.loading = false;
                            $scope.loading.updateTags.ok = true;
                            $scope.loading.updateTags.ko = false;
                        }, function(error){
                            $scope.loading.updateTags.loading = false;
                            $scope.loading.updateTags.ok = false;
                            $scope.loading.updateTags.ko = true;
                            $scope.loading.updateTags.msg = error;
                        });
                }, function(error){
                    $scope.loading.updateTags.loading = false;
                    $scope.loading.updateTags.ok = false;
                    $scope.loading.updateTags.ko = true;
                    $scope.loading.updateTags.msg = error;
                });
        };
        $scope.debug = function(){
            $scope.relationXMLOutput = $scope.getRelationXML();
        };
    }]
);
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

/*jshint strict:false */
/*global angular:false */

angular.module('osmMobileTagIt').directive('tagsTable', function(){
    return {
        restrict: 'A',
        replace: true,
        templateUrl: 'partials/tagsTable.html',
        controller: 'TagsTableController',
        scope: {
            tags: '='
        }
    };
});
angular.module('osmMobileTagIt.services').factory('tagsService',
    ['$q', 'osmTagInfoAPI', function($q, osmTagInfoAPI){
        return {
            '_cached': {},
            get: function(key){
                var deferred = $q.defer();
                var self = this;
                if (self._cached[key] === undefined){
                    osmTagInfoAPI.getKeyValues({
                        //key=shop&lang=fr&sortname=count&sortorder=desc&page=1&rp=400&format=json_pretty
                        key:key,
                        lang:'fr',
                        sortname:'count',
                        sortorder:'desc',
                        page:1,
                        rp:100
                    }).then(function(data){
                        self._cached[key] = data.data;
                        deferred.resolve(self._cached[key]);
                    }, function(error){
                        deferred.reject(error);
                    });
                }else{
                    deferred.resolve(self._cached[key]);
                }
                return deferred.promise;
            }
        };
    }]
);
angular.module('osmMobileTagIt.controllers').controller('TagsTableController',
    ['$scope', 'settingsService', 'tagsService',
    function($scope, settingsService, tagsService){
        console.log('init TagsTableController');
        $scope.loggedin = settingsService.settings.credentials;
        $scope.newTagKey = '';
        $scope.newTagValue = '';
        $scope.tagValues = {};
        $scope.addTag = function(){
            if ($scope.newTagKey && $scope.newTagValue){
                $scope.tags[$scope.newTagKey] = $scope.newTagValue;
            }
        };
        $scope.removeTag = function(key){
            delete $scope.tags[key];
        };
        $scope.addTagValue = function(k, v){
            $scope.tags[k] = v;
            /*tagsService.get(k).then(function(values){
                $scope.tagValues[k] = values;
            });*/
        };
        $scope.loadTagValues = function(tags){
            for (var k in tags) {
                if ($scope.tagValues[k] === undefined && k.indexOf(':')===-1 && k!== 'source' && k!== 'name'){
                    console.log('load tags for ' +k);
                    tagsService.get(k).then(function(values){
                        $scope.tagValues[k] = values;
                    });
                }
            }
        };
    }]
);