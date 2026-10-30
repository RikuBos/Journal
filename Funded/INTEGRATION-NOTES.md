# Backend integration notes

- Existing UI/components and calculation logic were retained.
- Replaced IndexedDB-backed `DB` API with Supabase-backed implementation, keeping the same `get/getAll/put/delete/clear` interface.
- Added Supabase Auth gate (email/password login and registration) before mounting the existing app.
- Added private Storage uploads for trade screenshots and generic private user image helpers.
- Added SQL schema and RLS policies in `supabase/schema.sql`.
- Added setup instructions in `SUPABASE-SETUP.md`.

No Supabase project credentials were supplied, so the app is not connected to a live database yet. Add your Project URL and Publishable key in `js/lib/supabase-config.js`, then run the SQL setup.
