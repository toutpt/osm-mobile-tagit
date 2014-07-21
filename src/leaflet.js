/*jshint strict:false */
/*global angular:false */
/*global L:false */
L.Icon.Default.imagePath = 'images/';

angular.module('osm.services').factory('leafletService',
    ['$q', 'leafletData', 'osmService', function($q, leafletData, osmService){
        return {
            center: {lat: 47.2150, lng: -1.5551, zoom: 18},//, autoDiscover: true},
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

angular.module('osm.controllers').controller('LeafletController',
    ['$scope', '$q', 'leafletService', 'osmService', 'settingsService',
    function($scope, $q, leafletService, osmService, settingsService){
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
            osmService.overpassToGeoJSON(query, filter).then(function(geojson){
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
        $scope.loadOverpassBusStop = function(){
            $scope.loading.busstop = true;
            $scope.loading.busstopOK = false;
            $scope.loading.busstopKO = false;
            var onError = function(){
                $scope.loading.busstop = false;
                $scope.loading.busstopOK = false;
                $scope.loading.busstopKO = true;
            };
            var onSuccess = function(){
                $scope.loading.busstop = false;
                $scope.loading.busstopOK = true;
                $scope.loading.busstopKO = false;
            };
            leafletService.getBBox().then(function(bbox){
                var filter = function(feature){
                    return feature.geometry.type !== 'Point';
                };
                var query = '<?xml version="1.0" encoding="UTF-8"?>';
                query += '<osm-script output="json" timeout="10"><union>';
                query += '<query type="node">';
                query += '<has-kv k="highway" v="bus_stop"/>';
                query += '<bbox-query ' + bbox + '/>';
                query += '</query>';
                query += '<query type="node">';
                query += '<has-kv k="public_transport" v="stop_position"/>';
                query += '<bbox-query ' + bbox + '/>';
                query += '</query></union>';
                query += '<print mode="body"/>';
                query += '<recurse type="down"/>';
                query += '<print mode="skeleton" order="quadtile"/>';
                query += '</osm-script>';
                $scope.overpassToLayer(query, filter).then(onSuccess,onError);
            },onError);
        };
        $scope.loadOverpassWays = function(){
            $scope.loading.ways = true;
            $scope.loading.waysOK = false;
            $scope.loading.waysKO = false;
            var onError = function(){
                $scope.loading.ways = false;
                $scope.loading.waysOK = false;
                $scope.loading.waysKO = true;
            };
            var onSuccess = function(){
                $scope.loading.ways = false;
                $scope.loading.waysOK = true;
                $scope.loading.waysKO = false;
            };
            leafletService.getBBox().then(function(bbox){
                var query = '<?xml version="1.0" encoding="UTF-8"?>';
                query += '<osm-script output="json" timeout="25"><union>';
                query += '<query type="way">';
                query += '<has-kv k="highway"/>';
                query += '<bbox-query ' + bbox + '/>';
                query += '</query></union>';
                query += '<print mode="body"/>';
                query += '<recurse type="down"/>';
                query += '<print mode="skeleton" order="quadtile"/>';
                query += '</osm-script>';
                var filter = function(feature){
                    return feature.geometry.type !== 'LineString';
                };
                $scope.overpassToLayer(query, filter).then(onSuccess, onError);
            }, onError);
        };
        $scope.loadOSMWays = function(){
            $scope.loadOSMData(function(feature){
                return feature.geometry.type !== 'LineString';
            }, function(){
                $scope.loading.ways = false;
                $scope.loading.waysOK = false;
                $scope.loading.waysKO = true;
            });
        };
        $scope.loadBusStop = function(){
            $scope.loadOSMData(function(feature){
                var filterIsNotPoint = feature.geometry.type !== 'Point';
                var filterIsNotBusStop = feature.properties.highway !== 'bus_stop';
                var filterIsNotPublicTransport = feature.properties.public_transport !== 'stop_position';
                return (filterIsNotPoint && (filterIsNotBusStop || filterIsNotPublicTransport));
            });
        };
        $scope.loadOSMData = function(filter){
            leafletService.getMap().then(function(map){
                var b = map.getBounds();
                var bbox = '' + b.getWest() + ',' + b.getSouth() + ',' + b.getEast() + ',' + b.getNorth();
                // s="47.1166" n="47.310" w="-1.7523" e="-1.3718
                //var bbox = 'w="' + b.getWest() + '" s="' + b.getSouth() + '" e="' + b.getEast() + '" n="' + b.getNorth() + '"';
                osmService.getMapGeoJSON(bbox).then(function(nodes){
                    $scope.nodes = nodes;
                    var feature, newFeatures = [];
                    for (var i = 0; i < $scope.nodes.features.length; i++) {
                        feature = $scope.nodes.features[i];
                        if (!filter(feature)){
                            newFeatures.push(feature);
                        }
                    }
                    $scope.nodes.features = newFeatures;
                    //display them on the map
                    $scope.leafletGeojson = {
                        data: $scope.nodes,
                        pointToLayer: pointToLayer
                    };
                });
            });
        };
        $scope.addNodeToRelation = function(node, newIndex){
            var features = $scope.relation.features;
            features.push($scope.currentNode);
            if ($scope.currentNode.geometry.type === 'LineString'){
                $scope.members.push({
                    type: 'way',
                    ref: $scope.currentNode.id,
                    role: '',
                    name: $scope.currentNode.properties.name
                });
            }else if ($scope.currentNode.geometry.type === 'Point'){
                $scope.members.push({
                    type: 'node',
                    ref: $scope.currentNode.id,
                    role: 'plateform',
                    name: $scope.currentNode.properties.name
                });
            }
            if (!isNaN(newIndex)){
                $scope.moveMemberFromIndexToIndex($scope.members.length-1, newIndex);
            }
            leafletService.addGeoJSONLayer(
                'relation',
                $scope.relation,
                $scope.relation.options
            );
        };
        $scope.addGeoJSON = function(uri){
            if ($scope.settings.geojsonLayers.indexOf(uri) === -1){
                $scope.settings.geojsonLayers.push(uri);
            }
            leafletService.loadExternalLayers($scope.settings.geojsonLayers);
        };
        $scope.removeGeoJSON = function(uri){
            var index = $scope.settings.geojsonLayers.indexOf(uri);
            if (index !== -1){
                $scope.settings.geojsonLayers.splice(index, 1);
            }
            leafletService.hideLayer(uri);
        };
        $scope.hideGeoJSON = function(uri){
            leafletService.hideLayer(uri);
        };
        $scope.displayGeoJSON = function(uri){
            console.log('display '+ uri);
            leafletService.displayLayer(uri);
        };
        $scope.updateLocationMarker = function(lat, lng){
            console.log(JSON.stringify(lat));
            console.log(JSON.stringify(lng));
            if (typeof(lat) !== "number"){
                lat = parseFloat(lat);
            }
            if (typeof(lng) !== "number"){
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
        $scope.addNode = function(){
            $scope.markers.newNode = {
                lat: $scope.center.lat,
                lng: $scope.center.lng,
                message: 'Center'
            };
        };

        //initialize
        leafletService.getMap().then(function(map){
            $scope.map = map;
            map.on('zoomend', function(){
                $scope.zoomLevel = map.getZoom();
            });
        });
    }]
);