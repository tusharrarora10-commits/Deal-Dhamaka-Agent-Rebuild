/* Amazon Review Brands card — best-effort, user-verified data.
   Amazon profile pages often block cross-origin automated review extraction. This
   feature never invents brands; users can save verified brand names manually. */
(function () {
  "use strict";
  const REFRESH_MS = 4 * 60 * 60 * 1000;
  const STORE_KEY = "dealDhamakaAgentV2";
  const norm = v => String(v || "").trim();
  const escapeHtml = v => norm(v).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  const getState = () => window.state || (typeof state !== "undefined" ? state : null);
  function contactById(id) {
    const s = getState();
    return s && Array.isArray(s.contacts) ? s.contacts.find(c => String(c.id) === String(id)) : null;
  }
  function persist() {
    try { if (typeof save === "function") save(); } catch (_) {}
  }
  function brandsFor(c) {
    if (!Array.isArray(c.amazonReviewBrands)) c.amazonReviewBrands = [];
    return c.amazonReviewBrands;
  }
  function card(c) {
    const brands = brandsFor(c);
    const last = c.amazonReviewCheckedAt ? new Date(c.amazonReviewCheckedAt).toLocaleString() : "Not checked yet";
    const status = c.amazonReviewStatus || "Not checked yet";
    return `<button type="button" class="mini amazon-review-card" data-amazon-reviews="${escapeHtml(c.id)}">
      <span class="amazon-review-card-icon">★</span>
      <span class="amazon-review-card-copy"><strong>Amazon Reviews</strong><small>${brands.length} ${brands.length === 1 ? "brand" : "brands"} · ${escapeHtml(status)}</small><small>Last checked: ${escapeHtml(last)}</small></span>
      <span class="amazon-review-chevron">›</span>
    </button>`;
  }
  function decorateContacts() {
    const list = document.getElementById("contactsList");
    const s = getState();
    if (!list || !s || !Array.isArray(s.contacts)) return;
    list.querySelectorAll(".contact-list-item").forEach(item => {
      const edit = item.querySelector("[data-edit]");
      const c = edit && contactById(edit.dataset.edit);
      if (!c) return;
      const old = item.querySelector(".amazon-review-card");
      if (old) old.remove();
      const holder = document.createElement("div");
      holder.innerHTML = card(c);
      const main = item.querySelector(".contact-main") || item;
      const actions = main.querySelector(".contact-actions");
      main.insertBefore(holder.firstElementChild, actions || null);
    });
    list.querySelectorAll("[data-amazon-reviews]").forEach(btn => {
      btn.addEventListener("click", () => openReviewDetails(btn.dataset.amazonReviews));
    });
  }
  function openReviewDetails(id) {
    const c = contactById(id);
    if (!c) return;
    const brands = brandsFor(c);
    const profile = norm(c.amazonProfileUrl || c.amazonProfile);
    const body = document.createElement("div");
    body.className = "amazon-review-modal-content";
    body.innerHTML = `
      <p class="hint">Brands below are user-verified. Amazon may block automatic review extraction, so this card will not invent brand names.</p>
      <div class="amazon-review-brand-list">${brands.length ? brands.map(b => `<div class="amazon-review-brand">${escapeHtml(b)}</div>`).join("") : '<p class="empty">No verified brands saved yet.</p>'}</div>
      <label for="amazonReviewBrandsInput">Add or update brand names</label>
      <textarea id="amazonReviewBrandsInput" rows="4" placeholder="Enter one brand per line">${escapeHtml(brands.join("\n"))}</textarea>
      <p class="hint">Enter one brand per line. Save only brands you have confirmed from the profile’s reviews.</p>
      <div class="amazon-review-modal-actions">
        ${profile ? `<a class="mini amazon-profile-link" href="${escapeHtml(profile)}" target="_blank" rel="noopener noreferrer">Open Amazon Profile ↗</a>` : ""}
        <button class="mini" type="button" id="amazonReviewRefresh">Check for updates</button>
      </div>
      <p class="hint" id="amazonReviewStatus">${escapeHtml(c.amazonReviewStatus || "Not checked yet")}</p>
      <button class="primary full" type="button" id="amazonReviewSave">Save verified brands</button>`;
    const modal = document.getElementById("modal");
    if (!modal) return;
    document.getElementById("modalTitle").textContent = `Amazon Reviews — ${c.name || "Contact"}`;
    const form = document.getElementById("modalForm");
    form.innerHTML = "";
    form.appendChild(body);
    modal.hidden = false;
    document.getElementById("closeModal").onclick = () => { modal.hidden = true; };
    body.querySelector("#amazonReviewSave").onclick = () => {
      const values = body.querySelector("#amazonReviewBrandsInput").value.split(/\r?\n/).map(norm).filter(Boolean);
      c.amazonReviewBrands = [...new Set(values)];
      c.amazonReviewCheckedAt = new Date().toISOString();
      c.amazonReviewStatus = "Brands saved";
      persist();
      modal.hidden = true;
      if (typeof renderContacts === "function") renderContacts();
      decorateContacts();
    };
    body.querySelector("#amazonReviewRefresh").onclick = () => {
      c.amazonReviewCheckedAt = new Date().toISOString();
      c.amazonReviewStatus = "Unable to refresh automatically";
      persist();
      body.querySelector("#amazonReviewStatus").textContent = c.amazonReviewStatus + " — Amazon may block automated access. Open the profile to verify new reviews, then save brand names.";
      if (profile) window.open(profile, "_blank", "noopener,noreferrer");
      if (typeof renderContacts === "function") renderContacts();
      decorateContacts();
    };
  }
  function refreshDueStatuses() {
    const s = getState();
    if (!s || !Array.isArray(s.contacts)) return;
    const now = Date.now();
    let changed = false;
    s.contacts.forEach(c => {
      if (!c.amazonReviewCheckedAt || now - new Date(c.amazonReviewCheckedAt).getTime() >= REFRESH_MS) {
        c.amazonReviewStatus = "Refresh due — open profile to verify";
        changed = true;
      }
    });
    if (changed) persist();
    decorateContacts();
  }
  function init() {
    if (typeof renderContacts !== "function") { setTimeout(init, 250); return; }
    const original = renderContacts;
    if (!original.__amazonReviewWrapped) {
      const wrapped = function () { original.apply(this, arguments); decorateContacts(); };
      wrapped.__amazonReviewWrapped = true;
      window.renderContacts = wrapped;
      try { renderContacts = wrapped; } catch (_) {}
    }
    decorateContacts();
    refreshDueStatuses();
    setInterval(refreshDueStatuses, 60 * 1000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshDueStatuses(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();