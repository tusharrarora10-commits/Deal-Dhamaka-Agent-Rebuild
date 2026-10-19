Deal Dhamaka Agent V2 — Recipient-wise Timeline refinement

This update refines the existing recipient timeline in the provided source package.

Changes:
- Timeline table is explicitly organized into four main columns: Date, Product, Shared, Ordered.
- Order status remains editable per recipient-product share record.
- Review status remains editable in the Product column to preserve existing functionality.
- Refund state remains visible as a compact badge in the Product column, so the main table stays focused on the requested four columns.
- Mobile styling retains horizontal table scrolling rather than squeezing columns into unreadable widths.
- Existing localStorage key and saved data structure are unchanged.
- Existing bulk-followups.js and related app modules are included unchanged.

Important:
- No live deployment was performed by this package build.
- Test in a Vercel Preview before production.
