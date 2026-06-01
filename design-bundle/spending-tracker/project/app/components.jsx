/* Spending Tracker — shared UI primitives (icons, avatar, mascot, chips) */
const { PROFILES, CATEGORIES, fmtRp, fmtRpShort } = window.STData;

// Global UI palette (warm cream + coral accent)
const UI = {
  bg: '#FBF5EF', card: '#FFFFFF', ink: '#3F3530', sub: '#A99E94',
  faint: '#EFE7DE', line: '#F1E9E1', accent: '#FF8A5B', accentDk: '#F0703F',
  accentSoft: '#FFE7DB', good: '#5FC6B0', warn: '#F4A93C', bad: '#EF6F6F',
};
window.UI = UI;

// ── Category glyphs (white, on a colored rounded tile) ──
const CAT_GLYPHS = {
  makan: (
    <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11h16a8 8 0 0 1-16 0Z" fill="#fff" stroke="none" />
      <path d="M4 11h16" />
      <path d="M12 4v3M9.5 4.5l.6 2.5M14.5 4.5l-.6 2.5" />
      <path d="M5 20h14" />
    </g>
  ),
  sewa: (
    <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9h12v-9" />
      <rect x="10" y="13.5" width="4" height="5.5" rx="0.5" fill="#fff" stroke="none" />
    </g>
  ),
  tagihan: (
    <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3.5h12v17l-2.2-1.4-2.3 1.4-2.2-1.4-2.3 1.4L6 20.5Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </g>
  ),
  belanja: (
    <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </g>
  ),
  hiburan: (
    <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="12" rx="2.5" />
      <path d="M10.5 9.7v4.6l4-2.3Z" fill="#fff" stroke="none" />
    </g>
  ),
  transport: (
    <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="16" r="2.6" />
      <circle cx="18" cy="16" r="2.6" />
      <path d="M8.5 16h6l2-5h2M11 11l1.5-4h2.2" />
    </g>
  ),
  lainnya: (
    <g fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4Z" fill="#fff" stroke="none" />
      <path d="M18 16l.7 1.8L20.5 18.5l-1.8.7L18 21l-.7-1.8L15.5 18.5l1.8-.7Z" fill="#fff" stroke="none" />
    </g>
  ),
};

function CatIcon({ cat, size = 44, radius }) {
  const c = CATEGORIES[cat] || CATEGORIES.lainnya;
  return (
    <div style={{
      width: size, height: size, borderRadius: radius != null ? radius : size * 0.34,
      background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: `0 4px 10px ${c.color}55`,
    }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">{CAT_GLYPHS[c.icon]}</svg>
    </div>
  );
}

// ── Person avatar ──
function Avatar({ pid, size = 40, ring = false }) {
  const p = PROFILES[pid];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: p.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontFamily: 'Fredoka, sans-serif', fontWeight: 600, color: '#fff',
      fontSize: size * 0.42, letterSpacing: 0.3,
      boxShadow: ring ? `0 0 0 3px #fff, 0 0 0 5px ${p.color}` : `0 3px 8px ${p.color}77`,
      border: '2px solid rgba(255,255,255,0.85)', boxSizing: 'border-box',
    }}>{p.initial}</div>
  );
}

function PayerBadge({ pid, label }) {
  const p = PROFILES[pid];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: p.soft, color: '#6b5e57', borderRadius: 999,
      padding: '4px 10px 4px 4px', fontSize: 12.5, fontWeight: 600,
    }}>
      <Avatar pid={pid} size={20} />
      {label || (p.name + ' bayar')}
    </span>
  );
}

// ── Mascot: "Pochi" the celengan (piggy bank) ──
function Mascot({ size = 120, mood = 'happy' }) {
  const pink = '#F7B5CB', pinkDk = '#EC9CB8', blush = '#F58BB0';
  const eye = mood === 'sleepy'
    ? <g><path d="M40 60q6 4 12 0M68 60q6 4 12 0" stroke="#5b4a52" strokeWidth="3" fill="none" strokeLinecap="round"/></g>
    : <g><circle cx="46" cy="59" r="4.2" fill="#5b4a52"/><circle cx="74" cy="59" r="4.2" fill="#5b4a52"/><circle cx="47.4" cy="57.6" r="1.4" fill="#fff"/><circle cx="75.4" cy="57.6" r="1.4" fill="#fff"/></g>;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ overflow: 'visible' }}>
      {/* sparkles */}
      {mood === 'proud' && (
        <g fill="#F4C04E">
          <path d="M16 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
          <path d="M104 24l1.5 3.5L109 29l-3.5 1.5L104 34l-1.5-3.5L99 29l3.5-1.5Z" />
        </g>
      )}
      {/* ears */}
      <path d="M34 34c-4-9-1-15 4-14 4 1 6 7 5 13Z" fill={pinkDk} />
      <path d="M86 34c4-9 1-15-4-14-4 1-6 7-5 13Z" fill={pinkDk} />
      {/* body */}
      <ellipse cx="60" cy="64" rx="42" ry="38" fill={pink} />
      <ellipse cx="60" cy="64" rx="42" ry="38" fill="none" stroke={pinkDk} strokeWidth="2" opacity="0.5" />
      {/* coin slot */}
      <rect x="49" y="31" width="22" height="5" rx="2.5" fill={pinkDk} />
      {/* legs */}
      <rect x="34" y="96" width="12" height="10" rx="5" fill={pinkDk} />
      <rect x="74" y="96" width="12" height="10" rx="5" fill={pinkDk} />
      {/* snout */}
      <ellipse cx="60" cy="72" rx="16" ry="12" fill="#FBC9D8" stroke={pinkDk} strokeWidth="1.5" />
      <circle cx="54" cy="72" r="2.6" fill="#D98AA3" />
      <circle cx="66" cy="72" r="2.6" fill="#D98AA3" />
      {/* blush */}
      <ellipse cx="38" cy="68" rx="6" ry="4" fill={blush} opacity="0.55" />
      <ellipse cx="82" cy="68" rx="6" ry="4" fill={blush} opacity="0.55" />
      {/* eyes + smile */}
      {eye}
      <path d="M52 82q8 6 16 0" stroke="#5b4a52" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* tail */}
      <path d="M101 66c7-1 9 5 5 8s-9-1-6-4" fill="none" stroke={pinkDk} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ── Progress bar (budget) ──
function BudgetBar({ pct, color }) {
  const over = pct > 100;
  const warn = pct >= 80 && pct <= 100;
  const fill = over ? '#EF6F6F' : warn ? '#F4A93C' : color;
  return (
    <div style={{ height: 8, borderRadius: 999, background: '#EFEAE6', overflow: 'hidden' }}>
      <div style={{ width: Math.min(pct, 100) + '%', height: '100%', borderRadius: 999, background: fill, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}

// ── Shared utilities ──
function dateLabelShared(d) {
  if (d === '2026-05-31') return 'Hari ini';
  if (d === '2026-05-30') return 'Kemarin';
  const [y, m, day] = d.split('-').map(Number);
  const mon = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m - 1];
  return day + ' ' + mon;
}
if (!window.dateLabel) window.dateLabel = dateLabelShared;

// ── Donut chart (SVG segments) ──
function DonutChart({ segments, total, size = 178, stroke = 26 }) {
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
        <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: size > 200 ? 26 : 22, color: window.UI.ink }}>{fmtRpShort(total)}</div>
      </div>
    </div>
  );
}

// ── Cute inline calendar (Monday-start, future dates disabled) ──
const ST_MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const ST_TODAY = { y: 2026, m: 4, d: 31 }; // app "today" = 31 Mei 2026

function pad2(n) { return (n < 10 ? '0' : '') + n; }
function isoOf(y, m, d) { return y + '-' + pad2(m + 1) + '-' + pad2(d); }

function CuteCalendar({ value, onChange }) {
  const UI = window.UI;
  const [sy, sm, sd] = value.split('-').map(Number);
  const [view, setView] = React.useState({ y: sy, m: sm - 1 });
  const maxIso = isoOf(ST_TODAY.y, ST_TODAY.m, ST_TODAY.d);

  const firstDow = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Mon=0
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const atMin = view.y < 2025 || (view.y === 2025 && view.m === 0);
  const atMax = view.y > ST_TODAY.y || (view.y === ST_TODAY.y && view.m >= ST_TODAY.m);
  const step = (dir) => setView((v) => {
    let m = v.m + dir, y = v.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    return { y, m };
  });

  const navBtn = (dir, disabled) => (
    <div onClick={() => !disabled && step(dir)} style={{ width: 32, height: 32, borderRadius: 10, background: disabled ? 'transparent' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', boxShadow: disabled ? 'none' : '0 2px 6px rgba(196,170,142,0.16)', opacity: disabled ? 0.3 : 1 }}>
      <svg width="8" height="14" viewBox="0 0 8 14" style={{ transform: dir < 0 ? 'scaleX(-1)' : 'none' }}><path d="M1 1l6 6-6 6" stroke={UI.ink} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  );

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: '14px 14px 8px', boxShadow: '0 6px 18px rgba(196,170,142,0.16)', marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        {navBtn(-1, atMin)}
        <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 15.5, color: UI.ink }}>{ST_MONTHS[view.m]} {view.y}</div>
        {navBtn(1, atMax)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((w) => (
          <div key={w} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: UI.sub, padding: '2px 0' }}>{w}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = isoOf(view.y, view.m, d);
          const selected = iso === value;
          const isToday = iso === maxIso;
          const future = iso > maxIso;
          return (
            <div key={i} onClick={() => !future && onChange(iso)} style={{
              aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13.5, fontWeight: selected ? 700 : 500, borderRadius: 10,
              cursor: future ? 'default' : 'pointer',
              color: future ? '#D8CFC6' : selected ? '#fff' : UI.ink,
              background: selected ? UI.accent : 'transparent',
              boxShadow: selected ? '0 4px 10px rgba(255,138,91,0.4)' : 'none',
              border: isToday && !selected ? `1.5px solid ${UI.accent}` : '1.5px solid transparent',
            }}>{d}</div>
          );
        })}
      </div>
    </div>
  );
}

// Label for a date chip (relative to app "today")
function dateChipLabel(iso) {
  if (iso === '2026-05-31') return 'Hari ini';
  if (iso === '2026-05-30') return 'Kemarin';
  const [y, m, d] = iso.split('-').map(Number);
  return d + ' ' + ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m - 1];
}

Object.assign(window, { CatIcon, Avatar, PayerBadge, Mascot, BudgetBar, DonutChart, CuteCalendar, dateChipLabel, isoOf });
