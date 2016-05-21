import template from './osmtiUser.html';
import controller from './osmtiUser.controller';
import './osmtiUser.styl';

let osmtiUserComponent = {
  restrict: 'E',
  bindings: {},
  template,
  controller,
  controllerAs: 'vm'
};

export default osmtiUserComponent;
