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
		$firebaseHelperProvider.namespace('mismith-info');
	})
	
	.controller('AppCtrl', function($scope, $firebaseHelper){
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
		
		
		var w = 1280,
			h = 800,
			rx = w / 2,
			ry = h / 2,
			m0,
			rotate = 0;
		
		var splines = [];
		
		var cluster = d3.layout.cluster()
			.size([360, ry - 120])
			.sort(function(a, b) { return d3.ascending(a.$id, b.$id); });
		
		var bundle = d3.layout.bundle();
		
		var line = $scope.line = d3.svg.line.radial()
			.interpolate("bundle")
			.tension(.085)
			.radius(function(d) { return d.y; })
			.angle(function(d) { return d.x / 180 * Math.PI; });
		
		// Chrome 15 bug: <http://code.google.com/p/chromium/issues/detail?id=98951>
		var div = d3.select("body").append("div")
			.style("top", "0")
			.style("left", "1000px")
			.style("width", w + "px")
			.style("height", w + "px")
			.style("position", "absolute")
			.style("-webkit-backface-visibility", "hidden");
		
		var svg = div
			.append("svg:svg")
				.attr("width", w)
				.attr("height", w)
			.append("svg:g")
				.attr("transform", "translate(" + rx + "," + ry + ")");
		
		svg.append("svg:path")
			.attr("class", "arc")
			.attr("d", d3.svg.arc().outerRadius(ry - 120).innerRadius(0).startAngle(0).endAngle(2 * Math.PI))
			//.on("mousedown", mousedown);
		
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
			
			var nodes = $scope.nodes = cluster.nodes(packages.root(classes)),
				links = $scope.links = packages.imports(nodes),
				splines = $scope.splines = bundle(links);
			
			var path = svg.selectAll("path.link")
				.data(links)
				.enter()
				.append("svg:path")
					.attr("class", function(d) { return "link source-" + d.source.$id + " target-" + d.target.$id; })
					.attr("d", function(d, i) { return line(splines[i]); });
			
			var g = svg.selectAll("g.node")
				.data(nodes.filter(function(n) { return ! n.children; }))
				.enter()
				.append("svg:g")
					.attr("class", "node")
					.attr("id", function(d) { return "node-" + d.$id; })
					.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ") translate(" + d.y + ")"; });
			
			g.append("svg:image")
				.attr("width", 32)
				.attr("height", 32)
				.attr("y", -16)
				.attr("transform", function(d) { return d.x < 180 ? null : "rotate(180, 16, 0)"; })
				.attr("xlink:href", function(d){
					var p = 'assets/img/icons/';
					switch(d.icon){
						case 'icns': p += 'icns/' + d.$id + '.iconset/icon_128x128@2x.png'; break;
						case 'svg': p += 'svg/' + d.$id + '.svg'; break;
						case 'png': p += 'png/' + d.$id + '.png'; break;
					}
					return p;
				});
			g.append("svg:text")
				.attr("dx", function(d) { return d.x < 180 ? 40 : -40; })
				.attr("dy", 4)
				.attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
				.attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
				.text(function(d) { return d.name; })
				//.on("mouseover", mouseover)
				//.on("mouseout", mouseout);
		});
		
		
		
		
		var linksLabel = 'children',
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