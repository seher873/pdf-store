# Secure Purchase-Authorized PDF Downloads

## Goal
Only allow downloads after admin marks order as `Payment Received` or `Completed`. Never expose private PDFs via public URLs. Never auto-mark paid.

## Required changes

### 1) Database
Add verification fields to `orders`:

```sql
alter table orders
  add column if not exists download_code text,
  add column if not exists download_code_expires_at timestamp with time zone,
  add column if not exists download_code_used_at timestamp with time zone;
```

Generate download codes securely (server-side). Optionally hash them if storing long-term; for prototype store securely and expire quickly.

### 2) Environment variables
```env
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # SERVER ONLY - NEVER expose to client
DOWNLOAD_CODE_EXPIRY_MINUTES=10
SIGNED_URL_EXPIRY_SECONDS=300
```

## 3) Flow
1. Customer enters order reference on `/download`
2. Request a one-time verification code (server sends or displays based on setup). Since emailing isn't configured, admin can generate/share code securely or system can issue short code.
3. Customer verifies code
4. Server checks: order exists, code valid/unexpired/unused, status in (Payment Received, Completed), product has pdf_path
5. Server creates short-lived signed URL using service role (server only) and returns it or redirects
6. Never log codes/URLs

## 4) Policies
- Keep storage bucket private
- Do not add public select policy
- Only service role can create signed URLs server-side
- RLS remains strict

## Security notes
- Order reference alone is not a secret - must verify with code/other mechanism
- Admin must change status to Payment Received only after verifying payment
- Do not issue download just for "Pending/Confirmed"
- Rate limit recommended in production
- This prototype requires email/code delivery setup; document clearly if not fully wired
