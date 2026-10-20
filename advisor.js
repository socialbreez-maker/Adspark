const Advisor = {
  async analyze(input) {
    if (Store.hasAI()) {
      const res = await this.analyzeAI(input);
      if (res) return res;
    }
    return this.analyzeOffline(input);
  },

  buildInput(input) {
    return {
      you: input.product.trim(),
      usp: input.usp.trim(),
      c1: { name: input.c1.trim(), known: input.c1Known.trim() },
      c2: input.c2.trim() ? { name: input.c2.trim(), known: input.c2Known.trim() } : null
    };
  },

  /* ---------- offline heuristic engine ---------- */

  analyzeOffline(input) {
    const I = this.buildInput(input);
    const rivals = I.c2 ? [I.c1, I.c2] : [I.c1];
    const rivalNames = rivals.map((r) => r.name).join(" and ");

    const verdict = `${I.you} shouldn't fight ${rivalNames} on their home turf. ${I.usp ? `${I.usp[0].toUpperCase() + I.usp.slice(1)} is something they` : "That's something they"} structurally can't claim without rebuilding themselves. Win the frame before features.`;

    const table = [
      { label: "Known for", you: I.usp ? `(our claim) ${I.usp}` : "\u2014", c1: I.c1.known || I.c1.name, c2: I.c2 ? I.c2.known || I.c2.name : "" },
      { label: "Loose complexion", you: `Focused: does one thing that matters`, c1: this.severity(I.c1.known), c2: I.c2 ? this.severity(I.c2.known) : "" },
      { label: "Your attack surface", you: I.usp || "your edge", c1: "complexity tax / legacy expectations", c2: I.c2 ? "tool fatigue / switching depth" : "" }
    ].filter((r) => r.c2 || r.label !== "Your attack surface");

    const angles = [
      `"\u201C${I.c1.name}\u201D is the name everyone uses. ${I.you} is the name people finish the job with."`,
      `Everyone compares feature lists. Meanwhile, ${I.you} quietly ${I.usp || "removes the busywork"}.`,
      `Not better at everything \u2014 deliberately better at the one thing that matters: ${I.usp || "your core benefit"}.`,
      I.c2 ? `Where ${I.c2.name} gives you a list, ${I.you} gives you an outcome.` : `Try '${I.you}' alongside ${I.c1.name} for a week \u2014 keep whichever gets the work done.`,
      `Built by people who got tired of ${rivalNames}' workflow. No migration party required.`
    ];

    const dos = [
      `Lead every ad with the ${I.usp ? I.usp.split(/[,.]/)[0] : "core benefit"} — never open with a feature brand-riders match anyway.`,
      `Name the category ${rivalNames} own it in — then redefine it around your edge ("${I.usp ? I.usp.split(/[,.]/)[0] : "the smarter way"} apps") so comparison is on your terms.`,
      `Run an A/B pair (Create tab): arm A = pure benefit ad, arm B = comparison-flavored ad ("the calm ${I.c1.known ? I.c1.known.split(",")[0].split(" ").slice(0, 3).join(" ") : "workspace"} alternative"). Crown a winner.`,
      `Pick 2 platforms as your home run lanes and go deep there instead of spreading thin across all four.`,
      `Social-proof where rivals are weakest: speed, simplicity switch, or whatever your advantage implies.`
    ];

    const donts = [
      `Never say "'better than ${I.c1.name}'" in ads — legally risky, reads insecure, and gives them free mentions.`,
      `Don't out-feature them on an equal terrain. You'll lose, and your audience will yawn.`,
      `Don't copy their tone. If they are the corporate default, be the human one.`,
      `Avoid the word "disruptive" and cap the emojis per platform.`,
      `Don't fight for your competitor's power users at the start — poach the frustrated majority first.`
    ];

    return { verdict, mode: "templates \u00B7 offline", table, angles, dos, donts };
  },

  severity(known) {
    if (!known) return "\u2014";
    const k = known.toLowerCase();
    if (/complex|powerful|all-in-one|everything/.test(k)) return "powerful, but opinionated \u2014 power users locked in, new users overwhelmed";
    if (/simple|fast|list|rigid|basic/.test(k)) return "simple and quick \u2014 but shallow for growing workflows";
    if (/free|cheap|budget/.test(k)) return "cheap \u2014 with the usual tradeoffs hidden underneath";
    return known;
  },

  /* ---------- AI engine ---------- */

  async analyzeAI(input) {
    const I = this.buildInput(input);
    const s = Store.getSettings();

    const prompt = `Act as a sharp startup positioning + go-to-market strategist who has scaled paid social and search campaigns.

MY PRODUCT: ${I.you}
UNFAIR ADVANTAGE (what I can claim and rivals supposedly can't): ${I.usp}
COMPETITOR 1: ${I.c1.name} — known for: ${I.c1.known}
${I.c2 ? `COMPETITOR 2: ${I.c2.name} — known for: ${I.c2.known}` : "COMPETITOR 2: none"}

Deliver competitive strategy. Respond with ONLY minified JSON (no markdown):
{"verdict":"2-3 sentence positioning verdict, punchy, direct, no fluff",
"table":[{"label":"<dimension 3-5 words>","you":"...","c1":"...","c2":"... or empty"}],
"angles":["4-5 ready-to-test headline attack angles that exploit gaps rivals can't copy without rebuilding who they are"],
"dos":["5 concrete campaign actions"],
"donts":["5 mistakes to avoid"],
"platformAdvice":"2-3 sentences: which platforms to prioritize and why given this positioning"}
Rules: concrete, no filler words, no "unleash/disrupt/game-changing" clichés. Each angle must be under 100 chars.`;

    let raw;
    try {
      raw = s.provider === "gemini" ? await Generator.callGemini(s, prompt) : await Generator.callOpenAI(s, prompt);
    } catch {
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) return null;
      try { parsed = JSON.parse(m[0]); } catch { return null; }
    }

    if (!parsed.verdict || !Array.isArray(parsed.table)) return null;

    return {
      verdict: parsed.verdict,
      mode: `AI \u00B7 ${s.provider}`,
      table: parsed.table.slice(0, 5).map((row) => ({
        label: String(row.label || ""),
        you: String(row.you || ""),
        c1: String(row.c1 || ""),
        c2: String(row.c2 || "")
      })),
      angles: (parsed.angles || []).slice(0, 6).map(String),
      dos: (parsed.dos || []).slice(0, 6).map(String),
      donts: (parsed.donts || []).slice(0, 6).map(String)
    };
  }
};
