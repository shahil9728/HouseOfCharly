# Order notifications — setup

**The problem this solves:** until now, a Cash on Delivery order existed only as
one line in a rolling server log. If you didn't happen to be watching the Netlify
log dashboard, the order was gone — customer name, phone, address and all.

The site now announces every order on **up to three independent channels**. Each
one switches on by itself the moment you set its environment variables; you can
run one, two or all three.

| Channel | What you get | Cost | Setup |
|---|---|---|---|
| **Sheet + email** (Apps Script) | Permanent `Orders` tab in your sheet **and** an email per order | Free | ~5 min |
| **Telegram** | Instant push notification on your phone | Free, unlimited | ~3 min |
| **Email** (Resend) | Nicely formatted HTML email | Free to 3,000/month | ~5 min |

**Recommended:** set up **Apps Script + Telegram**. Between them you get a
permanent written record, an email, and an instant phone alert — for ₹0/month
and no ongoing cost per order.

They are deliberately independent. If Telegram is down you still get the email;
if the Apps Script quota is hit you still get the push. Any channel failing
**never** fails the customer's order — they always see their confirmation.

---

## Channel 1 — Sheet + email (do this one first)

This is the important one, because it's the only channel that creates a
**permanent record you can search later**. The script is already written and
sitting in this repo.

1. Open your Google Sheet → **Extensions → Apps Script**
2. Delete anything in the editor, paste the entire contents of
   [`docs/orders-apps-script.js`](orders-apps-script.js)
3. Line 24 — `NOTIFY_EMAIL` is set to `Official@houseofcharly.com`. Change it if
   you want the alerts somewhere else.
4. **Deploy → New deployment → Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone** ← this exact wording matters
5. Authorise it (Google will warn about an unverified app — it's your own
   script; click *Advanced → Go to project*), then copy the `/exec` URL
6. Add it to your environment as `ORDERS_WEBHOOK_URL`

> ⚠️ **"Anyone" is the step people get wrong.** If you pick *"Anyone with a
> Google account"* the website's request gets silently rejected, and you'll
> think it works until an order goes missing. The site posts anonymously — it
> has no Google login.

The `Orders` tab is created automatically on the first order.

---

## Channel 2 — Telegram (instant phone alert)

Genuinely free and instant. This is the closest free equivalent to a WhatsApp
message — see the note at the bottom for why WhatsApp itself isn't free.

**Get a bot token:**
1. Install Telegram, search for **@BotFather**, open the chat
2. Send `/newbot`
3. Give it a name (e.g. `House of Charly Orders`) and a username ending in
   `bot` (e.g. `houseofcharly_orders_bot`)
4. BotFather replies with a token like `8123456789:AAH...`. That's
   `TELEGRAM_BOT_TOKEN`

**Get your chat ID:**
1. Open a chat with the bot you just made and send it any message (say `hi`) —
   **this step is required**, a bot cannot message you until you message it first
2. Open this URL in your browser, with your token pasted in:
   `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Find `"chat":{"id":123456789` — that number is `TELEGRAM_CHAT_ID`

**Want the whole team to get alerts?** Create a Telegram group, add your bot to
it, send a message in the group, and use the group's ID from `getUpdates`
instead. Group IDs are negative — include the minus sign.

---

## Channel 3 — Email via Resend (optional)

Only worth doing if you want a nicer-looking email than the Apps Script one, or
you'd rather not use Apps Script at all.

1. Sign up free at [resend.com](https://resend.com)
2. **API Keys → Create API Key** → copy it → that's `RESEND_API_KEY`
3. Done — it works immediately with no DNS setup

**The catch with the no-setup version:** until you verify a domain, Resend only
lets you send *from* `onboarding@resend.dev` and only *to* the email address
that owns your Resend account. That's fine for alerting yourself.

To send to any address (or from your own domain), go to **Domains → Add Domain**,
add `houseofcharly.com`, add the DNS records it gives you, then set:

```
ORDER_EMAIL_FROM = House of Charly <orders@houseofcharly.com>
ORDER_EMAIL_TO   = Official@houseofcharly.com
```

`ORDER_EMAIL_TO` accepts a comma-separated list for multiple recipients.

---

## Environment variables

Set these in Netlify → **Site settings → Environment variables** (or in
`.env.local` for local testing). Every one is optional; a channel with missing
variables is simply skipped.

| Variable | Channel | Notes |
|---|---|---|
| `ORDERS_WEBHOOK_URL` | Sheet + email | The Apps Script `/exec` URL |
| `TELEGRAM_BOT_TOKEN` | Telegram | From @BotFather |
| `TELEGRAM_CHAT_ID` | Telegram | From `getUpdates`; negative for groups |
| `RESEND_API_KEY` | Email | From resend.com |
| `ORDER_EMAIL_TO` | Email | Defaults to the site's contact email |
| `ORDER_EMAIL_FROM` | Email | Defaults to Resend's shared sender |

> After changing variables on Netlify, use **Deploys → Trigger deploy → Clear
> cache and deploy site**, not a plain redeploy.

---

## Testing it

Test locally before trusting it in production:

```bash
# .env.local with your real tokens, then:
npm run build && npm start
```

Then either place a real order through the site at `localhost:3000`, or fire one
straight at the API — replace the SKU with one that's genuinely in stock:

```bash
curl -X POST localhost:3000/api/checkout/cod \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"sku":"320W500G2601","qty":1}],
       "customer":{"name":"Test","phone":"9876543210",
                   "address":"1 Test St","city":"Hisar","pin":"125006"}}'
```

**Read the server log** — it tells you exactly what happened:

```
[order] HOC-ABC123 notified via: webhook, telegram     ← both worked
[order] channel email failed: HTTP 401: invalid key    ← one broke, order was fine
[order] NO NOTIFICATION CHANNEL CONFIGURED …           ← nothing is set up
```

Do place one real test order on the live site once deployed. Ordering it
yourself is the only way to be sure the whole chain works end to end.

---

## How it behaves when things break

Deliberate design decisions, because an order is real money:

- **A channel failing never fails the order.** The customer always sees their
  confirmation and reference. They've done their part; a broken integration is
  ours to fix, not theirs to see.
- **Every channel is time-boxed to 8 seconds.** A hung endpoint can't leave a
  customer stuck on a spinner.
- **Channels run in parallel**, so three channels cost the time of one.
- **If every channel fails, the complete order is written to the server log as
  JSON** — so it's still recoverable from Netlify's function logs while they're
  in retention. That's a safety net, not a plan: fix the channel.

Worth checking the logs occasionally for `channel … failed` lines. That's how
you notice Telegram has been quietly broken for a fortnight.

---

## Two things this does *not* do

**The customer gets no email.** Checkout only asks for name, phone, address and
PIN — there's no email field, so there's nowhere to send one. Customers see
their order reference on screen and that's it. If you want customers to receive
a confirmation, we'd need to add an email field to checkout (worth doing — say
the word).

**WhatsApp is not one of the channels, and can't cheaply be.** Automated
WhatsApp requires the Meta Cloud API: a separate phone number, business
verification, pre-approved message templates, and roughly ₹0.115 per message.
Telegram gives you the same instant-phone-alert experience for free. The
WhatsApp buttons on the site today just open a chat with a pre-filled message —
they don't send anything automatically.
