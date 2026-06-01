/* Web — Tambah Pengeluaran (centered modal, keypad + keyboard) */
function WebAddModal({ onClose, onSave }) {
  const UI = window.UI;
  const { PROFILES, CATEGORIES, fmtRp, computeShares } = window.STData;
  const [amount, setAmount] = React.useState(0);
  const [cat, setCat] = React.useState('makan');
  const [payer, setPayer] = React.useState('mei');
  const [split, setSplit] = React.useState('equal');
  const [desc, setDesc] = React.useState('');
  const [date, setDate] = React.useState('2026-05-31');
  const [showCal, setShowCal] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const bump = (k) => setAmount((a) => k === 'del' ? Math.floor(a / 10) : k === '000' ? Math.min(a * 1000, 999999999) : Math.min(a * 10 + k, 999999999));

  React.useEffect(() => {
    const h = (e) => {
      if (saved) return;
      if (e.key >= '0' && e.key <= '9') bump(Number(e.key));
      else if (e.key === 'Backspace') bump('del');
      else if (e.key === 'Enter') save();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const shares = computeShares(amount, split, payer, { owner: payer });
  const canSave = amount > 0;
  const save = () => {
    if (!canSave) return;
    onSave({ id: 'e' + Date.now(), spent_at: date, category_id: cat, payer_id: payer, amount, description: desc.trim() || CATEGORIES[cat].name, split_type: split, owner: split === 'full' ? payer : undefined, recurring: false, shares });
    setSaved(true);
    setTimeout(onClose, 1100);
  };

  const seg = (active, color) => ({ flex: 1, padding: '11px 8px', borderRadius: 13, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', transition: 'all .18s', background: active ? (color || UI.accent) : 'transparent', color: active ? '#fff' : UI.sub, boxShadow: active ? '0 6px 14px rgba(0,0,0,0.12)' : 'none' });
  const segWrap = { display: 'flex', gap: 6, background: UI.faint, borderRadius: 16, padding: 5 };
  const label = { fontSize: 12.5, fontWeight: 700, color: UI.sub, margin: '0 2px 9px', letterSpacing: 0.2 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(63,53,48,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fade .2s' }}>
      <div className="add-modal" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, maxHeight: '92vh', overflow: 'auto', background: UI.bg, borderRadius: 28, padding: '22px 24px 26px', animation: 'pop .3s cubic-bezier(.34,1.56,.64,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 19, color: UI.ink }}>Catat pengeluaran</div>
          <div onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(196,170,142,0.2)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke={UI.ink} strokeWidth="2.2" strokeLinecap="round" /></svg>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0 18px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: UI.sub }}>Jumlah</div>
          <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 44, color: amount ? UI.ink : '#D8CFC6', lineHeight: 1.1 }}>
            {amount ? fmtRp(amount) : 'Rp0'}<span style={{ color: UI.accent, fontWeight: 400, animation: 'blink 1.1s steps(1) infinite' }}>|</span>
          </div>
          {amount > 0 && split === 'equal' && <div style={{ fontSize: 13, color: UI.sub, marginTop: 5 }}>Masing-masing {fmtRp(shares.mei)}</div>}
          {amount > 0 && split === 'full' && <div style={{ fontSize: 13, color: UI.sub, marginTop: 5 }}>Ditanggung penuh {PROFILES[payer].name}</div>}
        </div>

        <div style={label}>KATEGORI</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {Object.values(CATEGORIES).map((c) => (
            <div key={c.id} onClick={() => setCat(c.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <div style={{ borderRadius: 16, padding: 3, background: cat === c.id ? c.color + '33' : 'transparent', boxShadow: cat === c.id ? `0 0 0 2px ${c.color}` : 'none', transition: 'all .15s' }}>
                <CatIcon cat={c.id} size={42} radius={13} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: cat === c.id ? UI.ink : UI.sub, textAlign: 'center', lineHeight: 1.1 }}>{c.name}</span>
            </div>
          ))}
        </div>

        <div style={label}>SIAPA YANG BAYAR?</div>
        <div style={{ ...segWrap, marginBottom: 16 }}>
          {['mei', 'bas'].map((p) => (
            <div key={p} onClick={() => setPayer(p)} style={{ ...seg(payer === p, PROFILES[p].color), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, color: payer === p ? '#fff' : UI.ink }}>
              <Avatar pid={p} size={22} />{PROFILES[p].name}
            </div>
          ))}
        </div>

        <div style={label}>DIBAGI GIMANA?</div>
        <div style={{ ...segWrap, marginBottom: 16 }}>
          <div onClick={() => setSplit('equal')} style={seg(split === 'equal')}>Bagi 2 rata</div>
          <div onClick={() => setSplit('full')} style={seg(split === 'full')}>Sendiri</div>
        </div>

        <div style={label}>CATATAN</div>
        <input autoFocus value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Buat apa nih? (opsional)"
          style={{ width: '100%', boxSizing: 'border-box', border: 'none', background: '#fff', borderRadius: 14, padding: '13px 15px', fontSize: 15, color: UI.ink, outline: 'none', boxShadow: '0 4px 12px rgba(196,170,142,0.12)', marginBottom: 16 }} />
        <div style={label}>TANGGAL</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: showCal ? 0 : 18, flexWrap: 'wrap' }}>
          {[['2026-05-31', 'Hari ini'], ['2026-05-30', 'Kemarin']].map(([iso, lbl]) => {
            const active = !showCal && date === iso;
            return <div key={iso} onClick={() => { setDate(iso); setShowCal(false); }} style={{ padding: '9px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: active ? UI.accentSoft : '#fff', color: active ? UI.accentDk : UI.sub, boxShadow: '0 3px 9px rgba(196,170,142,0.1)' }}>{lbl}</div>;
          })}
          {(() => {
            const custom = date !== '2026-05-31' && date !== '2026-05-30';
            const active = showCal || custom;
            return (
              <div onClick={() => setShowCal((s) => !s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: active ? UI.accentSoft : '#fff', color: active ? UI.accentDk : UI.sub, boxShadow: '0 3px 9px rgba(196,170,142,0.1)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1.5" y="2.5" width="11" height="10" rx="2" /><path d="M1.5 5.5h11M4.5 1v2.5M9.5 1v2.5" strokeLinecap="round" /></svg>
                {custom ? window.dateChipLabel(date) : 'Tanggal lain'}
              </div>
            );
          })()}
        </div>
        {showCal && <CuteCalendar value={date} onChange={setDate} />}
        {showCal && <div style={{ height: 18 }} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
          {['1','2','3','4','5','6','7','8','9','000','0','del'].map((k) => (
            <div key={k} onClick={() => bump(k === 'del' ? 'del' : k === '000' ? '000' : Number(k))}
              style={{ height: 44, borderRadius: 13, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: k === 'del' ? 18 : 20, color: UI.ink, cursor: 'pointer', userSelect: 'none', boxShadow: '0 2px 6px rgba(196,170,142,0.1)' }}>
              {k === 'del' ? '⌫' : k}
            </div>
          ))}
        </div>
        <button onClick={save} disabled={!canSave} style={{ width: '100%', border: 'none', borderRadius: 16, padding: '15px', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 17, color: '#fff', cursor: canSave ? 'pointer' : 'default', background: canSave ? UI.accent : '#E7DDD4', boxShadow: canSave ? '0 8px 20px rgba(255,138,91,0.4)' : 'none', transition: 'all .2s' }}>Simpan</button>

        {saved && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: 28, background: 'rgba(251,245,239,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ animation: 'pop .4s cubic-bezier(.34,1.56,.64,1)' }}><Mascot size={140} mood="proud" /></div>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 24, color: UI.ink }}>Tercatat! 🎉</div>
            <div style={{ fontSize: 15, color: UI.sub }}>{fmtRp(amount)} · {CATEGORIES[cat].name}</div>
          </div>
        )}
      </div>
    </div>
  );
}
Object.assign(window, { WebAddModal });
