alter table public.finance_accounts
  add column if not exists balance_as_of date;

update public.finance_accounts
set balance_as_of = created_at::date
where balance_as_of is null;

alter table public.finance_accounts
  alter column balance_as_of set default current_date;

alter table public.finance_accounts
  alter column balance_as_of set not null;
