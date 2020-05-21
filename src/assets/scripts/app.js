let MiResume = Vue.extend({
	data() {
		return {
			resume: null,
			filtered: null,
			actives: [],
			order: undefined,
			url: `https://mismith.io/resume/`,
		};
	},
	methods: {
		sortByName(a, b) {
			return a.name.localeCompare(b.name, {
				sensitivity: 'base',
				numeric: true,
			});
		},
		sortByPriority(items) {
			return items.sort((a, b) => {
				let A = a.priority || items.length,
					B = b.priority || items.length;

				return A < B ? -1 : (B < A ? 1 : 0);
			});
		},
		topPicks(items, num = 3) {
			if (!items) return;

			let picks = [].concat(items);
			this.sortByPriority(picks);
			return picks.slice(0, num);
		},
		replaceStrings(text, replacements) {
			if (!text || !replacements) return;

			let regex = new RegExp(`\\$\\{(${Object.keys(replacements).join('|')})\\}`, 'ig');
			return text.replace(regex, (m, key) => replacements[key]);
		},
		className(name) {
			return name.toLowerCase().replace(' ', '-').replace('.', '');
		},

		isActive(item) {
			return this.actives.indexOf(item) >= 0;
		},
		toggleActive(item) {
			return this.isActive(item) ? this.actives.splice(this.actives.indexOf(item), 1) : this.actives.push(item);
		},

		isMobile() {
			let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
			return width < 600;
		},
		handleResize() {
			this.order = this.isMobile() ? null : '_order';
		},
	},
	init() {
		fetch('resume.json')
			.then(res => res.json())
			.then(json => {
				this.resume = json;
				this.filtered = {};

				for(let section in this.resume) {
					switch (section) {
						case 'experience':
						case 'education':
						case 'volunteering':
							// remove irrelevant entries
							this.filtered[section] = this.resume[section].filter(item => item.relevant !== false);
							break;
						case 'about':
						case 'portfolio':
							// store order for columnal display
							let half = Math.ceil(this.resume[section].length / 2);
							this.filtered[section] = this.resume[section].map((item, i) => {
								item._order = i < half ? i * 2 : i * 2 - this.resume[section].length + 1;
								item.items = item.items && item.items.filter(item => item.relevant !== false).sort(this.sortByName);
								return item;
							});
							break;
						default:
							// no filtering needed
							this.filtered[section] = this.resume[section];
							break;
					}
				}
			})
			.then(() => {
				// auto-expand section (e.g. if landing from PDF link click)
				setTimeout(() => {
					let more = location.hash && document.querySelector(`${location.hash} .btn.more`);
					if (more) {
						more.click();
					}
				}, 1000);
			});
	},
	ready() {
		window.addEventListener('load', this.handleResize);
		window.addEventListener('resize', this.handleResize);
	},
	beforeDestroy() {
		window.removeEventListener('load', this.handleResize);
		window.removeEventListener('resize', this.handleResize);
	},
	template: `
<header id="header" class="flex-row flex-align-center">
	<div class="flex-grow flex-shrink padding-right" style="flex-basis: 50%;">
		<h1>{{ resume.info.name }}</h1>
		<p>{{ resume.info.description }}</p>
	</div>
	<figure>
		<img :src="resume.info.image" width="128" height="128" />
	</figure>
</header>
<section v-for="section of ['about','portfolio']" :id="section">
	<header>
		<h2><a href="#{{ section }}">{{ section }}</a></h2>
	</header>
	<ul class="flex-row">
		<li v-for="(i, article) of filtered[section] | orderBy order" :id="section + '-' + i" class="iconed">
			<i class="fa fa-{{ article.icon }}" :title="article.name"></i>
			<span>{{ article.description }}</span>
			<ol v-if="article.items" class="picks">
				<li v-for="pick of topPicks(article.items)"><span v-if="!pick.url">{{ pick.name }}</span><a v-if="pick.url" :href="pick.url" target="_blank">{{ pick.name }}</a></li>
			</ol>
			<!--
			<a v-if="article.items" :href="url + '#' + section + '-' + i" @click.prevent="toggleActive(article)" class="btn more"><i class="fa fa-{{ isActive(article) ? 'minus' : 'plus' }}-circle"></i> {{ article.items.length - 3 }}&nbsp;{{ isActive(article) ? 'less' : 'more' }}</a>
			<ul v-if="article.items" v-show="isActive(article)" class="more">
				<li v-for="item of article.items" :class="{priority: item.priority}">
					<img v-if="item.url" :src="'https://www.google.com/s2/favicons?domain_url=' + item.url" height="12" />
					<span v-if="!item.url">{{ item.name }}</span>
					<a v-if="item.url" :href="item.url" target="_blank">{{ item.name }}</a>
					<ul class="tags">
						<li v-for="tag in item.tags">{{ tag }}</li>
					</ul>
				</li>
			</ul>
			-->
		</li>
	</ul>
</section>
<section id="social">
	<header>
		<h2><a href="#social">social</a></h2>
	</header>
	<ul class="flex-row flex-justify-around">
		<li v-for="item of filtered.social">
			<a :href="item.url" :title="item.name" target="_blank" :class="'hero fa fa-' + className(item.name)"></a>
		</li>
	</ul>
</section>
<section v-for="section of ['experience','education','volunteering']" v-if="filtered[section].length" :id="section">
	<header>
		<h2><a href="#{{ section }}">{{ section }}</a></h2>
	</header>
	<ol>
		<li v-for="item of (isActive(section) ? resume : filtered)[section]">
			<header>
				<strong v-if="item.title">{{ item.title }}</strong>
				<a v-if="item.url" :href="item.url" target="_blank">{{ item.name }}</a>
				<small v-if="item.duration">{{ item.duration }}</small>
			</header>
			<div v-if="item.description">{{ item.description }}</div>
		</li>
	</ol>
	<!--<footer>
		<a v-if="filtered[section].length < resume[section].length" :href="url + '#' + section" @click.prevent="toggleActive(section)" class="btn more"><i class="fa fa-{{ isActive(section) ? 'minus' : 'plus' }}-circle"></i> {{ resume[section].length - filtered[section].length }}&nbsp;{{ isActive(section) ? 'less' : 'more' }}</a>
	</footer>-->
</section>
<section id="references">
	<header>
		<h2><a href="#references">references</a></h2>
	</header>
	<ul>
		<li>
			Available on <a :href="'mailto:' + resume.info.email" target="_blank">request</a>.
		</li>
	</ul>
</section>`,
});

let MiApp = new Vue({
	el: '#app',
	components: {
		MiResume,
	},
	template: `
<main>
	<mi-resume></mi-resume>
</main>`,
});