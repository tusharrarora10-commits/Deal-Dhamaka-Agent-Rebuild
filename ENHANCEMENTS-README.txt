DEAL DHAMAKA AGENT V2 — HOME DASHBOARD ENHANCEMENT

What changed
1. Consolidated Home into one executive dashboard. Removed duplicate analytics dashboard from the Home page and removed the old duplicate basic stats / How it works card.
2. Added Shared Amount, Ordered Amount, Pending Order Value and Allotted Value KPIs.
3. New share records save priceSnapshot at the time the share attempt is recorded, so later edits to product price do not change new historical share values.
4. Older share records without priceSnapshot use the current saved product price as a fallback. Their historical amount is therefore an estimate, not a guaranteed original price.
5. Allotted Value = current product price × allotted quantity. Shared/Ordered/Pending amounts follow the selected Home activity period; Allotted Value is all-time.
6. Used the latest app.js supplied with the active/closed deal and send-selection rules.
7. Replaced whatsapp-enhancements.js with the supplied fixed version so multiline WhatsApp templates can be edited on mobile.
8. Detailed brand/type/recipient filters remain in Tracking. Existing localStorage key remains dealDhamakaAgentV2.

Important data safety
- This package does not clear, rename, or migrate localStorage.
- Export a JSON backup from Settings before replacing files in any live app.
- WhatsApp opening is only a share attempt; it does not prove delivery, order, or payment.

Files changed
- index.html
- app.js
- dashboard.js
- whatsapp-enhancements.js
- analytics.js removed from the active package to prevent duplicate dashboard rendering.

Validation
- JavaScript syntax checked with Node.js for app.js, dashboard.js, whatsapp-enhancements.js, followup.js, undo-redo.js and recipients-tab.js.
- This package has not been deployed or live-tested in Vercel from this chat.
