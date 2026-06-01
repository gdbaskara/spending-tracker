/* Web — Pengaturan */
function WebSettings({ state, toggleRecurring }) {
  const UI = window.UI;
  const { PROFILES, CATEGORIES, fmtRp, fmtRpShort } = window.STData;
  const [notif, setNotif] = React.useState(true);
  const card = { background: UI.card, borderRadius: 28, boxShadow: '0 10px 30px rgba(196,170,142,0.14)' };
  const secLabel = { fontSize: 13.5, fontWeight: 700, color: UI.sub, margin: '8px 6px 12px', letterSpacing: 0.3 };
  const rowS = (i) => ({ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0', borderTop: i ? `1px solid ${UI.line}` : 'none' });
  const chev = <svg width="8" height="14" viewBox="0 0 8 14"><path d="M1 1l6 6-6 6" stroke={UI.sub} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const Sw = ({ on, t }) => (
    <div onClick={t} style={{ width: 48, height: 28, borderRadius: 999, background: on ? UI.good : '#E2D8CE', padding: 3, cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.18)', transform: on ? 'translateX(20px)' : 'translateX(0)', transition: 'transform .2s' }} />
    </div>
  );

  return (
    <div className="rgrid" style={{ alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* profile */}
        <div style={{ ...card, padding: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 86, height: 54, flexShrink: 0 }}>
              <div style={{ position: 'absolute', left: 0 }}><Avatar pid="mei" size={54} ring /></div>
              <div style={{ position: 'absolute', left: 32 }}><Avatar pid="bas" size={54} ring /></div>
            </div>
            <div>
              <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 20, color: UI.ink }}>Rumah Mei & Baskara</div>
              <div style={{ fontSize: 13.5, color: UI.sub, marginTop: 2 }}>2 anggota · sejak 2025</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            {['mei', 'bas'].map((p) => (
              <div key={p} style={{ flex: 1, background: UI.bg, borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: PROFILES[p].color, boxShadow: `0 0 0 3px ${PROFILES[p].soft}` }} />
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: UI.ink }}>{PROFILES[p].name}</div>
                  <div style={{ fontSize: 11.5, color: UI.sub }}>{PROFILES[p].color}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* categories */}
        <div>
          <div style={secLabel}>KATEGORI & BUDGET</div>
          <div style={{ ...card, padding: '4px 24px' }}>
            {Object.values(CATEGORIES).map((c, i) => (
              <div key={c.id} style={rowS(i)}>
                <CatIcon cat={c.id} size={40} />
                <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: UI.ink }}>{c.name}</div>
                <span style={{ fontSize: 14, color: c.budget ? UI.sub : '#C9BEB3', fontWeight: 500 }}>{c.budget ? fmtRpShort(c.budget) + '/bln' : 'Tanpa budget'}</span>
                {chev}
              </div>
            ))}
            <div style={{ ...rowS(1), color: UI.accentDk, fontWeight: 600, fontSize: 15, justifyContent: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Tambah kategori
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* recurring */}
        <div>
          <div style={secLabel}>PENGELUARAN BERULANG</div>
          <div style={{ ...card, padding: '4px 24px' }}>
            {state.recurring.map((r, i) => (
              <div key={r.id} style={rowS(i)}>
                <CatIcon cat={r.category_id} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: UI.ink }}>{r.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <Avatar pid={r.payer_id} size={16} />
                    <span style={{ fontSize: 12.5, color: UI.sub }}>{fmtRp(r.amount)} · tiap tgl {r.day}</span>
                  </div>
                </div>
                <Sw on={r.active} t={() => toggleRecurring(r.id)} />
              </div>
            ))}
          </div>
        </div>

        {/* account */}
        <div>
          <div style={secLabel}>AKUN</div>
          <div style={{ ...card, padding: '4px 24px' }}>
            <div style={rowS(0)}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: UI.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</div>
              <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: UI.ink }}>Notifikasi budget</div>
              <Sw on={notif} t={() => setNotif(!notif)} />
            </div>
            <div style={rowS(1)}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#E7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💱</div>
              <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: UI.ink }}>Mata uang</div>
              <span style={{ fontSize: 14, color: UI.sub }}>Rupiah (IDR)</span>{chev}
            </div>
            <div style={rowS(1)}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FDECF2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👋</div>
              <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: UI.bad }}>Keluar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { WebSettings });
