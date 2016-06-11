let MiResume = Vue.extend({
	data() {
		return {
			resume: null,
			isActive: [],
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
			return items.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
		},
		sortByPriority(items) {
			return items.sort((a, b) => (a.priority || items.length) < (b.priority || items.length) ? -1 : 1);
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

		getActive(item) {
			return this.isActive.indexOf(item) >= 0;
		},
		toggleActive(item) {
			return this.getActive(item) ? this.isActive.splice(this.isActive.indexOf(item), 1) : this.isActive.push(item);
		},
	},
	init() {
		fetch('resume.json')
			.then(res => res.json())
			.then(json => this.resume = json);
	},
	template: `
<section>
	<header>
		<img :src="resume.info.image" />
		<h1>{{ resume.info.name }}</h1>
		<p>{{ resume.info.description }}</p>
	</header>
	<article class="about">
		<header>
			<h2>about</h2>
		</header>
		<ul>
			<li v-for="skill in resume.skills">
				<strong>{{ skill.name }}</strong>:
				<span>{{ skill.description + (skill.items ? topPicks(skill.items) + '.' : '') }}</span>
				<a v-if="skill.items" href @click.prevent="toggleActive(skill)">Show {{ getActive(skill) ? 'Less' : 'More' }}</a>
				<p v-if="skill.items" v-show="getActive(skill)">{{ listOfNames(skill.items) }}</p>
			</li>
		</ul>
	</article>
	<article v-for="section of ['social','experience','education','volunteering']" :class="section">
		<header>
			<h2>{{ section }}</h2>
		</header>
		<ol>
			<li v-for="item of resume[section]">
				<header>
					<span v-if="item.title"><strong>{{ item.title }}</strong>,</span>
					<a v-if="item.url" :href="item.url" target="_blank">{{ item.name }}</a>
					<small v-if="item.duration">{{ item.duration }}</small>
				</header>
				<div v-if="item.description">{{ item.description }}</div>
			</li>
		</ol>
	</article>
</section>`,
});

let MiApp = new Vue({
	el: '#app',
	components: {
		MiResume,
	},
	template: `<mi-resume></mi-resume>`,
});