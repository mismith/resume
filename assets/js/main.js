'use strict';

var MiResume = Vue.extend({
	data: function data() {
		return {
			resume: null,
			isActive: []
		};
	},

	methods: {
		listOfNames: function listOfNames(items) {
			if (!items) return;

			var names = [].concat(items);
			this.sortByName(names);
			return names.map(function (item) {
				return item.name;
			}).join(', ');
		},
		sortByName: function sortByName(items) {
			return items.sort(function (a, b) {
				return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
			});
		},
		sortByPriority: function sortByPriority(items) {
			return items.sort(function (a, b) {
				return (a.priority || items.length) < (b.priority || items.length) ? -1 : 1;
			});
		},
		topPicks: function topPicks(items) {
			var num = arguments.length <= 1 || arguments[1] === undefined ? 3 : arguments[1];

			if (!items) return;

			var picks = [].concat(items);
			this.sortByPriority(picks);
			return this.listOfNames(picks.slice(0, num - 1)) + ', and ' + this.listOfNames(picks.slice(num - 1, num));
		},
		replaceStrings: function replaceStrings(text, replacements) {
			if (!text || !replacements) return;

			var regex = new RegExp('\\$\\{(' + Object.keys(replacements).join('|') + ')\\}', 'ig');
			return text.replace(regex, function (m, key) {
				return replacements[key];
			});
		},
		getActive: function getActive(item) {
			return this.isActive.indexOf(item) >= 0;
		},
		toggleActive: function toggleActive(item) {
			return this.getActive(item) ? this.isActive.splice(this.isActive.indexOf(item), 1) : this.isActive.push(item);
		}
	},
	init: function init() {
		var _this = this;

		fetch('resume.json').then(function (res) {
			return res.json();
		}).then(function (json) {
			return _this.resume = json;
		});
	},

	template: '\n<section>\n\t<header>\n\t\t<img :src="resume.info.image" />\n\t\t<h1>{{ resume.info.name }}</h1>\n\t\t<p>{{ resume.info.description }}</p>\n\t</header>\n\t<article class="about">\n\t\t<header>\n\t\t\t<h2>about</h2>\n\t\t</header>\n\t\t<ul>\n\t\t\t<li v-for="skill in resume.skills">\n\t\t\t\t<strong>{{ skill.name }}</strong>:\n\t\t\t\t<span>{{ skill.description + (skill.items ? topPicks(skill.items) + \'.\' : \'\') }}</span>\n\t\t\t\t<a v-if="skill.items" href @click.prevent="toggleActive(skill)">Show {{ getActive(skill) ? \'Less\' : \'More\' }}</a>\n\t\t\t\t<p v-if="skill.items" v-show="getActive(skill)">{{ listOfNames(skill.items) }}</p>\n\t\t\t</li>\n\t\t</ul>\n\t</article>\n\t<article v-for="section of [\'social\',\'experience\',\'education\',\'volunteering\']" :class="section">\n\t\t<header>\n\t\t\t<h2>{{ section }}</h2>\n\t\t</header>\n\t\t<ol>\n\t\t\t<li v-for="item of resume[section]">\n\t\t\t\t<header>\n\t\t\t\t\t<span v-if="item.title"><strong>{{ item.title }}</strong>,</span>\n\t\t\t\t\t<a v-if="item.url" :href="item.url" target="_blank">{{ item.name }}</a>\n\t\t\t\t\t<small v-if="item.duration">{{ item.duration }}</small>\n\t\t\t\t</header>\n\t\t\t\t<div v-if="item.description">{{ item.description }}</div>\n\t\t\t</li>\n\t\t</ol>\n\t</article>\n</section>'
});

var MiApp = new Vue({
	el: '#app',
	components: {
		MiResume: MiResume
	},
	template: '<mi-resume></mi-resume>'
});