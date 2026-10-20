# AdSpark — ads that sell

Platform-native ad copy generator. Works **100% offline** with its built-in template engine, or connect your own API key for real AI generation.

## Run locally

```bash
node server.js        # http://localhost:5301
```

(or just open `index.html` in a browser)

## Modes

| Mode | How | What you get |
|---|---|---|
| **Templates (offline)** | Nothing to configure | Built-in hook/body/CTA engine, 4 tones x 4 platforms |
| **AI (BYOK)** | Click the gear -> pick OpenAI or Gemini -> paste your key | Genuinely fresh copy from an LLM |

- Your key is stored **only in your browser's localStorage** and calls go **directly from your browser to the provider** (OpenAI / Google). AdSpark's code never sees your key.
- Recommended models: `gpt-4o-mini` (OpenAI, cheap) or `gemini-2.0-flash` (Gemini free tier is fine for light use).

## Features

- 4 platforms: Instagram, Google Ads (30/90 char limits), X/Twitter (280), LinkedIn
- Editable output with live character counters
- Performance budget scorer (filler words, adverbs, sentence length, caps, exclamation use)
- A/B pair mode: save two variants of an ad, crown the winner later — wins train the engine's tone preference
- Copy all / export .txt / export .csv / print-to-PDF client-ready brief

## Publishing (free static hosting)

The whole app is static — no backend needed.

**GitHub Pages**
1. Push this folder to a repo
2. Settings -> Pages -> deploy from `main` / root
3. Live at `https://<you>.github.io/<repo>/`

**Netlify** — drag & drop this folder at app.netlify.com

**Vercel** — `vercel` CLI, or import the repo, framework preset "Other"

Note: AI mode requires HTTPS or localhost for clipboard + fetch reliability — both GitHub Pages and Netlify give you HTTPS automatically.

## Structure

```
index.html    — app shell
styles.css    — editorial cream/ink theme + print styles
server.js     — tiny local static server (dev only, not needed when published)
js/
  store.js    — localStorage (ads, A/B pairs, winner weights, settings)
  budget.js   — performance budget scorer
  generator.js— template engine + OpenAI/Gemini BYOK calls
  views.js    — results/library/insights rendering
  app.js      — wiring, settings modal, exports, print
```
