import 'x2js';
import angularOsm from 'angular-osm';
import angularLeaflet from 'angular-leaflet-light';
import angularUiBootstrap from 'angular-ui-bootstrap';

import oauth from './components/oauth/oauth';
//import map from './map';

angular.module('osmMobileTagIt', [
    oauth.name,
    'angular-leaflet',
    'ui.bootstrap'
//    map.name
]);
