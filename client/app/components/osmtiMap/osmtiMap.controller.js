class OsmtiMapController {
  constructor($scope, $location, leafletService) {
    this.name = 'osmtiMap';
    this.leafletService = leafletService;
    this.$scope = $scope;
    this.$location = $location;
  }
  onMapInitialized(map) {
    this.map = map;
    this.onLocationFound();
    this.onLocationError();
    this.onMoveend();
    this.onZoomend();
    var parsed = this.parseLocationPath();
    if (!parsed) {
      this.map.setZoom(16);
    } else {
      this.map.locate({
        setView: true,
        maxZoom: 18,
        enableHighAccuracy: true
      });
    }
  }
  parseLocationPath() {
    // path = /zoom/lat/lng
    var path = this.$location.path().split('/');
    if (path.length === 4) {
      this.map.setView({lat: path[2], lng: path[3]}, path[1]);
      return true;
    }
    return false;
  }
  onLocationFound() {
    var vm = this;
    function callback(e) {
      vm.map.setZoom(16);
      vm.location = e;
      //TODO: put a marker on the location found
    }
    this.leafletService.on('locationfound', callback, this.map, this.$scope);
  }
  onLocationError() {
    var vm = this;
    function callback(e) {
      vm.locationError = e; //{message, code}
    }
    this.leafletService.on('locationerror', callback, this.map, this.$scope);
  }
  onMoveend() {
    var vm = this;
    function callback(e) {
      //Sync the location into $location
      var center = vm.map.getCenter();
      var zoom = vm.map.getZoom();
      vm.$location.path(`${zoom}/${center.lat}/${center.lng}`);
    }
    this.leafletService.on('moveend', callback, this.map, this.$scope);
  }
  onZoomend() {
    var vm = this;
    function callback(e) {
      //Sync the location into $location
    }
    this.leafletService.on('zoomend', callback, this.map, this.$scope);
  }
}

OsmtiMapController.$inject = ['$scope', '$location', 'leafletService'];
export default OsmtiMapController;
