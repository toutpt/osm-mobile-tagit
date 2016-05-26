import osmtiMapComponent from './osmtiMap.component';
import leaflet from 'angular-leaflet-light';

let osmtiMapModule = angular.module('osmtiMap', [
    leaflet.name
])

.component('osmtiMap', osmtiMapComponent);

export default osmtiMapModule;
