-- ============================================================
-- SQL INIT untuk SIPANDA di Supabase
-- Copy & paste ke Supabase SQL Editor lalu RUN
-- ============================================================

-- 1. TABEL PEGAWAI
create table if not exists pegawai (
  nip text primary key,
  nama text not null,
  golongan text default '',
  jabatan text default '',
  gender text default 'Laki-laki',
  "tglLahir" text default '',
  pendidikan text default 'S1',
  "tmtPns" text default '',
  email text default '',
  "noHp" text default '',
  foto text default '',
  "namaPangkat" text default '',
  "pangkatBerikutnya" text default '',
  "tglPangkatTerakhir" text default '',
  "tglPangkatBerikutnya" text default '',
  "tmtJabatan" text default '',
  "tglKgbTerakhir" text default '',
  "tglKgbBerikutnya" text default '',
  dokumen jsonb default '{}'::jsonb,
  "pangkatCountdownDays" integer,
  "kgbCountdownDays" integer,
  "pensiunCountdown" integer,
  "progressBerkas" integer default 0,
  created_at timestamptz default now()
);

-- 2. TABEL CUTI
create table if not exists cuti (
  "cutiId" text primary key,
  nip text not null references pegawai(nip) on delete cascade,
  nama text default '',
  "jenisCuti" text default '',
  "tanggalMulai" text default '',
  "tanggalSelesai" text default '',
  keterangan text default '',
  created_at timestamptz default now()
);

-- 3. MIGRASI TABEL LAMA
-- PostgreSQL melipat identifier tanpa kutip menjadi lowercase. Ubah kolom
-- lama agar cocok dengan nama properti camelCase yang dikirim aplikasi.
do $$
declare
  column_map record;
begin
  for column_map in
    select * from (values
      ('pegawai', 'tgllahir', 'tglLahir'),
      ('pegawai', 'tmtpns', 'tmtPns'),
      ('pegawai', 'nohp', 'noHp'),
      ('pegawai', 'namapangkat', 'namaPangkat'),
      ('pegawai', 'pangkatberikutnya', 'pangkatBerikutnya'),
      ('pegawai', 'tglpangkatterakhir', 'tglPangkatTerakhir'),
      ('pegawai', 'tglpangkatberikutnya', 'tglPangkatBerikutnya'),
      ('pegawai', 'tmtjabatan', 'tmtJabatan'),
      ('pegawai', 'tglkgbterakhir', 'tglKgbTerakhir'),
      ('pegawai', 'tglkgbberikutnya', 'tglKgbBerikutnya'),
      ('pegawai', 'pangkatcountdowndays', 'pangkatCountdownDays'),
      ('pegawai', 'kgbcountdowndays', 'kgbCountdownDays'),
      ('pegawai', 'pensiuncountdown', 'pensiunCountdown'),
      ('pegawai', 'progressberkas', 'progressBerkas'),
      ('cuti', 'cutiid', 'cutiId'),
      ('cuti', 'jeniscuti', 'jenisCuti'),
      ('cuti', 'tanggalmulai', 'tanggalMulai'),
      ('cuti', 'tanggalselesai', 'tanggalSelesai')
    ) as columns(table_name, old_name, new_name)
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = column_map.table_name
        and column_name = column_map.old_name
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = column_map.table_name
        and column_name = column_map.new_name
    ) then
      execute format(
        'alter table public.%I rename column %I to %I',
        column_map.table_name,
        column_map.old_name,
        column_map.new_name
      );
    end if;
  end loop;
end $$;

alter table public.pegawai
  add column if not exists "tglLahir" text default '',
  add column if not exists "tmtPns" text default '',
  add column if not exists "noHp" text default '',
  add column if not exists "namaPangkat" text default '',
  add column if not exists "pangkatBerikutnya" text default '',
  add column if not exists "tglPangkatTerakhir" text default '',
  add column if not exists "tglPangkatBerikutnya" text default '',
  add column if not exists "tmtJabatan" text default '',
  add column if not exists "tglKgbTerakhir" text default '',
  add column if not exists "tglKgbBerikutnya" text default '',
  add column if not exists "pangkatCountdownDays" integer,
  add column if not exists "kgbCountdownDays" integer,
  add column if not exists "pensiunCountdown" integer,
  add column if not exists "progressBerkas" integer default 0;

alter table public.cuti
  add column if not exists "cutiId" text,
  add column if not exists "jenisCuti" text default '',
  add column if not exists "tanggalMulai" text default '',
  add column if not exists "tanggalSelesai" text default '';

-- 4. ENABLE REALTIME
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pegawai'
  ) then
    alter publication supabase_realtime add table public.pegawai;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cuti'
  ) then
    alter publication supabase_realtime add table public.cuti;
  end if;
end $$;

-- 5. ROW LEVEL SECURITY
alter table pegawai enable row level security;
alter table cuti enable row level security;

-- PEGAWAI
drop policy if exists "pegawai_select" on pegawai;
create policy "pegawai_select" on pegawai
  for select using (auth.role() = 'authenticated');

drop policy if exists "pegawai_insert" on pegawai;
create policy "pegawai_insert" on pegawai
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "pegawai_update" on pegawai;
create policy "pegawai_update" on pegawai
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "pegawai_delete" on pegawai;
create policy "pegawai_delete" on pegawai
  for delete using (auth.role() = 'authenticated');

-- CUTI
drop policy if exists "cuti_select" on cuti;
create policy "cuti_select" on cuti
  for select using (auth.role() = 'authenticated');

drop policy if exists "cuti_insert" on cuti;
create policy "cuti_insert" on cuti
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "cuti_update" on cuti;
create policy "cuti_update" on cuti
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "cuti_delete" on cuti;
create policy "cuti_delete" on cuti
  for delete using (auth.role() = 'authenticated');

-- Pastikan PostgREST langsung membaca nama kolom hasil migrasi.
notify pgrst, 'reload schema';
