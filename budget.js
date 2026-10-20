const Budget = {
  weakWords: ["very", "really", "just", "actually", "basically", "literally", "somehow", "stuff", "things", "amazing", "awesome", "click here", "buy now!!!", "100% guaranteed"],
  adverbs: /\b\w{6,}ly\b/g,

  analyze(blocks) {
    let text = blocks.map((b) => b.text).join("\n");
    let score = 100;
    const issues = [];

    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 0);

    const weakHits = this.weakWords.filter((w) => {
      const re = new RegExp("\\b" + w.replace(/[^\w\s!]/g, "") + "\\b", "i");
      return re.test(text.toLowerCase());
    });
    if (weakHits.length) {
      const pen = Math.min(weakHits.length * 6, 24);
      score -= pen;
      issues.push(`${weakHits.length} filler word${weakHits.length === 1 ? "" : "s"}`);
    }

    const adv = text.match(this.adverbs) || [];
    if (adv.length > 2) {
      score -= Math.min((adv.length - 2) * 3, 12);
      issues.push(`${adv.length - 2} heavy adverbs`);
    }

    const overlong = sentences.filter((s) => s.split(/\s+/).length > 24);
    if (overlong.length) {
      score -= Math.min(overlong.length * 5, 15);
      issues.push(`${overlong.length} overlong sentence${overlong.length === 1 ? "" : "s"}`);
    }

    const exclam = (text.match(/[!?]/g) || []).length;
    if (exclam > 4) {
      score -= 8;
      issues.push("exclamation overload");
    }

    const caps = (text.match(/\b[A-Z]{3,}\b/g) || []).length;
    if (caps > 3) {
      score -= 8;
      issues.push("ALL-CAPS shouting");
    }

    if (words.length < 12) {
      score -= 10;
      issues.push("too thin — add a hook or detail");
    }

    score = Math.max(10, Math.min(100, score));
    const grade = score >= 82 ? "good" : score >= 62 ? "mid" : "low";
    const label = score >= 82 ? "Sharp" : score >= 62 ? "Okay" : "Needs work";
    return { score, grade, label, issues };
  },

  gradeText(blocks) {
    return blocks.map((b) => `${b.label}: ${b.text}`).join("\n\n");
  }
};
