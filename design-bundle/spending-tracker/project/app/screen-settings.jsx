/* Pengaturan — profil, kategori & budget, recurring, akun */
function Switch({ on, onToggle }) {
  const UI = window.UI;
  return (
    <div onClick={onToggle} style={{ width: 46, height: 28, borderRadius: 999, background: on ? UI.good : '#E2D8CE', padding: 3, cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.18)', transform: on ? 'translateX(18px)' : 'translateX(0)', transition: 'transform .2s' }} />
    </div>
  );
}

function SettingsScreen({ state, toggleRecurring }) {
  const UI = window.UI;
  const { PROFILES, CATEGORIES, fmtRp, fmtRpShort } = window.STData;
  const [notif, setNotif] = React.useState(true);

  const card = { background: UI.card, borderRadius: 26, boxShadow: '0 10px 30px rgba(196,170,142,0.16)' };
  const secLabel = { fontSize: 13, fontWeight: 700, color: UI.sub, margin: '26px 8px 11px', letterSpacing: 0.3 };
  const row = (i, extra = {}) => ({ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderTop: i ? `1px solid ${UI.line}` : 'none', ...extra });
  const chev = <svg width="8" height="14" viewBox="0 0 8 14"><path d="M1 1l6 6-6 6" stroke={UI.sub} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;

  return (
    <div style={{ padding: '64px 18px 120px' }}>
      <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 28, color: UI.ink, margin: '0 4px 14px' }}>Pengaturan</div>

      {/* household profile */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', width: 76, height: 48, flexShrink: 0 }}>
            <div style={{ position: 'absolute', left: 0 }}><Avatar pid="mei" size={48} ring /></div>
            <div style={{ position: 'absolute', left: 28 }}><Avatar pid="bas" size={48} ring /></div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 18, color: UI.ink }}>Rumah Mei & Baskara</div>
            <div style={{ fontSize: 13, color: UI.sub, marginTop: 2 }}>2 anggota · sejak 2025</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {['mei', 'bas'].map((p) => (
            <div key={p} style={{ flex: 1, background: UI.bg, borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: PROFILES[p].color, boxShadow: `0 0 0 3px ${PROFILES[p].soft}` }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: UI.ink }}>{PROFILES[p].name}</div>
                <div style={{ fontSize: 11, color: UI.sub }}>{PROFILES[p].color}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* categories & budget */}
      <div style={secLabel}>KATEGORI & BUDGET</div>
      <div style={{ ...card, padding: '4px 18px' }}>
        {Object.values(CATEGORIES).map((c, i) => (
          <div key={c.id} style={row(i)}>
            <CatIcon cat={c.id} size={38} />
            <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: UI.ink }}>{c.name}</div>
            <span style={{ fontSize: 13.5, color: c.budget ? UI.sub : '#C9BEB3', fontWeight: 500 }}>{c.budget ? fmtRpShort(c.budget) + '/bln' : 'Tanpa budget'}</span>
            {chev}
          </div>
        ))}
        <div style={{ ...row(1), color: UI.accentDk, fontWeight: 600, fontSize: 15, justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ fontSize: 19, lineHeight: 1 }}>+</span> Tambah kategori
        </div>
      </div>

      {/* recurring */}
      <div style={secLabel}>PENGELUARAN BERULANG</div>
      <div style={{ ...card, padding: '4px 18px' }}>
        {state.recurring.map((r, i) => (
          <div key={r.id} style={row(i)}>
            <CatIcon cat={r.category_id} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: UI.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.description}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <Avatar pid={r.payer_id} size={15} />
                <span style={{ fontSize: 12, color: UI.sub }}>{fmtRp(r.amount)} · tiap tgl {r.day}</span>
              </div>
            </div>
            <Switch on={r.active} onToggle={() => toggleRecurring(r.id)} />
          </div>
        ))}
      </div>

      {/* account */}
      <div style={secLabel}>AKUN</div>
      <div style={{ ...card, padding: '4px 18px' }}>
        <div style={row(0)}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: UI.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</div>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: UI.ink }}>Notifikasi budget</div>
          <Switch on={notif} onToggle={() => setNotif(!notif)} />
        </div>
        <div style={row(1)}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: '#E7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💱</div>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: UI.ink }}>Mata uang</div>
          <span style={{ fontSize: 13.5, color: UI.sub }}>Rupiah (IDR)</span>{chev}
        </div>
        <div style={row(1)}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: '#FDECF2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👋</div>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: UI.bad }}>Keluar</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: '#CFC4B9', fontSize: 12.5, marginTop: 22, fontWeight: 500 }}>Dibuat dengan 🧡 buat Mei & Baskara · v1.0</div>
    </div>
  );
}

Object.assign(window, { SettingsScreen, Switch });
