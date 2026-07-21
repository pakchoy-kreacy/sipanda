window.Sipanda.admin = {
        exportDatabaseBackup() {
            const data = "data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify({ pegawai: this.pegawaiList, cuti: this.cutiList }));
            const a = document.createElement('a');
            a.href = data; a.download = "SIPANDA_BACKUP_"+this._todayString()+".json";
            document.body.appendChild(a); a.click(); a.remove();
            this.toastSuccess("Backup berhasil diunduh!");
        },

        async importDatabaseBackup(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    if (!Array.isArray(json.pegawai) || !Array.isArray(json.cuti)) throw new Error('Struktur backup tidak valid.');
                    const nipSet = new Set();
                    for (const p of json.pegawai) {
                        if (!p || typeof p.nip !== 'string' || !/^\d{8,20}$/.test(p.nip) || typeof p.nama !== 'string' || nipSet.has(p.nip)) {
                            throw new Error('Data pegawai dalam backup tidak valid atau memiliki NIP ganda.');
                        }
                        nipSet.add(p.nip);
                    }
                    const cutiIdSet = new Set();
                    for (const c of json.cuti) {
                        if (!c || typeof c.cutiId !== 'string' || typeof c.nip !== 'string' || !nipSet.has(c.nip) ||
                            typeof c.tanggalMulai !== 'string' || typeof c.tanggalSelesai !== 'string' ||
                            !this._parseLocalDate(c.tanggalMulai) || !this._parseLocalDate(c.tanggalSelesai) ||
                            c.tanggalSelesai < c.tanggalMulai || cutiIdSet.has(c.cutiId)) {
                            throw new Error('Data cuti dalam backup tidak valid.');
                        }
                        cutiIdSet.add(c.cutiId);
                    }
                    if (!confirm("Ini akan menimpa data yang ada. Lanjutkan?")) return;
                    const pegawaiIdsBackup = new Set(json.pegawai.map(p => p.nip));
                    const cutiIdsBackup = new Set(json.cuti.map(c => c.cutiId));
                    for (const c of this.cutiList.filter(c => !cutiIdsBackup.has(c.cutiId))) await this._deleteCutiFromFS(c.cutiId);
                    for (const p of this.pegawaiList.filter(p => !pegawaiIdsBackup.has(p.nip))) await this._deletePegawaiFromFS(p.nip);
                    for (const p of json.pegawai) await this._savePegawaiToFS(p);
                    for (const c of json.cuti) await this._saveCutiToFS(c);
                    this.toastSuccess("Database berhasil dipulihkan!");
                } catch(err) { this.toastError(err.message); }
                finally { event.target.value = ''; }
            };
            reader.readAsText(file);
        },

        async clearAllFirestore() {
            if (!this.isAdmin) { this.toastError("Hanya admin yang bisa menghapus semua data."); return; }
            if (!confirm("HAPUS SEMUA DATA? Ini tidak bisa di-undo!")) return;
            if (!confirm("Konfirmasi sekali lagi: hapus semua data Supabase?")) return;
            try {
                const pegawaiSnapshot = JSON.parse(JSON.stringify(this.pegawaiList));
                const cutiSnapshot = JSON.parse(JSON.stringify(this.cutiList));
                for (const c of cutiSnapshot) await this._deleteCutiFromFS(c.cutiId);
                for (const p of pegawaiSnapshot) await this._deletePegawaiFromFS(p.nip);
                this.toastSuccess("Semua data telah dihapus.");
            } catch (error) {
                this.toastError(error.message);
            }
        },

        triggerReportExport(type) { this.toast("Fitur ekspor PDF akan ditambahkan segera", 'info'); },

        downloadTemplatePegawai() {
            if (typeof XLSX === 'undefined') { this.toastError("Library Excel belum dimuat. Muat ulang halaman."); return; }
            const headers = ['nip', 'nama', 'golongan', 'gender', 'jabatan', 'tglLahir', 'pendidikan', 'noHp', 'email'];
            const example = [['199501012020011001', 'Budi Santoso', 'III/c', 'Laki-laki', 'Staff', '1995-01-01', 'S1', '081234567890', 'budi@domain.com']];
            const ws = XLSX.utils.aoa_to_sheet([headers, ...example]);
            ws['!cols'] = headers.map(() => ({ wch: 22 }));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Pegawai');
            XLSX.writeFile(wb, 'template_pegawai_sipanda.xlsx');
            this.toastSuccess("Template berhasil diunduh!");
        },

        async importPegawaiFromExcel(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (typeof XLSX === 'undefined') { this.toastError("Library Excel belum dimuat. Muat ulang halaman."); event.target.value = ''; return; }
            const golonganValid = ['II/a','II/b','II/c','II/d','III/a','III/b','III/c','III/d','IV/a','IV/b','IV/c','IV/d','IV/e'];
            const genderValid = ['Laki-laki', 'Perempuan'];
            const pendidikanValid = ['SMA/SMK', 'D3', 'S1', 'S2', 'S3'];
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const wb = XLSX.read(e.target.result, { type: 'array' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(ws);
                    if (!rows.length) { this.toastError("File kosong atau format tidak sesuai."); event.target.value = ''; return; }
                    let success = 0, skipped = 0, error = 0, errors = [];
                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        const nip = String(row.nip || '').trim();
                        const nama = String(row.nama || '').trim();
                        if (!nip || !nama) { error++; errors.push(`Baris ${i+2}: NIP & Nama wajib diisi`); continue; }
                        if (!/^\d{8,20}$/.test(nip)) { error++; errors.push(`Baris ${i+2}: NIP "${nip}" harus 8-20 digit angka`); continue; }
                        if (this.pegawaiList.some(p => p.nip === nip)) { skipped++; continue; }
                        const gol = String(row.golongan || 'II/a').trim();
                        const gen = String(row.gender || 'Laki-laki').trim();
                        const pend = String(row.pendidikan || 'S1').trim();
                        const item = {
                            nip, nama,
                            golongan: golonganValid.includes(gol) ? gol : 'II/a',
                            gender: genderValid.includes(gen) ? gen : 'Laki-laki',
                            jabatan: String(row.jabatan || '').trim(),
                            tglLahir: String(row.tglLahir || '1995-01-01').trim(),
                            pendidikan: pendidikanValid.includes(pend) ? pend : 'S1',
                            noHp: String(row.noHp || '').trim(),
                            email: String(row.email || '').trim(),
                            namaPangkat: '', pangkatBerikutnya: '', tmtJabatan: '',
                            tmtPns: '', pangkatCountdownDays: null, kgbCountdownDays: null,
                            pensiunCountdown: this._calculateRetirement(String(row.tglLahir || '1995-01-01').trim()),
                            progressBerkas: 0,
                            tglPangkatTerakhir: '', tglPangkatBerikutnya: '',
                            tglKgbTerakhir: '', tglKgbBerikutnya: '',
                            foto: '',
                            dokumen: {
                                skPangkat: { namaFile:'', base64:'' },
                                skJabatan: { nomor:'', namaFile:'', base64:'' },
                                skKgb: { nomor:'', namaFile:'', base64:'' },
                                skp: { namaFile:'', base64:'' },
                                skpKgb: { nilai:80, predikat:'Sesuai Ekspektasi', tahun:new Date().getFullYear() }
                            }
                        };
                        try {
                            await this._savePegawaiToFS(item);
                            success++;
                        } catch (err) {
                            error++;
                            errors.push(`Baris ${i+2}: ${err.message}`);
                        }
                    }
                    let msg = `${success} pegawai berhasil diimport.`;
                    if (skipped > 0) msg += ` ${skipped} dilewati (NIP sudah ada).`;
                    if (error > 0) msg += ` ${error} error.`;
                    if (errors.length) msg += '\n' + errors.slice(0, 5).join('\n');
                    if (success > 0) this.toastSuccess(msg);
                    else this.toastWarning(msg);
                } catch(err) { this.toastError("Gagal membaca file: " + err.message); }
                finally { event.target.value = ''; }
            };
            reader.readAsArrayBuffer(file);
        },
};
