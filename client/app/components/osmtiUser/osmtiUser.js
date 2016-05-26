import osmtiUserComponent from './osmtiUser.component';
import osm from 'angular-osm';

let osmtiUserModule = angular.module('osmtiUser', [
    'osm.oauth',
    'osm.api'
])

.component('osmtiUser', osmtiUserComponent)
.config(config);

function config(osmAuthServiceProvider) {
    osmAuthServiceProvider.options = {
        oauth_consumer_key: 'Y4mIaH1rx9qqjYFo9mjDEc7rArpP7rFkj1hLl3Mj',
        oauth_secret: 'EkXrocMrHbtSQ3r9VH0D7KH6oAEhfJ6elImVRBzB'
    };
}
config.$inject = ['osmAuthServiceProvider'];

export default osmtiUserModule;
