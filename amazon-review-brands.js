/* Best-effort Amazon review-brand card. Amazon may block browser-side profile access. */
(() => {
  const STORAGE_KEY = "dealDhamakaAgentV2";
  const REFRESH_MS = 4 * 60 * 60 * 1000;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));
  const readState = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (_) { return {}; } };
  const writeContact = (id, patch) => {
    // Reuse the app's in-memory state and existing save() path to avoid cache fields
    // being lost the next time the main app saves contacts.
    try {
      if (typeof state !== "undefined" && Array.isArray(state.contacts)) {
        const contact = state.contacts.find(c => String(c.id) === String(id));
        if (!contact) return null;
        Object.assign(contact, patch);
        if (typeof save === "function") save(); else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return contact;
      }
    } catch (_) {}
    const data = readState();
    if (!Array.isArray(data.contacts)) return null;
    const contact = data.contacts.find(c => String(c.id) === String(id));
    if (!contact) return null;
    Object.assign(contact, patch); localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return contact;
  };
  const getContact = id => {
    try { if (typeof state !== "undefined" && Array.isArray(state.contacts)) return state.contacts.find(c => String(c.id) === String(id)); } catch (_) {}
    return (readState().contacts || []).find(c => String(c.id) === String(id));
  };
  const profileUrl = c => String(c?.amazonProfileUrl || c?.amazonProfile || "").trim();
  const dateLabel = value => value ? new Date(value).toLocaleString([], {dateStyle:"medium", timeStyle:"short"}) : "Never";

  function openDialog(id) {
    const c = getContact(id); if (!c) return;
    document.querySelector(".amazon-review-overlay")?.remove();
    const brands = Array.isArray(c.amazonReviewBrands) ? c.amazonReviewBrands : [];
    const overlay = document.createElement("div"); overlay.className = "amazon-review-overlay";
    overlay.innerHTML = `<section class="amazon-review-dialog" role="dialog" aria-modal="true" aria-label="Amazon review brands for ${esc(c.name)}">
      <h3>Amazon Review Brands</h3><p>${esc(c.name || "Contact")} · Brands saved from review information</p>
      <div class="amazon-review-status" id="arbStatus">${esc(statusText(c))}</div>
      <div class="amazon-review-brand-list" id="arbBrands">${brands.length ? brands.map(b=>`<span class="amazon-review-brand-chip">${esc(b.name || b)}</span>`).join("") : `<p>No verified brand names saved yet.</p>`}</div>
      <p>Last successful check: ${esc(dateLabel(c.amazonReviewCheckedAt))}. The app will retry every 4 hours while open. iPhone browsers do not guarantee background refresh while the app is closed.</p>
      <label for="arbBrandInput">Add a verified brand manually</label><input id="arbBrandInput" maxlength="80" placeholder="Enter brand name">
      <div class="amazon-review-buttons"><button class="primary" id="arbAdd">Add brand</button><button id="arbRefresh">Refresh now</button>${profileUrl(c) ? `<a href="${esc(profileUrl(c))}" target="_blank" rel="noopener noreferrer">Open Amazon profile ↗</a>` : ""}<button id="arbClose">Close</button></div>
    </section>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector("#arbClose").onclick = () => overlay.remove();
    overlay.querySelector("#arbAdd").onclick = () => {
      const input = overlay.querySelector("#arbBrandInput"); const name = input.value.trim(); if (!name) return;
      const current = getContact(id); const list = Array.isArray(current.amazonReviewBrands) ? [...current.amazonReviewBrands] : [];
      if (!list.some(b => String(b.name || b).toLowerCase() === name.toLowerCase())) list.push({name, source:"manual", addedAt:new Date().toISOString()});
      writeContact(id, {amazonReviewBrands:list, amazonReviewStatus:"manual", amazonReviewCheckedAt:current.amazonReviewCheckedAt || ""});
      input.value = ""; renderBrands(overlay, list); refreshCardText(id);
    };
    overlay.querySelector("#arbRefresh").onclick = () => refreshProfile(id, overlay);
    refreshProfile(id, overlay, true);
  }
  function statusText(c) {
    if (!profileUrl(c)) return "Add an Amazon profile link to enable refresh attempts.";
    if (c.amazonReviewStatus === "blocked") return "Unable to refresh: Amazon did not allow browser access. No brands were guessed.";
    if (c.amazonReviewStatus === "checked-empty") return "Profile page was reached, but no reliable brand names could be extracted.";
    if (c.amazonReviewStatus === "manual") return "Brand list includes names entered and verified manually.";
    if (c.amazonReviewStatus === "ok") return "Review information checked; only detected names are listed.";
    return "Ready to check. Amazon may restrict access to public review data.";
  }
  function renderBrands(overlay, brands) {
    const el = overlay.querySelector("#arbBrands"); if (!el) return;
    el.innerHTML = brands.length ? brands.map(b=>`<span class="amazon-review-brand-chip">${esc(b.name || b)}</span>`).join("") : "<p>No verified brand names saved yet.</p>";
  }
  function refreshCardText(id) {
    const c = getContact(id); const button = document.querySelector(`[data-amazon-reviews="${CSS.escape(String(id))}"]`); if (!button || !c) return;
    const small = button.querySelector("small"); if (small) small.textContent = Array.isArray(c.amazonReviewBrands) && c.amazonReviewBrands.length ? `${c.amazonReviewBrands.length} saved brand${c.amazonReviewBrands.length === 1 ? "" : "s"}` : c.amazonReviewStatus === "blocked" ? "Unable to refresh — Amazon access blocked" : "View detected review brands";
  }
  async function refreshProfile(id, overlay, quiet=false) {
    let c = getContact(id); if (!c) return;
    const url = profileUrl(c); const status = overlay?.querySelector("#arbStatus");
    if (!url) { writeContact(id, {amazonReviewStatus:"no-link", amazonReviewAttemptedAt:new Date().toISOString()}); if(status) status.textContent = statusText(getContact(id)); return; }
    const now = Date.now();
    if (quiet && c.amazonReviewAttemptedAt && now - new Date(c.amazonReviewAttemptedAt).getTime() < REFRESH_MS) { if(status) status.textContent = statusText(c); return; }
    if (status) status.textContent = "Checking public profile access…";
    writeContact(id, {amazonReviewAttemptedAt:new Date().toISOString()});
    try {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 9000);
      const response = await fetch(url, {mode:"cors", credentials:"omit", signal:controller.signal, headers:{"Accept":"text/html"}}); clearTimeout(timer);
      if (!response.ok) throw new Error("Amazon returned an unavailable response");
      const html = await response.text();
      // Only use clearly labeled review elements if the page exposes them to browser fetch.
      const doc = new DOMParser().parseFromString(html, "text/html");
      const candidates = [...doc.querySelectorAll('[data-hook="review"], [data-hook="review-body"], .review')];
      const found = new Set();
      for (const node of candidates) {
        const text = (node.innerText || node.textContent || "").trim();
        const brand = node.querySelector('[data-hook="cr-product-title"], .a-link-normal[href*="/dp/"], a[href*="/dp/"]');
        const name = (brand?.textContent || "").trim();
        if (name && name.length <= 100) found.add(name);
      }
      const old = Array.isArray(c.amazonReviewBrands) ? c.amazonReviewBrands : [];
      const merged = [...old];
      for (const name of found) if (!merged.some(b => String(b.name || b).toLowerCase() === name.toLowerCase())) merged.push({name, source:"public-page", addedAt:new Date().toISOString()});
      const patch = {amazonReviewBrands:merged, amazonReviewCheckedAt:new Date().toISOString(), amazonReviewStatus:found.size ? "ok" : "checked-empty"};
      writeContact(id, patch); c = getContact(id);
      if (status) status.textContent = statusText(c);
      const list = overlay?.querySelector("#arbBrands"); if (list) renderBrands(overlay, merged);
      const p = overlay?.querySelector(".amazon-review-dialog > p:nth-of-type(2)"); if (p) p.textContent = `Last successful check: ${dateLabel(c.amazonReviewCheckedAt)}. The app will retry every 4 hours while open. iPhone browsers do not guarantee background refresh while the app is closed.`;
    } catch (_) {
      writeContact(id, {amazonReviewStatus:"blocked"}); c = getContact(id);
      if (status) status.textContent = statusText(c);
    }
    refreshCardText(id);
  }
  function bindCards() {
    document.querySelectorAll("[data-amazon-reviews]").forEach(button => { if (button.dataset.arbBound) return; button.dataset.arbBound="1"; button.addEventListener("click", () => openDialog(button.dataset.amazonReviews)); });
  }
  function refreshDueProfiles() {
    const data = readState(); const now = Date.now();
    (data.contacts || []).forEach(c => {
      if (!profileUrl(c)) return;
      const last = c.amazonReviewAttemptedAt ? new Date(c.amazonReviewAttemptedAt).getTime() : 0;
      if (!last || now - last >= REFRESH_MS) refreshProfile(c.id, null, true);
    });
  }
  const observer = new MutationObserver(bindCards);
  observer.observe(document.body, {childList:true, subtree:true});
  document.addEventListener("DOMContentLoaded", () => { bindCards(); refreshDueProfiles(); });
  // Foreground-only periodic check; browsers suspend timers while the app is closed.
  setInterval(() => { if (document.visibilityState === "visible") refreshDueProfiles(); }, 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refreshDueProfiles(); });
  bindCards();
})();
