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
};
