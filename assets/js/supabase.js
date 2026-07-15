import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const configResp = await fetch('/api/config');
if (!configResp.ok) throw new Error('Konfigurasi Supabase gagal dimuat.');
const config = await configResp.json();

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  throw new Error('Konfigurasi Supabase belum lengkap.');
}

const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);

window._supabase = supabase;
