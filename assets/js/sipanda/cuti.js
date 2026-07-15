window.Sipanda.cuti = {
        async saveNewCuti() {
            if (!this.newCutiForm.nip || !this.newCutiForm.tanggalMulai || !this.newCutiForm.tanggalSelesai) { this.toastWarning("Lengkapi semua field!"); return; }
            if (this.newCutiForm.tanggalSelesai < this.newCutiForm.tanggalMulai) { this.toastError("Tanggal selesai tidak boleh sebelum tanggal mulai."); return; }
            const peg = this.pegawaiList.find(p => p.nip === this.newCutiForm.nip);
            if (!peg) { this.toastError("Pegawai tidak ditemukan!"); return; }
            const cuti = {
                cutiId: "C-"+crypto.randomUUID(),
                nip: this.newCutiForm.nip, nama: peg.nama,
                jenisCuti: this.newCutiForm.jenisCuti,
                tanggalMulai: this.newCutiForm.tanggalMulai,
                tanggalSelesai: this.newCutiForm.tanggalSelesai,
                keterangan: this.newCutiForm.keterangan || '-'
            };
            try {
                await this._saveCutiToFS(cuti);
                this.newCutiForm = { nip:'', jenisCuti:'Cuti Tahunan', keterangan:'', tanggalMulai:'', tanggalSelesai:'' };
                this.showModalAddCuti = false;
                if (this.activeMenu === 'cuti') setTimeout(() => this.renderCalendar(), 300);
                this.toastSuccess("Cuti berhasil disimpan!");
            } catch (error) {
                this.toastError(error.message);
            }
        },

        async hapusCuti(id) {
            if (confirm("Hapus data ini?")) {
                try {
                    await this._deleteCutiFromFS(id);
                    if (this.activeMenu === 'cuti') setTimeout(() => this.renderCalendar(), 300);
                    this.toastSuccess("Data cuti berhasil dihapus.");
                } catch (error) {
                    this.toastError(error.message);
                }
            }
        },
        prefillCutiForSelected() {
            if (this.selectedPegawai) this.newCutiForm.nip = this.selectedPegawai.nip;
        },
        getBadgeCuti(jenis) {
            if (jenis === 'Sakit') return 'bg-red-100 text-red-700';
            if (jenis === 'Izin') return 'bg-blue-100 text-blue-700';
            if (jenis === 'Dinas Luar') return 'bg-purple-100 text-purple-700';
            if (jenis === 'Cuti Besar') return 'bg-orange-100 text-orange-700';
            return 'bg-green-100 text-green-700';
        },
};
