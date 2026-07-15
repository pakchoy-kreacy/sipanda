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
  tglLahir text default '',
  pendidikan text default 'S1',
  tmtPns text default '',
  email text default '',
  noHp text default '',
  foto text default '',
  namaPangkat text default '',
  pangkatBerikutnya text default '',
  tglPangkatTerakhir text default '',
  tglPangkatBerikutnya text default '',
  tmtJabatan text default '',
  tglKgbTerakhir text default '',
  tglKgbBerikutnya text default '',
  dokumen jsonb default '{}'::jsonb,
  pangkatCountdownDays integer,
  kgbCountdownDays integer,
  pensiunCountdown integer,
  progressBerkas integer default 0,
  created_at timestamptz default now()
);

-- 2. TABEL CUTI
create table if not exists cuti (
  cutiId text primary key,
  nip text not null references pegawai(nip) on delete cascade,
  nama text default '',
  jenisCuti text default '',
  tanggalMulai text default '',
  tanggalSelesai text default '',
  keterangan text default '',
  created_at timestamptz default now()
);

-- 3. ENABLE REALTIME
alter publication supabase_realtime add table pegawai;
alter publication supabase_realtime add table cuti;

-- 4. ROW LEVEL SECURITY
alter table pegawai enable row level security;
alter table cuti enable row level security;

-- PEGAWAI
drop policy if exists "pegawai_select" on pegawai;
create policy "pegawai_select" on pegawai
  for select using (auth.role() = 'authenticated');

drop policy if exists "pegawai_insert" on pegawai;
create policy "pegawai_insert" on pegawai
  for insert with check (auth.email() = 'choiruddin2410@gmail.com');

drop policy if exists "pegawai_update" on pegawai;
create policy "pegawai_update" on pegawai
  for update using (auth.email() = 'choiruddin2410@gmail.com');

drop policy if exists "pegawai_delete" on pegawai;
create policy "pegawai_delete" on pegawai
  for delete using (auth.email() = 'choiruddin2410@gmail.com');

-- CUTI
drop policy if exists "cuti_select" on cuti;
create policy "cuti_select" on cuti
  for select using (auth.role() = 'authenticated');

drop policy if exists "cuti_insert" on cuti;
create policy "cuti_insert" on cuti
  for insert with check (auth.email() = 'choiruddin2410@gmail.com');

drop policy if exists "cuti_update" on cuti;
create policy "cuti_update" on cuti
  for update using (auth.email() = 'choiruddin2410@gmail.com');

drop policy if exists "cuti_delete" on cuti;
create policy "cuti_delete" on cuti
  for delete using (auth.email() = 'choiruddin2410@gmail.com');
