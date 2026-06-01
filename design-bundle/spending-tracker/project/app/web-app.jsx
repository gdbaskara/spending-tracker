/* Web — App shell (responsive: sidebar / icon-rail / bottom-tab) */
function navIcon(name, col) {
  const sw = 2.1;
  const paths = {
    home: <path d="M3 11l9-7 9 7M5.5 9.5V20h13V9.5M9.5 20v-5.5h5V20" stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    reports: <g stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></g>,
    settle: <g stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3" /></g>,
    settings: <g stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></g>,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24">{paths[name]}</svg>;
}

const NAV = [['home', 'Beranda'], ['reports', 'Laporan'], ['settle', 'Saldo'], ['settings', 'Pengaturan']];
const TITLES = { home: 'Beranda', reports: 'Laporan', settle: 'Saldo Bareng', settings: 'Pengaturan' };

function WebApp() {
  const UI = window.UI;
  const D = window.STData;
  const [screen, setScreen] = React.useState('home');
  const [adding, setAdding] = React.useState(false);
  const [detail, setDetail] = React.useState(null);
  const [state, setState] = React.useState({ expenses: D.EXPENSES.slice(), settlements: D.SETTLEMENTS.slice(), recurring: D.RECURRING.slice() });

  const derived = React.useMemo(() => ({
    total: D.totalThisMonth(state.expenses), net: D.netMei(state.expenses, state.settlements),
    spendByCat: D.spendByCategory(state.expenses), paid: D.paidByPerson(state.expenses),
  }), [state]);

  const addExpense = (rec) => setState((s) => ({ ...s, expenses: [rec, ...s.expenses] }));
  const onSettle = (from, to, amt) => setState((s) => ({ ...s, settlements: [...s.settlements, { id: 's' + Date.now(), from_id: from, to_id: to, amount: amt, note: 'Lunaskan', settled_at: '2026-05-31' }] }));
  const toggleRecurring = (id) => setState((s) => ({ ...s, recurring: s.recurring.map((r) => r.id === id ? { ...r, active: !r.active } : r) }));
  const deleteExpense = (id) => { setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) })); setDetail(null); };

  const body = {
    home: <WebHome derived={derived} state={state} go={setScreen} openExpense={setDetail} />,
    reports: <WebReports derived={derived} state={state} />,
    settle: <WebSettle derived={derived} state={state} onSettle={onSettle} />,
    settings: <WebSettings state={state} toggleRecurring={toggleRecurring} />,
  };

  return (
    <div className="app">
      {/* sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo"><Mascot size={42} mood="happy" /></div>
          <div className="sidebar-label">
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 18, color: UI.ink, lineHeight: 1 }}>Celengin</div>
            <div style={{ fontSize: 11.5, color: UI.sub, marginTop: 2 }}>Mei & Baskara</div>
          </div>
        </div>

        <button className="add-btn" onClick={() => setAdding(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /></svg>
          <span className="sidebar-label">Tambah</span>
        </button>

        <nav className="nav">
          {NAV.map(([id, label]) => (
            <div key={id} className={'nav-item' + (screen === id ? ' active' : '')} onClick={() => setScreen(id)}>
              {navIcon(id, screen === id ? UI.accentDk : '#A99E94')}
              <span className="sidebar-label">{label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <Avatar pid="mei" size={34} />
          <Avatar pid="bas" size={34} />
          <div className="sidebar-label" style={{ fontSize: 12.5, color: UI.sub, fontWeight: 600 }}>Tersinkron ☁️</div>
        </div>
      </aside>

      {/* main */}
      <main className="main">
        <header className="topbar">
          <div>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 'clamp(24px,3vw,30px)', color: UI.ink, lineHeight: 1.1 }}>
              {screen === 'home' ? 'Hai, Mei! 👋' : TITLES[screen]}
            </div>
            {screen === 'home' && <div style={{ color: UI.sub, fontSize: 14, fontWeight: 500, marginTop: 6 }}>Sabtu, 31 Mei 2026</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="month-pill">Mei 2026</div>
            <button className="topbar-add" onClick={() => setAdding(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" /></svg>
              <span>Tambah</span>
            </button>
            <Avatar pid="mei" size={42} ring />
          </div>
        </header>
        <div className="content">{body[screen]}</div>
      </main>

      {/* mobile bottom nav */}
      <div className="bottomnav">
        {NAV.slice(0, 2).map(([id, label]) => (
          <div key={id} className={'bn-item' + (screen === id ? ' active' : '')} onClick={() => setScreen(id)}>
            {navIcon(id, screen === id ? UI.accentDk : '#BDB2A7')}<span>{label}</span>
          </div>
        ))}
        <div className="bn-fab" onClick={() => setAdding(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
        </div>
        {NAV.slice(2).map(([id, label]) => (
          <div key={id} className={'bn-item' + (screen === id ? ' active' : '')} onClick={() => setScreen(id)}>
            {navIcon(id, screen === id ? UI.accentDk : '#BDB2A7')}<span>{label === 'Pengaturan' ? 'Atur' : label}</span>
          </div>
        ))}
      </div>

      {adding && <WebAddModal onClose={() => setAdding(false)} onSave={addExpense} />}
      {detail && <WebExpenseDetail expense={detail} onClose={() => setDetail(null)} onDelete={deleteExpense} />}
    </div>
  );
}

function WebExpenseDetail({ expense: e, onClose, onDelete }) {
  const UI = window.UI;
  const { PROFILES, CATEGORIES, fmtRp } = window.STData;
  const c = CATEGORIES[e.category_id];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(63,53,48,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fade .2s' }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 28, padding: '28px 26px', animation: 'pop .3s cubic-bezier(.34,1.56,.64,1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <CatIcon cat={e.category_id} size={64} />
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 22, color: UI.ink, textAlign: 'center' }}>{e.description}</div>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 34, color: UI.ink }}>{fmtRp(e.amount)}</div>
        </div>
        <div style={{ background: UI.bg, borderRadius: 18, padding: '4px 18px', marginTop: 18 }}>
          {[['Kategori', c.name], ['Pembayar', PROFILES[e.payer_id].name], ['Tanggal', window.dateLabel(e.spent_at)], ['Pembagian', e.split_type === 'full' ? 'Ditanggung ' + PROFILES[e.owner || e.payer_id].name : 'Bagi 2 rata']].map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', borderTop: i ? `1px solid ${UI.line}` : 'none', fontSize: 14.5 }}>
              <span style={{ color: UI.sub, fontWeight: 500 }}>{k}</span><span style={{ color: UI.ink, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          {e.split_type !== 'full' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', borderTop: `1px solid ${UI.line}`, fontSize: 14.5 }}>
              <span style={{ color: UI.sub, fontWeight: 500 }}>Porsi masing-masing</span><span style={{ color: UI.ink, fontWeight: 600 }}>{fmtRp(e.shares.mei)} · {fmtRp(e.shares.bas)}</span>
            </div>
          )}
        </div>
        {e.recurring && <div style={{ marginTop: 12, fontSize: 13, color: UI.sub, textAlign: 'center' }}>🔁 Pengeluaran berulang otomatis</div>}
        <button onClick={() => onDelete(e.id)} style={{ width: '100%', marginTop: 18, border: 'none', borderRadius: 16, padding: '14px', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15.5, color: UI.bad, background: '#FDEEEE', cursor: 'pointer' }}>Hapus pengeluaran</button>
      </div>
    </div>
  );
}

Object.assign(window, { WebApp, WebExpenseDetail });
