-- ShiftSwap Database Schema
-- Drop existing objects to start fresh
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.swap_requests;
drop table if exists public.shifts;
drop table if exists public.users;

-- 1. Users table
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  role text not null default 'worker' check (role in ('worker', 'manager')),
  full_name text not null,
  created_at timestamptz default now()
);

alter table public.users enable row level security;
create policy "users_select_all" on public.users for select using (true);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- 2. Shifts table
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  assigned_to uuid not null references public.users(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'open_for_swap', 'pending_approval', 'swapped')),
  created_at timestamptz default now()
);

alter table public.shifts enable row level security;
create policy "shifts_select_all" on public.shifts for select using (auth.uid() is not null);
create policy "shifts_update_own" on public.shifts for update using (auth.uid() = assigned_to);
create policy "shifts_update_manager" on public.shifts for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'manager')
);
create policy "shifts_insert_auth" on public.shifts for insert with check (auth.uid() is not null);

-- 3. Swap Requests table
create table public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  requested_by uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

alter table public.swap_requests enable row level security;
create policy "swap_requests_select_all" on public.swap_requests for select using (auth.uid() is not null);
create policy "swap_requests_insert_own" on public.swap_requests for insert with check (auth.uid() = requested_by);
create policy "swap_requests_update_manager" on public.swap_requests for update using (
  exists (select 1 from public.users where id = auth.uid() and role = 'manager')
);
create policy "swap_requests_update_own" on public.swap_requests for update using (auth.uid() = requested_by);

-- 4. Auto-create user profile trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, role, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    coalesce(new.raw_user_meta_data ->> 'role', 'worker'),
    coalesce(new.raw_user_meta_data ->> 'phone', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
