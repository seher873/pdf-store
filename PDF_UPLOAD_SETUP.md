# PDF Upload & Storage Setup (Supabase)

## 1) Database changes
Run this SQL in Supabase SQL Editor:

```sql
alter table products
  add column if not exists pdf_path text;
```

## 2) Create private storage bucket
In Supabase Dashboard → Storage:
1. Create a new bucket named `product-pdfs`
2. Set it to **Private** (do not make it public)
3. Save

## 3) Storage RLS policies (critical)
Enable RLS on storage.objects and restrict access. Only authenticated admins can upload/replace/delete. Public must NOT have access.

Replace `admin@example.com` with your actual admin email(s).

```sql
-- Only authenticated users with allowed emails can manage files in this bucket
create policy "Admins can upload product PDFs" on storage.objects
  for insert with check (
    bucket_id = 'product-pdfs' AND
    auth.role() = 'authenticated' AND
    auth.jwt() ->> 'email' IN ('admin@example.com')
  );

create policy "Admins can update product PDFs" on storage.objects
  for update using (
    bucket_id = 'product-pdfs' AND
    auth.role() = 'authenticated' AND
    auth.jwt() ->> 'email' IN ('admin@example.com')
  ) with check (
    bucket_id = 'product-pdfs' AND
    auth.role() = 'authenticated' AND
    auth.jwt() ->> 'email' IN ('admin@example.com')
  );

create policy "Admins can delete product PDFs" on storage.objects
  for delete using (
    bucket_id = 'product-pdfs' AND
    auth.role() = 'authenticated' AND
    auth.jwt() ->> 'email' IN ('admin@example.com')
  );

-- DO NOT add a public select policy for this bucket
-- Downloads must be authorized server-side with purchase verification
```

## 4) Security notes
- Bucket must be private. Never use public URLs for paid PDFs.
- Filename check is not enough - validate MIME/type server-side where possible.
- Do not delete old file before successful upload of replacement.
- Hiding UI is not security; rely on RLS and auth.
- If adding downloads later, enforce verified purchase authorization on the server.
- Limit to 10 MB and PDF only (enforced in UI).
