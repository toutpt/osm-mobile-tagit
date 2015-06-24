/*jshint strict:false */
/*global angular:false */
/*global L:false */
L.Icon.Default.imagePath = 'images/';

angular.module('osmMobileTagIt.services').factory('leafletService',
    ['$q', 'leafletData', '$location', function($q, leafletData, $location){
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
            initMap: function () {
                var self = this;
                var s = $location.search();
                if (s.zoom) {
                    self.center.zoom = parseInt(s.zoom, 10);
                }
                if (s.lat && s.lng) {
                    self.center.lat = parseFloat(s.lat);
                    self.center.lng = parseFloat(s.lng);
                }
                return leafletData.getMap().then(function (map) {
                    map.on('zoomend', function () {
                        $location.search('zoom', self.center.zoom);
                    });
                    return map;
                });
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
        leafletService.initMap().then(function(map){
            $scope.map = map;
        });
        $scope.$watch('center', function(newValue, oldValue){
            $location.search('lat', newValue.lat);
            $location.search('lng', newValue.lng);
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