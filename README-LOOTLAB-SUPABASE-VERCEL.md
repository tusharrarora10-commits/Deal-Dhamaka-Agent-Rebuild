# LOOTLAB — Supabase + existing Vercel app

This build adds a LOOTLAB tab to the latest Deal Dhamaka Agent V2 package. It reuses the existing Vercel app origin and the same Supabase project/authenticated shared workspace. It does not use Cloudflare, a separate shortener provider, or a service-role key.

## One-time Supabase setup
1. Open the existing Supabase project.
2. Open SQL Editor > New query.
3. Paste and run the complete contents of `LOOTLAB-SUPABASE-SETUP.sql`.
4. The SQL creates `dd_lootlab_links`, member-only RLS policies, and the public redirect/click-count RPC `dd_lootlab_resolve`.

## Deploy
1. Extract this ZIP.
2. Replace the files in the existing Vercel/GitHub project with the contents of `Deal-Dhamaka-Agent-V2-main` (upload the contents, not an extra nested directory).
3. Commit/deploy to the existing Vercel project. Keep `supabase-config.js` as supplied; it uses the existing project URL and publishable key.
4. Open the app, go to Settings and confirm the existing Shared Cloud account is signed in.
5. Open LOOTLAB. Create a short link and test it in a private browser tab.

## How links work
A short link uses the existing Vercel app URL with a `?lootlab=<slug>` query. The app calls the Supabase RPC, increments click count, and redirects to the exact saved original affiliate URL. Affiliate parameters are not rewritten or removed. Use Share to open the iPhone share sheet and choose the LOOTLAB WhatsApp Channel.

## Important
- The SQL must be run once before the LOOTLAB tab can save or resolve links.
- The short URL is hosted on your existing app domain; it will stop working if that app/domain is renamed or removed.
- A redirect does not guarantee commission. Confirm the destination retains your affiliate ID and test with the affiliate platform's own link checker.
- JavaScript syntax and ZIP integrity were checked locally. Live Supabase SQL execution, deployment, redirect and click counting still need to be tested in your account.
