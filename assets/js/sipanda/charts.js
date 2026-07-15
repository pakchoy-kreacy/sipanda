window.Sipanda.charts = {
        initCharts() {
            if (this._chartTimer) clearTimeout(this._chartTimer);
            this._chartTimer = setTimeout(() => {
                this._chartTimer = null;
                if (!this.isLoggedIn || this.activeMenu !== 'dashboard') return;

                const canvases = {
                    golongan: document.getElementById('chartGolongan'),
                    gender: document.getElementById('chartGender'),
                    pendidikan: document.getElementById('chartPendidikan')
                };
                if (Object.values(canvases).some(canvas => !canvas?.isConnected || !canvas.getContext('2d'))) return;

                this._destroyCharts();
                const ctxGol = canvases.golongan.getContext('2d');
                if (ctxGol) {
                    const golList = ['II/a','II/b','II/c','II/d','III/a','III/b','III/c','III/d','IV/a','IV/b'];
                    const golData = golList.map(g => this.pegawaiList.filter(p => p.golongan === g).length);
                    this._charts.golongan = new Chart(ctxGol, {
                        type: 'bar',
                        data: { labels: golList, datasets: [{ label: 'Pegawai', data: golData, backgroundColor: '#0B2341', borderRadius: 6 }] },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
                    });
                }
                const ctxGen = canvases.gender.getContext('2d');
                if (ctxGen) {
                    const laki = this.pegawaiList.filter(p => p.gender === 'Laki-laki').length;
                    const pr = this.pegawaiList.filter(p => p.gender === 'Perempuan').length;
                    this._charts.gender = new Chart(ctxGen, {
                        type: 'doughnut',
                        data: { labels: ['Laki-laki', 'Perempuan'], datasets: [{ data: [laki, pr], backgroundColor: ['#0B2341', '#C9A227'], borderWidth: 0 }] },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } } }
                    });
                }
                const ctxPend = canvases.pendidikan.getContext('2d');
                if (ctxPend) {
                    const pendList = ['SMA/SMK','D3','S1','S2','S3'];
                    const pendData = pendList.map(p => this.pegawaiList.filter(x => x.pendidikan === p).length);
                    this._charts.pendidikan = new Chart(ctxPend, {
                        type: 'pie',
                        data: { labels: pendList, datasets: [{ data: pendData, backgroundColor: ['#0B2341','#C9A227','#123B63','#1e6091','#2E7D32'], borderWidth: 0 }] },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } } }
                    });
                }
            }, 600);
        },

        _destroyCharts() {
            if (this._chartTimer) { clearTimeout(this._chartTimer); this._chartTimer = null; }
            Object.values(this._charts).forEach(c => { try { c.destroy(); } catch(e){} });
            this._charts = {};
        },
};
