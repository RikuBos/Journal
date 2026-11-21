create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_name text not null check (char_length(btrim(transaction_name)) between 1 and 120),
  type text not null check (type in ('income', 'expense')),
  category text not null check (char_length(btrim(category)) between 1 and 60),
  amount numeric(14, 2) not null check (amount > 0),
  transaction_date date not null,
  notes text check (notes is null or char_length(notes) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_transactions_user_date_idx
on public.finance_transactions (user_id, transaction_date desc, created_at desc);

create or replace function public.finance_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists finance_transactions_set_updated_at on public.finance_transactions;
create trigger finance_transactions_set_updated_at
before update on public.finance_transactions
for each row execute function public.finance_set_updated_at();

alter table public.finance_transactions enable row level security;

revoke all on public.finance_transactions from anon;
grant select, insert, update, delete on public.finance_transactions to authenticated;

drop policy if exists "Users read own finance transactions" on public.finance_transactions;
create policy "Users read own finance transactions"
on public.finance_transactions for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own finance transactions" on public.finance_transactions;
create policy "Users insert own finance transactions"
on public.finance_transactions for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own finance transactions" on public.finance_transactions;
create policy "Users update own finance transactions"
on public.finance_transactions for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete own finance transactions" on public.finance_transactions;
create policy "Users delete own finance transactions"
on public.finance_transactions for delete to authenticated
using (auth.uid() = user_id);
