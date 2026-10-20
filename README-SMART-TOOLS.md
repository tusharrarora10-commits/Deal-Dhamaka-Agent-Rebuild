# Smart Tools enhancement (2026-10-20)

This additive update introduces three tools without replacing the main local data model:

1. **Smart Deal Allocation** — category filter and per-product allotted/shared/ordered/available indicators, with warnings when shares meet/exceed allotted quantity.
2. **Profit & Refund Reconciliation** — estimated ordered value and recorded refunds using existing share snapshots/product prices; editable unit cost estimates are saved separately under `dealDhamakaProductCostsV1`.
3. **Global Search** — searches contacts, products and share/history records from the top bar and routes to the relevant existing tab.

The main data remains under `dealDhamakaAgentV2`. Manual WhatsApp sharing and bulk follow-ups are unchanged. The tools are local-only and do not scrape Amazon or send messages automatically.

## Important calculation notes
- Inventory allocation follows the app's existing rule that each share record consumes one allotted unit.
- Revenue estimate sums ordered share `priceSnapshot` values, falling back to the current product price.
- Refunds sum records marked refunded, using `refundAmount` then price snapshot/current product price.
- Estimated margin = ordered value − refunds − entered unit costs for ordered records. It excludes fees, taxes, commissions, shipping and other expenses; it is an estimate only.
- Unit cost estimates are stored separately under `dealDhamakaProductCostsV1` to avoid changing existing contact/product/share records.
