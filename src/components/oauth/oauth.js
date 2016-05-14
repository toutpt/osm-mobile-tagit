import OauthController from './oauth.controller';
import osmauth from 'osm-auth';

let oauthModule = angular.module('osmmti.oauth', ['osm.oauth', 'osm.api'])
.component('osmmtiOauth', {
    template: `<div class="col-xs-12">
        <div class="form-group ng-hide" ng-show="!$ctrl.authenticated">
            <button class="btn btn-primary btn-block" ng-click="$ctrl.login()">login</button>
        </div>
        <div class="form-group ng-hide" ng-show="$ctrl.authenticated">
            <button class="form-control btn btn-danger" ng-click="logout()">Logout</button>
        </div>
    </div>`,
    controller: OauthController
})
.config(config);

function config(osmAuthServiceProvider) {
    osmAuthServiceProvider.options = {
        oauth_consumer_key: 'Geh51IduOY2PxCcT7pLCxhJr3rBvNK6SzqgWokJw',
        oauth_secret: 'LedSRVNUaYNKpveXaxAQ9lsAXlQ8xhJ5OE72QWYI',
        //singlepage: true
    };
}

export default oauthModule;
 