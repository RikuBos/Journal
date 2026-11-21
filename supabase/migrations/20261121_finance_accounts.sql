create table if not exists public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 30),
  initial_balance numeric(14, 2) not null default 0 check (initial_balance >= 0),
  color text not null default '#60a5fa' check (color ~ '^#[0-9a-fA-F]{6}$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_accounts_user_idx
on public.finance_accounts (user_id, sort_order, created_at);

drop trigger if exists finance_accounts_set_updated_at on public.finance_accounts;
create trigger finance_accounts_set_updated_at
before update on public.finance_accounts
for each row execute function public.finance_set_updated_at();

alter table public.finance_accounts enable row level security;

revoke all on public.finance_accounts from anon;
grant select, insert, update, delete on public.finance_accounts to authenticated;

drop policy if exists "Users read own finance accounts" on public.finance_accounts;
create policy "Users read own finance accounts"
on public.finance_accounts for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own finance accounts" on public.finance_accounts;
create policy "Users insert own finance accounts"
on public.finance_accounts for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own finance accounts" on public.finance_accounts;
create policy "Users update own finance accounts"
on public.finance_accounts for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete own finance accounts" on public.finance_accounts;
create policy "Users delete own finance accounts"
on public.finance_accounts for delete to authenticated
using (auth.uid() = user_id);

alter table public.finance_transactions
  add column if not exists account_id uuid references public.finance_accounts(id) on delete set null;

create index if not exists finance_transactions_account_idx
on public.finance_transactions (account_id);

drop policy if exists "Users insert own finance transactions" on public.finance_transactions;
create policy "Users insert own finance transactions"
on public.finance_transactions for insert to authenticated
with check (
  auth.uid() = user_id
  and (account_id is null or exists (
    select 1 from public.finance_accounts a where a.id = account_id and a.user_id = auth.uid()
  ))
);

drop policy if exists "Users update own finance transactions" on public.finance_transactions;
create policy "Users update own finance transactions"
on public.finance_transactions for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (account_id is null or exists (
    select 1 from public.finance_accounts a where a.id = account_id and a.user_id = auth.uid()
  ))
);
