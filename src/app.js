import Vue from 'vue/dist/vue.js';

new Vue({
  el: 'main',
  template: '#template',
  data() {
    return {
      resume: undefined,
      filtered: {},
      actives: [],
      order: undefined,
      file: '/resume.json',
      url: 'https://mismith.io/resume/',
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
  created() {
    window.fetch(this.file)
      .then(res => res.json())
      .then(resume => {
        this.resume = resume;

        const filtered = {};
        for(let section in resume) {
          switch (section) {
            case 'experience':
            case 'education':
            case 'volunteering':
              // remove irrelevant entries
              filtered[section] = resume[section].filter(item => item.relevant !== false);
              break;
            case 'about':
            case 'portfolio':
              // store order for columnal display
              let half = Math.ceil(resume[section].length / 2);
              filtered[section] = resume[section].map((item, i) => {
                item._order = i < half ? i * 2 : i * 2 - resume[section].length + 1;
                item.items = item.items && item.items.filter(item => item.relevant !== false).sort(this.sortByName);
                return item;
              });
              if (section === 'about') {
                filtered[section].sort((a, b) => a.order - b.order);
              }
              break;
            default:
              // no filtering needed
              filtered[section] = resume[section];
              break;
          }
        }
        this.filtered = filtered;
      })
  },
});
