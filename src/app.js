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

