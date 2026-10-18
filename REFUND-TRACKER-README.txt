Refund Tracker Enhancement
=========================

Added refunds.js and loaded it from index.html. The feature uses the existing localStorage key: dealDhamakaAgentV2.

Features:
- Refunds tab with contacts sorted alphabetically.
- Search by contact, phone, or product; filter by product and refund status.
- Select a contact to see product shares in a table with Shared date, Ordered status, and Amount refunded checkbox.
- Mark all share records for a selected product as refunded.
- Refund summary cards on the existing Home dashboard.
- Existing contacts, products, shares and Bulk Follow-ups are preserved; only refunded/refundedAt fields are added to share records when toggled.

Refund value calculation:
- Uses priceSnapshot or share price when available, otherwise current product price.
- Older records without snapshots can reflect the current product price. Checkbox means the user manually confirmed a refund; the app does not verify bank/payment settlement.

Test on a Vercel Preview first. Keep a JSON backup. Do not clear Safari website data. No deployment is performed by this package.
