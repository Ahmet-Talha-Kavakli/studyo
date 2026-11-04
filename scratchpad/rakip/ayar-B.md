# Competitor research B: account and settings areas of AI creative tools

Prepared 2026-10-28 for Vayra `/panel/ayarlar` redesign.

Source labels:
- **[doc]**: confirmed in official help center or docs during this research.
- **[3p]**: third-party guide.
- **[obs]**: my own knowledge of the product UI. Treat as likely, and check against the live product before copying exact labels.

Many settings pages sit behind login, and several help centers block fetching (Runway, Midjourney returned 403). Where nothing official was found, I say so.

---

## 1. Higgsfield (closest direct competitor)

**Layout and navigation**
- An avatar menu (top right) acts as a mini-dashboard **[doc]**. It shows username, plan, remaining credits, and these items: Credits, Top-up credits, Boost speed, Increase Concurrent, Unlimited models, View profile, Manage Account, Join Community, Sign Out.
- Manage Account is a full page at `/me/settings` with a left sidebar of 5 sections **[doc]**: Personal profile, Gifts, Subscription, Usage, Promocode.
- The public profile (`/@username`) is a separate page. It has an Edit profile button covering picture, username, bio, and social links **[doc]**.
- Assets (`/asset/all`) is the private library. It is kept separate from settings **[doc]**.

**Sections and settings**
- **Personal profile**: display name, email, avatar.
- **Gifts**: gifts received or claimable.
- **Subscription**: plan, billing cycle, renewal. It has a Credits card that shows monthly balance and Auto-Refill credits as separate lines **[doc]**.
- **Credits auto-refill** (under Subscription) **[doc]**:
  - Off by default.
  - Set up through "Set-up & Enable", then choose a refill amount.
  - Triggers when the balance drops below a plan-specific threshold, which is shown in the set-up window.
  - Auto-refill credits expire after 90 days.
  - Explicit spend order: subscription credits, then credit packs, then promo, then auto-refill.
  - If the payment fails, no credits are added and the user is prompted to update the card.
- **Usage**: credit usage history, a "Usage history" chart of spending over time, and a "Collab karma history" section.
- **Promocode**: a code redemption field.
- Upsells such as Concurrency Boost ("Increase Concurrent") and Unlimited models sit in the avatar menu, not in settings.
- **Workspace**: members can't see each other's assets, but owners and admins can **[doc]**.
- **Delete account**: a separate process linked from help **[doc]**.

**Plan and credits visualisation**
- The credit balance is always visible in the top bar.
- The Credits card splits the balance by bucket.
- A usage chart shows spending over time.

**Delightful details**
- Credit buckets are shown separately, and the spend order is stated openly. Users trust a balance they can understand.
- A promo code field is built into settings.
- "Gifts" is treated as its own section.

---

## 2. Runway

**Layout and navigation**
- Avatar (top right) opens Settings, a full page with tabs **[doc]**.
- Workspace Settings is reached from the avatar and has 3 tabs: General, Members, Plans & Billing **[doc]**.
- Personal settings and workspace settings are separated.
- A workspace switcher appears in the avatar menu **[obs]**.

**Sections and settings**
- **General** (account) **[doc]**:
  - Name, username, and profile photo.
  - Email.
  - Password reset.
  - Re-linking Google or Apple sign-in.
  - Delete account.
- **Notifications** tab **[doc]**:
  - Browser (push) notifications on or off, for example when a generation finishes.
  - Marketing and promotional email opt-out.
  - Changes save automatically, so there is no Save button.
- **Email settings** has its own help section **[doc]**.
- **Workspace General**: workspace name and avatar **[doc]**.
- **Members** **[doc]**:
  - Invite, remove, and change roles.
  - Roles are Admin, Editor, and Viewer. Viewers don't use seats.
  - Adding an Editor or Admin charges the card first.
- **Plans & Billing** **[doc]**:
  - Change plan.
  - Invoices.
  - Credit usage history.
  - Buy extra credits.
  - Monthly credits expire at renewal. Purchased credits never expire.
- **Enterprise** **[doc]**:
  - Credit spend notifications.
  - Workspace credit caps.
  - Workspace Analytics.
  - SSO.
- **API** is a separate developer portal with its own keys and billing **[3p]**.
- **2FA**: Runway advises securing your email account and using SSO. No native 2FA toggle was documented **[doc]**.
- **Generation defaults**: none in settings. Aspect ratio, duration, and fixed seed are chosen per tool **[3p]**.

**Row and control design**
- Toggle rows that save instantly.
- Tables for members and invoices **[obs]**.

**Delightful details**
- The Viewer role is free and doesn't use a seat.
- Auto-save on notifications.

---

## 3. Krea

**Layout and navigation**
- Settings is a full page at `/settings/...` with sub-routes **[doc]**:
  - `/settings/billing`
  - `/settings/usage-statistics`
  - `/settings/compute-packs`
  - `/settings/api-tokens`
  - `/settings/workspace-settings`
- A workspace toggle (personal or team) sits at the top left of the app **[doc]**.

**Sections and settings**
- **Billing** **[doc]**:
  - A "Manage Subscription" button opens the Stripe customer portal. Cancellation and refunds happen there.
  - Plan changes go through the pricing page.
  - Upgrades apply immediately. Downgrades apply at period end.
- **Usage Statistics** **[doc]**: compute unit consumption, updated in near real time (1 to 2 minutes).
- **Compute packs** **[doc]**: one-time packs that expire after 90 days.
- **Teams** **[doc]**:
  - A shared compute pool, bought by the owner.
  - The owner can assign individual paid plans to members.
  - Members use their own plan's compute first, then the pool.
  - The team settings page shows the billing cycle and the upcoming price.
- **Workspace settings, Model Access card** **[doc]**: allow or deny specific models per organisation, workspace, or member. Business and Enterprise only.
- **Organisations** **[doc]**:
  - Domain verification and capture.
  - SAML SSO.
  - Workspace handoff when a teammate leaves (offboarding).
- **API tokens** **[doc]**:
  - "Create Personal Token" and "Create Service Token" buttons, with a name field.
  - The token is shown once ("you'll only see it once!").
  - Owners see every token, with 30-day spend per service token.
- **API balance** (separate from the plan) **[doc]**:
  - Preset top-ups of $10, $25, $50, or $100, or a custom amount from $5 to $10,000.
  - The balance card shows estimated API cost for the last 7 days.
  - When the balance runs out, requests return HTTP 402.
- **API usage page** **[doc]**: a date range picker, completed jobs, and estimated cost.
- **MCP server** and **webhooks** are documented for developers **[doc]**.
- **Zero Data Retention** is available for the API **[doc]**.
- **Generation defaults**: not in settings. Each model's settings appear under the prompt box **[doc]**.

**Delightful details**
- Separate personal and service tokens.
- Spend tracked per token.
- Per-model access control.
- A workspace handoff flow for offboarding.

---

## 4. Midjourney (web)

**Layout and navigation**
- Two different settings surfaces:
  - **Creation settings** live in a popover panel opened from the Imagine bar, next to the prompt **[doc]**. These are generation defaults and are synced with Discord `/settings`.
  - **Account** pages are reached from the left sidebar: Manage Subscription and Account settings **[doc][3p]**.

**Creation settings popover** **[doc][3p][obs]**
- Image Size and Aspect Ratio, with a visual ratio picker and slider. Ratios wider than 2:1 are labeled experimental.
- Mode: Standard or Raw.
- Version: model selector (V7, V6.1, Niji).
- Personalization on or off, plus profile and moodboard selection.
- Aesthetics sliders: Stylize, Weirdness, Variety (chaos).
- More options:
  - Speed: Relax, Fast, or Turbo.
  - Draft mode.
  - Stealth or Public visibility (Pro and Mega only).
  - Video settings (motion low or high, batch size).
- A "Reset to default" option **[obs]**.

**Stealth mode** **[doc]**
- Pro and Mega plans only.
- Toggled in the web settings panel, with `/stealth` and `/public` in Discord, or with a per-prompt flag.
- Turning it on doesn't hide past public work.
- Per-image "Make Private" is available. Trashing an image does not make it private.

**Manage Subscription** **[doc]**
- "Usage Details" shows remaining Fast GPU time.
- Plan features are shown in the centre of the page.
- "Billing & Payment" shows price and renewal date.
- Change Plan and Cancel Plan buttons. Cancellation applies at the end of the cycle.
- Buy extra Fast hours **[obs]**.

**Account settings** **[3p]**
- **Email preferences**, in 4 categories:
  - Major announcements
  - Account activity
  - Tips and tricks
  - Surveys and research

  Billing and account emails can't be turned off, and the page says so.
- **Data and privacy**: analytics and advertising cookie toggles, plus an analytics data export.
- Image export is done from the Organize page, not from settings.
- **Delete account.**

**Other** **[obs]**
- The Explore page has content-visibility preferences.
- A theme option (light or dark).
- Linked Discord and Google accounts.

**Delightful details**
- Creation defaults live in a popover next to the prompt, not buried in a settings page.
- Settings stay in sync between web and Discord.
- Remaining Fast time is shown in hours, not abstract credits.

---

## 5. Leonardo.ai

**Layout and navigation**
- Clicking the username (sidebar or top) opens a menu with Create Team, Settings, and Logout **[doc]**.
- Settings is a page with a tabbed or left list **[obs]**: Profile, Subscription/Plan, API Access, Account settings, Teams.
- Team settings are reached from team name, then Settings, then Team Profile (name and logo) **[doc]**.

**Sections and settings**
- **Profile**: username, avatar, bio, and public gallery link **[obs]**.
- **Subscription** **[obs]**:
  - Plan.
  - Token balance: subscription tokens plus "rollover" tokens, shown separately.
  - Buy tokens (top-up).
- **API Access** **[doc]**:
  - Its own API credit balance and its own plan.
  - Production API keys.
  - Visibility is controlled with a `public` flag.
- **Private Mode** **[doc]**:
  - Paid only.
  - The toggle lives in the generation page sidebar, not in settings. It is a per-session default.
- **Content filter** **[doc]**:
  - NSFW blocked by default.
  - Flagged prompts fail with a "content moderation filter" error.
  - The API returns an `nsfw` flag on generated images.
- **Teams** **[doc]**:
  - Roles are Owner (billing and seats), Admin (members, name, logo), and Editor (creation only).
  - Shared team feed versus "Your Generations".
  - A "Hide in Team Feed" option.
- **Delete Account** **[doc]**:
  - A settings section that tells you to cancel paid subscriptions first.
  - Warns that deletion is permanent.
- **Generation defaults** **[obs]**: the last-used settings persist in the generation sidebar, and prompt enhance is a per-prompt toggle.

**Delightful details**
- Rollover tokens are shown separately.
- A clear prerequisite ("cancel subscription first") is shown before delete.

---

## 6. Kling AI

**Layout and navigation**
- The left sidebar shows the credit balance as a number. Clicking it opens credit details **[doc]**.
- A Membership Center page covers plan and benefits **[3p]**.
- The account area is reached from the avatar **[obs]**: profile, language, sign out.

**Sections and settings**
- **Credits** **[doc]**:
  - Buckets: Promotional, Membership, 7-day membership, daily Login credits, and Purchased (valid 2 years).
  - Credits with the shortest validity are spent first.
  - Credits are deducted at the start of a generation and refunded if it fails.
- **Watermark** **[3p]**:
  - Membership removes the watermark.
  - The no-watermark export is a separate option in the download menu (hover over Download).
  - The quick download can still give the watermarked file.
- **Daily login credits**: claimed once a day, a retention mechanic **[doc]**.
- **Language** selector, account binding (Google or email), and API in a separate developer console **[obs]**.

**Delightful details**
- Clicking the balance number opens the details.
- Failed generations are refunded automatically, and this is stated in the policy.

---

## 7. ElevenLabs (best-documented settings of the group)

**Layout and navigation**
- Profile icon (top right) gives Settings, Subscription, and Workspace **[doc]**.
- A "Developers" item at the bottom of the left sidebar holds API Keys and Analytics **[doc]**.
- Billing actions open in pop-ups from the Subscription page **[doc]**.

**Settings (account)** **[doc]**
- Email display.
- Change Email: the old address gets a revert link.
- Sign-in method: email and password, or OAuth (Google, Apple; GitHub and Facebook are legacy).
- **Two-factor**:
  - "Add Two-Factor Authentication" shows a QR code.
  - Confirm with "Verify & Enable".
  - A backup code is shown once.
  - Enabling 2FA removes the monthly cap on Pay As You Go purchases. Security is rewarded.
- **Delete Account**:
  - A red button at the bottom.
  - You confirm by typing your account email.
  - Blocked while a payment is outstanding.
  - The email can't be reused afterward.

**Subscription** **[doc]**
- Plan and billing cycle (monthly or annual toggle).
- Billing pop-up:
  - Modify Plan: a Downgrade dropdown with "Cancel downgrade", and cancellation with "Resume subscription".
  - Manage billing information: Update information, Tax ID, Payment Methods (add, set default, remove).
  - View invoices as PDF.
- **Credit usage notification**: a toggle with a slider that emails you at X% of credits used. All admins receive it in multi-seat workspaces.
- **Pay As You Go** prepaid credits valid 12 months. These replace legacy usage-based billing, which had a threshold or Unlimited cap.
- Unused credits roll over, up to 2 months' worth.

**Developers** **[doc]**
- API Keys.
- Analytics tabs: API Requests, Usage, Webhooks, Request Log.
- Usage can be filtered by voice, product, or API key.
- CSV export.
- An Account versus Workspace toggle.

**Workspace** **[doc]**
- Multiple workspaces per user, with at most one free workspace.
- Seats.
- Workspace groups.
- SSO.

**Data** **[doc]**
- Retention settings per agent: default 2 years, or set days, keep indefinitely, or schedule deletion. You choose whether the change applies to existing data.
- Zero Retention Mode for Enterprise API traffic.

**Delightful details**
- A threshold slider for low-credit email.
- Type-your-email confirmation for delete.
- 2FA unlocks a higher purchase cap.
- Retention changes can apply retroactively or only going forward.

---

## 8. Suno

**Layout and navigation**
- Profile avatar gives View Profile and Settings (gear) **[doc]**.
- On mobile, settings is a single scrolling list. Delete account sits at the very bottom, under the Save icon **[doc]**.
- Subscription is in Account settings: Subscription, then Manage plan **[3p]**.

**Sections and settings**
- **Visibility default** **[doc]**:
  - New songs are Private / Link Only by default.
  - Visibility is changed per song from the "…" menu (Link Only or Public).
  - Only Public songs appear on the profile, in search, and in curated playlists.
- **Profile** **[obs]**:
  - Handle, display name, avatar, bio, social links.
  - Profile tabs: Songs, Playlists, Hooks, Voices (V5 and V6) **[3p]**.
- **Account** **[obs]**: email, connected sign-ins (Google, Discord, Apple, Microsoft, phone).
- **Notifications** **[obs]**: in-app activity for likes, comments, follows, and remixes.
- **Delete account** **[doc]**: warns that songs and personal details are not recoverable.
- **Credits** **[obs]**:
  - The credits counter sits in the sidebar.
  - Free tier credits reset daily (50 a day).
  - Pro and Premier get monthly credits plus top-up packs.
  - Commercial rights only apply to songs made while subscribed. This is shown on the plan page.

**Delightful details**
- Private by default, with an explicit "Link Only" state that is honest about not being truly private.

---

## 9. Pika

Official settings docs weren't found, so this is mostly **[3p]/[obs]**.

**Layout and navigation**
- A profile menu opens a settings page or modal with Account, Subscription, and Billing.
- Mobile (iOS and Android) subscriptions are managed in the store.

**Settings**
- Plan management.
- Credit balance.
- Credit packs. The minimum pack rose to $50 in September 2026.
- The free Basic plan has 250 initial credits, then 30 a day **[doc pricing]**.
- No watermark from the Standard plan up **[doc pricing]**.
- Delete account, and support at support@pika.art.
- Cancellation applies at the end of the cycle. EU and UK users have a 14-day withdrawal right **[3p]**.

**Delightful details**
- A daily refill keeps free users coming back.
- Watermark removal is framed as a plan benefit in the plan comparison.

---

## 10. Freepik AI (now partly branded Magnific for AI docs)

**Layout and navigation**
- A profile page has a left menu **[obs]**: Profile, Account (email and password), Subscription and billing, Notifications, Devices, Downloads history, Support, Delete account **[doc topics]**.
- The AI Suite has its own credits display in the header **[obs]**.

**Settings**
- **Credits** **[doc]**:
  - Credits are AI-only and don't cover stock downloads.
  - Extra credits can be bought on Premium+, Pro, and Business.
  - A **low-credit in-app banner** offers a top-up.
- **Free plan**: 20 AI images a day with the in-house model **[doc]**.
- **Business** **[doc]**: 2 to 30 people, a shared credit pool, team management, one billing account.
- **API** **[3p]**: a developer dashboard with API keys, separate from the creative subscription.
- **Priority usage**: a documented concept for a queue priority tier **[doc]**.

**Delightful details**
- A contextual low-credit banner at the point of need.
- AI credits and stock downloads are separated.

---

## 11. Apple Account (account.apple.com), design reference

**Layout and navigation**
- Card-based web layout (redesigned 2021, still current) **[doc]**.
- A left sidebar with these sections:
  - Sign-In and Security
  - Personal Information
  - Payment Methods
  - Family Sharing
  - Devices
  - Privacy
- The right pane is a grid of cards. Each card shows the current value as a summary, for example "Two-factor: On" or "2 trusted phone numbers". Clicking a card opens a focused modal sheet to edit that one thing.

**Sections**
- **Sign-In and Security**:
  - Email and phone numbers
  - Password, with "last changed" date
  - Account Security (2FA, trusted numbers)
  - Sign in with Apple (apps using your account, with revoke)
  - App-Specific Passwords
  - Account Recovery
  - Legacy Contact
- **Personal Information**: name, birthday, country/region, language, communication preferences (announcements, apps and music).
- **Payment Methods**: cards, shipping address.
- **Devices**: a list of devices with model images. Click one to see details and "Remove from account".
- **Privacy**: manage your data at privacy.apple.com (request a copy, deactivate, delete).

**Delightful details**
- Every card shows its current state, so users never open a page just to check something.
- Edits happen in small, focused modals that each save one thing.
- Devices are shown with product images.
- In iOS 26.4, in-app Apple Account sheets use consistent groupings with "Add Money" and "Send Gift" actions **[doc]**.

---

## 12. iOS Settings app, design reference

**Layout and navigation**
- An identity banner at the top shows the avatar, name, and "Apple Account, iCloud, and more". It is the entry to account settings.
- Search sits at the top, or at the bottom in iOS 26 for one-handed reach **[doc]**. It searches deep into individual settings and shows breadcrumb paths.
- Grouped inset lists ("inset grouped" table) separated by section spacing.
- Each row has:
  - A coloured rounded-square icon. The colour signals the category.
  - A label.
  - A right-hand value or accessory: a toggle, a current value in secondary text with a chevron, or a badge.
- Section footers explain consequences in small grey text under the group.
- Drill-down push navigation with a back title.
- Suggestion cards at the top: "Finish Setting Up", "Software Update Available", and red badges for pending actions.

**Controls**
- Toggles apply instantly.
- Picker rows push a list with a checkmark.
- Destructive actions are red text rows at the bottom ("Sign Out", "Erase").
- Confirmation uses an action sheet.

**Delightful details**
- Footer explanations, so there is no separate help link.
- The current value is visible on the row.
- Search finds any toggle.
- Badges for the next action.
- Coloured icons help scanning.

---

## Cross-product patterns

1. **Full page, not modal**:
   - Every competitor uses a full page with a left rail of 5 to 8 groups.
   - Generation defaults are kept close to the prompt (Midjourney popover, Leonardo sidebar, Krea under the prompt box), not hidden in account settings.
   - Recommendation for Vayra: keep a "Creation defaults" section in settings and mirror it in the studio chip popovers, synced both ways.
2. **Personal versus workspace split** (Runway, Krea, ElevenLabs):
   - Separate "Account" from "Workspace/Team".
   - Workspace has General, Members (roles; Viewer is free), and Billing.
3. **Credits shown as buckets with an explicit spend order** (Higgsfield, Kling):
   - Show monthly, purchased, promo, and auto-refill amounts separately, each with an expiry date.
   - Show a usage chart and a history table.
4. **Auto-refill**: off by default, with an amount, a threshold, and failure handling (Higgsfield).
5. **Low-credit alert**: a percentage slider by email (ElevenLabs), plus an in-app banner (Freepik).
6. **API**:
   - Show the token once, with named tokens and spend per token (Krea).
   - Separate API balance, top-up presets, and a 7-day cost card.
   - Usage filters and CSV export (ElevenLabs).
   - MCP section (Krea).
7. **Visibility**:
   - A private-by-default option with "Link Only" (Suno).
   - Paid stealth (Midjourney).
   - Per-item "Make private".
   - Be honest that a past public item stays public.
8. **Save behaviour**:
   - Toggles auto-save (Runway, iOS).
   - Grouped fields such as profile, email, and payment edit in a focused modal or sheet with an explicit Save (Apple, ElevenLabs).
9. **Destructive actions**:
   - A red row at the bottom.
   - Type your email to confirm.
   - Block deletion if a payment is outstanding or a subscription is active, and tell the user to cancel first (ElevenLabs, Leonardo).
10. **Email categories**: 4 opt-out categories, with billing and security emails marked as always on (Midjourney).
11. **Summary cards** (Apple): show the current value on every row or card.

---

## Merged list of AI-specific settings Vayra should have

**Creation defaults** (synced with the studio chips)
- Default model per studio: image, video, music, 3D.
- Default aspect ratio.
- Default quality or resolution.
- Default number of outputs.
- Video default duration and motion.
- Music default length or genre.
- 3D default format (GLB, OBJ, USDZ).
- Prompt enhancement on or off.
- Auto-upscale or upscale default (2x or 4x).
- Default seed: random or fixed.
- Speed mode: standard, fast, or "relax" queue, if one exists.
- Draft mode.
- Remember last-used settings, or always use defaults.
- Reset to defaults.

**Privacy and visibility**
- Private mode or stealth (paid).
- Default visibility for new work: Private, Link Only, or Public.
- Show on public profile and gallery.
- Allow remix and reuse of public works.
- Allow use of my data for model training (opt-out).
- Make all past work private (bulk action).

**Content**
- Content filter level.
- Blur sensitive content in the gallery.

**Output**
- Watermark on or off (paid).
- C2PA or AI-generated metadata.
- Auto-download on completion.
- Download format (PNG, JPG, WEBP; MP4, WEBM; WAV, MP3).
- File naming.

**Storage**
- Storage used, shown as a bar.
- Asset retention period.
- Auto-delete trash after N days.
- Export all assets as a ZIP.

**Credits**
- Balance by bucket (monthly, purchased, promo, auto-refill) with expiry dates.
- Spend order explanation.
- Usage chart, plus a history table filterable by studio and model, with CSV export.
- Refund on failure, shown in history.
- Auto top-up: on or off, amount, and threshold.
- Low-credit alert: percentage slider, email or push.
- Monthly spending cap.
- Promo code.
- Gifts.
- Referral link with earned credits.

**Plan**
- Current plan, renewal date, features.
- Change, downgrade, or cancel, with Resume and Cancel downgrade options.
- Invoices as PDF.
- Payment methods.
- Tax ID or e-fatura details (Turkey).

**Team**
- Workspaces and switcher.
- Members and roles (Owner, Admin, Editor, Viewer; Viewer is free).
- Shared credit pool.
- Per-member credit limits.
- Model access control.
- Shared versus private team feed.
- Offboarding handoff.

**API and MCP**
- Personal and service keys, shown once, named, with last used date and 30-day spend.
- Revoke.
- Separate API balance with top-up presets.
- Usage by key, with CSV export.
- Webhooks.
- MCP connection: server URL, connected clients, revoke.

**Account**
- Profile: avatar, handle, bio, social links.
- Email: change with a revert link.
- Password.
- Connected accounts: Google, Apple, Discord.
- 2FA with backup codes.
- Active sessions and devices, with sign out per device.
- Language (TR, EN).
- Theme: system, light, or dark.
- Time zone.

**Notifications**
- Per event, by email or push:
  - Generation finished
  - Low credits
  - Billing
  - Security
  - Comments, likes, and follows
  - Product news
  - Tips
- Billing and security emails are locked on.

**Data**
- Export my data.
- Delete account: red row at the bottom, type your email to confirm, blocked while a subscription is active.

---

## Sources
- Higgsfield account: https://higgsfield.ai/creator-hub/help-center/getting-started/whats-in-my-higgsfield-account
- Higgsfield auto-refill: https://higgsfield.ai/creator-hub/help-center/credits-and-usage/how-does-auto-refill-work
- Runway workspace settings: https://help.runwayml.com/hc/en-us/articles/10282588336915-Workspace-settings
- Runway notifications: https://help.runwayml.com/hc/en-us/articles/4402074756499-Managing-browser-and-email-notifications
- Runway Enterprise credits: https://help.runwayml.com/hc/en-us/articles/32117491177619-Enterprise-Credits
- Krea teams: https://www.krea.ai/docs/features/teams
- Krea API keys and billing: https://www.krea.ai/docs/developers/api-keys-and-billing.md
- Krea compute units: https://www.krea.ai/docs/user-guide/help-and-support/compute-units.md
- Krea manage subscriptions: https://www.krea.ai/docs/user-guide/help-and-support/manage-subscriptions.md
- Krea docs index: https://www.krea.ai/docs/llms.txt
- Midjourney Stealth: https://docs.midjourney.com/docs/stealth
- Midjourney subscription: https://docs.midjourney.com/hc/en-us/articles/28014179406861-Managing-Your-Subscription
- Midjourney privacy guide: https://joindeleteme.com/ai-privacy-settings/midjourney-privacy-settings-guide/
- Leonardo Teams FAQ: https://intercom.help/leonardo-ai/en/articles/9393396-teams-faq
- Leonardo team management: https://intercom.help/leonardo-ai/en/articles/13458813-managing-your-leonardo-ai-team
- Leonardo delete account: https://intercom.help/leonardo-ai/en/articles/9665417-how-do-i-delete-my-account
- Leonardo NSFW guide: https://docs.leonardo.ai/docs/guide-to-handling-not-safe-for-work-image-generation-nsfw
- Kling credits policy: https://kling.ai/docs/point-policy
- ElevenLabs account: https://elevenlabs.io/docs/overview/administration/account.mdx
- ElevenLabs billing: https://elevenlabs.io/docs/overview/administration/billing.mdx
- ElevenLabs usage analytics: https://elevenlabs.io/docs/overview/administration/usage-analytics.md
- ElevenLabs retention: https://elevenlabs.io/docs/eleven-agents/customization/privacy/retention
- Suno song visibility: https://help.suno.com/en/articles/2551361
- Suno delete account: https://help.suno.com/en/articles/3480577
- Pika pricing: https://pika.art/pricing
- Freepik AI credits and limits: https://www.freepik.es/ai/docs/ai-credits-and-limits
- Apple ID web redesign: https://appleinsider.com/articles/21/11/04/apple-redesigns-its-apple-id-webpage-with-cleaner-look
- iOS 26.4 Apple Account sheets: https://9to5mac.com/2026/04/17/ios-26-4-revamps-apple-account-pages-inside-apps-with-new-design/
