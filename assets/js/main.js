'use strict';

var MiResume = Vue.extend({
	data: function data() {
		return {
			resume: null,
			filtered: null,
			actives: [],
			order: undefined
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
				var A = a.name.toLowerCase(),
				    B = b.name.toLowerCase();

				return A < B ? -1 : B < A ? 1 : 0;
			});
		},
		sortByPriority: function sortByPriority(items) {
			return items.sort(function (a, b) {
				var A = a.priority || items.length,
				    B = b.priority || items.length;

				return A < B ? -1 : B < A ? 1 : 0;
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
		className: function className(name) {
			return name.toLowerCase().replace(' ', '-').replace('.', '');
		},
		isActive: function isActive(item) {
			return this.actives.indexOf(item) >= 0;
		},
		toggleActive: function toggleActive(item) {
			return this.isActive(item) ? this.actives.splice(this.actives.indexOf(item), 1) : this.actives.push(item);
		},
		isMobile: function isMobile() {
			var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
			return width < 600;
		},
		handleResize: function handleResize() {
			console.log(this.order = this.isMobile() ? null : '_order');
		}
	},
	init: function init() {
		var _this = this;

		fetch('resume.json').then(function (res) {
			return res.json();
		}).then(function (json) {
			_this.resume = json;
			_this.filtered = {};

			var _loop = function _loop(section) {
				(function () {
					switch (section) {
						case 'experience':
						case 'education':
						case 'volunteering':
							// remove irrelevant entries
							_this.filtered[section] = _this.resume[section].filter(function (item) {
								return item.relevant !== false;
							});
							break;
						case 'about':
							// store order for columnal display
							var half = Math.ceil(_this.resume[section].length / 2);
							_this.filtered[section] = _this.resume[section].map(function (item, i) {
								item._order = i < half ? i * 2 : i * 2 - _this.resume[section].length + 1;
								return item;
							});
							break;
						default:
							// no filtering needed
							_this.filtered[section] = _this.resume[section];
							break;
					}
				})();
			};

			for (var section in _this.resume) {
				_loop(section);
			}
		});
	},
	ready: function ready() {
		window.addEventListener('load', this.handleResize);
		window.addEventListener('resize', this.handleResize);
	},
	beforeDestroy: function beforeDestroy() {
		window.removeEventListener('load', this.handleResize);
		window.removeEventListener('resize', this.handleResize);
	},

	template: '\n<div>\n\t<header class="flex-row flex-align-center">\n\t\t<div class="flex-grow flex-shrink padding-right" style="flex-basis: 50%;">\n\t\t\t<h1>{{ resume.info.name }}</h1>\n\t\t\t<p>{{ resume.info.description }}</p>\n\t\t</div>\n\t\t<figure>\n\t\t\t<img :src="resume.info.image" width="128" height="128" />\n\t\t</figure>\n\t</header>\n\t<article class="about">\n\t\t<header>\n\t\t\t<h2>about</h2>\n\t\t</header>\n\t\t<ul class="flex-row">\n\t\t\t<li v-for="skill of filtered.about | orderBy order" class="iconed">\n\t\t\t\t<i class="fa fa-{{ skill.icon }}" :title="skill.name"></i>\n\t\t\t\t<span>{{ skill.description + (skill.items ? topPicks(skill.items) + \'.\' : \'\') }}</span>\n\t\t\t\t<button v-if="skill.items" @click="toggleActive(skill)" class="btn more"><i class="fa fa-{{ isActive(skill) ? \'minus\' : \'plus\' }}-circle"></i> {{ skill.items.length - 3 }} {{ isActive(skill) ? \'less\' : \'more\' }}</button>\n\t\t\t\t<ul v-if="skill.items" v-show="isActive(skill)" class="more">\n\t\t\t\t\t<li v-for="item of skill.items">{{ item.name }}<sup v-if="item.priority" class="color-primary">&star;</sup></li>\n\t\t\t\t</ul>\n\t\t\t</li>\n\t\t</ul>\n\t</article>\n\t<article class="social">\n\t\t<header>\n\t\t\t<h2>social</h2>\n\t\t</header>\n\t\t<ul class="flex-row flex-justify-around">\n\t\t\t<li v-for="item of resume.social">\n\t\t\t\t<a :href="item.url" :title="item.name" target="_blank" :class="\'fa fa-\' + className(item.name)"></a>\n\t\t\t</li>\n\t\t</ul>\n\t</article>\n\t<article v-for="section of [\'experience\',\'education\',\'volunteering\']">\n\t\t<header>\n\t\t\t<h2>{{ section }}</h2>\n\t\t</header>\n\t\t<ol>\n\t\t\t<li v-for="item of (isActive(section) ? resume : filtered)[section]">\n\t\t\t\t<header>\n\t\t\t\t\t<strong v-if="item.title">{{ item.title }}</strong>\n\t\t\t\t\t<a v-if="item.url" :href="item.url" target="_blank">{{ item.name }}</a>\n\t\t\t\t\t<small v-if="item.duration">{{ item.duration }}</small>\n\t\t\t\t</header>\n\t\t\t\t<div v-if="item.description">{{ item.description }}</div>\n\t\t\t</li>\n\t\t</ol>\n\t\t<footer>\n\t\t\t<button v-if="filtered[section].length < resume[section].length" @click="toggleActive(section)" class="btn more"><i class="fa fa-{{ isActive(section) ? \'minus\' : \'plus\' }}-circle"></i> {{ resume[section].length - filtered[section].length }} {{ isActive(section) ? \'less\' : \'more\' }}</button>\n\t\t</footer>\n\t</article>\n\t<article>\n\t\t<header>\n\t\t\t<h2>references</h2>\n\t\t</header>\n\t\t<ul>\n\t\t\t<li>\n\t\t\t\tAvailable on <a :href="\'mailto:\' + resume.info.email" target="_blank">request</a>.\n\t\t\t</li>\n\t\t</ul>\n\t</article>\n</div>'
});

var MiApp = new Vue({
	el: '#app',
	components: {
		MiResume: MiResume
	},
	template: '\n<main>\n\t<mi-resume></mi-resume>\n</main>'
});