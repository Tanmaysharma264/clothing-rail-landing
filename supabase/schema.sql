-- Run this ONCE in Supabase: Dashboard → SQL Editor → New query → paste → Run.

-- 1. Order status (shows as a dropdown in the Table Editor)
do $$ begin
  create type order_status as enum ('pending', 'paid', 'shipped', 'cancelled');
exception when duplicate_object then null; end $$;

-- 2. Orders table
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_no      bigint generated always as identity,
  created_at    timestamptz not null default now(),
  status        order_status not null default 'pending',   -- change to 'paid' by hand after you check the payment
  product_id    text not null,
  product_name  text not null,
  size          text not null,
  amount        integer not null,                          -- rupees
  customer_name text not null,
  mobile        text not null,                             -- 10 digits
  whatsapp      text generated always as ('https://wa.me/91' || mobile) stored,   -- click to open WhatsApp
  utr           text,                                      -- optional UPI transaction id
  proof_url     text not null                              -- link to the payment screenshot
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_mobile_idx on public.orders (mobile, created_at desc);

-- 3. Lock the table down: nobody can read or write it from the browser.
--    The website's server uses the secret service-role key, which bypasses this.
alter table public.orders enable row level security;

-- 4. Storage bucket for the payment screenshots (images only, max 5 MB).
--    Public so the link in the proof_url column opens in a click. File names are random and unguessable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
