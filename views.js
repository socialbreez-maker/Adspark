const Views = {
  renderResults(cards, brief, modeText) {
    const wrap = document.getElementById("results");
    document.getElementById("resultActionsRow").style.display = cards.length ? "flex" : "none";
    if (!cards) {
      wrap.innerHTML = "";
      return;
    }
    const platNames = cards.map((c) => Generator.meta[c.platform].name).join(" \u00B7 ");
    wrap.innerHTML = `
      <div class="results-head">
        <h2>Fresh from the engine</h2>
        <span class="meta">${modeText} \u00B7 ${platNames}</span>
      </div>
      <div class="result-grid" id="resultGrid"></div>
    `;
    const grid = document.getElementById("resultGrid");
    cards.forEach((card) => {
      const meta = Generator.meta[card.platform];
      const budget = Budget.analyze(card.blocks);
      const el = document.createElement("div");
      el.className = "result-card";
      el.dataset.platform = card.platform;
      el.innerHTML = `
        <div class="result-head">
          <span class="plat-name">${meta.icon} ${meta.name}</span>
          <button class="variant-btn" data-action="new-variant">New spin \u21BB</button>
        </div>
        <div class="result-body">${card.blocks.map((b) => `
          <div class="block">
            <div class="block-label"><span>${b.label}</span><span class="count" data-limit="${b.limit}">0 / ${b.limit}</span></div>
            <textarea spellcheck="false">${b.text}</textarea>
          </div>`).join("")}
          <div class="block">
            <div class="block-label"><span>Performance budget</span><span class="score-badge ${budget.grade}">${budget.label} \u00B7 ${budget.score}/100</span></div>
            ${budget.issues.length ? `<div class="score-tip">\u26A0 ${budget.issues.join(" \u00B7 ")}</div>` : ""}
          </div>
        </div>
        <div class="result-actions">
          <button class="rbtn copy" data-action="copy-card">Copy all</button>
          <button class="rbtn save" data-action="save-card">Save \u2605</button>
        </div>
        ${App.abMode ? `<div class="result-actions" style="border-top-style:dotted"><button class="rbtn" data-action="save-pair" style="background:transparent;border-color:var(--accent);color:var(--accent-deep)">Save as A/B pair \u26FD</button></div>` : ""}`;
      grid.appendChild(el);
      this.bindCard(el, card, brief);
    });
  },

  bindCard(el, card, brief) {
    el.querySelectorAll(".block").forEach((block) => {
      const ta = block.querySelector("textarea");
      if (!ta) return;
      const count = block.querySelector(".count");
      const limit = Number(count.dataset.limit);
      const sync = () => {
        const n = ta.value.length;
        count.textContent = `${n} / ${limit}`;
        count.classList.toggle("over", n > limit);
        ta.classList.toggle("warned", n > limit);
      };
      ta.addEventListener("input", sync);
      sync();
    });

    el.querySelector('[data-action="copy-card"]').onclick = () => {
      const text = [...el.querySelectorAll("textarea")].map((t) => t.value).join("\n\n");
      this.copy(text, "Copied to clipboard \u2713");
    };

    el.querySelector('[data-action="save-card"]').onclick = () => {
      const blocks = [...el.querySelectorAll(".block")].slice(0, -1).map((block) => ({
        label: block.querySelector(".block-label span").textContent,
        text: block.querySelector("textarea").value,
        limit: Number(block.querySelector(".count").dataset.limit)
      }));
      Store.add({ ...brief, platform: card.platform, blocks });
      App.toast("Saved to library \u2605");
    };

    const pairBtn = el.querySelector('[data-action="save-pair"]');
    if (pairBtn) {
      pairBtn.onclick = () => {
        const blocksA = [...el.querySelectorAll(".block")].slice(0, -1).map((block) => ({
          label: block.querySelector(".block-label span").textContent,
          text: block.querySelector("textarea").value,
          limit: Number(block.querySelector(".count").dataset.limit)
        }));
        const spin = Generator.generate(brief, [card.platform])[0];
        const { saved } = Store.addPairs(
          [{ platform: card.platform, blocks: blocksA }, { platform: card.platform, blocks: spin.blocks }],
          brief
        );
        App.toast(`A/B pair saved \u26FD \u2014 run them, then crown the winner`);
      };
    }

    el.querySelector('[data-action="new-variant"]').onclick = () => {
      const fresh = Generator.generate(brief, [card.platform])[0];
      const body = el.querySelector(".result-body");
      body.querySelectorAll(".block").forEach((b, i) => {
        if (!b.querySelector("textarea")) return;
        const nb = fresh.blocks[i];
        if (!nb) return;
        const ta = b.querySelector("textarea");
        const count = b.querySelector(".count");
        ta.value = nb.text;
        count.dataset.limit = nb.limit;
        count.textContent = `${ta.value.length} / ${nb.limit}`;
        count.classList.remove("over");
        ta.dispatchEvent(new Event("input"));
      });
      const budgetBlocks = [...body.querySelectorAll(".block")].filter((b) => !b.querySelector("textarea"));
      budgetBlocks[0].remove();
      const bud = Budget.analyze(fresh.blocks);
      body.insertAdjacentHTML("beforeend", `
        <div class="block">
          <div class="block-label"><span>Performance budget</span><span class="score-badge ${bud.grade}">${bud.label} \u00B7 ${bud.score}/100</span></div>
          ${bud.issues.length ? `<div class="score-tip">\u26A0 ${bud.issues.join(" \u00B7 ")}</div>` : ""}
        </div>`);
      App.toast("New spin \u21BB");
    };
  },

  copy(text, msg) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => App.toast(msg)).catch(() => this.fallbackCopy(text, msg));
    } else {
      this.fallbackCopy(text, msg);
    }
  },

  fallbackCopy(text, msg) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    App.toast(msg);
  },

  renderLibrary(plat) {
    const grid = document.getElementById("libraryGrid");
    let ads = Store.read().sort((a, b) => b.createdAt - a.createdAt);
    if (plat && plat !== "all") ads = ads.filter((a) => a.platform === plat);

    const singles = ads.filter((a) => !a.pairId);
    const pairs = [];
    const seen = new Set();
    ads.filter((a) => a.pairId).forEach((a) => {
      if (!seen.has(a.pairId)) {
        seen.add(a.pairId);
        pairs.push(Store.getPair(a.pairId).sort((x, y) => (x.slot || "").localeCompare(y.slot || "")));
      }
    });

    if (!ads.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="big">Nothing saved yet.</div><p>Generate some copy on the Create tab and hit "Save \u2605".</p></div>`;
      return;
    }

    grid.innerHTML =
      singles.map((ad) => this.libCardHTML(ad)).join("") +
      pairs
        .map((pair) => {
          const done = pair.some((p) => p.won);
          return `
          <div class="lib-card pair-card" style="grid-column:1/-1;padding:18px">
            <div class="lib-top" style="margin-bottom:12px">
              <span class="lib-plat" style="background:var(--accent)">${Generator.meta[pair[0].platform].icon} A/B TEST \u2014 ${pair[0].product}</span>
              ${done ? `<span class="winner-tag">\u{1F451} winner crowned</span>` : `<span class="pair-tag">awaiting verdict</span>`}
            </div>
            <div class="ab-row">
              ${pair.map((ad) => this.abCardHTML(ad, done)).join("")}
            </div>
          </div>`;
        })
        .join("");

    grid.querySelectorAll("[data-id]").forEach((el) => {
      el.addEventListener("click", (e) => {
        const id = el.dataset.id;
        if (e.target.closest('[data-action="fav"]')) {
          Store.toggleFav(id);
          this.renderLibrary(plat);
        } else if (e.target.closest('[data-action="remove-lib"]')) {
          const target = el;
          if (target.classList.contains("ab-mini")) {
            if (confirm("Remove this arm from the pair?")) {
              Store.remove(id);
              this.renderLibrary(plat);
            }
          } else if (confirm("Delete this ad?")) {
            Store.remove(id);
            this.renderLibrary(plat);
          }
        } else if (e.target.closest('[data-action="copy-lib"]')) {
          const ad = Store.read().find((a) => a.id === id);
          this.copy(ad.blocks.map((x) => x.text).join("\n\n"), "Copied \u2713");
        } else if (e.target.closest('[data-action="crown"]')) {
          const pairId = el.dataset.pair;
          Store.markWinner(pairId, id);
          this.toastCrown();
          this.renderLibrary(plat);
          App.toast("Winner crowned \u{1F451} \u2014 engine learned");
        }
      });
    });
  },

  toastCrown() {},

  libCardHTML(ad) {
    const meta = Generator.meta[ad.platform];
    const first = ad.blocks.map((b) => b.text).join("\n\n");
    return `
      <div class="lib-card ${ad.favorite ? "faved" : ""}" data-id="${ad.id}">
        <div class="lib-top">
          <span class="lib-plat">${meta.icon} ${meta.name}</span>
          <button class="lib-star ${ad.favorite ? "on" : ""}" data-action="fav" title="Mark as winner">\u2605</button>
        </div>
        <div class="lib-product">${ad.product}</div>
        <div class="lib-text">${first.replace(/\n/g, " ")}</div>
        <div class="lib-date">${new Date(ad.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} \u00B7 ${ad.tone}</div>
        <div style="display:flex;gap:8px">
          <button class="chip" data-action="copy-lib" style="flex:1;text-align:center">Copy</button>
          <button class="lib-del" data-action="remove-lib" title="Delete">&times;</button>
        </div>
      </div>`;
  },

  abCardHTML(ad, done) {
    const meta = Generator.meta[ad.platform];
    const first = ad.blocks.map((b) => b.text).join("\n\n");
    const isWinner = ad.won;
    return `
      <div class="lib-card ab-mini ${isWinner ? "faved" : done ? "loser" : ""}" data-id="${ad.id}" data-pair="${ad.pairId}" style="position:relative">
        <div class="lib-top">
          <span class="pair-tag" style="${isWinner ? "background:var(--gold);color:var(--ink);border-color:var(--gold)" : ""}">arm ${ad.slot || "?"}</span>
          ${isWinner ? `<span class="winner-tag">\u{1F451} won</span>` : ""}
        </div>
        <div class="lib-product" style="font-size:14px">${ad.tone} tone</div>
        <div class="lib-text">${first.replace(/\n/g, " ")}</div>
        ${!done ? `<button class="btn-winner" data-action="crown">\u{1F451} Crown winner</button>` : ""}
        <div style="display:flex;gap:8px">
          <button class="chip" data-action="copy-lib" style="flex:1;text-align:center">Copy</button>
          <button class="lib-del" data-action="remove-lib" title="Delete">&times;</button>
        </div>
      </div>`;
  },

  renderRivals(r) {
    const wrap = document.getElementById("rivalsResults");
    if (!r) { wrap.innerHTML = ""; return; }
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    wrap.innerHTML = `
      <div class="verdict-card">
        <div class="v-label">The verdict \u00B7 ${r.mode}</div>
        <p>${esc(r.verdict)}</p>
      </div>
      <div class="rivals-grid">
        <div class="rival-panel">
          <h2>Head to head</h2>
          <table class="compo-table">
            <tr><th></th><th class="you">You</th><th>Rival 1</th>${r.table[0] && r.table[0].c2 ? "<th>Rival 2</th>" : ""}</tr>
            ${r.table.map((row) => `<tr>
              <td>${esc(row.label)}</td>
              <td class="you">${esc(row.you) || "\u2014"}</td>
              <td>${esc(row.c1) || "\u2014"}</td>
              ${row.c2 !== undefined ? `<td>${esc(row.c2) || "\u2014"}</td>` : ""}
            </tr>`).join("")}
          </table>
        </div>
        <div class="rival-panel">
          <h2>Attack angles</h2>
          <ul class="angles-list">${r.angles.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
        </div>
      </div>
      <div class="rivals-cols">
        <div class="rival-panel">
          <h2>DO this</h2>
          <ul class="advice-list">${r.dos.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
        </div>
        <div class="rival-panel">
          <h2>Not this</h2>
          <ul class="advice-list donts">${r.donts.map((a) => `<li class="quiet">${esc(a)}</li>`).join("")}</ul>
        </div>
      </div>`;
    wrap.scrollIntoView({ behavior: "smooth", block: "start" });
  },

  renderInsights() {
    const ads = Store.read();
    const wins = ads.filter((a) => a.favorite).length;
    const abTests = new Set(ads.filter((a) => a.pairId).map((a) => a.pairId)).size;
    const cards = [
      { k: "Ads generated", v: String(ads.length), note: "all time" },
      { k: "Winners starred", v: `<em>${wins}</em>`, note: "your strongest angles" },
      { k: "A/B tests run", v: `<em>${abTests}</em>`, note: "verdicts train the engine" },
      { k: "Words written", v: Intl.NumberFormat().format(ads.reduce((s, a) => s + a.blocks.reduce((x, b) => x + (b.text || "").split(/\s+/).length, 0), 0)), note: "creative fuel" }
    ];
    document.getElementById("insightGrid").innerHTML = cards
      .map((c) => `<div class="ins-card"><div class="k">${c.k}</div><div class="v">${c.v}</div><div class="note">${c.note}</div></div>`)
      .join("");

    const bars = (elId, field, labelFn) => {
      const counts = {};
      ads.forEach((a) => (counts[a[field]] = (counts[a[field]] || 0) + 1));
      const max = Math.max(...Object.values(counts), 1);
      document.getElementById(elId).innerHTML = Object.entries(counts)
        .sort((x, y) => y[1] - x[1])
        .map(([key, n], i) => {
          const label = labelFn ? labelFn(key) : Generator.meta[key] ? Generator.meta[key].name : key;
          return `<div class="hbar-row"><span>${label}</span><div class="hbar"><i style="width:${(n / max) * 100}%;animation-delay:${i * 0.06}s"></i></div><b>${n}</b></div>`;
        })
        .join("") || `<div class="empty"><p>No data yet \u2014 generate something.</p></div>`;
    };

    bars("hbarsPlatform", "platform");
    bars("hbarsTone", "tone", (t) => t[0].toUpperCase() + t.slice(1));
  }
};
