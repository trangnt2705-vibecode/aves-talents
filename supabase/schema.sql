-- ============================================================
-- App tuyển dụng AVES: bảng dữ liệu và phân quyền
-- Chạy một lần trong Supabase: SQL Editor > New query > dán toàn bộ > Run
-- ============================================================

-- Danh sách người được dùng app và quyền của họ
create table if not exists public.members (
  email text primary key,
  role text not null check (role in ('admin','editor','viewer')),
  created_at timestamptz not null default now()
);

-- Dữ liệu app: mỗi dòng là một vị trí / một ứng viên / một mục cài đặt
create table if not exists public.positions  (id text primary key, data jsonb not null default '{}', updated_at timestamptz not null default now(), updated_by text);
create table if not exists public.candidates (id text primary key, data jsonb not null default '{}', updated_at timestamptz not null default now(), updated_by text);
create table if not exists public.settings   (id text primary key, data jsonb not null default '{}', updated_at timestamptz not null default now(), updated_by text);

-- Quyền của người đang đăng nhập (null nếu không có trong danh sách)
create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.members where email = lower(coalesce(auth.jwt() ->> 'email',''))
$$;

-- Tự ghi lại ai sửa, sửa lúc nào
create or replace function public.touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := lower(coalesce(auth.jwt() ->> 'email', new.updated_by));
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['positions','candidates','settings'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before insert or update on public.%1$s for each row execute function public.touch()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists read_%1$s on public.%1$s', t);
    execute format('drop policy if exists write_%1$s on public.%1$s', t);
    execute format('create policy read_%1$s on public.%1$s for select to authenticated using (public.app_role() is not null)', t);
    execute format('create policy write_%1$s on public.%1$s for all to authenticated using (public.app_role() in (''admin'',''editor'')) with check (public.app_role() in (''admin'',''editor''))', t);
  end loop;
end $$;

alter table public.members enable row level security;
drop policy if exists read_members on public.members;
drop policy if exists write_members on public.members;
create policy read_members  on public.members for select to authenticated using (public.app_role() is not null);
create policy write_members on public.members for all to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- Cập nhật realtime: ai sửa thì người khác thấy ngay
do $$ declare t text; begin
  foreach t in array array['positions','candidates','settings','members'] loop
    begin execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null; end;
  end loop;
end $$;

-- ============================================================
-- QUAN TRỌNG: thay email bên dưới bằng email của chị (viết thường),
-- đây là tài khoản quản trị đầu tiên. Người khác chị thêm trong app, tab Người dùng.
-- ============================================================
insert into public.members (email, role) values ('email-cua-chi@vi-du.com', 'admin')
on conflict (email) do update set role = 'admin';
