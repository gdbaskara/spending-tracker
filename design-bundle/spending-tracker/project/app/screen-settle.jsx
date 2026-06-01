/* Settle Up — saldo net + Lunaskan + riwayat */
function SettleScreen({ derived, state, onSettle }) {
  const UI = window.UI;
  const { PROFILES, fmtRp } = window.STData;
  const { net, paid } = derived;
  const [confirm, setConfirm] = React.useState(false);
  const [celebrate, setCelebrate] = React.useState(false);

  const owes = net > 0 ? { debtor: 'bas', creditor: 'mei', amt: net }
            : net < 0 ? { debtor: 'mei', creditor: 'bas', amt: -net } : null;

  const doSettle = () => {
    onSettle(owes.debtor, owes.creditor, owes.amt);
    setConfirm(false);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1800);
  };

  const card = { background: UI.card, borderRadius: 26, boxShadow: '0 10px 30px rgba(196,170,142,0.16)' };
  const history = [...state.settlements].sort((a, b) => b.settled_at.localeCompare(a.settled_at));

  return (
    <div style={{ padding: '64px 18px 120px' }}>
      <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 28, color: UI.ink, margin: '0 4px 4px' }}>Saldo Bareng</div>
      <div style={{ color: UI.sub, fontSize: 14, margin: '0 4px 20px', fontWeight: 500 }}>Siapa utang siapa, bulan ini.</div>

      {/* hero */}
      {owes ? (
        <div style={{ ...card, padding: '28px 22px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <Avatar pid={owes.debtor} size={58} />
              <div style={{ fontSize: 12.5, fontWeight: 600, color: UI.sub, marginTop: 6 }}>{PROFILES[owes.debtor].name}</div>
            </div>
            <svg width="42" height="20" viewBox="0 0 42 20"><path d="M2 10h34m0 0l-7-6m7 6l-7 6" stroke={UI.accent} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div style={{ textAlign: 'center' }}>
              <Avatar pid={owes.creditor} size={58} />
              <div style={{ fontSize: 12.5, fontWeight: 600, color: UI.sub, marginTop: 6 }}>{PROFILES[owes.creditor].name}</div>
            </div>
          </div>
          <div style={{ fontSize: 15, color: UI.sub, fontWeight: 500 }}>{PROFILES[owes.debtor].name} utang ke {PROFILES[owes.creditor].name}</div>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 42, color: UI.accentDk, lineHeight: 1.15, marginTop: 2 }}>{fmtRp(owes.amt)}</div>
          <button onClick={() => setConfirm(true)} style={{ marginTop: 18, width: '100%', border: 'none', borderRadius: 18, padding: '15px', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 17, color: '#fff', background: UI.accent, boxShadow: '0 8px 20px rgba(255,138,91,0.4)', cursor: 'pointer' }}>Lunaskan sekarang</button>
        </div>
      ) : (
        <div style={{ ...card, padding: '30px 22px', textAlign: 'center' }}>
          <Mascot size={130} mood="proud" />
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 24, color: UI.ink, marginTop: 6 }}>Impas! 🎉</div>
          <div style={{ fontSize: 14.5, color: UI.sub, marginTop: 4 }}>Nggak ada yang utang. Kalian keren!</div>
        </div>
      )}

      {/* who fronted what */}
      <div style={{ ...card, padding: '6px 18px', marginTop: 14 }}>
        {['mei', 'bas'].map((p, i) => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 0', borderTop: i ? `1px solid ${UI.line}` : 'none' }}>
            <Avatar pid={p} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: UI.ink }}>{PROFILES[p].name} nalangin</div>
              <div style={{ fontSize: 12.5, color: UI.sub, marginTop: 1 }}>total yang dibayarin duluan</div>
            </div>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 16, color: UI.ink }}>{fmtRp(paid[p])}</div>
          </div>
        ))}
      </div>

      {/* history */}
      <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 19, color: UI.ink, margin: '26px 4px 12px' }}>Riwayat pelunasan</div>
      {history.length ? (
        <div style={{ ...card, padding: '6px 18px' }}>
          {history.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderTop: i ? `1px solid ${UI.line}` : 'none' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: UI.good + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 9.5l4 4 8-9" stroke={UI.good} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: UI.ink }}>{PROFILES[s.from_id].name} → {PROFILES[s.to_id].name}</div>
                <div style={{ fontSize: 12.5, color: UI.sub, marginTop: 1 }}>{s.note || 'Pelunasan'} · {window.dateLabel(s.settled_at)}</div>
              </div>
              <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15, color: UI.good }}>{fmtRp(s.amount)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...card, padding: '24px', textAlign: 'center', color: UI.sub, fontSize: 14 }}>Belum ada pelunasan 🌱</div>
      )}

      {/* confirm sheet */}
      {confirm && owes && (
        <div onClick={() => setConfirm(false)} style={{ position: 'absolute', inset: 0, zIndex: 85, background: 'rgba(63,53,48,0.4)', display: 'flex', alignItems: 'flex-end', animation: 'fade .2s' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '14px 22px 34px', animation: 'sheetUp .3s cubic-bezier(.32,.72,0,1)' }}>
            <div style={{ width: 40, height: 5, borderRadius: 999, background: UI.faint, margin: '0 auto 18px' }} />
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 21, color: UI.ink, textAlign: 'center' }}>Lunaskan utang?</div>
            <div style={{ fontSize: 15, color: UI.sub, textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
              {PROFILES[owes.debtor].name} bayar <b style={{ color: UI.accentDk }}>{fmtRp(owes.amt)}</b> ke {PROFILES[owes.creditor].name}. Saldo balik ke nol.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setConfirm(false)} style={{ flex: 1, border: 'none', borderRadius: 16, padding: '14px', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15.5, color: UI.sub, background: UI.faint, cursor: 'pointer' }}>Nanti</button>
              <button onClick={doSettle} style={{ flex: 1.4, border: 'none', borderRadius: 16, padding: '14px', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15.5, color: '#fff', background: UI.accent, boxShadow: '0 8px 18px rgba(255,138,91,0.4)', cursor: 'pointer' }}>Ya, lunaskan</button>
            </div>
          </div>
        </div>
      )}

      {/* celebration */}
      {celebrate && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: 'rgba(251,245,239,0.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, animation: 'fade .25s' }}>
          <div style={{ animation: 'pop .4s cubic-bezier(.34,1.56,.64,1)' }}><Mascot size={150} mood="proud" /></div>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 26, color: UI.ink }}>Lunas! 🎉</div>
          <div style={{ fontSize: 15, color: UI.sub }}>Saldo kalian balik ke nol.</div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SettleScreen });
