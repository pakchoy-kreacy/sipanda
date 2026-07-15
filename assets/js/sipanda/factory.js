window.sipandaApp = function () {
    return window.Sipanda.compose(
        window.Sipanda.createState(),
        window.Sipanda.bootstrap,
        window.Sipanda.auth,
        window.Sipanda.database,
        window.Sipanda.pegawai,
        window.Sipanda.cuti,
        window.Sipanda.ui,
        window.Sipanda.calendar,
        window.Sipanda.charts,
        window.Sipanda.admin
    );
};
