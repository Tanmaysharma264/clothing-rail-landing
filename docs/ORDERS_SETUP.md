# Setting up orders (about 10 minutes)

Until you do this, the store works but **Pay now shows "Payments aren't set up yet"** and orders can't be placed.
Nothing here costs money: Supabase and Vercel both have free plans that are enough for this.

## 1. Create the Supabase project

1. Go to https://supabase.com and sign up (GitHub login is fine).
2. Click **New project**. Name it `chillcom-store`, choose a region close to your customers
   (for India: **Mumbai (ap-south-1)**), set a database password and save it somewhere safe.
3. Wait about a minute for it to finish setting up.

## 2. Create the orders table and screenshot storage

1. In Supabase open **SQL Editor → New query**.
2. Open the file `supabase/schema.sql` in this repo, copy everything, paste it in, click **Run**.
3. You should see "Success". This creates:
   - the `orders` table (with a `status` column that starts as `pending`), and
   - a `payment-proofs` storage bucket for the screenshots.

## 3. Get your two secret values

In Supabase open **Project Settings → API** and copy:

- **Project URL** (looks like `https://abcdefgh.supabase.co`)
- **service_role** key (under "Project API keys"). **Keep this secret.** Never post it in a chat, a screenshot or GitHub.

## 4. Add settings in Vercel

Vercel → your project → **Settings → Environment Variables**. Add these four, for all environments:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_UPI_ID` | your UPI ID, e.g. `yourname@okhdfcbank` |
| `NEXT_PUBLIC_UPI_NAME` | the name shown to the payer, e.g. `Chillcom` |
| `SUPABASE_URL` | the Project URL from step 3 |
| `SUPABASE_SERVICE_ROLE_KEY` | the service_role key from step 3 |

Then **Deployments → ⋯ on the latest → Redeploy**. (The UPI values are baked in at build time, so a redeploy is required after any change.)

## 5. Test it yourself

1. Open your live site on your phone and pick any piece → **Shop** → size.
2. Tap **Pay in your UPI app**. Check your own UPI ID and the amount (₹599 / ₹799) show up. You can cancel there.
3. Fill the form with your own details and any screenshot, then **Place order**.
4. In Supabase open **Table Editor → orders**. Your test order should be there with `status = pending`.
   You can delete the test row.

## Managing orders

In Supabase → **Table Editor → orders**, newest orders are listed with:

- `order_no` (shown to the customer as `CC-0042`), product, size, amount
- name, mobile, and a `whatsapp` link you can click to message the buyer
- `utr` (if they entered it) and `proof_url` (click to open the payment screenshot)
- `status`, a dropdown: **pending → paid → shipped → cancelled**

Check the payment in your UPI app, then change `status` to `paid` by hand. Use the **Filter** button to see only `pending` orders.

## Good to know

- **Prices** are set in `src/config/store.ts` (`PRICES`). The server always uses these, never what the browser sends.
- **Deadline:** orders close at the end of 20 Nov 2026 IST (`DEADLINE` in the same file). After that the Shop button is disabled and the server refuses orders.
- **Screenshots** are stored in a public bucket under random, unguessable names so the link works in one click. Don't share the links.
- Supabase pauses **free** projects after about a week with no activity. If the store ever sits unused, open the Supabase dashboard and click **Restore**.
