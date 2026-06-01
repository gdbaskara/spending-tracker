/* Spending Tracker — seed data + split/balance engine (plain JS, window globals) */
(function () {
  // ── People (identity colors locked from brief) ──
  const PROFILES = {
    mei: { id: 'mei', name: 'Mei',     color: '#F7B5CB', soft: '#FDECF2', initial: 'M' },
    bas: { id: 'bas', name: 'Baskara', color: '#A8D8C8', soft: '#E7F4EF', initial: 'B' },
  };

  // ── Categories (icon key + pastel color + monthly budget in rupiah) ──
  const CATEGORIES = {
    makan:     { id: 'makan',     name: 'Makan',     icon: 'makan',     color: '#FF9E64', budget: 1200000 },
    sewa:      { id: 'sewa',      name: 'Sewa Rumah',icon: 'sewa',      color: '#7FA9D6', budget: 3000000 },
    tagihan:   { id: 'tagihan',   name: 'Tagihan',   icon: 'tagihan',   color: '#F4C04E', budget: 1200000 },
    belanja:   { id: 'belanja',   name: 'Belanja',   icon: 'belanja',   color: '#5FC6B0', budget: 1500000 },
    hiburan:   { id: 'hiburan',   name: 'Hiburan',   icon: 'hiburan',   color: '#F58BB0', budget: 400000 },
    transport: { id: 'transport', name: 'Transport', icon: 'transport', color: '#B59CE6', budget: 500000 },
    lainnya:   { id: 'lainnya',   name: 'Lainnya',   icon: 'lainnya',   color: '#9AA7B5', budget: null },
  };

  // ── Split engine ──
  // equal  → split in 2, odd-rupiah remainder goes to the payer
  // full   → one person bears the whole thing (personal); `owner` defaults to payer
  // custom → explicit { mei, bas } shares (must sum to amount)
  function computeShares(amount, type, payerId, opts = {}) {
    if (type === 'full') {
      const owner = opts.owner || payerId;
      return { mei: owner === 'mei' ? amount : 0, bas: owner === 'bas' ? amount : 0 };
    }
    if (type === 'custom' && opts.shares) return { ...opts.shares };
    const half = Math.floor(amount / 2);
    const rem = amount - half * 2;
    return {
      mei: half + (payerId === 'mei' ? rem : 0),
      bas: half + (payerId === 'bas' ? rem : 0),
    };
  }

  // Build an expense record with computed shares
  let _id = 0;
  function exp(spent_at, category_id, payer_id, amount, description, split_type, opts) {
    return {
      id: 'e' + (++_id),
      spent_at, category_id, payer_id, amount, description,
      split_type, recurring: !!(opts && opts.recurring),
      owner: opts && opts.owner,
      shares: computeShares(amount, split_type, payer_id, opts || {}),
    };
  }

  // ── This-month expenses (May 2026) ──
  const EXPENSES = [
    exp('2026-05-30','makan','mei',84000,'Makan malam Padang','equal'),
    exp('2026-05-29','makan','mei',36000,'Kopi Kenangan x2','equal'),
    exp('2026-05-27','makan','bas',58000,'GoFood ayam geprek','equal'),
    exp('2026-05-24','makan','mei',175000,'Brunch akhir pekan','equal'),
    exp('2026-05-18','makan','bas',268000,'Sushi date 🍣','equal'),
    exp('2026-05-15','makan','mei',40000,'Nasi goreng pinggir jalan','equal'),
    exp('2026-05-12','makan','bas',52000,'Bakso malam','equal'),
    exp('2026-05-08','makan','mei',187000,'Belanja bahan masak','equal'),
    exp('2026-05-05','makan','bas',65000,'Martabak manis','equal'),
    exp('2026-05-03','makan','mei',195000,'Catering meeting','equal'),

    exp('2026-05-01','sewa','bas',3000000,'Sewa rumah Mei','equal',{recurring:true}),

    exp('2026-05-25','tagihan','bas',385000,'Listrik PLN','equal',{recurring:true}),
    exp('2026-05-20','tagihan','mei',350000,'Internet IndiHome','equal',{recurring:true}),
    exp('2026-05-15','tagihan','bas',150000,'Air PDAM','equal',{recurring:true}),
    exp('2026-05-12','tagihan','mei',100000,'Pulsa & paket data','equal'),
    exp('2026-05-08','tagihan','bas',100000,'Spotify + Netflix','equal',{recurring:true}),

    exp('2026-05-28','belanja','bas',432500,'Belanja bulanan Superindo','equal'),
    exp('2026-05-18','belanja','mei',220000,'Skincare Mei','full',{owner:'mei'}),
    exp('2026-05-10','belanja','bas',118000,'Sabun & deterjen','equal'),
    exp('2026-05-06','belanja','mei',99000,'Galon & gas','equal'),

    exp('2026-05-22','hiburan','bas',100000,'Tiket bioskop XXI','equal'),
    exp('2026-05-16','hiburan','mei',250000,'Tiket konser','equal'),
    exp('2026-05-04','hiburan','bas',100000,'Game & App Store','full',{owner:'bas'}),

    exp('2026-05-24','transport','mei',50000,'Bensin motor','equal'),
    exp('2026-05-20','transport','bas',28000,'Gojek ke kantor','equal'),
    exp('2026-05-17','transport','mei',32000,'Gojek pulang','equal'),
    exp('2026-05-09','transport','bas',25000,'Parkir & tol','equal'),
    exp('2026-05-02','transport','mei',45000,'Bensin motor','equal'),

    exp('2026-05-09','lainnya','bas',150000,'Kado ultah teman','equal'),
  ];

  // ── Settlements (history) ──
  const SETTLEMENTS = [
    { id:'s1', from_id:'mei', to_id:'bas', amount:1500000, note:'Lunasin sewa', settled_at:'2026-05-02' },
  ];

  // ── Recurring templates (for Pengaturan) ──
  const RECURRING = [
    { id:'r1', description:'Sewa rumah Mei',   category_id:'sewa',    payer_id:'bas', amount:3000000, day:1,  active:true },
    { id:'r2', description:'Listrik PLN',       category_id:'tagihan', payer_id:'bas', amount:385000,  day:25, active:true },
    { id:'r3', description:'Internet IndiHome', category_id:'tagihan', payer_id:'mei', amount:350000,  day:20, active:true },
    { id:'r4', description:'Air PDAM',          category_id:'tagihan', payer_id:'bas', amount:150000,  day:15, active:true },
    { id:'r5', description:'Spotify + Netflix', category_id:'tagihan', payer_id:'bas', amount:100000,  day:8,  active:false },
  ];

  // ── Monthly trend for the yearly report (2026, rupiah) ──
  const MONTHLY_TREND = [
    { m:'Jan', total:6320000 }, { m:'Feb', total:6180000 }, { m:'Mar', total:6910000 },
    { m:'Apr', total:6540000 }, { m:'Mei', total:0 /* filled at runtime */ },
    { m:'Jun', total:0 }, { m:'Jul', total:0 }, { m:'Agu', total:0 },
    { m:'Sep', total:0 }, { m:'Okt', total:0 }, { m:'Nov', total:0 }, { m:'Des', total:0 },
  ];

  // ── Helpers ──
  function fmtRp(n) {
    const neg = n < 0; n = Math.abs(Math.round(n));
    return (neg ? '-' : '') + 'Rp' + n.toLocaleString('id-ID');
  }
  function fmtRpShort(n) {
    n = Math.round(n);
    if (n >= 1000000) return 'Rp' + (n / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
    if (n >= 1000) return 'Rp' + Math.round(n / 1000) + 'rb';
    return 'Rp' + n;
  }

  // net(Mei) > 0  ⇒  Baskara owes Mei
  function netMei(expenses, settlements) {
    let net = 0;
    for (const e of expenses) {
      if (e.payer_id === 'mei') net += e.amount;
      net -= e.shares.mei;
    }
    for (const s of settlements) {
      if (s.from_id === 'mei') net += s.amount; // Mei paid Baskara → settles her debt
      if (s.to_id === 'mei') net -= s.amount;   // Baskara paid Mei → reduces what's owed to Mei
    }
    return net;
  }

  function totalThisMonth(expenses) {
    return expenses.reduce((a, e) => a + e.amount, 0);
  }

  // spend per category {catId: amount}
  function spendByCategory(expenses) {
    const out = {};
    for (const e of expenses) out[e.category_id] = (out[e.category_id] || 0) + e.amount;
    return out;
  }

  // amount each person actually paid (fronted)
  function paidByPerson(expenses) {
    const out = { mei: 0, bas: 0 };
    for (const e of expenses) out[e.payer_id] += e.amount;
    return out;
  }

  window.STData = {
    PROFILES, CATEGORIES, EXPENSES, SETTLEMENTS, RECURRING, MONTHLY_TREND,
    computeShares, fmtRp, fmtRpShort, netMei, totalThisMonth, spendByCategory, paidByPerson,
  };
})();
