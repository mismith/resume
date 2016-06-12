let MiResume = Vue.extend({
	data() {
		return {
			resume: null,
			filtered: null,
			actives: [],
		};
	},
	methods: {
		listOfNames(items) {
			if (!items) return;

			let names = [].concat(items);
			this.sortByName(names);
			return names.map(item => item.name).join(', ');
		},
		sortByName(items) {
			return items.sort((a, b) => {
				let A = a.name.toLowerCase(),
					B = b.name.toLowerCase();

				return A < B ? -1 : (B < A ? 1 : 0);
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
			return this.listOfNames(picks.slice(0, num - 1)) + ', and ' + this.listOfNames(picks.slice(num - 1, num));
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
							// flip order for columnal display
							this.filtered[section] = [];
							let half = Math.ceil(this.resume[section].length / 2);
							for (let i = 0; i < this.resume[section].length; i++) {
								let j = i % 2 === 0 ? i / 2 : half + Math.floor(i/2);
								this.filtered[section][i] = this.resume[section][j];
							}
							break;
						default:
							// no filtering needed
							this.filtered[section] = this.resume[section];
							break;
					}
				}
			});
	},
	template: `
<div>
	<header class="flex-row flex-align-center">
		<div class="flex-grow flex-shrink padding-right" style="flex-basis: 50%;">
			<h1>{{ resume.info.name }}</h1>
			<p>{{ resume.info.description }}</p>
		</div>
		<figure>
			<img :src="resume.info.image" width="128" height="128" />
		</figure>
	</header>
	<article class="about">
		<header>
			<h2>about</h2>
		</header>
		<ul class="flex-row">
			<li v-for="skill of filtered.about" class="iconed">
				<i class="fa fa-{{ skill.icon }}" :title="skill.name"></i>
				<span>{{ skill.description + (skill.items ? topPicks(skill.items) + '.' : '') }}</span>
				<button v-if="skill.items" @click="toggleActive(skill)" class="btn more"><i class="fa fa-{{ isActive(skill) ? 'minus' : 'plus' }}-circle"></i> {{ skill.items.length - 3 }} {{ isActive(skill) ? 'less' : 'more' }}</button>
				<ul v-if="skill.items" v-show="isActive(skill)" class="more">
					<li v-for="item of skill.items">{{ item.name }}<sup v-if="item.priority" class="color-primary">&star;</sup></li>
				</ul>
			</li>
		</ul>
	</article>
	<article class="social">
		<header>
			<h2>social</h2>
		</header>
		<ul class="flex-row flex-justify-around">
			<li v-for="item of resume.social">
				<a :href="item.url" :title="item.name" target="_blank" :class="'fa fa-' + className(item.name)"></a>
			</li>
		</ul>
	</article>
	<article v-for="section of ['experience','education','volunteering']">
		<header>
			<h2>{{ section }}</h2>
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
		<footer>
			<button v-if="filtered[section].length < resume[section].length" @click="toggleActive(section)" class="btn more"><i class="fa fa-{{ isActive(section) ? 'minus' : 'plus' }}-circle"></i> {{ resume[section].length - filtered[section].length }} {{ isActive(section) ? 'less' : 'more' }}</button>
		</footer>
	</article>
	<article>
		<header>
			<h2>references</h2>
		</header>
		<ul>
			<li>
				Available on <a :href="'mailto:' + resume.info.email" target="_blank">request</a>.
			</li>
		</ul>
	</article>
</div>`,
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