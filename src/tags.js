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
            '_cachedKeyValues': {},
            '_cachedKeyWikiPages': {},
            '_cachedKeysAll': undefined,
            getKeysAll: function(){
                var deferred = $q.defer();
                var self = this;
                if (self._cachedKeysAll === undefined){
                    osmTagInfoAPI.getKeysAll({
                        sortname:'count_all',
                        sortorder:'desc',
                        page:1,
                        rp:100
                    }).then(function(data){
                        self._cachedKeysAll = data.data;
                        deferred.resolve(self._cachedKeysAll);
                    }, function(error){
                        deferred.reject(error);
                    });
                }else{
                    deferred.resolve(self._cachedKeysAll);
                }
                return deferred.promise;
            },
            getKeyValues: function(key){
                var deferred = $q.defer();
                var self = this;
                if (self._cachedKeyValues[key] === undefined){
                    osmTagInfoAPI.getKeyValues({
                        //key=shop&lang=fr&sortname=count&sortorder=desc&page=1&rp=400&format=json_pretty
                        key:key,
                        lang:'fr',
                        sortname:'count',
                        sortorder:'desc',
                        page:1,
                        rp:100
                    }).then(function(data){
                        self._cachedKeyValues[key] = data.data;
                        deferred.resolve(self._cachedKeyValues[key]);
                    }, function(error){
                        deferred.reject(error);
                    });
                }else{
                    deferred.resolve(self._cachedKeyValues[key]);
                }
                return deferred.promise;
            },
            getKeyWikiPages: function(key){
                var deferred = $q.defer();
                var self = this;
                if (self._cachedKeyWikiPages[key] === undefined){
                    osmTagInfoAPI.getKeyWikiPages({
                        //key=shop&lang=fr&sortname=count&sortorder=desc&page=1&rp=400&format=json_pretty
                        key:key
                    }).then(function(wikipages){
                        self._cachedKeyWikiPages[key] = wikipages;
                        deferred.resolve(self._cachedKeyWikiPages[key]);
                    }, function(error){
                        deferred.reject(error);
                    });
                }else{
                    deferred.resolve(self._cachedKeyWikiPages[key]);
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
        $scope.tagValues = {};
        $scope.tagWikiPages = {};
        $scope.addTagValue = function(k, v){
            if (k === undefined){
                k = $scope.newTagKey;
            }
            if (k !== undefined){
                if($scope.tags[k] === undefined){
                    $scope.tags[k] = '';
                    $scope.newTagKey = '';
                }else if (v !== undefined){
                    $scope.tags[k] = v;
                }
            }
        };
        $scope.removeTag = function(key){
            delete $scope.tags[key];
        };
        $scope.toggleTagInfo = function(k){
            if ($scope.tagWikiPages[k] !== undefined){
                $scope.tagWikiPages[k] = undefined;
            }else{
                var getWikiPageByLang = function(wikipages, lang){
                    for (var i = 0; i < wikipages.length; i++) {
                        if (wikipages[i].lang === lang){
                            return wikipages[i];
                        }
                    }
                };
                tagsService.getKeyWikiPages(k).then(function(wikipages){
                    if ($scope.tagWikiPages[k]===undefined){
                        $scope.tagWikiPages[k] = getWikiPageByLang(wikipages, 'fr');
                        if ($scope.tagWikiPages[k]===undefined){
                            $scope.tagWikiPages[k] = getWikiPageByLang(wikipages, 'en');
                        }
                    }
                });
            }
            if ($scope.tagValues[k] !== undefined){
                $scope.tagValues[k] = undefined;
            }else{
                tagsService.getKeyValues(k).then(function(values){
                    $scope.tagValues[k] = values;
                });
            }
        };
        $scope.toggleKeysInfo = function(){
            if ($scope.keys === undefined){
                tagsService.getKeysAll().then(function(data){
                    $scope.keys = data;
                });
            }else{
                $scope.keys = undefined;
            }
        };
    }]
);