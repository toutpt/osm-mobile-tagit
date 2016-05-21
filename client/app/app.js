import Components from './components/components';
import AppComponent from './app.component';

angular.module('app', [
    Components.name
  ])

  .component('app', AppComponent);

//fake base 64

angular.module('base64', []).service('$base64', function () {});
