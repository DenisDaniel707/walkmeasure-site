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
| `href="#start" data-appstore` | hero button, both home pages | the App Store link once the app is live, and Apple's official "Download on the App Store" badge (Apple Marketing Tools) |

To publish accuracy figures, use your own field results (taped side vs. measured side)
and add them to the FAQ answer "Cât de precisă este?" / "How accurate is it?".

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

## Prices

The `#pricing` section and the "Cât costă? / How much does it cost?" and "Pot plăti o
singură dată? / Can I pay once?" answers show 19,99 lei and $3.99 a month for Pro Monthly,
and 249,99 lei and $49.99 once for Pro Lifetime. If you change a price in App Store
Connect, update both pages (the app itself always shows the App Store's prices).

The home pages follow a one-page business plan: a specific customer (people who quote
by the square metre), the expensive problem (a wrong area), the narrow promise (the
number on the spot, with how far to trust it), proof built into the product (the
start/finish check, the margin on every number, the free first project) and the two ways
to pay. Keep new copy honest: no accuracy figures, no promises the app can't check.

## Updating screenshots

Screenshots are 395×860 PNGs in `assets/img/`. Replace a file with one of the same name
and aspect ratio. `measure`, `plan`, `project`, `surface`, `floor-plan` and `projects` are
the App Store screenshots (`docs/app-store/screenshots/`) scaled down, so the site matches
the store listing. `floor-plan-pdf.png` is the top of an exported floor-plan PDF page
(title, plan and room table).

## Publishing (walkmeasure.com)

The site is served by GitHub Pages from the **public** repo
`DenisDaniel707/walkmeasure-site`, which holds only this folder. The app and
everything else live in the **private** repo `DenisDaniel707/walkmeasure`.

To publish changes: commit them in the main repo, then run

```bash
scripts/publish-website.sh
```

It splits `website/` out of the main repo's history and pushes it to the site
repo's `main` branch; Pages redeploys within a minute or two.

Files GitHub Pages uses here: `CNAME` (the custom domain), `.nojekyll` (serve
files as they are), `404.html` (shown for unknown addresses). `sitemap.xml` and
`robots.txt` are for search engines; add new pages to the sitemap.

DNS for walkmeasure.com (at the registrar):

| Type | Host | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153 |
| CNAME | www | denisdaniel707.github.io |

Remove any other A/AAAA records for `@` (such as the registrar's parking page).
