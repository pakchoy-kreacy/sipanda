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

-- 3. ENABLE REALTIME (wajib untuk subscription)
alter publication supabase_realtime add table pegawai;
alter publication supabase_realtime add table cuti;

-- 4. ROW LEVEL SECURITY (amatankan data)
alter table pegawai enable row level security;
alter table cuti enable row level security;

-- izinkan semua user terautentikasi baca/tulis
-- ganti 'choiruddin2410@gmail.com' dengan email admin kamu
create policy "pegawai_read_all" on pegawai for select using (auth.role() = 'authenticated');
create policy "pegawai_write_admin" on pegawai for insert using (auth.email() = 'choiruddin2410@gmail.com');
create policy "pegawai_write_admin" on pegawai for update using (auth.email() = 'choiruddin2410@gmail.com');
create policy "pegawai_write_admin" on pegawai for delete using (auth.email() = 'choiruddin2410@gmail.com');

create policy "cuti_read_all" on cuti for select using (auth.role() = 'authenticated');
create policy "cuti_write_admin" on cuti for insert using (auth.email() = 'choiruddin2410@gmail.com');
create policy "cuti_write_admin" on cuti for update using (auth.email() = 'choiruddin2410@gmail.com');
create policy "cuti_write_admin" on cuti for delete using (auth.email() = 'choiruddin2410@gmail.com');
