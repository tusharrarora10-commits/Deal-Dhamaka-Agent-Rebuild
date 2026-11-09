# Deal Dhamaka Agent V2 — Excel Payment Import & UPI Queue

## What's included
- New **Payments** tab.
- Import `.xlsx`, `.xls`, or `.csv` with columns:
  - `Contact Name` (required; exact saved contact name match)
  - `Pending Amount` (required, numeric INR)
  - `Product Name` (optional)
  - `Remarks` (optional)
- Add a **UPI ID** to each contact in Contacts → Edit Contact.
- Queue entries show matched contact, saved UPI ID, product, amount and status.
- Open a UPI payment intent with payee UPI ID, payee name, amount, INR and product/remarks.
- Mark paid only after verifying successful payment in the bank/UPI app.
- Export payment register as CSV.

## Important payment safety
This feature does not debit an account or verify settlement. It opens a standard `upi://pay` intent; iOS/Android may offer a compatible UPI app (including CRED if installed and registered for the intent), but the app cannot force CRED specifically. Verify the payee UPI ID and amount on the payment app's confirmation screen. Never store bank credentials, UPI PINs or OTPs in Deal Dhamaka.

## Cloud / shared data
Payment queue rows are stored as `dd_payment` entries inside the existing app `activity` array. The existing Supabase bridge serializes the activity array to `dd_activity`, so the payment register follows the current shared-cloud activity sync when that bridge is signed in and running. Existing local data is not cleared by this feature.

## Deploy
1. Keep an export backup of the current app first.
2. Extract this ZIP. Upload the **contents** of `Deal-Dhamaka-Agent-V2-main` to the same GitHub/Vercel project root, replacing matching files.
3. Commit and wait for Vercel deployment.
4. Open the app, edit each relevant contact and save its UPI ID.
5. Open Payments and import the Excel file. Review unmatched names and amounts before paying.
6. Test with a small amount to a trusted recipient first.

## Limitations
- Contact matching is exact after trimming/case/space normalization. Unmatched names remain visible and cannot be paid until linked to a saved contact.
- Combined payment is supported only for selected rows belonging to one contact.
- Payment status is manually marked after the external app confirms success; automatic bank reconciliation is not available.
- CSV export is provided for the register; Excel import supports `.xlsx`, `.xls`, and `.csv`.
