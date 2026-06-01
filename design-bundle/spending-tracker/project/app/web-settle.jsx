/* Web — Settle Up */
function WebSettle({ derived, state, onSettle }) {
  const UI = window.UI;
  const { PROFILES, fmtRp } = window.STData;
  const { net, paid } = derived;
  const [confirm, setConfirm] = React.useState(false);
  const [celebrate, setCelebrate] = React.useState(false);

  const owes = net > 0 ? { debtor: 'bas', creditor: 'mei', amt: net }
            : net < 0 ? { debtor: 'mei', creditor: 'bas', amt: -net } : null;

  const doSettle = () => {
    onSettle(owes.debtor, owes.creditor, owes.amt);
    setConfirm(false); setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1800);
  };

  const card = { background: UI.card, borderRadius: 28, boxShadow: '0 10px 30px rgba(196,170,142,0.14)' };
  const history = [...state.settlements].sort((a, b) => b.settled_at.localeCompare(a.settled_at));

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {owes ? (
        <div style={{ ...card, padding: '36px 32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, marginBottom: 18 }}>
            <div><Avatar pid={owes.debtor} size={66} /><div style={{ fontSize: 13.5, fontWeight: 600, color: UI.sub, marginTop: 8 }}>{PROFILES[owes.debtor].name}</div></div>
            <svg width="56" height="22" viewBox="0 0 56 22"><path d="M2 11h48m0 0l-8-7m8 7l-8 7" stroke={UI.accent} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div><Avatar pid={owes.creditor} size={66} /><div style={{ fontSize: 13.5, fontWeight: 600, color: UI.sub, marginTop: 8 }}>{PROFILES[owes.creditor].name}</div></div>
          </div>
          <div style={{ fontSize: 16, color: UI.sub, fontWeight: 500 }}>{PROFILES[owes.debtor].name} utang ke {PROFILES[owes.creditor].name}</div>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 52, color: UI.accentDk, lineHeight: 1.1, marginTop: 4 }}>{fmtRp(owes.amt)}</div>
          <button onClick={() => setConfirm(true)} style={{ marginTop: 22, border: 'none', borderRadius: 18, padding: '15px 48px', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 17, color: '#fff', background: UI.accent, boxShadow: '0 8px 20px rgba(255,138,91,0.4)', cursor: 'pointer' }}>Lunaskan sekarang</button>
        </div>
      ) : (
        <div style={{ ...card, padding: '40px', textAlign: 'center' }}>
          <Mascot size={150} mood="proud" />
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 28, color: UI.ink, marginTop: 8 }}>Impas! 🎉</div>
          <div style={{ fontSize: 15.5, color: UI.sub, marginTop: 6 }}>Nggak ada yang utang. Kalian keren!</div>
        </div>
      )}

      <div style={{ ...card, padding: '8px 26px' }}>
        {['mei', 'bas'].map((p, i) => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 0', borderTop: i ? `1px solid ${UI.line}` : 'none' }}>
            <Avatar pid={p} size={42} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: UI.ink }}>{PROFILES[p].name} nalangin</div>
              <div style={{ fontSize: 13, color: UI.sub, marginTop: 1 }}>total yang dibayarin duluan bulan ini</div>
            </div>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 18, color: UI.ink }}>{fmtRp(paid[p])}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 20, color: UI.ink, margin: '6px 4px 14px' }}>Riwayat pelunasan</div>
        {history.length ? (
          <div style={{ ...card, padding: '8px 26px' }}>
            {history.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 0', borderTop: i ? `1px solid ${UI.line}` : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: UI.good + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 9.5l4 4 8-9" stroke={UI.good} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: UI.ink }}>{PROFILES[s.from_id].name} → {PROFILES[s.to_id].name}</div>
                  <div style={{ fontSize: 13, color: UI.sub, marginTop: 1 }}>{s.note || 'Pelunasan'} · {window.dateLabel(s.settled_at)}</div>
                </div>
                <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 16, color: UI.good }}>{fmtRp(s.amount)}</div>
              </div>
            ))}
          </div>
        ) : <div style={{ ...card, padding: 28, textAlign: 'center', color: UI.sub }}>Belum ada pelunasan 🌱</div>}
      </div>

      {confirm && owes && (
        <div onClick={() => setConfirm(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(63,53,48,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fade .2s', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 28, padding: '30px 28px', textAlign: 'center', animation: 'pop .3s cubic-bezier(.34,1.56,.64,1)' }}>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 22, color: UI.ink }}>Lunaskan utang?</div>
            <div style={{ fontSize: 15, color: UI.sub, marginTop: 10, lineHeight: 1.5 }}>{PROFILES[owes.debtor].name} bayar <b style={{ color: UI.accentDk }}>{fmtRp(owes.amt)}</b> ke {PROFILES[owes.creditor].name}. Saldo balik ke nol.</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setConfirm(false)} style={{ flex: 1, border: 'none', borderRadius: 16, padding: '14px', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15.5, color: UI.sub, background: UI.faint, cursor: 'pointer' }}>Nanti</button>
              <button onClick={doSettle} style={{ flex: 1.4, border: 'none', borderRadius: 16, padding: '14px', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15.5, color: '#fff', background: UI.accent, boxShadow: '0 8px 18px rgba(255,138,91,0.4)', cursor: 'pointer' }}>Ya, lunaskan</button>
            </div>
          </div>
        </div>
      )}

      {celebrate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(251,245,239,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, animation: 'fade .25s' }}>
          <div style={{ animation: 'pop .4s cubic-bezier(.34,1.56,.64,1)' }}><Mascot size={170} mood="proud" /></div>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 30, color: UI.ink }}>Lunas! 🎉</div>
          <div style={{ fontSize: 16, color: UI.sub }}>Saldo kalian balik ke nol.</div>
        </div>
      )}
    </div>
  );
}
Object.assign(window, { WebSettle });
