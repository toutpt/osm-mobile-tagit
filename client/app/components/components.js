import Home from './home/home';
import osmtiEdit from './osmtiEdit/osmtiEdit';
import osmtiUser from './osmtiUser/osmtiUser';
import osmtiMap from './osmtiMap/osmtiMap';

let componentModule = angular.module('app.components', [
  Home.name,
  osmtiUser.name,
  osmtiMap.name,
  osmtiEdit.name
]);

export default componentModule;
