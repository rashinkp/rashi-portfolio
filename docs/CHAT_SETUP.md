# Portfolio chat setup

The React portfolio uses ASTRYX chat components and the Vercel AI SDK. Supabase hosts the knowledge database and two Edge Functions. Gemini generates answers; Supabase's built-in `gte-small` model creates the 384-dimensional embeddings.

The portfolio launcher links to the dedicated `/chat` page. The Vercel rewrite in `vercel.json` supports direct visits and refreshes. On other hosts, rewrite `/chat` to `/index.html`. The chat opens in preview mode until frontend environment variables are configured. It never returns simulated AI answers.

## 1. Create and link a free Supabase project

Use Node.js 22.18 or later for the knowledge scripts. From the project root:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The migration enables pgvector, creates a private knowledge table, and adds atomic request budgets. It does not expose tables or RPC functions to anonymous visitors. Use a dedicated project or review the migration before applying it to a shared database.

## 2. Configure Edge Function secrets

Copy `.env.functions.example` to `.env.functions.local` and fill in:

- `GEMINI_API_KEY`: your Google AI Studio API key.
- `GEMINI_MODEL`: defaults to `gemini-3.5-flash-lite`; choose a currently available model in your account if necessary.
- `CHAT_PROVIDER`: `google` (default) or `groq`. Groq uses `openai/gpt-oss-20b` with low reasoning and the same retrieval and verification safeguards. Set `GROQ_API_KEY` as a server-only secret before selecting Groq. Restore `CHAT_PROVIDER=google` to roll back without changing code. No paid service tier is requested.
- `TURNSTILE_SECRET_KEY`: the private secret for a free Cloudflare Turnstile Managed widget. Use real credentials; public test secrets are rejected by the backend.
- `ALLOWED_ORIGINS`: exact frontend origins, separated by commas, without paths or trailing slashes. Include your production domain and `http://localhost:5173` for local development. If Vite chooses another port, add that exact origin too.
- `RATE_LIMIT_SALT`: a random private value used to hash client addresses.
- `INGEST_SECRET`: a different random private value that authorizes knowledge updates.

Generate each random value separately with `openssl rand -hex 32`. Do not commit the local files or paste their contents into chat.

```sh
npx supabase secrets set --env-file .env.functions.local
npx supabase functions deploy chat
npx supabase functions deploy ingest
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are supplied automatically by the hosted Supabase Edge Function runtime. Never put the service role key or Gemini key in a `VITE_*` variable.

Both functions disable gateway JWT checks in `supabase/config.toml` because visitors do not sign in and publishable keys are not JWTs. The public chat handler requires a server-verified Turnstile token before database access, embeddings, or Gemini. The ingest handler requires the separate secret before reading the request body or generating embeddings.

## 3. Review and upload the knowledge

```sh
npm run knowledge:prepare
```

Review `.knowledge/documents.json`. The curated content in `knowledge/profile.json` was transcribed from the existing résumé and current portfolio. Projects and toolkit entries are generated directly from `src/data/portfolio.ts`.

The existing résumé and current site disagree on Brocamp dates. The curated entry records both and uses the site's 2024–2025 dates. Offrolls experience comes from the current portfolio. Availability, salary, notice period, and quantitative outcomes are intentionally not inferred. The knowledge omits the résumé's phone number; the downloadable PDF remains unchanged.

Copy `.env.ingest.example` to `.env.ingest.local`. Set `SUPABASE_URL` and the same `INGEST_SECRET` configured above. Then run:

```sh
npm run knowledge:ingest
```

The script embeds one chunk per function invocation to stay within the Free plan CPU budget, then replaces the complete dataset in one transaction. If validation, embedding, or database insertion fails, the old dataset remains available. Re-run after updating content. Updating the PDF alone does not update the curated knowledge: review and edit `knowledge/profile.json` too.

## 4. Connect the frontend

Create a widget at [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile), choose **Managed**, and allow only your production hostname plus `localhost`/`127.0.0.1` if needed for development. Turnstile works with Vercel/Supabase; no DNS move or paid Cloudflare plan is required. Keep hostname validation enabled. Save its secret in Supabase as `TURNSTILE_SECRET_KEY` and its public site key in the frontend variable below.

Copy `.env.example` to `.env.local` and set:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
VITE_TURNSTILE_SITE_KEY=YOUR_PUBLIC_TURNSTILE_SITE_KEY
```

Add the same three public variables to your frontend hosting environment. Restart Vite after local changes or rebuild/redeploy the hosted frontend after changing hosted variables. Missing Turnstile configuration disables sending; there is no production bypass. Deploy the frontend and backend together once the widget keys are configured.

For an existing installation, apply both `20261018120000_chat_abuse_protection.sql` and `20261019090000_chat_token_replay_guard.sql` with `npx supabase db push`, then redeploy the chat function. These preserve existing daily counters. The new monthly counter starts with requests admitted after the abuse-protection migration.

```sh
npm run dev
```

The browser sends the public key in the `apikey` header. Only the Edge Function calls Gemini and accesses the private knowledge table.

## 5. Verify the connected system

```sh
npm run test:chat
npm run test:chat:edge
npm run lint
npm run build
```

In the browser, check:

1. Ask about ByWay and payments. Check the answer against the résumé and open a retrieved source.
2. Ask a follow-up such as “What technology did he use for that?”
3. Ask about salary or notice period. The answer should say the information is not established.
4. Ask an unrelated general question. It should return to portfolio topics.
5. Stop a streaming reply, ask another question, and start a new chat.
6. Confirm missing/invalid Gemini configuration produces a recoverable error rather than an invented answer.
7. Check keyboard focus, Escape, mobile layout, light/dark themes, and rate-limit responses.
8. Send two messages and retry a failed answer: each attempt needs a fresh token. Stop during verification and navigate back to the portfolio; no chat request should be sent after cancellation.
9. A missing, expired, reused, wrong-host, or wrong-action token must return 403 without using the database/model. A Cloudflare outage must fail closed with 503. Do not flood the hosted function to test this; the local unit tests exercise these paths.

For Edge Function type checking:

```sh
npx deno check --config supabase/functions/deno.json supabase/functions/chat/index.ts supabase/functions/ingest/index.ts
```

Deno alone cannot run Supabase's built-in embedding model; that requires the Supabase Edge Runtime. Hosted retrieval, SQL execution, and Gemini answers must be tested after project connection.

## Cost and operational limits

Limits allow a message every five seconds, five per minute and 30 per UTC day for a client-address hash, plus 20 per minute, 200 per UTC day, and 3,000 per UTC calendar month across the entire site. Atomic global budgets remain the main AI spending control; network-address limits are best effort and depend on the gateway's forwarded address headers. New client buckets are created only for accepted requests. Expired bucket cleanup is indexed and bounded to 100 rows per accepted request.

Each message/retry requires a fresh Turnstile token validated by Cloudflare, including matching the `portfolio_chat` action, the allowed origin's hostname, and an issuance time within five minutes. The database atomically claims its SHA-256 hash with the usage budget, so replay cannot generate another answer even if upstream validation succeeds again. Token hashes expire after ten minutes; raw tokens are never stored in the database. The endpoint requires Origin, but Origin/CORS alone are not authentication. There is also a per-worker burst guard of 30 verification attempts per minute; it is best effort across worker restarts/instances, not a distributed request cap. Verification times out after eight seconds and body reading after ten seconds. Turnstile loads only after chat arrival and prepares a token while the visitor reads or types. Prepared tokens stay in memory for at most four minutes and are consumed once. Sending joins an in-flight challenge instead of restarting it; after the server responds, a separate token is prepared for the next turn. Expiry, cancellation, and navigation discard pending tokens. Every send still requires server validation and the atomic replay/budget check. A challenge is shown only if Cloudflare requires interaction. The React wrapper handles widget/script lifecycle.

This reduces automated abuse, but cannot stop all bots or network floods. Requests rejected before generation still consume Edge Function invocation/network quota; Turnstile is not an upstream WAF for the direct Supabase endpoint. The Free plans protect against paid overages, not service disruption. Avoid adding a paid Redis service or proxy just for this portfolio; monitor usage and add upstream protection if traffic warrants it.

Every accepted request counts, including failed requests. Recent model context is limited to six messages, questions to 2,000 characters, retrieval candidates to five, and generated output to 600 tokens. Automatic model retries are disabled. Requests time out after 45 seconds. Responses expose `Server-Timing` for verification, budget, catalog, embedding, and retrieval, plus an `X-Chat-Request-Id` for correlation. Server diagnostics record only the request ID, stage, model name, and elapsed time, never tokens, prompts, conversation text, or raw IP addresses. The code does not store conversation text or raw IP addresses. Messages and retrieved context are sent to Google; review your chosen Gemini tier's data-use terms before enabling it publicly.

Supabase Free can pause low-activity projects. The UI shows an error when the service cannot be reached; the rest of the portfolio remains available. Restore a paused project in the Supabase dashboard. Limits reduce costs but are not a provider billing guarantee; keep provider billing alerts enabled if using a paid API tier.

## Files

- `src/components/PortfolioChat.tsx`: chat UI and AI SDK transport.
- `supabase/functions/chat/index.ts`: retrieval and Gemini streaming.
- `supabase/functions/ingest/index.ts`: protected knowledge updates.
- `supabase/migrations/20261018090000_portfolio_chat.sql`: vectors, access restrictions, transactional ingestion, and budgets.
- `knowledge/profile.json`: reviewed résumé and experience content.
- `scripts/knowledge.mjs`: generated project/toolkit knowledge and chunking.

References: [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Turnstile React wrapper](https://docs.page/marsidev/react-turnstile), [Supabase embeddings](https://supabase.com/docs/guides/ai/quickstarts/generate-text-embeddings), [Supabase function authentication](https://supabase.com/docs/guides/functions/auth), [AI SDK useChat](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat), [Gemini pricing and data-use terms](https://ai.google.dev/gemini-api/docs/pricing).

Source selection sends named project or Offrolls passages for focused questions, up to three strong semantic matches for general questions, and the complete project inventory only for project-list requests. Follow-up questions retain their named subject.

Grounding instructions prohibit inferring product or billing features from technology names. A bounded streaming citation normalizer converts decorative numeric citations to supported ASCII citations and removes unknown source numbers. It does not buffer the whole answer or rewrite model facts. `X-Chat-Model` identifies the selected model for timing diagnostics; reasoning text is not forwarded to visitors.

Groq additionally reviews its generated draft against the current references and citation requirements before showing answer text. A failed review permits one corrected draft and another review, within the shared request deadline. Invalid reviews or a second failed review return an error rather than exposing the draft. This adds model calls and uses more free-tier tokens; it is a model-based check, not a guarantee of factual correctness. Google retains its existing streaming path.
