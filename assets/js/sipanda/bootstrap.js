window.Sipanda.bootstrap = {
        async initApp() {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const check = () => {
                    if (window._supabase) return resolve();
                    if (++attempts > 300) return reject(new Error('Supabase gagal dimuat.'));
                    setTimeout(check, 50);
                };
                check();
            }).catch(err => {
                this.loadingMsg = 'Gagal menghubungkan server. Muat ulang halaman.';
                this.isLoading = false;
                return;
            });
            if (!window._supabase) return;

            const supabase = window._supabase;
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            if (currentSession?.user) {
                const user = currentSession.user;
                this.sessionUser = { nama: user.user_metadata?.nama || user.email?.split('@')[0] || 'Admin', email: user.email, foto: user.user_metadata?.foto || '' };
                this.isAdmin = true;
                this.isLoggedIn = true;
                this.loadingMsg = 'Memuat data pegawai...';
                await this.subscribeSupabase();
                this.isLoading = false;
                this._recalcInterval = setInterval(() => {
                    this.recalculateAllCountdowns();
                    this.hitungUrgensiDanMasaBerlaku();
                    this.updateStats();
                }, 3600000);
                setTimeout(() => { this.initCharts(); lucide.createIcons(); }, 500);
            } else {
                this.isLoggedIn = false;
                this.isLoading = false;
                setTimeout(() => lucide.createIcons(), 300);
            }

            supabase.auth.onAuthStateChange((event, session) => {
                const user = session?.user;
                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && user) {
                    this.sessionUser = { nama: user.user_metadata?.nama || user.email?.split('@')[0] || 'Admin', email: user.email, foto: user.user_metadata?.foto || '' };
                    this.isAdmin = true;
                    this.isLoggedIn = true;
                    this.loadingMsg = 'Memuat data pegawai...';
                    this.subscribeSupabase();
                    this.isLoading = false;
                    this._recalcInterval = setInterval(() => {
                        this.recalculateAllCountdowns();
                        this.hitungUrgensiDanMasaBerlaku();
                        this.updateStats();
                    }, 3600000);
                    setTimeout(() => { this.initCharts(); lucide.createIcons(); }, 500);
                } else if (event === 'SIGNED_OUT') {
                    this.isLoggedIn = false;
                    this.isAdmin = false;
                    this.isLoading = false;
                    if (this._recalcInterval) { clearInterval(this._recalcInterval); this._recalcInterval = null; }
                    this._destroyCharts();
                    setTimeout(() => lucide.createIcons(), 300);
                }
            });
        },
        _parseLocalDate(dateString) {
            if (!dateString || typeof dateString !== 'string') return null;
            const [year, month, day] = dateString.split('-').map(Number);
            if (!year || !month || !day) return null;
            const date = new Date(year, month - 1, day);
            date.setHours(0, 0, 0, 0);
            return Number.isNaN(date.getTime()) ? null : date;
        },

        _daysUntil(dateString) {
            const target = this._parseLocalDate(dateString);
            if (!target) return null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return Math.round((target - today) / 86400000);
        },

        _calculateRetirement(tglLahir) {
            const lahir = this._parseLocalDate(tglLahir);
            if (!lahir) return null;
            const pensiun = new Date(lahir.getFullYear() + 58, lahir.getMonth(), lahir.getDate());
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return Math.round((pensiun - today) / 86400000);
        },

        _formatLocalDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        _todayString() {
            return this._formatLocalDate(new Date());
        },
        updateStats() {
            this.stats.totalPegawai = this.pegawaiList.length;
            const hariIni = this._todayString();
            const active = this.cutiList.filter(c => c.tanggalMulai <= hariIni && c.tanggalSelesai >= hariIni);
            this.stats.pegawaiCuti = active.length;
            this.stats.pegawaiCutiName = active.map(c => c.nama).join(", ");
            this.stats.pangkatSegera = this.pegawaiList.filter(p => p.pangkatCountdownDays !== null && p.pangkatCountdownDays <= 180).length;
            this.stats.kgbSegera = this.pegawaiList.filter(p => p.kgbCountdownDays !== null && p.kgbCountdownDays <= 180).length;
            this.stats.pensiunSegera = this.pegawaiList.filter(p => p.pensiunCountdown !== null && p.pensiunCountdown <= 730).length;
        },
};
