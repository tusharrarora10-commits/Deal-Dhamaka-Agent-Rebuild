# Deal Dhamaka Agent — Enhanced V2 (Corrected Package)

A mobile-friendly installable web app for managing contacts/products, opening personalized WhatsApp messages, and tracking share attempts.

## Included enhancements
- Dashboard KPIs for active/closed deals, allotment, shares, orders, pending counts, and order conversion.
- Share/order trend, brand and product-type rankings, status tables, recent activity, stock alerts, quick actions, and dashboard CSV export.
- Product search plus Active Deals / Closed Deals / All Deals filters and close/reopen controls.
- Searchable History for recipient, phone, product, brand, product type, and status.
- Searchable multi-select Tracking filters for Brand, Product Type, and Recipient, plus order-status/date filters, counts, order toggles, and CSV export.
- JSON backup import/export and CSV import for contacts/products.
- Local browser storage only; no cloud sync.

## Data safety
- The app retains the existing localStorage key `dealDhamakaAgentV2` for compatibility with the V2 app.
- Importing a JSON backup merges contacts, products, and shares by ID; it does not intentionally clear existing records.
- Export a fresh JSON backup before deploying or importing. Do not use **Delete All Local Data** as part of an update.
- Browser/site-data clearing and private browsing can erase local records. Keep a copy of your JSON backup in Files/iCloud Drive.
- The service worker uses a new cache name and does not delete other caches on the same origin.

## Deploy safely
1. Keep a fresh JSON export in a safe location.
2. Deploy this package to a separate Vercel Preview project/deployment first if you need the current production URL to remain untouched.
3. Test the preview with a copy of your JSON backup. Check dashboard, product status, History search, Tracking filters, and JSON export/import.
4. Only update the existing production deployment when you deliberately choose to replace its live code. Deploying to the existing V2 project can change the live website even though it does not directly delete localStorage.

## Run locally
Serve this folder over HTTP or deploy it to a static host. Opening `index.html` directly may limit service-worker/PWA features.

## CSV headers
Contacts: `name,phone,category` (phone should include country code).
Products: `name,brand,productType,description,price,platform,link,allottedQty,quantityUnit,dealStatus`.

## Tracking meaning
A record is saved when the app opens the corresponding WhatsApp link. This records a share attempt / WhatsApp opened, not confirmed sent, delivered, read, or purchased. The user must still tap Send in WhatsApp.


## Product report fixes and Undo/Redo

- Tracking and dashboard reports resolve current brand and product-type names from the current product record.
- Share records whose referenced product was deleted are excluded from current inventory/report calculations; records remain in History.
- Undo/Redo controls are added to each app tab for saved local-data changes (up to 80 steps). They cannot undo a WhatsApp message that was already sent.
- The local-storage key remains `dealDhamakaAgentV2`; export a JSON backup before replacing app files.
