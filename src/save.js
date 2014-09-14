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
                    console.log('dom before modification');
                    console.log(osmAPI.serialiseXmlToString(nodeDOM));
                    var source = $scope.currentElement.properties;
                    if (source.tags){ //support for osm2geojson -> properties.tags, ...
                        source = source.tags;
                    }
                    //remove all tags and re-create them from properties
                    var parent = nodeDOM.getElementsByTagName(tagName)[0];
                    while (nodeDOM.getElementsByTagName('tag')[0]){
                        parent.removeChild(nodeDOM.getElementsByTagName('tag')[0]);
                    }
                    var tag, value;
                    for (var key in source) {
                        value = source[key];
                        tag = document.createElement('tag');
                        tag.setAttribute('k', key);
                        tag.setAttribute('v', value);
                        parent.appendChild(tag);
                    }
                    var nodeElement = nodeDOM.getElementsByTagName(tagName)[0];
                    nodeElement.setAttribute('changeset', settings.getChangeset());
                    nodeElement.setAttribute('timestamp', new Date().toISOString());
                    nodeElement.setAttribute('user', settings.getUserName());
                    nodeDOM.getElementsByTagName('osm')[0].setAttribute('generator', 'osm mobile tagit');
                    var content = osmAPI.serialiseXmlToString(nodeDOM);
                    content = content.replace(new RegExp(' xmlns="http://www.w3.org/1999/xhtml"', 'g'), '');
                    console.log('dom after modification (just before save');
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