const Store = {
  KEY: "as_ads",
  SET: "as_settings",

  read() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || [];
    } catch {
      return [];
    }
  },

  write(v) {
    localStorage.setItem(this.KEY, JSON.stringify(v));
  },

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  add(ad) {
    const ads = this.read();
    const rec = { ...ad, id: this.uid(), favorite: false, won: false, createdAt: Date.now() };
    ads.push(rec);
    this.write(ads);
    return rec;
  },

  addPairs(cards, brief) {
    const pairId = this.uid();
    const saved = cards.map((c, i) =>
      this.add({ ...brief, platform: c.platform, blocks: c.blocks, pairId, slot: i === 0 ? "A" : "B" })
    );
    return { pairId, saved };
  },

  toggleFav(id) {
    this.write(this.read().map((a) => (a.id === id ? { ...a, favorite: !a.favorite } : a)));
  },

  remove(id) {
    this.write(this.read().filter((a) => a.id !== id));
  },

  getPair(pairId) {
    return this.read().filter((a) => a.pairId === pairId);
  },

  markWinner(pairId, winnerId) {
    const ads = this.read();
    let winningTone = null;
    const updated = ads.map((a) => {
      if (a.pairId !== pairId) return a;
      if (a.id === winnerId) {
        winningTone = a.tone;
        return { ...a, won: true, favorite: true };
      }
      return { ...a, won: false };
    });
    this.write(updated);
    if (winningTone) this.learnWin(winningTone, updated.find((a) => a.id === winnerId).platform);
  },

  learnWin(tone, platform) {
    const w = this.getWeights();
    w.tones[tone] = (w.tones[tone] || 0) + 1;
    w.platforms[platform] = (w.platforms[platform] || 0) + 1;
    w.total++;
    localStorage.setItem("as_weights", JSON.stringify(w));
  },

  getWeights() {
    try {
      return JSON.parse(localStorage.getItem("as_weights")) || { tones: {}, platforms: {}, total: 0 };
    } catch {
      return { tones: {}, platforms: {}, total: 0 };
    }
  },

  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.SET)) || { provider: "off", key: "", model: "" };
    } catch {
      return { provider: "off", key: "", model: "" };
    }
  },

  setSettings(s) {
    localStorage.setItem(this.SET, JSON.stringify(s));
  },

  hasAI() {
    const s = this.getSettings();
    return s.provider !== "off" && !!s.key;
  },

  seed() {
    if (localStorage.getItem("as_seeded")) return;
    const mk = (platform, product, tone, blocks, favorite, daysAgo, won) => ({
      id: this.uid() + platform,
      platform,
      product,
      audience: "designers drowning in busywork",
      benefit: "saves 6 hours a week",
      tone,
      blocks,
      favorite,
      won: !!won,
      createdAt: Date.now() - daysAgo * 864e5
    });

    this.write([
      mk("instagram", "Sortly", "bold",
        [{ label: "caption", text: "Your desk is a graveyard of tomorrow's tasks.\n\nSortly reads your brain dump and turns it into a plan before your coffee cools. Designers swear it gives them back their weekends.\n\nDitch the chaos \u2192 sortly.app\n\n#productivity #designlife #focusmode", limit: 2200 }], true, 2),
      mk("google", "Sortly", "bold",
        [
          { label: "headline 1", text: "Plan tasks in 60 sec", limit: 30 },
          { label: "headline 2", text: "Stop juggling apps", limit: 30 },
          { label: "headline 3", text: "One place. Zero mess.", limit: 30 },
          { label: "description 1", text: "Turn your messy to-do list into a clear plan instantly. Free to start.", limit: 90 },
          { label: "description 2", text: "Built for people who think faster than they type. Try Sortly today.", limit: 90 }
        ], false, 4),
      mk("twitter", "Sortly", "friendly",
        [
          { label: "variant 1", text: "Ever wrote a task down just to forget where you wrote it?\n\nSortly is the one place for every plan, reminder and idea. Your brain, but searchable.", limit: 280 },
          { label: "variant 2", text: "I stopped using 4 apps to manage my day and started using 1.\n\nFewer tabs, more done. Sortly.", limit: 280 }
        ], false, 6),
      mk("linkedin", "Sortly", "premium",
        [{ label: "post", text: "Most productivity tools fail for one reason: they ask you to change how you work.\n\nSortly adapts to you instead. Drop your notes, links and ideas in one place \u2014 it organizes itself around your workflow.\n\nThe team tried it for 30 days and cut meeting prep time by 40%.\n\nProductivity isn't about doing more. It's about carrying less.\n\n#Productivity #Workflow #SaaS", limit: 3000 }], true, 8)
    ]);
    localStorage.setItem("as_seeded", "1");
  }
};

Store.seed();
