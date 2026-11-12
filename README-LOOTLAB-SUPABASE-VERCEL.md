# LOOTLAB — branded short links and WhatsApp previews

This update keeps your existing Supabase table and shared workspace. Short links now use a clean path such as `https://YOUR-VERCEL-DOMAIN/l/abc123` instead of the `?lootlab=` query string. Shared message text is branded `LOOTLAB` and contains the URL only once.

## 1. Supabase (one-time update)
Open Supabase → SQL Editor and run the complete `LOOTLAB-SUPABASE-SETUP.sql` file. It is safe to re-run: it adds optional product preview fields and creates `dd_lootlab_resolve_meta`. Existing affiliate URLs and click history are retained.

## 2. Deploy to Vercel
Replace the contents of your existing GitHub/Vercel project with the contents of this folder and deploy. Keep `api/lootlab.js`, `vercel.json`, `lootlab.js`, `index.html`, and `supabase-config.js` in their shown locations. Vercel will route `/l/<slug>` through the serverless metadata endpoint.

## 3. Create links
In LOOTLAB, enter the brand, product title, full affiliate URL, and (recommended) a publicly accessible HTTPS product-image URL. The image URL must be directly viewable without login. If you leave preview fields blank, the serverless preview route makes a best-effort attempt to read Open Graph metadata from the affiliate destination; some retailers block automated previews, so a direct image URL is the reliable option. Generate the link and share it. The original affiliate URL is stored unchanged, including affiliate parameters.

## 4. WhatsApp preview and URL branding
The short URL path is now `/l/<slug>` and Open Graph metadata says `LOOTLAB`, with product title/description/image supplied during link creation. WhatsApp may cache previews; after changing a preview, test with a newly generated slug or wait for its cache to expire.

**Domain note:** The visible domain remains your current Vercel domain (for example, `deal-dhamaka-agent-rebuild.vercel.app`). The preview/site brand and short path will say LOOTLAB, but to make the actual domain itself say `lootlab...`, add a custom domain such as `go.lootlab...` in Vercel and configure its DNS. A path cannot hide or rename the hostname.

## Validation
JavaScript syntax and ZIP integrity should be checked before deployment. Live Supabase/Vercel and WhatsApp crawler behavior must be verified after deployment; WhatsApp controls its own preview cache.
