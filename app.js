const App = {
  brief: null,
  lastCards: null,
  lastMode: "",
  abMode: false,
  libFilter: "all",

  switchView(name) {
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("hidden", v.id !== "view-" + name));
    if (name === "library") Views.renderLibrary(this.libFilter);
    if (name === "insights") Views.renderInsights();
  },
  toast(msg) {
    const wrap = document.getElementById("toastWrap");
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.classList.add("gone"), 2300);
    setTimeout(() => t.remove(), 2700);
  },

  syncModeChip() {
    const chip = document.getElementById("modeChip");
    const text = document.getElementById("modeChipText");
    if (Store.hasAI()) {
      const s = Store.getSettings();
      chip.classList.add("ai");
      text.textContent = `AI · ${s.provider}`;
    } else {
      chip.classList.remove("ai");
      text.textContent = "Templates";
    }
  },

  bind() {
    document.querySelectorAll(".nav-item").forEach((b) =>
      b.addEventListener("click", () => this.switchView(b.dataset.view))
    );

    document.querySelectorAll("#tonePicker .tone").forEach((b) =>
      b.addEventListener("click", () => {
        document.querySelectorAll("#tonePicker .tone").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
      })
    );

    document.querySelectorAll("#platformPicker .plat").forEach((b) =>
      b.addEventListener("click", () => {
        const on = document.querySelectorAll("#platformPicker .plat.active").length;
        if (b.classList.contains("active") && on === 1) return;
        b.classList.toggle("active");
      })
    );

    document.getElementById("abMode").addEventListener("change", (e) => {
      this.abMode = e.target.checked;
    });

    document.querySelectorAll("#providerSeg button").forEach((b) =>
      b.addEventListener("click", () => {
        document.querySelectorAll("#providerSeg button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        const prov = b.dataset.prov;
        document.getElementById("aiFields").style.display = prov === "off" ? "none" : "block";
        document.getElementById("setKey").placeholder = prov === "gemini" ? "AIza..." : "sk-...";
        document.getElementById("setModel").placeholder = prov === "gemini" ? "gemini-2.0-flash" : "gpt-4o-mini";
        this.hintFor(prov);
      })
    );

    document.getElementById("briefForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const product = document.getElementById("bfProduct").value.trim();
      if (!product) return;
      this.brief = {
        product,
        audience: document.getElementById("bfAudience").value,
        benefit: document.getElementById("bfBenefit").value,
        tone: document.querySelector("#tonePicker .tone.active").dataset.tone
      };
      const platforms = [...document.querySelectorAll("#platformPicker .plat.active")].map((b) => b.dataset.plat);
      const btn = document.getElementById("sparkBtn");
      btn.classList.add("busy");
      btn.innerHTML = Store.hasAI() ? 'Thinking... <span class="arrow">&#10230;</span>' : 'Sparking... <span class="arrow">&#10230;</span>';

      let cards, mode;
      if (Store.hasAI()) {
        ({ cards, mode } = await Generator.generateAI(this.brief, platforms));
      } else {
        cards = Generator.generate(this.brief, platforms);
        mode = "templates \u00B7 offline";
      }

      this.lastCards = cards;
      this.lastMode = mode;
      Views.renderResults(cards, this.brief, mode);
      btn.classList.remove("busy");
      btn.innerHTML = 'Generate copy <span class="arrow">&rarr;</span>';
    });

    document.getElementById("resultActionsRow").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === "copy-all") this.copyAll();
      if (action === "export-txt") this.exportFile("txt");
      if (action === "export-csv") this.exportFile("csv");
      if (action === "print-brief") this.printBrief();
    });

    document.body.addEventListener("click", (e) => {
      const b = e.target.closest('[data-action="open-settings"]');
      if (b) this.openSettings();
      if (e.target.closest('[data-action="close-settings"]')) this.closeSettings();
    });
    document.getElementById("settingsBackdrop").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.closeSettings();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeSettings();
        document.getElementById("helpPanel").classList.add("hidden");
      }
    });

    document.getElementById("sideHelp").addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("helpPanel").classList.toggle("hidden");
    });
    document.getElementById("helpClose").addEventListener("click", () =>
      document.getElementById("helpPanel").classList.add("hidden")
    );
    document.getElementById("helpPanel").addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#helpPanel") && !e.target.closest("#sideHelp")) {
        document.getElementById("helpPanel").classList.add("hidden");
      }
    });

    document.getElementById("rivalsForm").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const btn = document.getElementById("rivalsBtn");
      btn.classList.add("busy");
      btn.innerHTML = 'Reading the field... <span class="arrow">&#10230;</span>';
      const input = {
        product: document.getElementById("rpProduct").value,
        usp: document.getElementById("rpUSP").value,
        c1: document.getElementById("rpC1").value,
        c1Known: document.getElementById("rpC1Known").value,
        c2: document.getElementById("rpC2").value,
        c2Known: document.getElementById("rpC2Known").value
      };
      const result = await Advisor.analyze(input);
      Views.renderRivals(result);
      btn.classList.remove("busy");
      btn.innerHTML = 'Analyze rivals <span class="arrow">&rarr;</span>';
    });

    document.getElementById("libraryFilters").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      document.querySelectorAll("#libraryFilters .chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      this.libFilter = chip.dataset.plat;
      Views.renderLibrary(this.libFilter);
    });

    this.syncModeChip();
  },

  /* ---------- settings ---------- */

  openSettings() {
    const s = Store.getSettings();
    document.querySelectorAll("#providerSeg button").forEach((b) =>
      b.classList.toggle("active", b.dataset.prov === s.provider)
    );
    document.getElementById("setKey").value = s.key;
    document.getElementById("setKey").placeholder =
      s.provider === "gemini" ? "AIza..." : "sk-...";
    document.getElementById("setModel").value = s.model;
    this.hintFor(s.provider);
    document.getElementById("aiFields").style.display = s.provider === "off" ? "none" : "block";
    document.getElementById("settingsBackdrop").classList.remove("hidden");
  },

  closeSettings() {
    document.getElementById("settingsBackdrop").classList.add("hidden");
  },

  hintFor(provider) {
    const el = document.getElementById("provHint");
    if (provider === "openai") el.textContent = "Get a key at platform.openai.com — gpt-4o-mini is cheap and great for ad copy.";
    else if (provider === "gemini") el.textContent = "Get a free key at aistudio.google.com — the free tier is generous for light use.";
    else el.textContent = "";
  },

  /* ---------- export ---------- */

  collectText() {
    return this.lastCards
      .map((card) => {
        const meta = Generator.meta[card.platform];
        const body = card.blocks.map((b) => `${b.label.toUpperCase()}\n${b.text}`).join("\n\n");
        return `${meta.name} (${Generator.meta[card.platform].name} spec)\n${"=".repeat(40)}\n${body}`;
      })
      .join("\n\n\n");
  },

  copyAll() {
    Views.copy(this.collectText(), "Brief copied \u2713");
  },

  download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  slug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30) || "brief";
  },

  exportFile(kind) {
    if (!this.lastCards) return;
    if (kind === "txt") {
      this.download(`adspark-${this.slug(this.brief.product)}.txt`, this.collectText(), "text/plain");
    } else {
      const rows = [["product", "platform", "block", "text", "limit"]];
      this.lastCards.forEach((card) =>
        card.blocks.forEach((b) => {
          const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
          rows.push([this.brief.product, card.platform, b.label, b.text, b.limit].map(esc).join(","));
        })
      );
      this.download(`adspark-${this.slug(this.brief.product)}.csv`, rows.join("\n"), "text/csv");
    }
    this.toast(`Exported .${kind} \u2193`);
  },

  printBrief() {
    if (!this.lastCards) return;
    const area = document.getElementById("printArea");
    const dateTxt = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
    area.innerHTML = `
      <div class="print-sheet">
        <div class="print-head">
          <h1>AdSpark campaign brief</h1>
          <div class="print-meta">${dateTxt} \u00B7 ${this.brief.tone} tone \u00B7 ${this.lastMode} ${document.getElementById("resultActionsRow").style.display !== "none" ? "" : ""}</div>
          <div class="print-meta"><strong>${this.brief.product}</strong>${this.brief.audience ? ` \u2014 for ${this.brief.audience}` : ""}${this.brief.benefit ? ` \u2014 ${this.brief.benefit}` : ""}</div>
        </div>
        ${this.lastCards
          .map((card) => {
            const meta = Generator.meta[card.platform];
            const bud = Budget.analyze(card.blocks);
            return `<div class="print-card">
              <h2>${meta.name} <span class="print-score">${bud.score}/100</span></h2>
              ${card.blocks.map((b) => `<div class="blk"><b>${b.label}</b><p>${b.text.replace(/</g, "&lt;")}</p></div>`).join("")}
            </div>`;
          })
          .join("")}
        <div class="print-meta" style="margin-top:16px">Generated with AdSpark \u2014 review, approve and ship.</div>
      </div>`;
    window.print();
  },

  init() {
    this.bind();
  }
};

App.init();
