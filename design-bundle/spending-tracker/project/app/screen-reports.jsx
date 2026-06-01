/* Laporan — donut, kontribusi, tren, budget (Bulanan / Tahunan) */
function Donut({ segments, total, size = 178, stroke = 26 }) {
  const { fmtRpShort } = window.STData;
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, cx = size / 2;
  let off = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#F1E9E1" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = <circle key={i} cx={cx} cy={cx} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} strokeLinecap="butt" />;
          off += len;
          return el;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 12, color: window.UI.sub, fontWeight: 600 }}>Total</div>
        <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 22, color: window.UI.ink }}>{fmtRpShort(total)}</div>
      </div>
    </div>
  );
}

function ReportsScreen({ derived, state }) {
  const UI = window.UI;
  const { CATEGORIES, PROFILES, fmtRp, fmtRpShort, MONTHLY_TREND } = window.STData;
  const [period, setPeriod] = React.useState('bulan');
  const { spendByCat, paid, total } = derived;

  const yearly = period === 'tahun';
  const scale = 4.8; // approximate Jan–May aggregate for the yearly view
  const catData = Object.values(CATEGORIES)
    .map((c) => ({ ...c, val: Math.round((spendByCat[c.id] || 0) * (yearly ? scale : 1)) }))
    .filter((c) => c.val > 0).sort((a, b) => b.val - a.val);
  const grand = catData.reduce((a, c) => a + c.val, 0);
  const paidMei = Math.round(paid.mei * (yearly ? scale : 1));
  const paidBas = Math.round(paid.bas * (yearly ? scale : 1));
  const paidMax = Math.max(paidMei, paidBas, 1);

  const trend = MONTHLY_TREND.map((t) => (t.m === 'Mei' ? { ...t, total } : t));
  const trendMax = Math.max(...trend.map((t) => t.total), 1);

  const card = { background: UI.card, borderRadius: 26, boxShadow: '0 10px 30px rgba(196,170,142,0.16)' };
  const segStyle = (active) => ({ flex: 1, padding: '10px', borderRadius: 13, fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15, textAlign: 'center', cursor: 'pointer', background: active ? '#fff' : 'transparent', color: active ? UI.ink : UI.sub, boxShadow: active ? '0 4px 12px rgba(196,170,142,0.18)' : 'none', transition: 'all .18s' });

  return (
    <div style={{ padding: '64px 18px 120px' }}>
      <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 28, color: UI.ink, margin: '0 4px 14px' }}>Laporan</div>

      {/* toggle */}
      <div style={{ display: 'flex', gap: 5, background: UI.faint, borderRadius: 17, padding: 5 }}>
        <div onClick={() => setPeriod('bulan')} style={segStyle(!yearly)}>Mei 2026</div>
        <div onClick={() => setPeriod('tahun')} style={segStyle(yearly)}>Tahun 2026</div>
      </div>

      {/* trend (yearly only) */}
      {yearly && (
        <div style={{ ...card, padding: '20px 18px 14px', marginTop: 14 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: UI.sub, marginBottom: 16 }}>TREN 12 BULAN</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 120 }}>
            {trend.map((t) => {
              const h = t.total ? Math.max((t.total / trendMax) * 100, 4) : 3;
              const cur = t.m === 'Mei';
              return (
                <div key={t.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '70%', height: h + '%', borderRadius: 6, background: cur ? UI.accent : (t.total ? '#F3D9C6' : '#F1E9E1') }} />
                  <span style={{ fontSize: 9.5, color: cur ? UI.accentDk : UI.sub, fontWeight: cur ? 700 : 500 }}>{t.m}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* donut */}
      <div style={{ ...card, padding: '22px 18px', marginTop: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Donut segments={catData.map((c) => ({ color: c.color, value: c.val }))} total={grand} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {catData.slice(0, 6).map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 11, height: 11, borderRadius: 4, background: c.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: UI.ink, fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
              <span style={{ fontSize: 11.5, color: UI.sub, fontWeight: 600 }}>{Math.round((c.val / grand) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* contribution Mei vs Baskara */}
      <div style={{ ...card, padding: '20px 18px', marginTop: 14 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: UI.sub, marginBottom: 16 }}>SIAPA PALING SERING NALANGIN</div>
        {[['mei', paidMei], ['bas', paidBas]].map(([p, v]) => (
          <div key={p} style={{ marginBottom: p === 'mei' ? 16 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <Avatar pid={p} size={26} />
              <span style={{ fontSize: 14, fontWeight: 600, color: UI.ink, flex: 1 }}>{PROFILES[p].name}</span>
              <span style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15, color: UI.ink }}>{fmtRp(v)}</span>
            </div>
            <div style={{ height: 12, borderRadius: 999, background: UI.faint, overflow: 'hidden' }}>
              <div style={{ width: (v / paidMax) * 100 + '%', height: '100%', borderRadius: 999, background: PROFILES[p].color, transition: 'width .5s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* budget per category */}
      <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 19, color: UI.ink, margin: '26px 4px 12px' }}>
        {yearly ? 'Total per kategori' : 'Budget per kategori'}
      </div>
      <div style={{ ...card, padding: '6px 18px' }}>
        {catData.map((c, i) => {
          const budget = yearly ? null : c.budget;
          const pct = budget ? Math.round((c.val / budget) * 100) : null;
          return (
            <div key={c.id} style={{ padding: '13px 0', borderTop: i ? `1px solid ${UI.line}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: budget ? 9 : 0 }}>
                <CatIcon cat={c.id} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: UI.ink }}>{c.name}</div>
                  {budget && pct > 100 && <div style={{ fontSize: 11.5, color: UI.bad, fontWeight: 600, marginTop: 1 }}>Lewat budget {pct - 100}% 😮</div>}
                  {budget && pct >= 80 && pct <= 100 && <div style={{ fontSize: 11.5, color: UI.warn, fontWeight: 600, marginTop: 1 }}>Hampir habis ({pct}%)</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15, color: UI.ink }}>{fmtRpShort(c.val)}</div>
                  {budget && <div style={{ fontSize: 11, color: UI.sub }}>dari {fmtRpShort(budget)}</div>}
                </div>
              </div>
              {budget && <BudgetBar pct={pct} color={c.color} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { ReportsScreen, Donut });
