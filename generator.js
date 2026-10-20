const Generator = {
  TONES: ["bold", "friendly", "premium", "urgent"],

  LIB: {
    bold: {
      hooks: [
        "Stop scrolling.",
        "This changes everything.",
        "Your {audience} deserve better than \"someday\".",
        "Hard truth: waiting won't make it easier."
      ],
      bodies: [
        "{product} does the one thing {audience} keep putting off — in minutes, not weeks.",
        "Built for {audience}. Obsessed with {benefit}.",
        "No fluff, no learning curve. {product} just works.",
        "{benefit} — that's the whole promise. And it delivers."
      ],
      ctas: ["Try {product} today.", "Get it before your competitors do.", "Start now \u2192 {product}."]
    },
    friendly: {
      hooks: [
        "Quick one for the {audience} out there \u270B",
        "Ever wish your tools just... got you?",
        "Okay, real talk.",
        "Little life upgrade incoming."
      ],
      bodies: [
        "{product} helps with {benefit} — minus the headaches you're used to.",
        "Think of it as a shortcut for {audience}. No setup ceremony, no manual.",
        "We made something we needed ourselves: {benefit}, finally painless.",
        "You bring the work. {product} brings the calm."
      ],
      ctas: ["Give it a spin sometime.", "Try it free — worst case, you lost 2 minutes \u2728", "Check out {product}. Be gentle with it."]
    },
    premium: {
      hooks: [
        "Crafted, not cobbled together.",
        "The bar for {audience} just moved.",
        "Some tools chase trends. This one chases excellence.",
        "Details matter. All of them."
      ],
      bodies: [
        "{product} sets a new standard: {benefit}, with the polish {audience} expect.",
        "Every pixel and every step considered. The result is effortless.",
        "Designed so well you'll forget it's software.",
        "Quiet confidence, built in. {benefit} without the noise."
      ],
      ctas: ["Experience {product}.", "Request your invite.", "See it for yourself."]
    },
    urgent: {
      hooks: [
        "Last call.",
        "You're losing time by reading this.",
        "Every day without this costs you something.",
        "The {audience} moving fast will take the advantage."
      ],
      bodies: [
        "{benefit} — starting today. {product} gets you live in under 5 minutes.",
        "Right now your competitors are solving this. Be the one they copy.",
        "The gap between struggling and sorted is one click.",
        "Wait a month, and {benefit} becomes another regret."
      ],
      ctas: ["Start before tonight.", "Join now \u2192 {product}.", "Don't bookmark it. Open it."]
    }
  },

  PLATFORMS: ["instagram", "google", "twitter", "linkedin"],

  meta: {
    instagram: { name: "Instagram", icon: "\u{1F4F8}", spec: "one caption, 3 short paragraphs, relevant hashtags, emojis allowed" },
    google: { name: "Google Ads", icon: "\u{1F50D}", spec: "exactly 3 headlines (max 30 chars each) and 2 descriptions (max 90 chars each)" },
    twitter: { name: "X / Twitter", icon: "\u{1D54F}", spec: "two distinct post variants, max 280 chars each" },
    linkedin: { name: "LinkedIn", icon: "\u{1F4BC}", spec: "one professional post, short paragraphs, max 3000 chars, end with hashtags" }
  },

  fill(template, ctx) {
    return template
      .replaceAll("{product}", ctx.product)
      .replaceAll("{audience}", ctx.audience || "busy people")
      .replaceAll("{benefit}", ctx.benefit || "getting more done with less effort");
  },

  pick(arr, used) {
    const fresh = arr.filter((t) => !used.includes(t));
    const pool = fresh.length ? fresh : arr;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  used: [],

  take(arr, ctx) {
    const t = this.pick(arr, this.used);
    this.used.push(t);
    return this.fill(t, ctx);
  },

  bestTone() {
    const w = Store.getWeights();
    const entries = Object.entries(w.tones);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  },

  build(ctx, platform) {
    const lib = this.LIB[ctx.tone];
    if (platform === "google") return this.buildGoogle(ctx, lib);
    if (platform === "instagram") return this.buildIG(ctx, lib);
    if (platform === "twitter") return this.buildX(ctx, lib);
    return this.buildLI(ctx, lib);
  },

  buildGoogle(ctx, lib) {
    this.used = [];
    const base = ctx.product.split(/[—-]/)[0].trim() || ctx.product;
    const benefitShort = (ctx.benefit || "Work smarter daily").split(/[.!]|\n/)[0].trim();
    const audWord = ctx.audience ? ctx.audience.split(/[\s,]+/)[0] : "pros";
    const h1pool = [
      `${base} \u2014 ${benefitShort}`.slice(0, 30),
      `${benefitShort} \u2014 ${base}`.slice(0, 30),
      `${base}: ${benefitShort.slice(0, 20)}`.slice(0, 30),
      `Built for ${audWord}`.slice(0, 30)
    ].filter(Boolean);
    const h2pool = [`Try ${base} free`, `Beat the deadlines`, `Made for ${audWord}`, `Zero setup needed`].map((s) => s.slice(0, 30));
    const h3pool = [`Start in minutes`, `No learning curve`, `See it in action`].map((s) => s.slice(0, 30));
    const h1 = h1pool[Math.floor(Math.random() * h1pool.length)];
    const h2 = this.pick(h2pool, [h1]);
    const h3 = this.pick(h3pool, [h1, h2]);
    const d1 = this.take(lib.bodies, ctx).slice(0, 90);
    const d2 = this.take(lib.ctas, ctx).slice(0, 90);
    return [
      { label: "headline 1", text: h1, limit: 30 },
      { label: "headline 2", text: h2, limit: 30 },
      { label: "headline 3", text: h3, limit: 30 },
      { label: "description 1", text: d1, limit: 90 },
      { label: "description 2", text: d2, limit: 90 }
    ];
  },

  buildIG(ctx, lib) {
    this.used = [];
    const hook = this.take(lib.hooks, ctx);
    const body = this.take(lib.bodies, ctx);
    const cta = this.take(lib.ctas, ctx);
    const tags = [
      "#" + (ctx.product.split(/[ \u2014-]/)[0].toLowerCase().replace(/[^a-z0-9]/g, "")),
      "#" + (ctx.audience ? ctx.audience.split(" ").slice(0, 2).join("").toLowerCase().replace(/[^a-z0-9]/g, "") : "dailygrind"),
      "#adlife",
      "#makeitcount"
    ].filter((t) => t.length > 2);
    return [{ label: "caption", text: `${hook}\n\n${body}\n\n${cta}\n\n${tags.join(" ")}`, limit: 2200 }];
  },

  buildX(ctx, lib) {
    this.used = [];
    return [0, 1].map((i) => {
      const hook = this.take(lib.hooks, ctx);
      const body = this.take(lib.bodies, ctx);
      const cta = this.take(lib.ctas, ctx);
      const text = i === 0 ? `${hook}\n\n${body}` : `${hook}\n\n${body}\n\n${cta}`;
      return { label: i === 0 ? "variant hot" : "variant calm", text: text.slice(0, 278), limit: 280 };
    });
  },

  buildLI(ctx, lib) {
    this.used = [];
    const hook = this.take(lib.hooks, ctx);
    const body = this.take(lib.bodies, ctx);
    const cta = this.take(lib.ctas, ctx);
    return [{
      label: "post",
      text: `${hook}\n\n${body}\n\nWhat used to take a full afternoon now fits between meetings. ${ctx.audience ? ctx.audience.replace(/^./, (c) => c.toUpperCase()) : "Teams"} notice it in week one: ${ctx.benefit || "less friction, more focus"}.\n\n${cta}\n\n#Growth #Tools #${ctx.tone[0].toUpperCase() + ctx.tone.slice(1)}`,
      limit: 3000
    }];
  },

  generate(brief, platforms) {
    const ctx = {
      product: brief.product.trim(),
      audience: brief.audience.trim(),
      benefit: brief.benefit.trim(),
      tone: brief.tone
    };
    return platforms.map((plat) => ({
      platform: plat,
      tone: ctx.tone,
      blocks: this.build(ctx, plat)
    }));
  },

  /* ---------- AI mode (BYOK, direct browser -> provider) ---------- */

  async generateAI(brief, platforms) {
    const ctx = {
      product: brief.product.trim(),
      audience: brief.audience.trim(),
      benefit: brief.benefit.trim(),
      tone: brief.tone
    };
    const weights = Store.getWeights();
    let learnNote = "";
    if (weights.total >= 3) {
      const tones = Object.entries(weights.tones).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} (${n} wins)`).join(", ");
      learnNote = `\nResearch note: in previous A/B tests, ads with these tones won most often: ${tones}. Prefer structures in that spirit while keeping variety.`;
    }
    const platformSpecs = platforms
      .map((p) => `- platform: "${p}" | format: ${this.meta[p].spec}`)
      .join("\n");

    const userPrompt = `Write ad copy for:
Product: ${ctx.product}
Target audience: ${ctx.audience || "general"}
Key benefit: ${ctx.benefit || ""}
Tone: ${ctx.tone}

Platforms and exact formats required:
${platformSpecs}${learnNote}

Rules:
- Respect EVERY character limit strictly (counts include spaces/newlines).
- Be specific and concrete; never use filler words like "very", "really", "amazing".
- No placeholder brackets.
- Respond with ONLY minified JSON, no markdown fences, exactly:
{"ads":[{"platform":"<platform>","blocks":[{"label":"<label>","text":"<copy>","limit":<number>}]}]}`;

    const s = Store.getSettings();
    let raw;
    try {
      raw = s.provider === "gemini" ? await this.callGemini(s, userPrompt) : await this.callOpenAI(s, userPrompt);
    } catch (err) {
      return { cards: this.generate(brief, platforms), mode: "templates (AI failed: " + (err.message || "unknown") + ")" };
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      try { parsed = JSON.parse(m[0]); } catch {
        return { cards: this.generate(brief, platforms), mode: "templates (AI gave no JSON)" };
      }
    }

    const cards = (parsed.ads || [])
      .filter((a) => platforms.includes(a.platform) && Array.isArray(a.blocks) && a.blocks.length)
      .map((a) => ({
        platform: a.platform,
        tone: ctx.tone,
        blocks: a.blocks
          .map((b) => ({
            label: String(b.label || "block"),
            text: String(b.text || "").slice(0, Number(b.limit) || 3000),
            limit: Number(b.limit) || 280
          }))
      }));

    if (!cards.length) {
      return { cards: this.generate(brief, platforms), mode: "templates (AI response blocked)" };
    }
    return { cards, mode: `AI \u00B7 ${s.provider}${s.model ? " " + s.model : ""}` };
  },

  async callOpenAI(settings, prompt) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 45000);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: ctl.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + settings.key
        },
        body: JSON.stringify({
          model: settings.model || "gpt-4o-mini",
          temperature: 0.9,
          messages: [
            { role: "system", content: "You are a world-class direct response ad copywriter. You follow character limits exactly. You output strict JSON only." },
            { role: "user", content: prompt }
          ]
        })
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error("HTTP " + res.status + (body.includes("401") ? " — bad key" : ""));
      }
      const data = await res.json();
      const text = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : null;
      if (!text) throw new Error("empty response");
      return text.trim().replace(/^```(?:json)?/, "").replace(/```$/, "");
    } finally {
      clearTimeout(timer);
    }
  },

  async callGemini(settings, prompt) {
    const model = settings.model || "gemini-2.0-flash";
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 45000);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(settings.key)}`,
        {
          method: "POST",
          signal: ctl.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 4096 }
          })
        }
      );
      if (!res.ok) {
        const body = await res.text();
        throw new Error("HTTP " + res.status + (body.includes("401") || body.includes("400") && body.includes("API key") ? " — bad key" : ""));
      }
      const data = await res.json();
      const text = data.candidates && data.candidates[0] && data.candidates[0].content
        ? data.candidates[0].content.parts.map((p) => p.text).join("")
        : null;
      if (!text) throw new Error("empty response");
      return text.trim().replace(/^```(?:json)?/, "").replace(/```$/, "");
    } finally {
      clearTimeout(timer);
    }
  }
};
