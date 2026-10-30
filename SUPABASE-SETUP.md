# FTJ — Supabase setup

This version keeps the existing HTML/CSS/vanilla-JS + React CDN UI. It replaces the local IndexedDB persistence adapter with Supabase. It does not require a build step.

## 1) Create Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Open Project Settings > API.
3. Copy the Project URL and the Publishable key (or legacy anon key).
4. Edit `js/lib/supabase-config.js` and replace both placeholders.

Never put the Secret key / service_role key in this static frontend.

## 2) Create database and Storage policies

In Supabase Dashboard > SQL Editor, run all of `supabase/schema.sql`.

This creates:
- `public.user_records`: a JSONB record table that preserves the app's existing store model (accounts, trades, journals, settings, reviews, mistakes, playbook).
- Private Storage buckets `trade-screenshots` and `user-images`.
- RLS policies limiting database rows and Storage files to the signed-in owner.

## 3) Enable Auth

In Authentication > Providers, enable Email. Configure email confirmation as desired. For production, set the Site URL to your Vercel domain and add both production and preview URLs under Redirect URLs if needed.

## 4) Run locally

Use VS Code Live Server or any static server. Do not open `index.html` with `file://`.

## 5) Deploy to Vercel

Import this folder/repository as a static site. No build command is required; set the output directory to the project root (or leave Vercel's static defaults). The Supabase URL and publishable key are in `js/lib/supabase-config.js`, so this implementation does not require Vercel environment variables. For team/production deployments, you may instead inject config at build/deploy time, but do not use a service-role key.

## 6) Existing local data migration

Before replacing the old deployed version, open its Settings > Data Management > Export and save the JSON backup. In the new Supabase-backed version, register/login, open Settings > Data Management > Import, and import that JSON. Import writes records into the currently authenticated user's account. Keep the backup until you've verified the imported data.

## 7) Image handling

Trade screenshots are uploaded to the private `trade-screenshots` bucket. The database stores the Storage path, not the base64 image. The app requests a 1-hour signed URL when rendering screenshots. The generic helper `DB.uploadFile(file, folder)` is available for future profile/avatar upload UI and uses the private `user-images` bucket; `DB.getFileUrl(path, 'user-images')` returns a signed URL.

Allowed images: PNG, JPG/JPEG, WEBP. Max size: 8 MB.

## Important notes

- The old app stored data in each browser's IndexedDB. The new version stores data per authenticated Supabase user. Existing IndexedDB data is not automatically uploaded; use the export/import migration above.
- This is a frontend-only static app. The Supabase Publishable/anon key is expected to be public; RLS is the security boundary. Never expose the Supabase Secret/service_role key.
- Discord webhook settings are still part of the user's data. A webhook URL placed in a static browser app is visible to that user and should be treated as a secret. For a multi-user public product, move Discord webhook delivery to a trusted server/Edge Function rather than storing or invoking arbitrary webhooks from the browser.
- Storage image upload is performed when a trade is saved. Existing screenshots stored as IndexedDB data URLs are migrated as files when the trade is saved in the new app; for bulk migration, export/import first and then re-save affected trades, or add a dedicated migration utility.
