# Portfolio analytics

PostHog receives explicit anonymous events through its batch API. No analytics
SDK, autocapture, heatmaps, session recordings, error capture, or person profiles
are enabled. Chat text, form values, DOM text, query strings, fragments, and
full referrer URLs are not sent. Location enrichment is disabled.

Events: page views, first section views per page load, navigation clicks,
published project and social links, résumé downloads, chat opens, accepted chat
requests, and successful contact-draft opens. The latter two are counts only.
An anonymous browser ID persists in local storage; a session ID lasts for the tab.

Tracking runs only on `rashinkp.vercel.app` in production. Localhost, deployment
previews, automated browsers, and storage-blocked browsers do not send events.

To exclude another browser or device, visit:

https://rashinkp.vercel.app/?analytics=off

This stores `portfolio-analytics-opt-out=true` in that browser and removes the
parameter from the address bar. The opt-out remains until that site's storage
is cleared. The owner's Ego browser was opted out during setup. Browser/device
exclusion does not automatically transfer to other browsers or devices.

The project token in `src/data/analytics-config.ts` is public and write-only.
Never replace it with a personal API key. No payment method is required.
