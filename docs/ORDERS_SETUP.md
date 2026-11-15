# Setting up orders with Google Sheets (about 10 minutes)

Every order becomes **a new row in your Google Sheet**, with a **small picture of the item that was ordered**, and the payment screenshot is saved in a **private Google Drive folder**.
No database and nothing to pay for. Until you do this, customers can see the payment options but **orders can't be saved**, so don't share the link yet.

## 1. Create the sheet
1. Go to https://sheets.new and name the file **Chillcom Orders**.

## 2. Add the script
1. In the sheet open **Extensions → Apps Script**.
2. Delete everything in the editor.
3. Open `google-apps-script/Code.gs` in this repo (GitHub → the file → **Raw**), copy **all** of it, and paste it into the editor.
4. Click the **Save** icon.

## 3. Run the one-time setup
1. In the toolbar, pick **`setup`** in the function dropdown and click **Run**.
2. Google asks for permission:
   **Review permissions → choose your Google account → "Google hasn't verified this app" → Advanced → "Go to … (unsafe)" → Allow.**
   This warning is normal for your own scripts. It only touches this sheet and a Drive folder it creates.
3. When it finishes, the **Execution log** at the bottom shows a line starting **`SECRET (copy this into Vercel as SHEETS_SECRET): …`**.
   **Copy that long secret** and keep it private.
4. Look at the sheet: there is now an **Orders** tab with headers, and a Drive folder called **Chillcom payment proofs**.

## 4. Publish the script as a web app
1. **Deploy → New deployment**, click the gear icon and choose **Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**. (Only your website knows the secret, so "Anyone" is safe.)
3. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
4. Check it: open that URL in a browser. You should see `{"ok":true,"service":"chillcom-orders"}`.

## 5. Add two settings in Vercel
Vercel → your project → **Settings → Environment Variables**. Add these two, for all environments:

| Name | Value |
| --- | --- |
| `SHEETS_WEBHOOK_URL` | the Web app URL from step 4 |
| `SHEETS_SECRET` | the secret from step 3 |

Then **Deployments → ⋯ on the latest → Redeploy**. Never paste the secret into a chat, a screenshot or GitHub.

## 6. Test it yourself
1. On your live site pick any piece, then **Shop**, a size, fill the form with your own details and any screenshot, and **Place order**.
2. In the sheet, a new row should appear: **CC-0001**, status **pending**, with a **picture of the item** in the **Item** column.
3. Click **Open** in the Screenshot column. It opens the image (you must be signed in to the same Google account).
4. Delete the test row. The next real order is **CC-0002**. To restart numbering at CC-0001, open Apps Script → **Project Settings → Script properties** and set `ORDER_NO` to `0`.

## Managing orders
- The **Item** column shows the picture of what was ordered (the same product photo as on the site, in small form). The **Product** column has its name and **Size** the size.
- **Status** is a dropdown: pending, paid, shipped, cancelled, and it is colour-coded. Check each payment in your UPI app, then set it to **paid**.
- **Chat** in the WhatsApp column opens a WhatsApp chat with the buyer.
- Use **Data → Create a filter** to show only pending orders.
- Don't rename the **Orders** tab, delete the header row, or insert columns before the last one (the script writes by position). Add your own notes columns to the **right**.
- Only share the sheet with people you trust: anyone with access sees buyers' mobile numbers.

## Upgrading an existing sheet to the version with item pictures
If you set the sheet up before the **Item** column existed:
1. Open Apps Script, select everything, and paste the latest `google-apps-script/Code.gs`. Save.
2. Pick **`setup`** and click **Run**. It adds the **Item** column and keeps your existing orders. (Older rows stay without a picture.)
3. **Deploy → Manage deployments → ✏️ → Version: New version → Deploy.** This step is easy to miss: until you do it, the live web app keeps running the OLD script and writes orders one column too far left. `setup` repairs such rows automatically the next time you run it.

## If you change the script later
Saving is not enough. Use **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The URL stays the same.

## If orders fail ("Could not save your order")
Open Vercel → **Logs** and look for the message:
- **"Apps Script did not return JSON"**: the deployment access is wrong. Redeploy with **Execute as: Me** and **Who has access: Anyone**.
- **"Apps Script refused the order: unauthorized"**: `SHEETS_SECRET` in Vercel doesn't match the script's secret. Copy it again from the setup log (or Apps Script → Project Settings → Script properties → `SECRET`).
- **"Ordering is not set up yet"**: one of the two Vercel settings is missing. Add it and redeploy.

## Good to know
- **Item pictures** are the small JPGs in `public/order-thumbs/<product-id>.jpg`, shown from your GitHub repo (`PICTURE_BASE` at the top of `Code.gs`), so they keep working even if you rename your Vercel domain. New orders get their picture automatically from the product id. `setup` also fills in pictures for older orders using the product names (`PRODUCT_IDS` in `Code.gs`). After adding or changing a product, run `python3 scripts/make-order-thumbs.py` (needs `pip install pillow`), push, and add the product's name to `PRODUCT_IDS` if you want old rows to get a picture too.
- **Prices** are in `src/config/store.ts` (`PRICES`). The server always uses these, never what the browser sends.
- **Deadline:** orders close at the end of 20 Nov 2026 IST (`DEADLINE` in the same file). After that the Shop button is disabled and the server refuses orders.
- **Your UPI ID** is in `src/config/upi.ts`, and the QR image is `public/payment/gpay-qr.png`.
- **Spam protection:** one mobile number can place at most 3 orders in 10 minutes, and a hidden field catches simple bots.
- **Google limits:** Apps Script and Drive have daily limits, far above what a few hundred orders need.
