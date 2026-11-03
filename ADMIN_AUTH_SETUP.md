# Admin Authentication Setup

## 1) Create the first admin account (safe way)
Do NOT create a public signup page. Create the admin user in Supabase:

1. Go to Supabase Dashboard → Authentication → Users → Add user (Create new user)
2. Enter the admin email and a strong password
3. Save the user

Only users you explicitly create can sign in. No self-registration is provided.

## 2) Protect the admin via Row Level Security (required)
Replace broad policies with role-based/allowlist policies.

```sql
-- Ensure RLS is enabled
alter table products enable row level security;

-- Drop old permissive policies if they exist
drop policy if exists "Public read products" on products;
drop policy if exists "Prototype write products" on products;

-- Allow anyone to read products (public store)
create policy "Public read products" on products
  for select using (true);

-- Only authenticated admins can write. Use one of these approaches:

-- Option A: Check by email allowlist (simple for small teams)
create policy "Admins can insert products" on products
  for insert with check (
    auth.role() = 'authenticated' AND auth.jwt() ->> 'email' IN ('admin@example.com')
  );

create policy "Admins can update products" on products
  for update using (
    auth.role() = 'authenticated' AND auth.jwt() ->> 'email' IN ('admin@example.com')
  ) with check (
    auth.role() = 'authenticated' AND auth.jwt() ->> 'email' IN ('admin@example.com')
  );

create policy "Admins can delete products" on products
  for delete using (
    auth.role() = 'authenticated' AND auth.jwt() ->> 'email' IN ('admin@example.com')
  );

-- Option B: Use a custom claim/role table (more scalable). Add to your setup if needed.
```

Replace `admin@example.com` with your actual admin email(s).

## 3) Environment variables
Use existing vars (anon key is fine for client auth):
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Security notes
- Hiding `/admin` is not security. Always enforce RLS on the database.
- UI protection (redirects) improves UX but must be backed by policies.
- Never put service_role key in browser code.
- No public signup page is provided.
