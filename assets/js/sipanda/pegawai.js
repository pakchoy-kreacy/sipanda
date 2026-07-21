window.Sipanda.pegawai = {
        migrateData() {
            this.pegawaiList = this.pegawaiList.map(p => {
                if (!p.dokumen) p.dokumen = {};
                if (!p.dokumen.skPangkat) p.dokumen.skPangkat = { namaFile:"", base64:"" };
                if (!p.dokumen.skJabatan) p.dokumen.skJabatan = { nomor:"", namaFile:"", base64:"" };
                if (!p.dokumen.skKgb) p.dokumen.skKgb = { nomor:"", namaFile:"", base64:"" };
                if (!p.dokumen.skp) p.dokumen.skp = { namaFile:"", base64:"" };
                if (!p.dokumen.skpKgb) p.dokumen.skpKgb = { nilai:80, predikat:"Sesuai Ekspektasi", tahun:2025 };
                if (!p.gender) p.gender = "Laki-laki";
                if (!p.pendidikan) p.pendidikan = "S1";
                if (!p.namaPangkat) p.namaPangkat = "";
                if (!p.pangkatBerikutnya) p.pangkatBerikutnya = "";
                if (!p.tmtJabatan) p.tmtJabatan = "";
                if (!Number.isFinite(p.pangkatCountdownDays)) p.pangkatCountdownDays = null;
                if (!Number.isFinite(p.kgbCountdownDays)) p.kgbCountdownDays = null;
                if (!Number.isFinite(p.pensiunCountdown)) p.pensiunCountdown = null;
                return p;
            });
        },
        recalculateAllCountdowns() {
            this.pegawaiList.forEach(p => {
                p.pangkatCountdownDays = this._daysUntil(p.tglPangkatBerikutnya);
                p.kgbCountdownDays = this._daysUntil(p.tglKgbBerikutnya);
                p.pensiunCountdown = this._calculateRetirement(p.tglLahir);
            });
        },

        recalcSelected() {
            if (!this.selectedPegawai) return;
            this.selectedPegawai.pangkatCountdownDays = this._daysUntil(this.selectedPegawai.tglPangkatBerikutnya);
            this.selectedPegawai.kgbCountdownDays = this._daysUntil(this.selectedPegawai.tglKgbBerikutnya);
            this.selectedPegawai.pensiunCountdown = this._calculateRetirement(this.selectedPegawai.tglLahir);
        },

        async onTableDateChange(p) {
            p.pangkatCountdownDays = this._daysUntil(p.tglPangkatBerikutnya);
            p.kgbCountdownDays = this._daysUntil(p.tglKgbBerikutnya);
            try {
                await this._savePegawaiToFS(JSON.parse(JSON.stringify(p)));
                this.toastSuccess("Data berhasil disimpan.");
            } catch (error) {
                this.toastError(error.message);
            }
        },
        hitungUrgensiDanMasaBerlaku() {
            this.prioritasList = [];
            this.pegawaiList.forEach(p => {
                let total = 4, ada = 0;
                if (p.dokumen?.skPangkat?.namaFile) ada++;
                if (p.dokumen?.skJabatan?.namaFile) ada++;
                if (p.dokumen?.skKgb?.namaFile) ada++;
                if (p.dokumen?.skp?.namaFile) ada++;
                p.progressBerkas = Math.round((ada/total)*100);
                if (p.pangkatCountdownDays !== null && p.pangkatCountdownDays <= 90)
                    this.prioritasList.push({ nip: p.nip, nama: p.nama, golongan: p.golongan, jabatan: p.jabatan, status: "PANGKAT", keterangan: this.formatCountdown(p.pangkatCountdownDays)+' - TMT Pangkat' });
                if (p.kgbCountdownDays !== null && p.kgbCountdownDays <= 45)
                    this.prioritasList.push({ nip: p.nip, nama: p.nama, golongan: p.golongan, jabatan: p.jabatan, status: "KGB", keterangan: this.formatCountdown(p.kgbCountdownDays)+' - TMT KGB' });
                if (p.pensiunCountdown !== null && p.pensiunCountdown <= 365)
                    this.prioritasList.push({ nip: p.nip, nama: p.nama, golongan: p.golongan, jabatan: p.jabatan, status: "PENSIUN", keterangan: this.formatCountdown(p.pensiunCountdown)+' - Pensiun' });
            });
        },

        get filteredPegawaiList() {
            return this.pegawaiList.filter(p => {
                const q = p.nama.toLowerCase().includes(this.pegawaiSearch.toLowerCase())
                    || p.nip.includes(this.pegawaiSearch)
                    || (p.jabatan||'').toLowerCase().includes(this.pegawaiSearch.toLowerCase());
                const g = this.filterGolongan === '' || p.golongan === this.filterGolongan;
                let u = true;
                if (this.filterUrgensi === 'red') u = (p.pangkatCountdownDays !== null && p.pangkatCountdownDays <= 30) || (p.kgbCountdownDays !== null && p.kgbCountdownDays <= 30);
                else if (this.filterUrgensi === 'orange') u = p.pangkatCountdownDays !== null && p.pangkatCountdownDays > 30 && p.pangkatCountdownDays <= 90;
                else if (this.filterUrgensi === 'yellow') u = p.pangkatCountdownDays !== null && p.pangkatCountdownDays > 90 && p.pangkatCountdownDays <= 180;
                else if (this.filterUrgensi === 'green') u = p.pangkatCountdownDays !== null && p.pangkatCountdownDays > 180;
                return q && g && u;
            });
        },

        async saveNewPegawai() {
            if (!this.newPegawaiForm.nip || !this.newPegawaiForm.nama) { this.toastWarning("NIP dan Nama wajib diisi!"); return; }
            const normalizedNip = this.newPegawaiForm.nip.trim();
            if (this.pegawaiList.some(p => p.nip === normalizedNip)) { this.toastError("NIP sudah ada!"); return; }
            if (!/^\d{8,20}$/.test(normalizedNip)) { this.toastError("NIP harus terdiri dari 8-20 digit angka."); return; }
            const item = {
                ...this.newPegawaiForm, nip: normalizedNip, nama: this.newPegawaiForm.nama.trim(),
                namaPangkat: "", pangkatBerikutnya: "", tmtJabatan: "",
                tmtPns: this.newPegawaiForm.tmtPns||"", pangkatCountdownDays: null, kgbCountdownDays: null,
                pensiunCountdown: this._calculateRetirement(this.newPegawaiForm.tglLahir), progressBerkas: 0,
                tglPangkatTerakhir: "", tglPangkatBerikutnya: "",
                tglKgbTerakhir: "", tglKgbBerikutnya: "",
                foto: "",
                dokumen: {
                    skPangkat: { namaFile:"", base64:"" },
                    skJabatan: { nomor:"", namaFile:"", base64:"" },
                    skKgb: { nomor:"", namaFile:"", base64:"" },
                    skp: { namaFile:"", base64:"" },
                    skpKgb: { nilai:80, predikat:"Sesuai Ekspektasi", tahun:new Date().getFullYear() }
                }
            };
            try {
                await this._savePegawaiToFS(item);
                this.showModalAddPegawai = false;
                this.newPegawaiForm = { nip:'', nama:'', golongan:'II/a', jabatan:'', noHp:'', email:'', gender:'Laki-laki', tglLahir:'1995-01-01', pendidikan:'S1' };
                this.toastSuccess("Pegawai berhasil ditambahkan!");
            } catch (error) {
                this.toastError(error.message);
            }
        },

        async savePegawaiEdit(showError = true) {
            if (!this.selectedPegawai) return;
            this.recalcSelected();
            try {
                await this._savePegawaiToFS(JSON.parse(JSON.stringify(this.selectedPegawai)));
            } catch (error) {
                if (showError) this.toastError(error.message);
                throw error;
            }
        },

        async hapusPegawai(nip) {
            if (!confirm("Hapus pegawai ini? Data cuti juga akan dihapus.")) return;
            try {
                const cutiTerkait = this.cutiList.filter(c => c.nip === nip);
                for (const c of cutiTerkait) await this._deleteCutiFromFS(c.cutiId);
                await this._deletePegawaiFromFS(nip);
                this.activeMenu = 'pegawai';
                this.selectedPegawai = null;
                this.toastSuccess("Pegawai berhasil dihapus.");
            } catch (error) {
                this.toastError(error.message);
            }
        },
        uploadFoto(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (file.size > 1*1024*1024) { this.toastError("Maksimal 1MB!"); event.target.value = ''; return; }
            if (!file.type.startsWith('image/')) { this.toastError("Harus gambar!"); event.target.value = ''; return; }
            const target = this.selectedPegawai;
            if (!target) { this.toastError('Pegawai tidak ditemukan.'); event.target.value = ''; return; }
            const oldFoto = target.foto;
            const reader = new FileReader();
            reader.onload = async (e) => {
                target.foto = e.target.result;
                try {
                    await this._savePegawaiToFS(JSON.parse(JSON.stringify(target)));
                    setTimeout(() => lucide.createIcons(), 200);
                    this.toastSuccess("Foto berhasil diunggah!");
                } catch (error) {
                    target.foto = oldFoto;
                    this.toastError(error.message);
                }
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        },

        handleDocUpload(event, type) {
            const file = event.target.files[0];
            if (!file) return;
            if (file.type !== "application/pdf") { this.toastError("Harus PDF!"); event.target.value = ''; return; }
            if (file.size > 1*1024*1024) { this.toastError("Maksimal 1MB!"); event.target.value = ''; return; }
            const docMap = { skPangkat: 'skPangkat', skJabatan: 'skJabatan', skKgb: 'skKgb', skp: 'skp' };
            const docKey = docMap[type];
            if (!docKey) { this.toastError('Jenis dokumen tidak valid.'); return; }
            const target = this.selectedPegawai;
            if (!target) { this.toastError('Pegawai tidak ditemukan.'); event.target.value = ''; return; }
            const oldDoc = target.dokumen[docKey] ? { ...target.dokumen[docKey] } : {};
            const reader = new FileReader();
            reader.onload = async (e) => {
                target.dokumen[docKey] = { ...oldDoc, namaFile: file.name, base64: e.target.result };
                try {
                    await this._savePegawaiToFS(JSON.parse(JSON.stringify(target)));
                    this.toastSuccess(type.toUpperCase()+" berhasil diunggah!");
                } catch (error) {
                    target.dokumen[docKey] = oldDoc;
                    this.toastError(error.message);
                }
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        },

        handleBulkDocUpload(event, nip, type) {
            const file = event.target.files[0];
            if (!file) return;
            if (file.type !== "application/pdf") { this.toastError("Harus PDF!"); event.target.value = ''; return; }
            if (file.size > 1*1024*1024) { this.toastError("Maksimal 1MB!"); event.target.value = ''; return; }
            const docMap = { skPangkat: 'skPangkat', skJabatan: 'skJabatan', skKgb: 'skKgb', skp: 'skp' };
            const docKey = docMap[type];
            if (!docKey) { this.toastError('Jenis dokumen tidak valid.'); return; }
            const target = this.pegawaiList.find(p => p.nip === nip);
            if (!target) { this.toastError('Pegawai tidak ditemukan.'); event.target.value = ''; return; }
            if (!target.dokumen) target.dokumen = {};
            if (!target.dokumen[docKey]) target.dokumen[docKey] = { namaFile:'', base64:'' };
            const oldDoc = { ...target.dokumen[docKey] };
            const reader = new FileReader();
            reader.onload = async (e) => {
                target.dokumen[docKey] = { ...oldDoc, namaFile: file.name, base64: e.target.result };
                try {
                    await this._savePegawaiToFS(JSON.parse(JSON.stringify(target)));
                    this.toastSuccess(`${target.nama} — ${type.toUpperCase()} berhasil diunggah!`);
                } catch (error) {
                    target.dokumen[docKey] = oldDoc;
                    this.toastError(error.message);
                }
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        },
};
