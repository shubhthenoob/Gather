# Gather

> Keep what matters. Find it later.

The internet is full of interesting things. Gather the ones that matter. A personal knowledge journal that captures what you read, remembers what you highlight and keeps your thoughts organised automatically.

A Chrome extension saves text highlights and notes from any webpage. A Next.js web app shows them as automatic date-wise pages, grouped by website, alongside standalone notes, with search and Markdown export. Supabase provides Google sign-in, Postgres and Row Level Security.

```
apps/web         Next.js 15 web app (App Router, Tailwind)
apps/extension   Chrome extension, Manifest V3, bundled with esbuild
packages/shared  URL canonicalising, text anchoring, timezone dates, grouping, Markdown export
supabase/        SQL migration: tables, RLS, dedupe index, day pages and search functions
```

## Setup

### 1. Supabase

1. Create a project at supabase.com.
2. Run the migration. Either paste `supabase/migrations/20261112000000_init.sql` into the SQL editor, or:
   ```
   supabase link --project-ref YOUR-REF
   supabase db push
   ```
3. Authentication > Providers > Google: enable it and paste a Google OAuth client ID and secret.
   Create the client in Google Cloud Console as a **Web application** with this authorised redirect URI:
   ```
   https://YOUR-REF.supabase.co/auth/v1/callback
   ```
4. Authentication > URL Configuration > Redirect URLs: add both of these.
   ```
   http://localhost:3000/auth/callback
   https://EXTENSION-ID.chromiumapp.org/
   ```
   The extension ID is printed by the extension build (step 3 below).

### 2. Web app

```
pnpm install
cp apps/web/.env.example apps/web/.env.local   # fill in URL and anon key
pnpm dev                                       # http://localhost:3000
```

### 3. Extension

```
pnpm --filter extension keygen   # once: creates key.pem for a fixed extension ID
pnpm --filter extension build    # prints the extension ID and OAuth redirect URL
```

The build reads `apps/extension/.env` and falls back to `apps/web/.env.local`. Set `WEB_URL` in `.env` once the web app is deployed.

Load it in Chrome: `chrome://extensions` > Developer mode > Load unpacked > `apps/extension/dist`.

Keep `key.pem` private and out of git. Losing it changes the extension ID, and the redirect URL in Supabase then has to be updated.

## Commands

```
pnpm test        # shared + extension unit tests
pnpm typecheck
pnpm build       # web production build + extension bundle
pnpm dev:ext     # extension rebuild on change
```

## How it works

- **Privacy.** Every table has RLS policies restricting rows to `auth.uid()`. The extension only ever holds the anon key and the user's own session.
- **Shared identity.** The web app and extension both sign in through Supabase Google OAuth, so they resolve to the same user. The extension uses `chrome.identity.launchWebAuthFlow` with PKCE.
- **Date pages** are not stored. They are derived from UTC `created_at` in the user's timezone, which defaults to the browser timezone at first sign-in and can be changed in Settings.
- **Anchoring.** Each highlight stores its exact text, 64 characters of prefix and suffix, and a character offset hint. On revisit the extension rebuilds a text index of the page and finds the quote by context. If no occurrence matches confidently, it paints nothing and reports the highlight as not restored.
- **Painting** uses the CSS Custom Highlight API, so page HTML is never modified.
- **Duplicates.** A unique index on user, canonical URL, normalised text and context blocks duplicates. Selecting already-highlighted text offers note editing instead of a new save.
- **Offline.** Failed writes go to a queue in `chrome.storage.local` with client-generated IDs, replayed every minute and on browser start. Page highlights are cached for offline restore.
- **Sync.** The web app subscribes to Supabase Realtime and refreshes when the extension saves. The extension re-fetches when a tab becomes visible, so deletions in the web app stop restoring.

## Not in this MVP

Notion, AI summaries, sharing, tags, custom colours and keyboard shortcuts, per the PRD.
