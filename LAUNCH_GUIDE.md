# Launch guide

Every step to take Transfer Kitty live with payments, in order. Each says what **you**
do and what **Claude** does after. Prices were checked on 20 November 2026; dollar prices
are converted at about 78p to the dollar, so pounds are approximate.

**Your security rules:** type every key and password yourself, straight into the website
that needs it (Vercel, Supabase, Stripe). Never paste one into the chat.

---

## Part 1: Business basics (about 1 hour)

### Step 1. Domain name (skip if you already own transferkitty.io)

- **You:** buy `transferkitty.io` on Namecheap (about £12 for the first year; check the renewal
  price, which may be higher). Turn on domain privacy, auto-renew and Namecheap's free email
  forwarding so `hello@transferkitty.io` reaches your own inbox.
  That's the contact email for the terms, and keeps your personal address private.

### Step 2. A postal address for the terms

- **You:** UK law needs a postal address on any site that sells. To keep your home address
  private, rent a virtual office address (usually £10 to £20 a month; check what mail
  forwarding includes).
- **You:** send Claude: the name the site is run under (your name, or "Your Name, trading as
  Transfer Kitty"), the postal address and the contact email.
- **Claude:** puts them in the terms and privacy policy and removes the "draft" notice.

### Step 3. ICO data protection fee

- **You:** at ico.org.uk, search "pay the data protection fee". Pay Tier 1: **£47 a year by
  direct debit** (£52 otherwise). Takes about 10 minutes.

### Step 4. Tell HMRC

- **You:** register as self-employed on GOV.UK (free) once you earn more than £1,000 in a tax
  year, or set up a limited company if you prefer. Keep Stripe's monthly reports for your tax
  return.

---

## Part 2: The live database (about 30 minutes)

### Step 5. Supabase live project

- **You:** at supabase.com, create a **new project** for live (keep the current one for
  testing):
  - name: `transfer-kitty-live`;
  - region: **Frankfurt (eu-central-1)**, next to the website's servers;
  - a strong database password, saved in your password manager.
- **You:** upgrade the organisation to **Pro** (about £20 a month). It includes daily backups
  and never pauses.
- **You:** send Claude the project's **reference ID** (in the project's web address; it isn't
  secret).
- **Claude:** links the project; then, with your OK, applies every database change, loads
  players and questions, sets launch day as puzzle #1 and schedules 30 days ahead.

### Step 6. Sign-in emails (Resend)

Supabase's built-in email sends only a few emails an hour, which isn't enough for launch.

- **You:** create a free account at resend.com and add your domain. Resend shows a few DNS
  records: add them at your domain registrar, then wait for Resend to show "Verified".
- **You:** in Resend, create an SMTP password. In Supabase (live project), go to
  Authentication > Emails > SMTP settings, turn on custom SMTP and enter:
  - host `smtp.resend.com`, port `465`, user `resend`, and the password;
  - sender `hello@transferkitty.io`, sender name `Transfer Kitty`.
- **You:** in Supabase, go to Authentication > URL configuration:
  - Site URL: `https://transferkitty.io`;
  - Redirect URLs: add `https://transferkitty.io/auth/callback`.
- Free covers 100 emails a day. If more than 100 people sign in on one day, upgrade to Resend
  Pro (about £16 a month).

### Step 7. Google sign-in (optional, can wait)

- **You:** in Google Cloud Console, create an OAuth client (Web). Use the redirect address that
  Supabase shows under Authentication > Sign in providers > Google, and paste the client ID and
  secret there.

---

## Part 3: The website (about 30 minutes)

### Step 8. Vercel

The free Hobby plan doesn't allow commercial use, so the site needs Pro.

- **You:** at vercel.com:
  - upgrade to **Pro** (about £16 a month);
  - choose **Import Project** and pick `kempyyyy4/transfer-kitty` from GitHub.
- **You:** in the project's Settings > Environment Variables, add these for **Production**:

| Name                                   | Where it comes from                                                       |
| -------------------------------------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase live project > Project Settings > API                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same page, the publishable key                                            |
| `SUPABASE_SECRET_KEY`                  | Same page, a secret key                                                   |
| `CRON_SECRET`                          | Any long random text (at least 16 characters), from your password manager |
| `ADMIN_PASSWORD`                       | Any long password (at least 16 characters), for the admin page            |
| `ADMIN_USER_ID`                        | Leave until step 13                                                       |
| `STRIPE_SECRET_KEY`                    | Step 10                                                                   |
| `STRIPE_WEBHOOK_SECRET`                | Step 10                                                                   |
| `STRIPE_AUTOMATIC_TAX`                 | Step 11 (`on`)                                                            |
| `NEXT_PUBLIC_ADSENSE_CLIENT`           | Leave blank until AdSense approves you (step 16)                          |

- **You:** under Settings > Domains, add `transferkitty.io` and add the DNS records Vercel shows
  at your registrar.
- **Claude:** checks the live site, the nightly job and the speed.

### Step 9. Launch day

- **You:** tell Claude the launch date.
- **Claude:** sets it as puzzle #1 and schedules the dailies from it.

---

## Part 4: Taking money (about 1 to 2 hours, plus waiting for approvals)

### Step 10. Stripe live mode

- **You:** in Stripe, **activate your account**: business details, identity check and the bank
  account for payouts. Approval can take a day or two.
- **You:** in Settings, then:
  - turn on **email receipts** for successful payments (UK law needs a written confirmation);
  - add `https://transferkitty.io/terms` and your support email to the public business
    details.
- **You:** in Developers > Webhooks (live mode), add an endpoint:
  - address `https://transferkitty.io/api/stripe/webhook`;
  - events `checkout.session.completed` and `checkout.session.async_payment_succeeded`.

  Copy its signing secret (`whsec_...`) into Vercel as `STRIPE_WEBHOOK_SECRET`.

- **You:** copy the **live** secret key (`sk_live_...`) into Vercel as `STRIPE_SECRET_KEY`.

### Step 11. EU VAT (OSS) and Stripe Tax

- **You:** register for the EU's **non-Union OSS** scheme in one EU country. Ireland's Revenue
  works in English. Check its OSS guidance first; it can take a few weeks. EU buyers can't be
  sold to legally until it's done. (Claude can block EU checkouts until then if you want.)
- **You:** in Stripe, go to Settings > Tax:
  - activate Stripe Tax and set your address;
  - add the OSS registration (choose EU, OSS, non-Union scheme).
- **You:** set `STRIPE_AUTOMATIC_TAX` to `on` in Vercel.
- **Every quarter:** file the OSS return (even with no sales) using Stripe's tax report, and pay
  the VAT due.

### Step 12. A real test purchase

- **Claude:** redeploys and checks everything is wired.
- **You:** buy the cheapest coin pack with your own card on the live site, check the coins
  arrive and the receipt email comes, then refund it in Stripe.

---

## Part 5: Final checks (about 1 hour)

### Step 13. Your admin account

- **You:** sign in on the live site, open your account page and send Claude the account ID it
  shows (not secret).
- **You:** set it in Vercel as `ADMIN_USER_ID`. Then `/admin` works with your admin password.

### Step 14. Play-through

- **You:** in admin > Schedule, look through the first week of dailies; swap any weak ones.
- **You:** test on a real iPhone and a real Android phone: sound, buzz, the keyboard in a round,
  add to home screen, sharing, and a purchase.

### Step 15. Go live

- **You:** share the link. Add `?utm_source=` tags to links you post (for example
  `?utm_source=tiktok`) so the dashboard shows what works.

### Step 16. Ads (after launch)

- **You:** apply for AdSense once the site has been live for a while. When approved, set up
  Google's consent message under Privacy & messaging, then give Claude the publisher ID.

---

## What it costs

### Today (to launch)

| What                                  | Cost                   |
| ------------------------------------- | ---------------------- |
| Domain, first year                    | about £12              |
| ICO fee, first year (direct debit)    | £47                    |
| Supabase Pro, first month             | about £20              |
| Vercel Pro, first month               | about £16              |
| Virtual office, first month (if used) | about £10 to £20       |
| Resend, Stripe, Stripe Tax setup, OSS | £0                     |
| **Total to launch**                   | **about £105 to £115** |

### Every month after

| What                        | Cost                 |
| --------------------------- | -------------------- |
| Supabase Pro                | about £20            |
| Vercel Pro                  | about £16            |
| Virtual office (if used)    | about £10 to £20     |
| Resend Pro (only if needed) | about £16            |
| **Monthly**                 | **about £46 to £72** |

### After one year

| What                                      | Cost                   |
| ----------------------------------------- | ---------------------- |
| 12 months of running costs                | about £550 to £860     |
| Domain and ICO fee for the year           | about £59              |
| **First year in total** (including today) | **about £610 to £925** |

The low end has no Resend Pro and the cheaper virtual office; the high end has both.

### Fees taken from each sale (not counted above)

Stripe takes 1.5% + 20p on a standard UK card (2.5% + 20p on EU cards), and Stripe Tax adds
0.5% on EU sales. VAT on EU sales (around 17 to 27%) also comes out of the price.

| Product     | Price | Stripe fee (UK card) | You keep    |
| ----------- | ----- | -------------------- | ----------- |
| 500 coins   | £0.99 | about 21p (22%)      | about 78p   |
| 1,200 coins | £1.99 | about 23p            | about £1.76 |
| Lifetime    | £3.99 | about 26p            | about £3.73 |
| 3,500 coins | £4.99 | about 27p            | about £4.72 |

The fixed 20p hurts the £0.99 pack most. **To cover about £50 a month of running costs you need
about 14 lifetime sales a month**, or a mix of packs, before ads.

---

Sources (checked 20 November 2026): vercel.com/pricing and Vercel's Hobby plan docs;
supabase.com/pricing; resend.com/docs (free plan limits); ICO data protection fee
self-assessment; stripe.com/gb/pricing; Namecheap's .io price as Tom saw it. Prices change, so
check each site's own page before paying.
