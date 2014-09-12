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
            tagsService.get(k).then(cacheTagValues);
        };
        $scope.loadTagValues = function(tags){
            debugger;
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