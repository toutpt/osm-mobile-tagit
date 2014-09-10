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
            getBBox: function(){
                var self = this;
                var deferred = $q.defer();
                self.getMap().then(function(map){
                    var b = map.getBounds();
                    //var bbox = '' + b.getWest() + ',' + b.getSouth() + ',' + b.getEast() + ',' + b.getNorth();
                    // s="47.1166" n="47.310" w="-1.7523" e="-1.3718
                    var bbox = 'w="' + b.getWest() + '" s="' + b.getSouth() + '" e="' + b.getEast() + '" n="' + b.getNorth() + '"';
                    deferred.resolve(bbox);
                });
                return deferred.promise;
            }
        };
    }]
);

angular.module('osmMobileTagIt.controllers').controller('LeafletController',
    ['$scope', '$q', 'leafletService', 'overpassAPI', 'settingsService',
    function($scope, $q, leafletService, overpassAPI, settingsService){
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
        $scope.overpassToLayer = function(query, filter){
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
        };
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
                    message: 'My Position'
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
                    message: 'Center'
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
        $scope.addNode = function(node){
            console.log('addNode');
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
                method = '/0.6/node/'+$scope.currentElement.id;
                tagName = 'node';
            }else if (geometry === 'Polygon' || geometry === 'LineString'){
                method = '/0.6/way/'+$scope.currentElement.id;
                tagName = 'way';
            }
            osmAPI.get(method)
                .then(function(nodeDOM){
                    var source = $scope.currentElement.properties;
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

angular.module('osmMobileTagIt.controllers').controller('TagsTableController',
    ['$scope', 'settingsService',
    function($scope, settingsService){
        console.log('init TagsTableController');
        $scope.loggedin = settingsService.settings.credentials;
        $scope.newTagKey = '';
        $scope.newTagValue = '';
        $scope.addTag = function(){
            if ($scope.newTagKey && $scope.newTagValue){
                $scope.tags[$scope.newTagKey] = $scope.newTagValue;
            }
        };
        $scope.removeTag = function(key){
            delete $scope.tags[key];
        };
    }]
);
