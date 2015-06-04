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
	
	.config(["$firebaseHelperProvider", function($firebaseHelperProvider){
		// data
		$firebaseHelperProvider.namespace('mismith-info');
	}])
	
	.controller('AppCtrl', ["$scope", "$firebaseHelper", "$q", function($scope, $firebaseHelper, $q){
		$scope.jsonData = $firebaseHelper.array('nodes'); //.$bindTo($scope, 'jsonData');
		
		var packages = {
			// Lazily construct the package hierarchy from class names.
			root: function(classes) {
				var map = {};
				
				function find(name, data) {
					var node = map[name], i;
					if ( ! node) {
						node = map[name] = data || {name: name, children: []};
						if (name.length) {
							node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
							node.parent.children.push(node);
						}
					}
					return node;
				}
				
				classes.forEach(function(d) {
					find(d.$id, d);
				});
				
				return map[""];
			},
			
			// Return a list of imports for the given array of nodes.
			imports: function(nodes) {
				var map = {},
				imports = [];
				
				// Compute a map from name to node.
				nodes.forEach(function(d) {
					map[d.$id] = d;
				});
				
				// For each import, construct a link from the source to target node.
				nodes.forEach(function(d) {
					if (d.links) d.links.forEach(function(i) {
						imports.push({source: map[d.$id], target: map[i]});
					});
				});
				
				return imports;
			}
		};
		
		
		var w = 600,
			h = w,
			rx = w / 2,
			ry = h / 2;
		
		var splines = [];
		
		var cluster = d3.layout.cluster()
			.size([360, ry - 120])
			.sort(function(a, b) { return d3.ascending(a.$id, b.$id); });
		
		var bundle = d3.layout.bundle();
		
		$scope.arc = d3.svg.arc().outerRadius(ry - 120).innerRadius(0).startAngle(0).endAngle(2 * Math.PI);
		$scope.line = d3.svg.line.radial()
			.interpolate("bundle")
			.tension(.085)
			.radius(function(d) { return d.y; })
			.angle(function(d) { return d.x / 180 * Math.PI; });
		
		$scope.icon = function(d){
			var p = 'assets/img/icons/';
			switch(d.icon){
				case 'icns': p += 'icns/' + d.$id + '.iconset/icon_128x128@2x.png'; break;
				case 'svg': p += 'svg/' + d.$id + '.svg'; break;
				case 'png': p += 'png/' + d.$id + '.png'; break;
			}
			return p;
		}
		$scope.jsonData.$loaded(function(classes){
			classes = angular.copy(classes); // clone so we don't affect the firebase-synced array
			
			// @TODO: set these up as dynamic watchers so that when firebase changes, these are re-init
			$scope.nodes   = cluster.nodes(packages.root(classes)),
			$scope.links   = packages.imports($scope.nodes),
			$scope.splines = bundle($scope.links);
		});
		
		
		
		
		var linksLabel = 'links',
			linked     = $scope.linked = {};
		
		$scope.link = function(item, event){
			var key = item.$id;
			
			if(linked.key && linked.item){
				var unlink = function(){
					if( ! event || ! event.shiftKey){
						// un/re-set
						delete linked.item.$linked;
						linked = $scope.linked = {};
					}
				}
				if(key != linked.key){
					var source = $firebaseHelper.object('nodes', linked.key),
						target = $firebaseHelper.object('nodes', key);
					
					$q.all([source.$loaded(), target.$loaded()]).then(function(d){
						// make the changes locally
						source[linksLabel] = source[linksLabel] || [];
						var i = source[linksLabel].indexOf(key);
						if(i < 0) source[linksLabel].push(key); else source[linksLabel].splice(i, 1);
						
						target[linksLabel] = target[linksLabel] || [];
						i = target[linksLabel].indexOf(linked.key);
						if(i < 0) target[linksLabel].push(linked.key); else target[linksLabel].splice(i, 1);
						
						// save the changes
						source.$save();
						target.$save();
					}).finally(function(){
						unlink();
					});
				}else{
					unlink();
				}
			}else{
				item.$linked = true;
				
				linked.key  = key;
				linked.item = item;
			}
		};
/*
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
*/
	}]);