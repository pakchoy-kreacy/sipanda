window.Sipanda.calendar = {
        renderCalendar() {
            const el = document.getElementById('fullCalendarTarget');
            if (!el) return;
            if (this.calendarInstance) { this.calendarInstance.destroy(); this.calendarInstance = null; }
            const colorMap = { 'Sakit':'#C62828', 'Izin':'#123B63', 'Dinas Luar':'#7B1FA2', 'Cuti Besar':'#E65100' };
            const events = this.cutiList.map(c => ({
                title: c.nama+' ('+c.jenisCuti+')',
                start: c.tanggalMulai,
                end: (() => {
                    const endDate = this._parseLocalDate(c.tanggalSelesai);
                    if (!endDate) return c.tanggalSelesai;
                    endDate.setDate(endDate.getDate() + 1);
                    return this._formatLocalDate(endDate);
                })(),
                backgroundColor: colorMap[c.jenisCuti] || '#2E7D32',
                borderColor: colorMap[c.jenisCuti] || '#2E7D32',
                allDay: true
            }));
            this.calendarInstance = new FullCalendar.Calendar(el, {
                initialView: 'dayGridMonth', locale: 'id',
                headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' },
                events
            });
            this.calendarInstance.render();
        },
};
