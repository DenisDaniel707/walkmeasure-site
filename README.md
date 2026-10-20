# WalkMeasure — site de prezentare / presentation website

Static site, Romanian (`index.html`) and English (`en/index.html`), desktop and mobile.
Plain HTML + CSS + a little JavaScript. No build step, no frameworks, no cookies, no
analytics, no external fonts or scripts, so no cookie banner is needed.

```
website/
├── index.html               Romanian home page
├── confidentialitate.html   Romanian privacy page
├── en/index.html            English home page
├── en/privacy.html          English privacy page
└── assets/
    ├── styles.css           all styles (light + dark mode)
    ├── site.js              menu, scroll reveal, "how it works" slideshow
    ├── favicon.svg
    └── img/                 app screenshots, app icon, demo/ slides (SVG)
```

## Preview locally

```bash
python3 -m http.server 8765 --directory website
```

Then open http://localhost:8765 (RO) and http://localhost:8765/en/ (EN).

## Before publishing — replace the placeholders

Search both languages for these and replace them:

| What | Where | Replace with |
|---|---|---|
| `contact@example.com` | `index.html`, `en/index.html`, both privacy pages | your real contact address |
| `href="#start" data-appstore` | hero button, both home pages | the App Store link once the app is live, and Apple's official "Download on the App Store" badge (Apple Marketing Tools) |
| `og:image` (commented out) | `<head>` of both home pages | a full `https://` URL to a 1200×630 preview image |
| "Rezultate din teren: în curând" / "Field results: coming soon" | `#honest` section | a table of real field tests (site, taped side, measured side, error %) — and then update the "Precizie" / "Accuracy" row of the comparison table |
| "Prețul va fi anunțat la lansare" / "The price will be announced at launch" | FAQ | the real price |

Do not publish accuracy figures until they come from real, independently checked
measurements. The current text says plainly that the figures so far come from simulation.

## Replacing the "how it works" presentation with the video

The animated 5-step presentation in the `#how` section is a stand-in for the video.
Each home page has an HTML comment right above `<div class="demo" ...>` with the exact
code to paste. In short, replace the whole `<div class="demo"> … </div>` block with:

```html
<div class="video">
  <video src="assets/video/cum-functioneaza.mp4" poster="assets/img/demo/1-stick.svg"
         controls playsinline preload="metadata"></video>
</div>
```

(in `en/index.html` the paths start with `../`), or with a YouTube embed using
`https://www.youtube-nocookie.com/embed/VIDEO_ID` so no tracking cookies are set before
the visitor presses play. The `.video` styles are already in `styles.css`.

Video tips: 30–60 s, landscape 16:9, show the selfie stick from the side, the phone being
set down, a close-up of the hand feeling the buzz, the walk back to the start and the result
on screen. Export H.264 MP4 under ~15 MB.

## Updating screenshots

Screenshots are 395×860 PNGs in `assets/img/`. Replace a file with one of the same name
and aspect ratio. They are currently from the English version of the app.

## Publishing

Any static host works. Upload the contents of `website/` as the site root:

- **Netlify / Cloudflare Pages:** drag and drop the `website` folder, or connect the repo
  with the publish directory set to `website`.
- **GitHub Pages:** push the folder's contents to a `gh-pages` branch (or `/docs`).
- **Classic hosting (cPanel):** upload everything into `public_html/` by FTP.

Afterwards, add your domain to the `og:image` tag and, if you want, a `sitemap.xml`
listing `/`, `/en/`, `/confidentialitate.html` and `/en/privacy.html`.
