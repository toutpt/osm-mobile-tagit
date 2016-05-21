import OsmtiEditModule from './osmtiEdit'
import OsmtiEditController from './osmtiEdit.controller';
import OsmtiEditComponent from './osmtiEdit.component';
import OsmtiEditTemplate from './osmtiEdit.html';

describe('OsmtiEdit', () => {
  let $rootScope, makeController;

  beforeEach(window.module(OsmtiEditModule.name));
  beforeEach(inject((_$rootScope_) => {
    $rootScope = _$rootScope_;
    makeController = () => {
      return new OsmtiEditController();
    };
  }));

  describe('Module', () => {
    // top-level specs: i.e., routes, injection, naming
  });

  describe('Controller', () => {
    // controller specs
    it('has a name property [REMOVE]', () => { // erase if removing this.name from the controller
      let controller = makeController();
      expect(controller).to.have.property('name');
    });
  });

  describe('Template', () => {
    // template specs
    // tip: use regex to ensure correct bindings are used e.g., {{  }}
    it('has name in template [REMOVE]', () => {
      expect(OsmtiEditTemplate).to.match(/{{\s?vm\.name\s?}}/g);
    });
  });

  describe('Component', () => {
      // component/directive specs
      let component = OsmtiEditComponent;

      it('includes the intended template',() => {
        expect(component.template).to.equal(OsmtiEditTemplate);
      });

      it('uses `controllerAs` syntax', () => {
        expect(component).to.have.property('controllerAs');
      });

      it('invokes the right controller', () => {
        expect(component.controller).to.equal(OsmtiEditController);
      });
  });
});
