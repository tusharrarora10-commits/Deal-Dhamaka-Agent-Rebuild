/* Deal Dhamaka Agent — dedicated Recipients tab.
   Add <script src="recipients-tab.js"></script> after the existing app scripts. */
(() => {
  "use strict";
  const KEY = "dealDhamakaAgentV2";
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function data() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      const products = Array.isArray(raw.products) ? raw.products : [];
      const shares = (Array.isArray(raw.shares) ? raw.shares : []).map(s => {
        const p = s.productId == null
          ? products.find(p => String(p.name || p.brand || "").trim() === String(s.productName || s.brand || "").trim() && String(p.productType || "").trim() === String(s.productType || "").trim())
          : products.find(p => String(p.id) === String(s.productId));
        if (s.productId != null && !p) return null;
        return p ? {...s, brand:p.brand || p.name || "", productType:p.productType || "", productName:p.name || p.brand || ""} : s;
      }).filter(Boolean);
      return shares;
    } catch (_) { return []; }
  }

  function setup() {
    if (!$('recipients')) {
      const page = document.createElement('section');
      page.id = 'recipients'; page.className = 'page';
      page.innerHTML = `
        <div class="sectionhead"><div><h2>Recipients</h2><p>Recipient-wise share details and order status</p></div><button class="secondary" id="refreshRecipients" type="button">Refresh</button></div>
        <div class="stats"><div class="stat"><b id="recipientShareTotal">0</b><span>Share Attempts</span></div><div class="stat"><b id="recipientOrderedTotal">0</b><span>Marked Ordered</span></div><div class="stat"><b id="recipientPendingTotal">0</b><span>Not Marked Ordered</span></div></div>
        <div class="card"><h3>Find Recipient Details</h3><input id="recipientSearch" class="search" placeholder="Search recipient, phone, brand or product" autocomplete="off"><select id="recipientOrderFilter"><option value="all">All statuses</option><option value="ordered">Product ordered</option><option value="pending">Not marked ordered</option></select><label>From date<input id="recipientFromDate" type="date"></label><label>To date<input id="recipientToDate" type="date"></label><button id="clearRecipientFilters" class="secondary full" type="button">Clear Filters</button></div>
        <div class="card"><h3>Recipient Details</h3><div id="recipientDetailsList"></div></div>
        <div id="recipientTimelineModal" class="recipient-timeline-backdrop" hidden role="dialog" aria-modal="true" aria-labelledby="recipientTimelineTitle">
          <section class="recipient-timeline-panel"><header class="recipient-timeline-head"><div><p class="recipient-timeline-kicker">DEAL DHAMAKA · RECIPIENT HISTORY</p><h2 id="recipientTimelineTitle">Recipient Timeline</h2></div><button type="button" id="closeRecipientTimeline" class="recipient-timeline-close" aria-label="Close timeline">×</button></header>
          <div id="recipientTimelineSummary" class="recipient-timeline-summary"></div><div id="recipientTimelineIdentity" class="recipient-timeline-identity"></div>
          <input id="recipientTimelineFilter" class="search" placeholder="Filter by product or status" autocomplete="off">
          <div class="recipient-timeline-table-wrap"><table class="recipient-timeline-table"><thead><tr><th>Date</th><th>Product</th><th>Shared</th><th>Ordered</th></tr></thead><tbody id="recipientTimelineRows"></tbody></table></div></section></div>`;
      const settings = $('settings');
      if (settings?.parentNode) settings.parentNode.insertBefore(page, settings);
      else document.querySelector('main').appendChild(page);
    }
    if (!document.querySelector('.tabbar [data-page="recipients"]')) {
      const tab = document.createElement('button'); tab.type = 'button'; tab.dataset.page = 'recipients'; tab.innerHTML = '♧<span>Recipients</span>';
      const settingsTab = document.querySelector('.tabbar [data-page="settings"]');
      if (settingsTab) settingsTab.insertAdjacentElement('beforebegin', tab); else document.querySelector('.tabbar').appendChild(tab);
      tab.addEventListener('click', () => { if (typeof window.showPage === 'function') window.showPage('recipients'); render(); });
    }
    const style = document.createElement('style');
    style.textContent = `
      .tabbar{grid-template-columns:repeat(8,minmax(0,1fr))!important}.tabbar button{min-width:0!important}
      #recipients .recipient-record{background:#fff;border-bottom:1px solid #e5e7eb;padding:16px 0}
      #recipients .recipient-record h3{font-size:17px;margin:0 0 10px;overflow-wrap:anywhere}
      #recipients .recipient-record p{color:#6b7280;font-size:13px;line-height:1.5;margin:5px 0;overflow-wrap:anywhere}
      #recipients .recipient-record .badge{font-size:12px;border-radius:20px;background:#f3f4f6;padding:5px 10px;display:inline-block;margin:2px 4px 2px 0}
      #recipients .ordered-toggle{display:flex;align-items:center;gap:10px;margin-top:12px;padding:14px;min-height:54px;border-radius:12px;background:#eaf7ee;color:#176534;font-weight:750}
      #recipients .ordered-toggle input{width:22px;height:22px;flex-shrink:0;accent-color:#218838;margin:0}
      #recipients .open-recipient-timeline{margin-top:9px;width:100%;border:1px solid #dce4f2;border-radius:12px;padding:11px;background:#f4f7ff;color:#3456c7;font-weight:800}
      .recipient-timeline-backdrop[hidden]{display:none!important}.recipient-timeline-backdrop{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.55);display:flex;align-items:flex-end;justify-content:center;padding:0}
      .recipient-timeline-panel{width:min(900px,100%);max-height:88vh;overflow:auto;background:#f8fafc;border-radius:26px 26px 0 0;padding:22px 18px calc(24px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px #0f172a22;color:#18213b}
      .recipient-timeline-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.recipient-timeline-head h2{margin:4px 0 16px;font-size:25px}.recipient-timeline-kicker{font-size:10px;letter-spacing:3px;font-weight:900;color:#64748b;margin:0}.recipient-timeline-close{border:0;border-radius:50%;width:48px;height:48px;font-size:32px;background:#e8edf5;color:#377df0;flex-shrink:0}
      .recipient-timeline-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:8px 0 18px}.recipient-timeline-stat{background:#fff;border:1px solid #e1e7f0;border-radius:15px;padding:13px 8px;text-align:center}.recipient-timeline-stat b{display:block;font-size:25px}.recipient-timeline-stat span{font-size:12px;color:#77839a}.recipient-timeline-identity{font-weight:800;margin:10px 0 16px;overflow-wrap:anywhere}.recipient-timeline-identity small{display:block;color:#77839a;font-weight:500;margin-top:4px}
      .recipient-timeline-table-wrap{overflow-x:auto;background:#fff;border:1px solid #e1e7f0;border-radius:16px;margin-top:12px}.recipient-timeline-table{width:100%;border-collapse:collapse;min-width:530px}.recipient-timeline-table th{background:#edf2fa;text-align:left;font-size:12px;color:#596781;padding:13px 12px}.recipient-timeline-table td{padding:13px 12px;border-top:1px solid #edf0f5;font-size:13px;vertical-align:top}.recipient-timeline-table td:first-child{white-space:nowrap;color:#66738b}.timeline-status{display:inline-block;padding:5px 9px;border-radius:20px;font-size:11px;font-weight:800;white-space:nowrap}.timeline-status.yes{background:#dcfce7;color:#166534}.timeline-status.no{background:#fff1d6;color:#92400e}.timeline-status.shared{background:#e8edf5;color:#334155}
      @media(max-width:520px){.recipient-timeline-panel{padding:20px 13px calc(24px + env(safe-area-inset-bottom))}.recipient-timeline-head h2{font-size:22px}.recipient-timeline-table{min-width:500px}}
      @media(max-width:520px){.tabbar button span{font-size:8px!important}#recipients .recipient-record h3{font-size:15px}}
    `;
    document.head.appendChild(style);
    $('refreshRecipients').onclick = render;
    $('closeRecipientTimeline').onclick = closeTimeline;
    $('recipientTimelineModal').addEventListener('click', e => { if (e.target.id === 'recipientTimelineModal') closeTimeline(); });
    $('recipientTimelineFilter').oninput = renderTimelineRows;
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTimeline(); });
    $('recipientSearch').oninput = render;
    $('recipientOrderFilter').onchange = render;
    $('recipientFromDate').onchange = render;
    $('recipientToDate').onchange = render;
    $('clearRecipientFilters').onclick = () => { $('recipientSearch').value=''; $('recipientOrderFilter').value='all'; $('recipientFromDate').value=''; $('recipientToDate').value=''; render(); };
    // Existing app navigation runs first; render after the tab becomes active.
    document.querySelectorAll('.tabbar [data-page="recipients"]').forEach(tab => tab.addEventListener('click', () => setTimeout(render, 0)));
    if (typeof window.toggleOrdered === 'function' && !window.toggleOrdered.__recipientRefresh) {
      const original = window.toggleOrdered;
      const wrapped = function(...args) { const result = original.apply(this,args); render(); return result; };
      wrapped.__recipientRefresh = true; window.toggleOrdered = wrapped;
    }
    render();
  }

  function render() {
    const list = $('recipientDetailsList'); if (!list) return;
    const shares = data();
    const ordered = shares.filter(s => !!s.ordered).length;
    $('recipientShareTotal').textContent = shares.length;
    $('recipientOrderedTotal').textContent = ordered;
    $('recipientPendingTotal').textContent = shares.length - ordered;
    const q = ($('recipientSearch').value || '').trim().toLowerCase();
    const status = $('recipientOrderFilter').value;
    const from = $('recipientFromDate').value ? new Date($('recipientFromDate').value+'T00:00:00').getTime() : 0;
    const to = $('recipientToDate').value ? new Date($('recipientToDate').value+'T23:59:59.999').getTime() : Infinity;
    const rows = shares.filter(s => [s.contactName,s.phone,s.productName,s.brand,s.productType,s.status].join(' ').toLowerCase().includes(q) && (status==='all' || (status==='ordered' && !!s.ordered) || (status==='pending' && !s.ordered)) && Number(s.time||0)>=from && Number(s.time||0)<=to).sort((a,b)=>Number(b.time||0)-Number(a.time||0));
    list.innerHTML = rows.length ? rows.map(s => `
      <article class="recipient-record"><h3>${esc(s.contactName || 'Unknown recipient')} ← ${esc(s.brand || s.productName || 'Unknown product')}</h3>
      <p><span class="badge">${esc(s.brand || 'No brand')}</span><span class="badge">${esc(s.productType || 'No type')}</span></p>
      <p>${s.time ? new Date(Number(s.time)).toLocaleString() : ''} · ${esc(s.phone || '')}</p><p>${esc(s.status || 'Share initiated; delivery not confirmed')}</p>
      <label class="ordered-toggle"><input type="checkbox" data-recipient-ordered="${esc(s.id)}" ${s.ordered?'checked':''}>Product Ordered</label><button type="button" class="open-recipient-timeline" data-open-recipient-timeline="${esc(s.contactId || s.contactName || '')}">View complete timeline →</button></article>`).join('') : '<p class="report-empty">No recipient records match these filters.</p>';
    list.querySelectorAll('[data-open-recipient-timeline]').forEach(button => button.onclick = () => openTimeline(button.dataset.openRecipientTimeline));
    list.querySelectorAll('[data-recipient-ordered]').forEach(input => input.onchange = () => {
      if (typeof window.toggleOrdered === 'function') window.toggleOrdered(input.dataset.recipientOrdered,input.checked);
      else { try { const raw=JSON.parse(localStorage.getItem(KEY)||'{}'); const row=(raw.shares||[]).find(s=>String(s.id)===String(input.dataset.recipientOrdered)); if(row){row.ordered=input.checked;row.orderedAt=input.checked?(row.orderedAt||new Date().toISOString()):'';localStorage.setItem(KEY,JSON.stringify(raw));} } catch(_){} }
      render();
    });
  }

  let activeTimelineRecipient = "";
  function closeTimeline() { const modal = $('recipientTimelineModal'); if (modal) modal.hidden = true; }
  function openTimeline(recipientKey) {
    activeTimelineRecipient = String(recipientKey || "");
    const shares = data().filter(s => String(s.contactId || s.contactName || "") === activeTimelineRecipient).sort((a,b) => Number(b.time||0)-Number(a.time||0));
    if (!shares.length) return;
    const first = shares[0];
    const ordered = shares.filter(s => !!s.ordered).length;
    $('recipientTimelineTitle').textContent = `${first.contactName || "Recipient"} · Timeline`;
    $('recipientTimelineSummary').innerHTML = `<div class="recipient-timeline-stat"><b>${shares.length}</b><span>Products shared</span></div><div class="recipient-timeline-stat"><b>${ordered}</b><span>Ordered</span></div><div class="recipient-timeline-stat"><b>${shares.length-ordered}</b><span>Pending</span></div>`;
    $('recipientTimelineIdentity').innerHTML = `${esc(first.contactName || "Unknown recipient")}<small>${esc(first.phone || "Phone not available")}</small>`;
    $('recipientTimelineFilter').value = "";
    $('recipientTimelineModal').hidden = false;
    renderTimelineRows();
  }
  function renderTimelineRows() {
    const body = $('recipientTimelineRows'); if (!body || !activeTimelineRecipient) return;
    const q = ($('recipientTimelineFilter').value || "").trim().toLowerCase();
    const rows = data().filter(s => String(s.contactId || s.contactName || "") === activeTimelineRecipient)
      .filter(s => [s.productName,s.brand,s.productType,s.status,s.ordered ? "ordered" : "pending"].join(" ").toLowerCase().includes(q))
      .sort((a,b) => Number(b.time||0)-Number(a.time||0));
    body.innerHTML = rows.length ? rows.map(s => {
      const date = Number(s.time||0) ? new Date(Number(s.time)).toLocaleString([], {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "Date unavailable";
      return `<tr><td>${esc(date)}</td><td><strong>${esc(s.productName || s.brand || "Unknown product")}</strong><br><small>${esc(s.brand || "")}</small></td><td><span class="timeline-status shared">Shared</span></td><td><span class="timeline-status ${s.ordered?'yes':'no'}">${s.ordered?'Ordered':'Pending'}</span>${s.ordered && s.orderedAt ? `<br><small>${esc(formatOrderedDate(s.orderedAt))}</small>` : ""}</td></tr>`;
    }).join("") : '<tr><td colspan="4">No timeline entries match this filter.</td></tr>';
  }
  function formatOrderedDate(value) { const d = typeof value === "number" ? new Date(value) : new Date(value); return Number.isNaN(d.getTime()) ? "" : `Updated ${d.toLocaleDateString()}`; }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, {once:true}); else setup();
})();
