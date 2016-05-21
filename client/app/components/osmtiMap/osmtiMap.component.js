import template from './osmtiMap.html';
import controller from './osmtiMap.controller';
import './osmtiMap.styl';

let osmtiMapComponent = {
  restrict: 'E',
  bindings: {},
  template,
  controller,
  controllerAs: 'vm'
};

export default osmtiMapComponent;
