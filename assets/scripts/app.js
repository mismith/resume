angular.module('XXXXXX', ['ui.bootstrap', 'firebaseHelper', 'json-tree'])
	
	.run(function(){
		// remove 300ms click delay on touch devices
		FastClick.attach(document.body);
		
		// fix vh units in ios7 (and others)
		viewportUnitsBuggyfill.init();
	})
	
	.config(function($firebaseHelperProvider){
		// data
		$firebaseHelperProvider.namespace('mismith');
	})
	
	.controller('AppCtrl', function($rootScope){
		$rootScope.jsonData = {
			"social": {
				"github": {
					"name": "Github",
					"link": "https://github.com/mismith",
					"user": "mismith"
				},
				"twitter": {
					"name": "Twitter",
					"link": "https://twitter.com/mismith",
					"user": "_mismith"
				},
				"facebook": {
					"name": "Facebook",
					"link": "https://www.facebook.com/mismith",
					"user": "mismith"
				},
				"github": {
					"name": "Instagram",
					"link": "https://instagram.com/_mismith/",
					"user": "_mismith"
				},
				"stackoverflow": {
					"name": "Stack Overflow",
					"link": "http://stackoverflow.com/users/888928/murray-smith"
				},
				"tumblr": {
					"name": "Tumblr",
					"link": "http://mismith.tumblr.com/",
					"user": "mismith"
				},
				"quora": {
					"name": "Quora",
					"link": "http://www.quora.com/Murray-Smith-1"
				},
				"linkedin": {
					"name": "LinkedIn",
					"link": "https://www.linkedin.com/in/murrayiainsmith"
				},
				"reddit": {
					"name": "Reddit",
					"link": "http://www.reddit.com/user/mismith/"
				},
				"lastfm": {
					"name": "Last.fm",
					"link": "http://www.last.fm/user/cinesmith"
				},
				"rdio": {
					"name": "Rdio",
					"link": "http://www.rdio.com/people/murrayiainsmith/"
				},
			},
			"software": {
				
			},
			"technology": {
				
			}
		};
	});