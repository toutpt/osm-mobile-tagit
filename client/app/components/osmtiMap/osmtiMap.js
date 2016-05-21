import osmtiMapComponent from './osmtiMap.component';

let osmtiMapModule = angular.module('osmtiMap', [
    'angular-leaflet'
])

.component('osmtiMap', osmtiMapComponent);

export default osmtiMapModule;
