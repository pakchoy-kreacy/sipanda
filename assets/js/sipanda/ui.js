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
        async openPdfViewer(doc, type) {
            const source = doc?.base64 || doc?.url;
            if (!source) { this.toastWarning("File belum diupload!"); return; }

            this.closePdfViewer();
            try {
                if (source.startsWith('data:')) {
                    const response = await fetch(source);
                    const blob = await response.blob();
                    this._currentPdfObjectUrl = URL.createObjectURL(blob.type === 'application/pdf'
                        ? blob
                        : new Blob([blob], { type: 'application/pdf' }));
                    this.currentPdfSrc = this._currentPdfObjectUrl;
                } else {
                    this.currentPdfSrc = source;
                }
                this.currentPdfDoc = doc;
                this.currentPdfType = type;
                this.showPdfViewer = true;
                setTimeout(() => lucide.createIcons(), 100);
            } catch (error) {
                console.error('PDF preview error:', error);
                this.toastError("Dokumen tidak dapat dipratinjau. Silakan unduh file.");
            }
        },

        closePdfViewer() {
            this.showPdfViewer = false;
            if (this._currentPdfObjectUrl) URL.revokeObjectURL(this._currentPdfObjectUrl);
            this._currentPdfObjectUrl = '';
            this.currentPdfSrc = '';
            this.currentPdfDoc = { namaFile:'', url:'', base64:'' };
            this.currentPdfType = '';
        },
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
            else this.toastError("Tidak ditemukan: "+this.searchQuery);
        },

        toggleTodo(id) { const t = this.todoList.find(x => x.id === id); if (t) t.done = !t.done; },
        addTodo() { if (this.newTodoText.trim()) { this.todoList.push({ id: Date.now(), task: this.newTodoText, done: false }); this.newTodoText = ''; } },

        toast(message, type = 'info', duration = 3500) {
            this.toastQueue = this.toastQueue || [];
            this.toastCurrent = this.toastCurrent || null;
            this.toastQueue.push({ message, type, duration, id: Date.now() });
            if (!this.toastCurrent) this._showNextToast();
        },

        toastSuccess(message) { this.toast(message, 'success', 3000); },
        toastError(message) { this.toast(message, 'error', 5000); },
        toastWarning(message) { this.toast(message, 'warning', 4000); },

        _showNextToast() {
            if (!this.toastQueue || !this.toastQueue.length) { this.toastCurrent = null; return; }
            this.toastCurrent = this.toastQueue.shift();
            this.toastProgress = 100;
            if (this._progressTimer) clearInterval(this._progressTimer);
            if (this._toastTimer) clearTimeout(this._toastTimer);
            const duration = this.toastCurrent.duration || 3500;
            const start = Date.now();
            this._progressTimer = setInterval(() => {
                const elapsed = Date.now() - start;
                this.toastProgress = Math.max(0, 100 - (elapsed / duration) * 100);
            }, 30);
            this._toastTimer = setTimeout(() => {
                if (this._progressTimer) clearInterval(this._progressTimer);
                this._showNextToast();
            }, duration);
        },
};
