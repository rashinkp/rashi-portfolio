# SEO and mobile performance

Deployed and checked on 4 November 2026 at `https://rashinkp.vercel.app/`. Vercel marked commit `7be1426` Ready, Production, and Current.

The homepage has prerendered content, a self-referencing canonical, profile structured data, a sitemap, and robots.txt. Open Graph and Twitter cards now share `public/social-preview.jpg`, a 1200 × 630 JPEG. The chat page has its own title and description, plus `noindex, follow` in the generated HTML. Vercel configuration adds the same instruction as an `X-Robots-Tag` header for `/chat`, `/chat/`, and `/chat/index.html`.

Do not disallow chat in robots.txt: crawlers need access to read its noindex instruction. Chat remains outside the sitemap. Client-side navigation updates the canonical, descriptions, titles, and robots directive; returning home restores `index, follow`.

## Performance measurements

Lighthouse 13.6.0, mobile preset, simulated throttling, clean headless Chrome runs. The unchanged production site scored 75 for performance and 100 for SEO. To compare code changes under the same hosting conditions, the unchanged and updated production builds were also served with Vite preview on local ports 4174 and 4173.

| Local production build | Before | After |
| --- | ---: | ---: |
| Performance | 89 | 100 |
| SEO | 100 | 100 |
| First Contentful Paint | 2.8 s | 1.1 s |
| Largest Contentful Paint | 2.8 s | 1.1 s |
| Speed Index | 4.7 s | 1.4 s |
| Total Blocking Time | 20 ms | 20 ms |
| Cumulative Layout Shift | 0 | 0.003 |
| Measured network transfer | 5,187 KB | 425 KB |

Local scores are lab results, not deployed Core Web Vitals. Hosting latency, device speed, cache state, and network conditions affect results. Rerun against production after deployment.

The post-deployment mobile Lighthouse run scored **92 for performance and 100 for SEO**, compared with **75 and 100** before deployment. Live Largest Contentful Paint improved from 4.3 s to 2.5 s; measured transfer fell from 5,188 KB to 423 KB. Total Blocking Time was 60 ms and Cumulative Layout Shift was 0. These are lab measurements, not real-user Core Web Vitals.

Live checks confirmed the homepage remains indexable and prerendered; `/chat`, `/chat/`, and `/chat/index.html` return `noindex, follow` in both HTML and response headers. The social JPEG, local WOFF2 fonts, WebP thumbnails, robots.txt, and sitemap all return 200. Structured data is present, the idle homepage does not request the chat chunk, and the 390-pixel mobile viewport has no horizontal overflow. Opening chat applies its own title, canonical, and noindex metadata.

The three project screenshots now total 74 KB instead of 4.67 MB. WebP copies are resized to a maximum width of 960, with the source PNGs retained. Their intrinsic dimensions are specified and the existing aspect-ratio containers reserve layout space. Images remain lazy-loaded and decode asynchronously.

Gaegu and Solway use local Latin WOFF2 files with `font-display: swap`; the original font families stay in the theme. The heading and regular body faces are preloaded. Font licenses are in `public/fonts/`. Characters outside the Latin subset use the existing fallback font stacks. This removes the blocking Google Fonts stylesheet and extra remote font connections.

Chat no longer downloads and mounts during homepage idle time. Hover, focus, pointer-down, or click starts preparation; direct chat visits still load chat immediately. Browser QA confirmed zero chat chunk requests on an idle homepage, working open/return navigation, local font loading, and fitted images without horizontal overflow at 390 pixels.

The main JavaScript bundle is still about 667 KB uncompressed, largely React, Motion, and the design system. Further splitting is possible, but the current build has low blocking time and a 100 mobile lab score. CSS still comes from the design system.

## Checks and deployment follow-up

`npm run build`, `npm run test:prerender` (7 tests), and `npm run test:chat` (60 tests) pass. Analytics tests also pass. Lint has no new warnings; three existing warnings remain in `src/components/ChatVerification.tsx`.

To reproduce the mobile audit after building and starting `npm run preview`:

```sh
npx --yes lighthouse@13.6.0 http://localhost:4173/ --only-categories=performance,seo --output=json --output-path=/tmp/portfolio-mobile.json --chrome-flags='--headless --no-sandbox'
```

Remaining account-level follow-up:

1. Confirm ownership in Google Search Console, submit `https://rashinkp.vercel.app/sitemap.xml`, and inspect the homepage URL. A verification file alone does not confirm ownership or indexing.
2. Check Page Indexing and Core Web Vitals in Search Console. The live account reports were not accessible during this audit.
3. Refresh cached link previews on sharing platforms if they still show the older card.

Separate project case studies remain a useful future content improvement. They need substantive project details and are outside this technical SEO update.

## Social image source

Created with the built-in imagegen tool, then resized and encoded as JPEG with macOS `sips`. Final asset: `public/social-preview.jpg`. Generation prompt:

> Use case: ads-marketing. Create a polished social sharing preview for Rashin KP’s personal portfolio, wide 1200:630 aspect ratio. Match a friendly minimalist notebook website: warm off-white dotted notebook paper, charcoal serif headline, muted purple accent, pale green and yellow sticky notes, a small friendly hand-drawn robot doodle on the right. Strong readable typographic composition, generous margins. Exact text: "Rashin KP" large; "Full-stack Product Engineer" beneath; "Product · AI · Design" as a small supporting line; "rashinkp.vercel.app" at the bottom. Keep all text clearly readable in a small link preview. Flat editorial illustration, crisp simple shapes, no photography, no gradients, no extra text or watermarks. Save the generated image so it can be copied into the project.
