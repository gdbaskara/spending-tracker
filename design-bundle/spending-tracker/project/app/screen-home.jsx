/* Beranda / Dashboard */
function HomeScreen({ derived, state, go, openAdd, openExpense }) {
  const UI = window.UI;
  const { PROFILES, CATEGORIES, fmtRp, fmtRpShort } = window.STData;
  const { total, net, spendByCat } = derived;

  // balance direction
  const owes = net > 0 ? { debtor: 'bas', creditor: 'mei', amt: net }
            : net < 0 ? { debtor: 'mei', creditor: 'bas', amt: -net }
            : null;

  // budgeted categories sorted by % used
  const budgeted = Object.values(CATEGORIES).filter(c => c.budget)
    .map(c => ({ ...c, used: spendByCat[c.id] || 0, pct: Math.round(((spendByCat[c.id] || 0) / c.budget) * 100) }))
    .sort((a, b) => b.pct - a.pct);

  // recent transactions grouped by date
  const recent = [...state.expenses].sort((a, b) => b.spent_at.localeCompare(a.spent_at)).slice(0, 6);

  const card = { background: UI.card, borderRadius: 26, boxShadow: '0 10px 30px rgba(196,170,142,0.16)' };

  return (
    <div style={{ padding: '64px 18px 120px' }}>
      {/* greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, padding: '0 4px' }}>
        <div>
          <div style={{ color: UI.sub, fontSize: 14, fontWeight: 600 }}>Sabtu, 31 Mei</div>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 26, color: UI.ink, lineHeight: 1.1 }}>Hai, Mei! <span style={{ fontSize: 22 }}>👋</span></div>
        </div>
        <Avatar pid="mei" size={46} ring />
      </div>

      {/* total this month */}
      <div style={{ ...card, padding: '22px 22px 20px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#FF9E6B,#FF7E8A)' }}>
        <div style={{ position: 'absolute', right: -14, bottom: -22, opacity: 0.9 }}><Mascot size={120} mood="happy" /></div>
        <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: 600 }}>Pengeluaran bulan ini</div>
        <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 40, color: '#fff', lineHeight: 1.1, marginTop: 4, letterSpacing: -0.5 }}>{fmtRp(total)}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, background: 'rgba(255,255,255,0.22)', color: '#fff', padding: '5px 11px', borderRadius: 999, fontSize: 12.5, fontWeight: 600 }}>
          <span>▲ 5%</span><span style={{ opacity: 0.85, fontWeight: 500 }}>dari April</span>
        </div>
      </div>

      {/* balance / settle */}
      <div onClick={() => go('settle')} style={{ ...card, padding: 18, marginTop: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
        {owes ? (
          <React.Fragment>
            <div style={{ position: 'relative', width: 64, height: 40, flexShrink: 0 }}>
              <div style={{ position: 'absolute', left: 0 }}><Avatar pid={owes.debtor} size={40} /></div>
              <div style={{ position: 'absolute', left: 24 }}><Avatar pid={owes.creditor} size={40} /></div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, color: UI.sub, fontWeight: 600 }}>Saldo bareng</div>
              <div style={{ fontSize: 15.5, color: UI.ink, fontWeight: 600, lineHeight: 1.25, marginTop: 2 }}>
                {PROFILES[owes.debtor].name} utang <span style={{ color: UI.accentDk, fontFamily: 'Fredoka, sans-serif' }}>{fmtRp(owes.amt)}</span> ke {PROFILES[owes.creditor].name}
              </div>
            </div>
          </React.Fragment>
        ) : (
          <div style={{ flex: 1, fontSize: 15, color: UI.ink, fontWeight: 600 }}>🎉 Kalian lagi impas, nih!</div>
        )}
        <svg width="9" height="16" viewBox="0 0 9 16" style={{ flexShrink: 0 }}><path d="M1 1l6.5 7L1 15" stroke={UI.sub} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>

      {/* budget progress */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '26px 4px 12px' }}>
        <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 19, color: UI.ink }}>Budget bulan ini</div>
        <div onClick={() => go('reports')} style={{ color: UI.accentDk, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Lihat semua</div>
      </div>
      <div style={{ ...card, padding: '6px 18px' }}>
        {budgeted.slice(0, 4).map((c, i) => (
          <div key={c.id} style={{ padding: '13px 0', borderTop: i ? `1px solid ${UI.line}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 9 }}>
              <CatIcon cat={c.id} size={34} />
              <div style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: UI.ink }}>{c.name}</div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Fredoka, sans-serif', color: c.pct > 100 ? UI.bad : c.pct >= 80 ? UI.warn : UI.ink }}>{fmtRpShort(c.used)}</span>
                <span style={{ fontSize: 12, color: UI.sub }}> / {fmtRpShort(c.budget)}</span>
              </div>
            </div>
            <BudgetBar pct={c.pct} color={c.color} />
          </div>
        ))}
      </div>

      {/* recent */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '26px 4px 12px' }}>
        <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 19, color: UI.ink }}>Transaksi terbaru</div>
      </div>
      <div style={{ ...card, padding: '6px 16px' }}>
        {recent.map((e, i) => (
          <div key={e.id} onClick={() => openExpense(e)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i ? `1px solid ${UI.line}` : 'none', cursor: 'pointer' }}>
            <CatIcon cat={e.category_id} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: UI.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <Avatar pid={e.payer_id} size={16} />
                <span style={{ fontSize: 12.5, color: UI.sub, fontWeight: 500 }}>{PROFILES[e.payer_id].name} bayar · {dateLabel(e.spent_at)}</span>
              </div>
            </div>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15.5, color: UI.ink }}>{fmtRp(e.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function dateLabel(d) {
  if (d === '2026-05-31') return 'Hari ini';
  if (d === '2026-05-30') return 'Kemarin';
  const [y, m, day] = d.split('-').map(Number);
  const mon = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m - 1];
  return day + ' ' + mon;
}

Object.assign(window, { HomeScreen, dateLabel });
