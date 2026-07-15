window.Sipanda.database = {
        async subscribeSupabase() {
            const supabase = window._supabase;
            this.supabaseOnline = false;
            this.databaseError = '';

            try {
                const { data: pegawaiData, error: pegawaiError } = await supabase.from('pegawai').select('*');
                if (pegawaiError) throw pegawaiError;
                this.pegawaiList = pegawaiData || [];
                this.migrateData();
                this.recalculateAllCountdowns();
                this.hitungUrgensiDanMasaBerlaku();
                this.updateStats();
                if (this.selectedPegawai) {
                    this.selectedPegawai = this.pegawaiList.find(p => p.nip === this.selectedPegawai.nip) || null;
                    if (!this.selectedPegawai) this.activeMenu = 'pegawai';
                }
                this.supabaseOnline = true;
                this.databaseError = '';
                setTimeout(() => this.initCharts(), 300);

                const { data: cutiData, error: cutiError } = await supabase.from('cuti').select('*');
                if (cutiError) throw cutiError;
                this.cutiList = cutiData || [];
                this.updateStats();
                if (this.activeMenu === 'cuti') setTimeout(() => this.renderCalendar(), 100);
            } catch (err) {
                console.error('Supabase error:', err);
                this.supabaseOnline = false;
                this.databaseError = err.message || 'Koneksi ke database gagal.';
                if (this.databaseError.includes('schema cache')) {
                    this.databaseError = 'Skema database belum sinkron. Jalankan supabase-schema.sql terbaru di Supabase SQL Editor.';
                } else if (this.databaseError.includes('does not exist') || this.databaseError.includes('relation')) {
                    this.databaseError = 'Tabel database belum dibuat. Jalankan supabase-schema.sql di Supabase SQL Editor.';
                }
            }

            // Real-time subscription
            if (this._pegawaiChannel) this._pegawaiChannel.unsubscribe();
            if (this._cutiChannel) this._cutiChannel.unsubscribe();

            this._pegawaiChannel = supabase.channel('pegawai-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'pegawai' }, () => {
                    this._reloadPegawai();
                })
                .subscribe();

            this._cutiChannel = supabase.channel('cuti-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'cuti' }, () => {
                    this._reloadCuti();
                })
                .subscribe();
        },

        async _reloadPegawai() {
            const supabase = window._supabase;
            const { data } = await supabase.from('pegawai').select('*');
            if (data) {
                this.pegawaiList = data;
                this.migrateData();
                this.recalculateAllCountdowns();
                this.hitungUrgensiDanMasaBerlaku();
                this.updateStats();
                if (this.selectedPegawai) {
                    this.selectedPegawai = this.pegawaiList.find(p => p.nip === this.selectedPegawai.nip) || null;
                    if (!this.selectedPegawai) this.activeMenu = 'pegawai';
                }
                setTimeout(() => this.initCharts(), 300);
            }
        },

        async _reloadCuti() {
            const supabase = window._supabase;
            const { data } = await supabase.from('cuti').select('*');
            if (data) {
                this.cutiList = data;
                this.updateStats();
                if (this.activeMenu === 'cuti') setTimeout(() => this.renderCalendar(), 100);
            }
        },
        async _savePegawaiToFS(pegawai) {
            const supabase = window._supabase;
            const { error } = await supabase.from('pegawai').upsert(pegawai, { onConflict: 'nip' });
            if (error) {
                console.error('Save pegawai error:', error);
                throw new Error('Gagal menyimpan data pegawai: ' + error.message);
            }
            return true;
        },

        async _deletePegawaiFromFS(nip) {
            const supabase = window._supabase;
            const { error } = await supabase.from('pegawai').delete().eq('nip', nip);
            if (error) throw new Error('Gagal menghapus pegawai: ' + error.message);
        },

        async _saveCutiToFS(cuti) {
            const supabase = window._supabase;
            const { error } = await supabase.from('cuti').upsert(cuti, { onConflict: 'cutiId' });
            if (error) {
                console.error('Save cuti error:', error);
                throw new Error('Gagal menyimpan data cuti: ' + error.message);
            }
            return true;
        },

        async _deleteCutiFromFS(cutiId) {
            const supabase = window._supabase;
            const { error } = await supabase.from('cuti').delete().eq('cutiId', cutiId);
            if (error) throw new Error('Gagal menghapus data cuti: ' + error.message);
        },
};
