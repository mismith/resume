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
			return picks.slice(0, num);
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
			this.order = this.isMobile() ? null : '_order';
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

	template: '\n<div>\n\t<header class="flex-row flex-align-center">\n\t\t<div class="flex-grow flex-shrink padding-right" style="flex-basis: 50%;">\n\t\t\t<h1>{{ resume.info.name }}</h1>\n\t\t\t<p>{{ resume.info.description }}</p>\n\t\t</div>\n\t\t<figure>\n\t\t\t<img :src="resume.info.image" width="128" height="128" />\n\t\t</figure>\n\t</header>\n\t<article v-for="section of [\'about\',\'portfolio\']" :class="section">\n\t\t<header>\n\t\t\t<h2>{{ section }}</h2>\n\t\t</header>\n\t\t<ul class="flex-row">\n\t\t\t<li v-for="article of filtered[section] | orderBy order" class="iconed">\n\t\t\t\t<i class="fa fa-{{ article.icon }}" :title="article.name"></i>\n\t\t\t\t<span>{{ article.description }}</span>\n\t\t\t\t<ol v-if="article.items" class="picks">\n\t\t\t\t\t<li v-for="pick of topPicks(article.items)"><span v-if="!pick.url">{{ pick.name }}</span><a v-if="pick.url" :href="pick.url" target="_blank">{{ pick.name }}</a></li>\n\t\t\t\t</ol>\n\t\t\t\t<button v-if="article.items" @click="toggleActive(article)" class="btn more"><i class="fa fa-{{ isActive(article) ? \'minus\' : \'plus\' }}-circle"></i> {{ article.items.length - 3 }} {{ isActive(article) ? \'less\' : \'more\' }}</button>\n\t\t\t\t<ul v-if="article.items" v-show="isActive(article)" class="more">\n\t\t\t\t\t<li v-for="item of article.items | orderBy \'name\'" :class="{priority: item.priority}">\n\t\t\t\t\t\t<img v-if="item.url" :src="\'http://www.google.com/s2/favicons?domain_url=\' + item.url" height="12" />\n\t\t\t\t\t\t<span v-if="!item.url">{{ item.name }}</span>\n\t\t\t\t\t\t<a v-if="item.url" :href="item.url" target="_blank">{{ item.name }}</a>\n\t\t\t\t\t\t<ul class="tags">\n\t\t\t\t\t\t\t<li v-for="tag in item.tags">{{ tag }}</li>\n\t\t\t\t\t\t</ul>\n\t\t\t\t\t</li>\n\t\t\t\t</ul>\n\t\t\t</li>\n\t\t</ul>\n\t</article>\n\t<article class="social">\n\t\t<header>\n\t\t\t<h2>social</h2>\n\t\t</header>\n\t\t<ul class="flex-row flex-justify-around">\n\t\t\t<li v-for="item of filtered.social">\n\t\t\t\t<a :href="item.url" :title="item.name" target="_blank" :class="\'fa fa-\' + className(item.name)"></a>\n\t\t\t</li>\n\t\t</ul>\n\t</article>\n\t<article v-for="section of [\'experience\',\'education\',\'volunteering\']" :class="section">\n\t\t<header>\n\t\t\t<h2>{{ section }}</h2>\n\t\t</header>\n\t\t<ol>\n\t\t\t<li v-for="item of (isActive(section) ? resume : filtered)[section]">\n\t\t\t\t<header>\n\t\t\t\t\t<strong v-if="item.title">{{ item.title }}</strong>\n\t\t\t\t\t<a v-if="item.url" :href="item.url" target="_blank">{{ item.name }}</a>\n\t\t\t\t\t<small v-if="item.duration">{{ item.duration }}</small>\n\t\t\t\t</header>\n\t\t\t\t<div v-if="item.description">{{ item.description }}</div>\n\t\t\t</li>\n\t\t</ol>\n\t\t<footer>\n\t\t\t<button v-if="filtered[section].length < resume[section].length" @click="toggleActive(section)" class="btn more"><i class="fa fa-{{ isActive(section) ? \'minus\' : \'plus\' }}-circle"></i> {{ resume[section].length - filtered[section].length }} {{ isActive(section) ? \'less\' : \'more\' }}</button>\n\t\t</footer>\n\t</article>\n\t<article>\n\t\t<header>\n\t\t\t<h2>references</h2>\n\t\t</header>\n\t\t<ul>\n\t\t\t<li>\n\t\t\t\tAvailable on <a :href="\'mailto:\' + resume.info.email" target="_blank">request</a>.\n\t\t\t</li>\n\t\t</ul>\n\t</article>\n</div>'
});

var MiApp = new Vue({
	el: '#app',
	components: {
		MiResume: MiResume
	},
	template: '\n<main>\n\t<mi-resume></mi-resume>\n</main>'
});