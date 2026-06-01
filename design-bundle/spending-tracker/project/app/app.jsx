/* SpendingApp — shell: state, derived values, nav, FAB */
function SpendingApp({ initialScreen = 'home', initialAdding = false }) {
  const UI = window.UI;
  const D = window.STData;
  const [screen, setScreen] = React.useState(initialScreen);
  const [adding, setAdding] = React.useState(initialAdding);
  const [detail, setDetail] = React.useState(null);

  const [state, setState] = React.useState({
    expenses: D.EXPENSES.slice(),
    settlements: D.SETTLEMENTS.slice(),
    recurring: D.RECURRING.slice(),
  });

  const derived = React.useMemo(() => ({
    total: D.totalThisMonth(state.expenses),
    net: D.netMei(state.expenses, state.settlements),
    spendByCat: D.spendByCategory(state.expenses),
    paid: D.paidByPerson(state.expenses),
  }), [state]);

  const addExpense = (rec) => setState((s) => ({ ...s, expenses: [rec, ...s.expenses] }));
  const onSettle = (from, to, amt) => setState((s) => ({
    ...s, settlements: [...s.settlements, { id: 's' + Date.now(), from_id: from, to_id: to, amount: amt, note: 'Lunaskan', settled_at: '2026-05-31' }],
  }));
  const toggleRecurring = (id) => setState((s) => ({ ...s, recurring: s.recurring.map((r) => r.id === id ? { ...r, active: !r.active } : r) }));
  const deleteExpense = (id) => { setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) })); setDetail(null); };

  const screens = {
    home: <HomeScreen derived={derived} state={state} go={setScreen} openAdd={() => setAdding(true)} openExpense={setDetail} />,
    reports: <ReportsScreen derived={derived} state={state} />,
    settle: <SettleScreen derived={derived} state={state} onSettle={onSettle} />,
    settings: <SettingsScreen state={state} toggleRecurring={toggleRecurring} />,
  };

  // nav icons
  const icon = (name, active) => {
    const col = active ? UI.accentDk : '#BDB2A7';
    const sw = 2.1;
    const paths = {
      home: <path d="M3 11l9-7 9 7M5.5 9.5V20h13V9.5M9.5 20v-5.5h5V20" stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
      reports: <g stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></g>,
      settle: <g stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3" /></g>,
      settings: <g stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></g>,
    };
    return <svg width="24" height="24" viewBox="0 0 24 24">{paths[name]}</svg>;
  };

  const tab = (name, label) => (
    <div onClick={() => setScreen(name)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '4px 0' }}>
      {icon(name, screen === name)}
      <span style={{ fontSize: 10.5, fontWeight: 600, color: screen === name ? UI.accentDk : '#BDB2A7' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ height: '100%', position: 'relative', background: UI.bg, overflow: 'hidden', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {/* soft top tint */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, background: screen === 'home' ? 'linear-gradient(180deg,#FFEFE6,rgba(255,239,230,0))' : 'transparent', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ height: '100%', overflow: 'auto', position: 'relative', zIndex: 1, WebkitOverflowScrolling: 'touch' }}>
        {screens[screen]}
      </div>

      {/* floating bottom nav */}
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 22, height: 64, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 26, boxShadow: '0 12px 30px rgba(120,90,60,0.18)', display: 'flex', alignItems: 'center', padding: '0 8px', zIndex: 40 }}>
        {tab('home', 'Beranda')}
        {tab('reports', 'Laporan')}
        <div style={{ width: 64, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <div onClick={() => setAdding(true)} style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg,#FF9E6B,#FF7E5B)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 20px rgba(255,126,91,0.5)', transform: 'translateY(-14px)', border: '4px solid #FBF5EF' }}>
            <svg width="26" height="26" viewBox="0 0 26 26"><path d="M13 5v16M5 13h16" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
          </div>
        </div>
        {tab('settle', 'Saldo')}
        {tab('settings', 'Atur')}
      </div>

      {adding && <AddSheet instant={initialAdding} onClose={() => setAdding(false)} onSave={(rec) => { addExpense(rec); }} />}
      {detail && <ExpenseDetail expense={detail} onClose={() => setDetail(null)} onDelete={deleteExpense} />}
    </div>
  );
}

// ── Expense detail sheet ──
function ExpenseDetail({ expense: e, onClose, onDelete }) {
  const UI = window.UI;
  const { PROFILES, CATEGORIES, fmtRp } = window.STData;
  const c = CATEGORIES[e.category_id];
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 85, background: 'rgba(63,53,48,0.4)', display: 'flex', alignItems: 'flex-end', animation: 'fade .2s' }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ width: '100%', background: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '14px 22px 34px', animation: 'sheetUp .3s cubic-bezier(.32,.72,0,1)' }}>
        <div style={{ width: 40, height: 5, borderRadius: 999, background: UI.faint, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <CatIcon cat={e.category_id} size={62} />
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 21, color: UI.ink, textAlign: 'center' }}>{e.description}</div>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 34, color: UI.ink }}>{fmtRp(e.amount)}</div>
        </div>
        <div style={{ background: UI.bg, borderRadius: 18, padding: '4px 16px', marginTop: 18 }}>
          {[
            ['Kategori', c.name],
            ['Pembayar', PROFILES[e.payer_id].name],
            ['Tanggal', window.dateLabel(e.spent_at)],
            ['Pembagian', e.split_type === 'full' ? 'Ditanggung ' + PROFILES[e.owner || e.payer_id].name : 'Bagi 2 rata'],
          ].map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', borderTop: i ? `1px solid ${UI.line}` : 'none', fontSize: 14.5 }}>
              <span style={{ color: UI.sub, fontWeight: 500 }}>{k}</span>
              <span style={{ color: UI.ink, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          {e.split_type !== 'full' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', borderTop: `1px solid ${UI.line}`, fontSize: 14.5 }}>
              <span style={{ color: UI.sub, fontWeight: 500 }}>Porsi masing-masing</span>
              <span style={{ color: UI.ink, fontWeight: 600 }}>{fmtRp(e.shares.mei)} · {fmtRp(e.shares.bas)}</span>
            </div>
          )}
        </div>
        {e.recurring && <div style={{ marginTop: 12, fontSize: 13, color: UI.sub, textAlign: 'center' }}>🔁 Pengeluaran berulang otomatis</div>}
        <button onClick={() => onDelete(e.id)} style={{ width: '100%', marginTop: 18, border: 'none', borderRadius: 16, padding: '14px', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15.5, color: UI.bad, background: '#FDEEEE', cursor: 'pointer' }}>Hapus pengeluaran</button>
      </div>
    </div>
  );
}

Object.assign(window, { SpendingApp, ExpenseDetail });
