/* Web — Beranda (responsive dashboard) */
function WebHome({ derived, state, go, openExpense }) {
  const UI = window.UI;
  const { PROFILES, CATEGORIES, fmtRp, fmtRpShort } = window.STData;
  const { total, net, spendByCat } = derived;

  const owes = net > 0 ? { debtor: 'bas', creditor: 'mei', amt: net }
            : net < 0 ? { debtor: 'mei', creditor: 'bas', amt: -net } : null;

  const budgeted = Object.values(CATEGORIES).filter(c => c.budget)
    .map(c => ({ ...c, used: spendByCat[c.id] || 0, pct: Math.round(((spendByCat[c.id] || 0) / c.budget) * 100) }))
    .sort((a, b) => b.pct - a.pct);
  const recent = [...state.expenses].sort((a, b) => b.spent_at.localeCompare(a.spent_at)).slice(0, 7);

  const card = { background: UI.card, borderRadius: 28, boxShadow: '0 10px 30px rgba(196,170,142,0.14)' };

  return (
    <div className="dash">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* hero total */}
        <div style={{ ...card, padding: '30px 32px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg,#FF9E6B,#FF7E8A)' }}>
          <div style={{ position: 'absolute', right: 4, bottom: -18, opacity: 0.95 }}><Mascot size={150} mood="happy" /></div>
          <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: 600 }}>Pengeluaran bulan ini</div>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 'clamp(40px,5vw,56px)', color: '#fff', lineHeight: 1.05, marginTop: 6, letterSpacing: -1 }}>{fmtRp(total)}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, background: 'rgba(255,255,255,0.22)', color: '#fff', padding: '7px 14px', borderRadius: 999, fontSize: 13.5, fontWeight: 600 }}>
            <span>▲ 5%</span><span style={{ opacity: 0.85, fontWeight: 500 }}>dari April</span>
          </div>
        </div>

        {/* budget */}
        <div style={{ ...card, padding: '8px 26px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '18px 0 6px' }}>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 20, color: UI.ink, whiteSpace: 'nowrap' }}>Budget bulan ini</div>
            <div onClick={() => go('reports')} style={{ color: UI.accentDk, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Lihat laporan</div>
          </div>
          {budgeted.map((c, i) => (
            <div key={c.id} style={{ padding: '14px 0', borderTop: i ? `1px solid ${UI.line}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 9 }}>
                <CatIcon cat={c.id} size={38} />
                <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: UI.ink }}>{c.name}</div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Fredoka, sans-serif', color: c.pct > 100 ? UI.bad : c.pct >= 80 ? UI.warn : UI.ink }}>{fmtRpShort(c.used)}</span>
                  <span style={{ fontSize: 12.5, color: UI.sub }}> / {fmtRpShort(c.budget)}</span>
                </div>
              </div>
              <BudgetBar pct={c.pct} color={c.color} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* balance */}
        <div onClick={() => go('settle')} style={{ ...card, padding: 24, cursor: 'pointer' }}>
          <div style={{ fontSize: 14, color: UI.sub, fontWeight: 600, marginBottom: 14 }}>Saldo bareng</div>
          {owes ? (
            <React.Fragment>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ position: 'relative', width: 70, height: 44, flexShrink: 0 }}>
                  <div style={{ position: 'absolute', left: 0 }}><Avatar pid={owes.debtor} size={44} /></div>
                  <div style={{ position: 'absolute', left: 26 }}><Avatar pid={owes.creditor} size={44} /></div>
                </div>
                <div style={{ fontSize: 15.5, color: UI.ink, fontWeight: 600, lineHeight: 1.3 }}>
                  {PROFILES[owes.debtor].name} utang ke {PROFILES[owes.creditor].name}
                </div>
              </div>
              <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 32, color: UI.accentDk }}>{fmtRp(owes.amt)}</div>
              <button onClick={(e) => { e.stopPropagation(); go('settle'); }} style={{ marginTop: 16, width: '100%', border: 'none', borderRadius: 16, padding: '13px', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15.5, color: '#fff', background: UI.accent, boxShadow: '0 8px 18px rgba(255,138,91,0.35)', cursor: 'pointer' }}>Lunaskan</button>
            </React.Fragment>
          ) : (
            <div style={{ fontSize: 16, color: UI.ink, fontWeight: 600 }}>🎉 Kalian lagi impas!</div>
          )}
        </div>

        {/* recent */}
        <div style={{ ...card, padding: '8px 22px 12px' }}>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 18, color: UI.ink, padding: '16px 0 4px' }}>Transaksi terbaru</div>
          {recent.map((e, i) => (
            <div key={e.id} onClick={() => openExpense(e)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 0', borderTop: i ? `1px solid ${UI.line}` : 'none', cursor: 'pointer' }}>
              <CatIcon cat={e.category_id} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: UI.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <Avatar pid={e.payer_id} size={15} />
                  <span style={{ fontSize: 12.5, color: UI.sub, fontWeight: 500, whiteSpace: 'nowrap' }}>{PROFILES[e.payer_id].name} · {window.dateLabel(e.spent_at)}</span>
                </div>
              </div>
              <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15, color: UI.ink }}>{fmtRp(e.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { WebHome });
