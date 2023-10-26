import Vue from 'vue/dist/vue.js';

new Vue({
  el: 'main',
  template: '#template',
  data() {
    return {
      resume: undefined,
      filtered: {},
      actives: [],
      file: './resume.json',
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
    topPicks(items) {
      if (!items) return;

      let picks = [].concat(items);
      this.sortByPriority(picks);
      return picks.filter(({ priority }) => priority);
    },
    className(name) {
      return name.toLowerCase().replace(' ', '-').replace('.', '');
    },
    socialName(url) {
      return url.replace(/\/$/, '').replace(/^.*\//, '');
    },
  },
  created() {
    window.fetch(this.file)
      .then(res => res.json())
      .then(resume => {
        this.resume = resume;

        const filtered = {};
        for (let section in resume) {
          switch (section) {
            case 'about':
            case 'experience':
            case 'education':
            case 'social':
            case 'volunteering':
            case 'portfolio':
              // remove irrelevant entries
              filtered[section] = resume[section]
                .filter(item => item.relevant !== false)
                .map((item) => {
                  item.items = item.items && item.items
                    .filter(item => item.relevant !== false)
                    .sort(this.sortByName);
                  return item;
                });
              break;
            default:
              // no filtering needed
              filtered[section] = resume[section];
              break;
          }
        }
        this.filtered = filtered;
      })
      .catch(err => {
        console.error(err);
        this.resume = false;
      });
  },
});
