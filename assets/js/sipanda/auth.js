window.Sipanda.auth = {
        async handleLogin() {
            this.loginLoading = true;
            this.loginError = '';
            const supabase = window._supabase;
            try {
                const { error } = await supabase.auth.signInWithPassword({
                    email: this.loginForm.username,
                    password: this.loginForm.password
                });
                if (error) throw error;
            } catch(e) {
                const msg = {
                    'Invalid login credentials': 'Email atau password salah.',
                    'Email not confirmed': 'Email belum diverifikasi.',
                }[e.message] || ('Login gagal: ' + e.message);
                this.loginError = msg;
            } finally {
                this.loginLoading = false;
            }
        },

        async handleLogout() {
            if (!confirm("Keluar dari sistem?")) return;
            const supabase = window._supabase;
            try {
                if (this._pegawaiChannel) this._pegawaiChannel.unsubscribe();
                if (this._cutiChannel) this._cutiChannel.unsubscribe();
                await supabase.auth.signOut();
            } catch(e) { console.error('Logout error:', e); }
            if (this._recalcInterval) { clearInterval(this._recalcInterval); this._recalcInterval = null; }
        },
};
