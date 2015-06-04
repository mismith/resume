angular.module('XXXXXX', ['ui.bootstrap', 'firebaseHelper'])
	
	.run(function(){
		// remove 300ms click delay on touch devices
		FastClick.attach(document.body);
		
		// fix vh units in ios7 (and others)
		viewportUnitsBuggyfill.init();
		
		// array helpers
		Array.prototype.unique = function() {
			var a = this.concat();
			for(var i=0; i<a.length; ++i) {
				for(var j=i+1; j<a.length; ++j) {
					if(a[i] === a[j]) a.splice(j--, 1);
				}
			}
			
			return a;
		};
	})
	
	.config(function($firebaseHelperProvider){
		// data
		$firebaseHelperProvider.namespace('mismith');
	})
	
	.controller('AppCtrl', function($scope, $http){
		$http.get('data.json').success(function(data){
			$scope.jsonData = data;
		});
		
		var linksLabel = 'links',
			linked     = $scope.linked = {};
		
		$scope.link = function(key, item, event){
			if(linked.key && linked.item){
				if(key != linked.key){
					item[linksLabel] = item[linksLabel] || [];
					var i = item[linksLabel].indexOf(linked.key);
					if(i < 0) item[linksLabel].push(linked.key); else item[linksLabel].splice(i, 1);
					
					linked.item[linksLabel] = linked.item[linksLabel] || [];
					i = linked.item[linksLabel].indexOf(key);
					if(i < 0) linked.item[linksLabel].push(key); else linked.item[linksLabel].splice(i, 1);
				}
				if( ! event || ! event.shiftKey){
					// un/re-set
					delete linked.item.$linked;
					linked = $scope.linked = {};
				}
			}else{
				item.$linked = true;
				
				linked.key  = key;
				linked.item = item;
			}
		};
		$scope.linkedKeys = function(key, depth){
			depth = depth || 1;
			
			var keys = [];
			if(depth > 1){
				angular.forEach($scope.jsonData[key][linksLabel], function(k){
					keys = keys.concat($scope.linkedKeys(k, depth - 1));
				});
			}else{
				// we're at depth
				keys = keys.concat($scope.jsonData[key][linksLabel]);
			}
			
			// remove duplicates
			for(var i=0; i<keys.length; ++i) {
				for(var j=i+1; j<keys.length; ++j) {
					if(keys[i] === keys[j]) keys.splice(j--, 1);
				}
			}
			
			// remove source key
			var k = keys.indexOf(key)
			if(k >= 0) keys.splice(k, 1);
			
			return keys;
		};
		$scope.isLinked = function(key, depth){
			return linked.key ? ($scope.linkedKeys(linked.key, depth).indexOf(key) >= 0) : false;
		};
	});