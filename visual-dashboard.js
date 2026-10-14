/* Deal Dhamaka visual-first Home dashboard.
   Reads the existing dealDhamakaAgentV2 data. Does not change the storage schema or records.
   Add this file after recipients-tab.js in index.html. */
(() => {
  "use strict";
  const KEY = "dealDhamakaAgentV2";
  const $ = id => document.getElementById(id);
  let period = "all";
  let ranking = "brand";

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
  const num = value => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const fmt = value => Number.isInteger(Number(value))
    ? String(Number(value) || 0)
    : String(Number((Number(value) || 0).toFixed(2)));

  function readData() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      const products = Array.isArray(raw.products) ? raw.products : [];
      const contacts = Array.isArray(raw.contacts) ? raw.contacts : [];
      const shares = (Array.isArray(raw.shares) ? raw.shares : []).map(s => {
        const product = s.productId == null
          ? products.find(p =>
              String(p.name || p.brand || "").trim() ===
                String(s.productName || s.brand || "").trim() &&
              String(p.productType || "").trim() ===
                String(s.productType || "").trim())
          : products.find(p => String(p.id) === String(s.productId));
        if (s.productId != null && !product) return null;
        return product ? {
          ...s,
          brand: product.brand || product.name || "",
          productType: product.productType || "",
          productName: product.name || product.brand || ""
        } : s;
      }).filter(Boolean);
      return { contacts, products, shares };
    } catch (_) {
      return { contacts: [], products: [], shares: [] };
    }
  }

  function filteredShares(shares) {
    const now = Date.now();
    let start = 0;
    if (period === "today") {
      const d = new Date();
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    } else if (period === "7days") start = now - 7 * 86400000;
    else if (period === "30days") start = now - 30 * 86400000;
    return shares.filter(s => {
      const t = Number(s.time);
      return period === "all" || (Number.isFinite(t) && t >= start && t <= now);
    });
  }

  function installStyles() {
    if ($("visualDashboardStyles")) return;
    const style = document.createElement("style");
    style.id = "visualDashboardStyles";
    style.textContent = `
      /* Hide the older duplicate dashboard panels; data and other tabs remain untouched. */
      #dda-analytics,#advancedDashboard,#inventoryOverview { display:none !important; }
      #dashboard .hero { padding:15px 16px; margin-bottom:10px; border-radius:18px; }
      #dashboard .hero h2 { font-size:22px; margin:0; }
      #dashboard .hero p,#dashboard > button,#dashboard > .card { display:none !important; }
      #visualDashboard { margin:10px 0 18px; }
      #visualDashboard .vd-toolbar { display:flex; justify-content:space-between; align-items:center; gap:10px; margin:16px 0 10px; }
      #visualDashboard .vd-toolbar h3 { margin:0; font-size:18px; }
      #visualDashboard .vd-muted { color:#64748b; font-size:11px; line-height:1.45; }
      #visualDashboard .vd-period { width:auto; max-width:145px; margin:0; padding:9px 10px; font-size:12px; }
      #visualDashboard .vd-kpis { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; margin:12px 0; }
      #visualDashboard .vd-kpi { position:relative; overflow:hidden; min-width:0; background:#fff; border:1px solid #e7eaf0; border-radius:17px; padding:13px; box-shadow:0 4px 14px #17255408; }
      #visualDashboard .vd-kpi:before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:var(--accent,#3478f6); }
      #visualDashboard .vd-kpi .vd-kpi-icon { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:10px; background:var(--tint,#eff6ff); font-size:16px; margin-bottom:9px; }
      #visualDashboard .vd-kpi strong { display:block; font-size:25px; line-height:1.05; margin:0 0 5px; overflow-wrap:anywhere; }
      #visualDashboard .vd-kpi span { display:block; color:#64748b; font-size:11px; font-weight:700; }
      #visualDashboard .vd-grid { display:grid; grid-template-columns:1fr; gap:10px; }
      #visualDashboard .vd-card { min-width:0; background:#fff; border:1px solid #e7eaf0; border-radius:18px; padding:15px; margin:10px 0; box-shadow:0 4px 14px #17255408; }
      #visualDashboard .vd-card h3 { font-size:16px; margin:0 0 5px; }
      #visualDashboard .vd-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:12px; }
      #visualDashboard .vd-donut-row { display:flex; align-items:center; gap:15px; }
      #visualDashboard .vd-donut { width:122px; max-width:42%; flex:0 0 auto; }
      #visualDashboard .vd-legend { flex:1; min-width:0; display:grid; gap:11px; }
      #visualDashboard .vd-legend-row { display:flex; align-items:center; gap:8px; font-size:12px; }
      #visualDashboard .vd-dot { width:9px; height:9px; border-radius:50%; flex:0 0 auto; }
      #visualDashboard .vd-legend-row strong { margin-left:auto; white-space:nowrap; }
      #visualDashboard .vd-chart { display:block; width:100%; height:auto; overflow:visible; }
      #visualDashboard .vd-bars { display:grid; gap:14px; }
      #visualDashboard .vd-bar-row { display:grid; grid-template-columns:minmax(0,1fr) 38px; gap:10px; align-items:center; }
      #visualDashboard .vd-bar-label { display:flex; justify-content:space-between; gap:8px; font-size:12px; font-weight:700; }
      #visualDashboard .vd-track { height:8px; border-radius:20px; background:#edf0f5; overflow:hidden; margin-top:6px; }
      #visualDashboard .vd-fill { height:100%; border-radius:20px; background:#3478f6; }
      #visualDashboard .vd-count { text-align:right; font-size:12px; font-weight:800; }
      #visualDashboard .vd-progress-item { margin:14px 0; }
      #visualDashboard .vd-progress-head { display:flex; justify-content:space-between; gap:8px; font-size:12px; }
      #visualDashboard .vd-progress-head strong { white-space:nowrap; }
      #visualDashboard .vd-quick { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin:12px 0; }
      #visualDashboard .vd-quick button { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; min-height:68px; padding:10px 4px; border:1px solid #e1e7f0; border-radius:14px; background:#fff; color:#172554; font-size:11px; font-weight:800; }
      #visualDashboard .vd-quick .vd-emoji { font-size:20px; }
      #visualDashboard .vd-recent { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid #edf0f5; }
      #visualDashboard .vd-recent:last-child { border-bottom:0; }
      #visualDashboard .vd-avatar { display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:12px; background:#eef2ff; color:#3154a3; font-weight:850; flex:0 0 auto; }
      #visualDashboard .vd-recent-main { flex:1; min-width:0; }
      #visualDashboard .vd-recent-main strong { display:block; font-size:12px; overflow-wrap:anywhere; }
      #visualDashboard .vd-recent-main small { display:block; margin-top:4px; color:#64748b; font-size:11px; line-height:1.35; overflow-wrap:anywhere; }
      #visualDashboard .vd-status { padding:5px 8px; border-radius:20px; background:#e8f7ee; color:#176534; font-size:10px; font-weight:800; white-space:nowrap; }
      #visualDashboard .vd-status.pending { background:#fff4db; color:#9a5b00; }
      #visualDashboard .vd-alert { display:flex; align-items:center; gap:9px; padding:10px 0; border-bottom:1px solid #edf0f5; font-size:12px; }
      #visualDashboard .vd-alert:last-child { border-bottom:0; }
      #visualDashboard .vd-alert-icon { display:flex; align-items:center; justify-content:center; width:30px; height:30px; background:#fff4db; border-radius:10px; }
      #visualDashboard .vd-empty { padding:15px 0; color:#64748b; font-size:12px; }
      @media(min-width:650px) {
        #visualDashboard .vd-kpis { grid-template-columns:repeat(4,minmax(0,1fr)); }
        #visualDashboard .vd-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        #visualDashboard .vd-card.wide { grid-column:1/-1; }
        #visualDashboard .vd-quick { grid-template-columns:repeat(6,minmax(0,1fr)); }
      }
    `;
    document.head.appendChild(style);
  }

  function kpi(icon, label, value, accent, tint) {
    return `<div class="vd-kpi" style="--accent:${accent};--tint:${tint}">
      <div class="vd-kpi-icon">${icon}</div><strong>${esc(value)}</strong><span>${esc(label)}</span>
    </div>`;
  }

  function donut(ordered, pending) {
    const total = ordered + pending;
    const radius = 43;
    const circumference = 2 * Math.PI * radius;
    const ratio = total ? ordered / total : 0;
    const dash = circumference * ratio;
    const pct = total ? Math.round(ratio * 100) : 0;
    return `<svg class="vd-donut" viewBox="0 0 120 120" role="img" aria-label="${pct}% marked ordered">
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#e9edf3" stroke-width="13"/>
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#20b26b" stroke-width="13" stroke-linecap="round" stroke-dasharray="${dash} ${circumference-dash}" transform="rotate(-90 60 60)"/>
      <text x="60" y="56" text-anchor="middle" font-size="23" font-weight="800" fill="#111827">${pct}%</text>
      <text x="60" y="73" text-anchor="middle" font-size="10" fill="#64748b">ordered</text>
    </svg>`;
  }

  function trendChart(shares) {
    const now = new Date();
    const days = period === "today" ? 12 : (period === "7days" ? 7 : 10);
    const buckets = [];
    if (period === "today") {
      for (let i = Math.max(0, now.getHours() - 11); i <= now.getHours(); i++) {
        buckets.push({ key:String(i).padStart(2,"0"), label:String(i).padStart(2,"0")+":00", shared:0, ordered:0 });
      }
      shares.forEach(s => {
        const d = new Date(Number(s.time));
        const b = buckets.find(x => x.key === String(d.getHours()).padStart(2,"0"));
        if (b) { b.shared++; if (s.ordered) b.ordered++; }
      });
    } else if (period === "7days" || period === "30days") {
      const n = period === "7days" ? 7 : 10;
      for (let i=n-1;i>=0;i--) {
        const d = new Date(now); d.setDate(d.getDate()-i);
        buckets.push({key:d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate(),label:d.toLocaleDateString(undefined,{month:"short",day:"numeric"}),shared:0,ordered:0});
      }
      shares.forEach(s => {
        const d = new Date(Number(s.time));
        const b = buckets.find(x => x.key === d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate());
        if (b) { b.shared++; if (s.ordered) b.ordered++; }
      });
    } else {
      for (let i=5;i>=0;i--) {
        const d = new Date(now.getFullYear(),now.getMonth()-i,1);
        buckets.push({key:d.getFullYear()+"-"+d.getMonth(),label:d.toLocaleDateString(undefined,{month:"short"}),shared:0,ordered:0});
      }
      shares.forEach(s => {
        const d = new Date(Number(s.time));
        const b = buckets.find(x => x.key === d.getFullYear()+"-"+d.getMonth());
        if (b) { b.shared++; if (s.ordered) b.ordered++; }
      });
    }
    const w=340,h=155,left=20,right=8,top=10,bottom=26;
    const max=Math.max(1,...buckets.map(x=>Math.max(x.shared,x.ordered)));
    const x=i=>left+(buckets.length<=1?(w-left-right)/2:i*(w-left-right)/(buckets.length-1));
    const y=v=>h-bottom-(v/max)*(h-top-bottom);
    const points=key=>buckets.map((b,i)=>`${i?"L":"M"}${x(i)} ${y(b[key])}`).join(" ");
    const labels=buckets.map((b,i)=>(i===0||i===buckets.length-1||buckets.length<=7)?`<text x="${x(i)}" y="${h-7}" text-anchor="middle" font-size="9" fill="#64748b">${esc(b.label)}</text>`:"").join("");
    return `<svg class="vd-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Share activity trend">
      ${[0,.5,1].map(f=>`<line x1="${left}" y1="${y(max*f)}" x2="${w-right}" y2="${y(max*f)}" stroke="#edf0f5"/>`).join("")}
      <path d="${points("shared")}" fill="none" stroke="#3478f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${points("ordered")}" fill="none" stroke="#20b26b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${buckets.map((b,i)=>`<circle cx="${x(i)}" cy="${y(b.shared)}" r="3" fill="#3478f6"/><circle cx="${x(i)}" cy="${y(b.ordered)}" r="3" fill="#20b26b"/>`).join("")}${labels}
    </svg>`;
  }

  function bars(entries, emptyText) {
    if (!entries.length) return `<div class="vd-empty">${esc(emptyText)}</div>`;
    const top = entries.slice(0,5);
    const max = Math.max(1,...top.map(x=>x.count));
    return `<div class="vd-bars">${top.map(x=>`<div class="vd-bar-row"><div><div class="vd-bar-label"><span>${esc(x.label)}</span><span>${x.count}</span></div><div class="vd-track"><div class="vd-fill" style="width:${Math.max(1,x.count/max*100)}%;background:${x.color||"#3478f6"}"></div></div></div><div class="vd-count">${x.count}</div></div>`).join("")}</div>`;
  }

  function progress(label, value, max, color) {
    const pct = max > 0 ? Math.min(100, value / max * 100) : 0;
    return `<div class="vd-progress-item"><div class="vd-progress-head"><span>${esc(label)}</span><strong>${fmt(value)} / ${fmt(max)}</strong></div><div class="vd-track"><div class="vd-fill" style="width:${pct}%;background:${color}"></div></div></div>`;
  }

  function render() {
    const dashboard = $("dashboard");
    if (!dashboard) return;
    let host = $("visualDashboard");
    if (!host) {
      host = document.createElement("div");
      host.id = "visualDashboard";
      const stats = dashboard.querySelector(".stats");
      if (stats) stats.insertAdjacentElement("afterend", host);
      else dashboard.appendChild(host);
    }
    const data = readData();
    const allShares = data.shares;
    const shares = filteredShares(allShares);
    const ordered = shares.filter(s => !!s.ordered).length;
    const pending = shares.length - ordered;
    const rate = shares.length ? ordered / shares.length * 100 : 0;
    const active = data.products.filter(p => p.dealStatus !== "closed").length;
    const closed = data.products.length - active;
    const allotted = data.products.reduce((sum,p)=>sum+num(p.allottedQty),0);
    const sharedAll = allShares.length;
    const remaining = Math.max(0, allotted - sharedAll);
    const topBrands = new Map();
    const topTypes = new Map();
    shares.forEach(s => {
      const brand = String(s.brand || s.productName || "Unspecified").trim() || "Unspecified";
      const type = String(s.productType || "Unspecified").trim() || "Unspecified";
      topBrands.set(brand,(topBrands.get(brand)||0)+1);
      topTypes.set(type,(topTypes.get(type)||0)+1);
    });
    const ranked = (map,color) => [...map.entries()].map(([label,count])=>({label,count,color})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label));
    const recent = [...shares].sort((a,b)=>Number(b.time||0)-Number(a.time||0)).slice(0,4);
    const exhausted = data.products.filter(p => {
      const used = allShares.filter(s => String(s.productId)===String(p.id)).length;
      return num(p.allottedQty) <= used;
    }).slice(0,4);
    const periodName = ({all:"All time",today:"Today","7days":"Last 7 days","30days":"Last 30 days"})[period];

    const brandEntries = ranked(topBrands,"#3478f6");
    const typeEntries = ranked(topTypes,"#8b5cf6");
    const rankingEntries = ranking === "brand" ? brandEntries : typeEntries;
    const orderedLabel = shares.length ? `${rate.toFixed(1)}% marked ordered` : "No share records yet";

    const hero = dashboard.querySelector(".hero h2");
    if (hero) hero.textContent = "Your deals, at a glance";

    host.innerHTML = `
      <div class="vd-toolbar"><h3>Performance overview</h3>
        <select class="vd-period" id="vdPeriod" aria-label="Activity period">
          <option value="all" ${period==="all"?"selected":""}>All time</option>
          <option value="today" ${period==="today"?"selected":""}>Today</option>
          <option value="7days" ${period==="7days"?"selected":""}>7 days</option>
          <option value="30days" ${period==="30days"?"selected":""}>30 days</option>
        </select>
      </div>
      <div class="vd-kpis">
        ${kpi("👥","Contacts",data.contacts.length,"#3478f6","#eff6ff")}
        ${kpi("🛍️","Products",data.products.length,"#8b5cf6","#f5f3ff")}
        ${kpi("↗","Share attempts",allShares.length,"#0d9488","#ecfdf5")}
        ${kpi("⚡","Active deals",active,"#d97706","#fff7ed")}
      </div>
      <div class="vd-quick">
        <button type="button" data-vd-page="send"><span class="vd-emoji">↗</span>Share deal</button>
        <button type="button" data-vd-page="products"><span class="vd-emoji">＋</span>Add product</button>
        <button type="button" data-vd-page="contacts"><span class="vd-emoji">♙</span>Add contact</button>
      </div>
      <div class="vd-grid">
        <section class="vd-card">
          <div class="vd-card-head"><div><h3>Order status</h3><span class="vd-muted">${esc(orderedLabel)}</span></div></div>
          <div class="vd-donut-row">
            ${donut(ordered,pending)}
            <div class="vd-legend">
              <div class="vd-legend-row"><i class="vd-dot" style="background:#20b26b"></i><span>Ordered</span><strong>${ordered}</strong></div>
              <div class="vd-legend-row"><i class="vd-dot" style="background:#f59e0b"></i><span>Pending</span><strong>${pending}</strong></div>
              <span class="vd-muted">Status applies to ${periodName.toLowerCase()} share records.</span>
            </div>
          </div>
        </section>
        <section class="vd-card">
          <div class="vd-card-head"><div><h3>Deal inventory</h3><span class="vd-muted">${closed} closed · ${active} active</span></div></div>
          ${progress("Shared units",sharedAll,allotted,"#3478f6")}
          ${progress("Remaining units",remaining,allotted,"#20b26b")}
          <div class="vd-muted">All-time allocation across current products.</div>
        </section>
        <section class="vd-card wide">
          <div class="vd-card-head"><div><h3>Sharing activity</h3><span class="vd-muted">Shares vs. ordered · ${periodName}</span></div></div>
          <div class="vd-legend"><span><i class="vd-dot" style="background:#3478f6"></i>Shared</span><span><i class="vd-dot" style="background:#20b26b"></i>Ordered</span></div>
          ${trendChart(shares)}
        </section>
        <section class="vd-card">
          <div class="vd-card-head"><div><h3>Top performance</h3><span class="vd-muted">Ranked by share attempts</span></div>
            <select id="vdRanking" class="vd-period" aria-label="Ranking type"><option value="brand" ${ranking==="brand"?"selected":""}>Brands</option><option value="type" ${ranking==="type"?"selected":""}>Product types</option></select>
          </div>
          ${bars(rankingEntries,"No share activity for this period.")}
        </section>
        <section class="vd-card">
          <div class="vd-card-head"><div><h3>Order conversion</h3><span class="vd-muted">Current selected period</span></div></div>
          <div style="display:flex;align-items:baseline;gap:8px;margin:12px 0"><strong style="font-size:32px">${shares.length?rate.toFixed(1):"0.0"}%</strong><span class="vd-muted">${ordered} of ${shares.length} records</span></div>
          <div class="vd-track" style="height:12px"><div class="vd-fill" style="width:${rate}%;background:#20b26b;height:100%"></div></div>
          <div class="vd-muted" style="margin-top:10px">A record marked ordered is a manual status, not a confirmed purchase.</div>
        </section>
        <section class="vd-card">
          <div class="vd-card-head"><div><h3>Recent activity</h3><span class="vd-muted">Latest four share records</span></div></div>
          ${recent.length ? recent.map(s=>`<div class="vd-recent"><div class="vd-avatar">${esc(String(s.contactName||"?").trim().charAt(0).toUpperCase())}</div><div class="vd-recent-main"><strong>${esc(s.contactName||"Unknown recipient")}</strong><small>${esc(s.brand||s.productName||"Unknown product")} · ${s.time?esc(new Date(Number(s.time)).toLocaleString()):"Date unavailable"}</small></div><span class="vd-status ${s.ordered?"":"pending"}">${s.ordered?"Ordered":"Pending"}</span></div>`).join(""):'<div class="vd-empty">No share records yet.</div>'}
        </section>
        <section class="vd-card">
          <div class="vd-card-head"><div><h3>Stock alerts</h3><span class="vd-muted">Products at or over allocation</span></div></div>
          ${exhausted.length ? exhausted.map(p=>`<div class="vd-alert"><span class="vd-alert-icon">⚠️</span><div><strong>${esc(p.brand||p.name||"Product")}</strong><div class="vd-muted">${esc(p.productType||"Unspecified")} · ${data.products.filter(x=>String(x.id)===String(p.id)).reduce((n,x)=>n+num(x.allottedQty),0)} allotted</div></div></div>`).join(""):'<div class="vd-empty">No stock alerts.</div>'}
        </section>
      </div>
      <p class="vd-muted">Share attempts mean the app opened WhatsApp; they do not confirm message delivery or a purchase.</p>
    `;

    $("vdPeriod").onchange = e => { period=e.target.value; render(); };
    $("vdRanking").onchange = e => { ranking=e.target.value; render(); };
    host.querySelectorAll("[data-vd-page]").forEach(button => button.onclick = () => {
      if (typeof window.showPage === "function") window.showPage(button.dataset.vdPage);
    });
  }

  function install() {
    installStyles();
    render();
    if (typeof window.save === "function" && !window.save.__visualDashboardWrapped) {
      const oldSave = window.save;
      const wrapped = function(...args) { const result=oldSave.apply(this,args); render(); return result; };
      wrapped.__visualDashboardWrapped = true;
      window.save = wrapped;
    }
    window.addEventListener("storage", e => { if (e.key === KEY) render(); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
    document.querySelectorAll('.tabbar button[data-page="dashboard"]').forEach(button => button.addEventListener("click",render));
    document.addEventListener("dda:data-restored",render);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();
