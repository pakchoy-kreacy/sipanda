window.Sipanda.ui = {
        viewPegawaiProfileByNip(nip) {
            const target = this.pegawaiList.find(p => p.nip === nip);
            if (target) {
                this.selectedPegawai = target;
                this.selectedTab = 'identitas';
                this.activeMenu = 'profil';
                setTimeout(() => lucide.createIcons(), 200);
            }
        },
        openPdfViewer(doc, type) {
            if (!doc || (!doc.url && !doc.base64)) { alert("File belum diupload!"); return; }
            this.currentPdfDoc = doc;
            this.currentPdfType = type;
            this.showPdfViewer = true;
            setTimeout(() => lucide.createIcons(), 100);
        },

        closePdfViewer() { this.showPdfViewer = false; this.currentPdfDoc = { namaFile:'', url:'', base64:'' }; },
        getCountdownClass(days) {
            if (days === null || days === undefined || !Number.isFinite(days)) return 'text-gray-400';
            if (days < 0) return 'text-red-700 font-extrabold';
            if (days <= 30) return 'text-red-600 font-extrabold';
            if (days <= 90) return 'text-orange-500';
            if (days <= 180) return 'text-yellow-600';
            return 'text-[#0B2341]';
        },

        formatCountdown(days, compact = false) {
            if (days === null || days === undefined || !Number.isFinite(days)) return '-';
            if (days < 0) return compact ? `Lewat ${Math.abs(days)}h` : `Terlambat ${Math.abs(days)} hari`;
            return compact ? `${days}h` : `${days} hari lagi`;
        },
        runSmartSearch() {
            if (!this.searchQuery.trim()) return;
            const q = this.searchQuery.toLowerCase();
            const found = this.pegawaiList.find(p => p.nama.toLowerCase().includes(q) || p.nip.includes(q));
            if (found) { this.viewPegawaiProfileByNip(found.nip); this.searchQuery = ''; }
            else alert("Tidak ditemukan: "+this.searchQuery);
        },

        toggleTodo(id) { const t = this.todoList.find(x => x.id === id); if (t) t.done = !t.done; },
        addTodo() { if (this.newTodoText.trim()) { this.todoList.push({ id: Date.now(), task: this.newTodoText, done: false }); this.newTodoText = ''; } }
};
