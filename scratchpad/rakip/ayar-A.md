# Settings teardown A: ChatGPT, Claude.ai, Linear, Vercel, GitHub, Notion, Figma

Research date: 2026-10-28. Sources are official docs and help centers where I could reach them (Linear docs, Vercel docs, Notion help, Figma developer docs and help, OpenAI help), plus third-party guides and my own knowledge of these UIs. These products ship changes often, so exact labels can differ slightly from what is live today. Lines marked (inferred) are less certain.

Purpose: input for rebuilding Vayra's `/panel/ayarlar` (AI creative platform with image, video, music and 3D generation, credits and subscription plans).

---

## 1. ChatGPT (settings modal)

### Layout and navigation
- A **centered modal** opens from the avatar menu and covers the app with a dimmed backdrop. It is about 680 to 800 px wide with a fixed height. The **left rail** is a flat list of icon and label items with no group headings. The **right pane** shows the section title plus a divided list of rows.
- The URL gets a hash (`#settings/Personalization`), so each section is deep-linkable. This matters: help articles and emails link straight to a section.
- There is no search inside settings.
- On mobile the rail becomes a full-screen list that drills into each section (push navigation).
- Section order, roughly (2025-2026): **General, Notifications, Personalization, Apps (Apps & Connectors), Schedules, Data controls, Security, Parental controls, Account**. On Business and Enterprise there are extra workspace items (Members, Billing, Workspace settings, GPTs).

### Sections and contents
- **General**: Theme (System / Dark / Light), **Accent color** (a palette of about 6 colors), Language (Auto-detect or a list), Spoken language (for voice), Voice picker with a **Play** preview button, Show additional models, Show follow-up suggestions, and Archived chats / Archive all / Delete all (these moved between General and Data controls over time).
- **Notifications**: one row per category (Responses, Tasks, Projects, Recommendations, Usage). Each row has a dropdown: Push / Email / Push + Email / Off.
- **Personalization**:
  - Base style and tone preset (Default, Professional, Friendly, Candid, Quirky, Efficient, Nerdy, Cynical). Characteristic sliders/toggles such as Warm, Enthusiastic, Headers & lists, Emoji (inferred).
  - Custom instructions: a multi-line text field "What traits should ChatGPT have", plus Nickname ("What should ChatGPT call you"), Occupation, "More about you".
  - Memory block: "Reference saved memories" toggle, "Reference chat history" toggle, and a **Manage memories** button that opens a nested modal. The nested modal is a list of memory items with a trash icon each, plus a search box and "Delete all".
  - Advanced: toggles for capabilities (Web search, Canvas, Code, Advanced voice, Connector search).
- **Apps / Connectors**: a grid or list of connected apps (Google Drive, GitHub, Gmail…). Each has Connect / Disconnect. Permission level per app: Always ask through Allow all actions. "Allow all actions" carries a warning that it is higher risk. Advanced: developer mode for custom MCP connectors.
- **Schedules**: list of scheduled tasks with run times; edit, pause, or delete each.
- **Data controls**: "Improve the model for everyone" (opens a sub-dialog with a toggle and explanation), Remote browser data (for agent mode), Shared links → Manage (a table of shared links with delete), Archived chats → Manage, Archive all chats, Delete all chats, **Export data** (button, then a confirm dialog; an emailed download link arrives later).
- **Security**: Multi-factor authentication (authenticator app, SMS; toggle that opens a QR setup flow), Passkeys (inferred), Trusted devices (inferred), **Log out of this device**, **Log out of all devices** (confirm dialog), and "Sign in with ChatGPT" to third-party apps.
- **Parental controls**: link a teen account, quiet hours, disable memory, voice, or image generation for the teen, and safety notifications.
- **Account**: Subscription (plan name, Manage button that opens Stripe or the in-app plans view, Cancel), Payment (Manage), GPT builder profile (name display, website domain verification, LinkedIn/GitHub links, receive feedback emails), **Delete account** (red button).

### Row and control design
- Each row: label left, control right (dropdown, toggle, or small outlined button), rows separated by thin dividers, no cards. Descriptions are rare; an info "i" or a tooltip is used instead.
- **Auto-save** everywhere. Toggles apply instantly. Text fields (custom instructions) open in a sub-dialog with Cancel and **Save**.
- Destructive actions such as "Delete all chats" and "Delete account" use a red outlined or filled small button inside the same list, with no separate danger zone. Delete account opens a confirm dialog: type your email and the word "DELETE", and you may need to have logged in recently ("re-login if your session is older than 10 minutes").

### Delightful details
- Voice picker with a live audio preview.
- Accent color changes the send button and links instantly.
- Memory items are human-readable sentences and can be deleted one by one.
- "Export data" reassures with "you'll receive an email with your data".

---

## 2. Claude.ai (settings page)

### Layout and navigation
- A **full page** at `/settings/*`, not a modal. It has a left tab list (vertical rail on desktop, horizontal scrolling tabs on mobile) with no group headings, and a centered content column (max about 760 px).
- Order: **General, Account, Privacy, Billing, Usage, Capabilities, Connectors, Claude Code** (plus Organization / Members / Admin settings for Team or Enterprise). Each tab has its own URL (`/settings/billing`, `/settings/usage`).
- There is no search.

### Sections and contents
- **General**:
  - Profile: avatar (initials), Full name, "What should Claude call you?", "What best describes your work?" (dropdown).
  - "Personal preferences": a free-text box Claude takes into account in all chats.
  - Notifications: toggles for "Response completions" (browser notification when a long response finishes) and email for Claude Code / task completion.
  - Appearance: Color mode shown as **three visual thumbnail cards** (Light / Auto / Dark), plus Chat font as visual cards (Default, Sans, System, **Dyslexic friendly**).
  - Voice settings (inferred).
- **Account**: Log out of all devices, **Delete account**, Organization ID (copyable).
- **Privacy**: "Help improve Claude" toggle (model training), location metadata toggle, **Export data** (a download link is emailed), shared chats management, links to the privacy policy and data usage pages.
- **Billing**: current plan card (Pro / Max 5x / Max 20x), Adjust plan / Cancel, payment method (Stripe), invoices list with View links, **Extra usage** (enable pay-as-you-go above plan limits, monthly spend cap), and gift or redeem options (inferred).
- **Usage**: **progress bars** for "Current session" (5-hour window) and "Weekly limits" (all models, and Opus-only) with "Resets in 3 hr 12 min" or "Resets Thu 9:00 AM" captions and a "Last updated" timestamp. This is the most relevant pattern for Vayra's credits.
- **Capabilities**:
  - Memory: "Search and reference chats" toggle, "Generate memory from chat history" toggle, View / edit memory, and import memory from other AI providers.
  - Artifacts and "AI-powered artifacts" toggles.
  - "Code execution and file creation" toggle, with network egress options.
  - Skills: a list of skills with toggles, plus upload a custom skill.
  - Each toggle has a one-line description and sometimes a "Preview" badge.
- **Connectors**: list of connected tools (Google Drive, Gmail, Calendar, GitHub, custom MCP). Each row shows logo, name, status ("Connected"), and Connect / Disconnect / Configure. "Browse connectors" opens a directory, and "Add custom connector" takes a URL.
- **Claude Code**: settings for Claude Code on the web (environments, GitHub connection).

### Row and control design
- Sections are separated by headings and thin dividers. Rows: label plus muted description on the left, control (toggle / button / select) on the right.
- Profile text fields use an explicit save. Toggles auto-save, with a toast on some.
- Delete account: a button in the Account tab opens a modal that explains the consequences (an active subscription must be cancelled first) and asks you to type a confirmation. This is low-key, with no red-bordered zone.

### Delightful details
- Visual theme and font cards (preview the look instead of reading words).
- Usage bars with a **human reset time**.
- "Dyslexic friendly" font option, an accessibility signal.
- Memory import from other assistants lowers switching cost.

---

## 3. Linear (settings)

### Layout and navigation
- A **full-screen settings mode**: the main sidebar is replaced by a settings sidebar with a "Back to app" arrow at top, so it feels like a separate area.
- The left rail uses **group headings**: **Account** (Preferences, Profile, Notifications, Security & access, Connected accounts / Code & reviews, Agent personalization) / **Administration** or **Workspace** (General, Members, Teams, Billing, Security, API, Applications, Integrations, Import/export, Labels, Templates, SLAs, Emojis, Plans) / **Your teams** (each team expands to its own settings) / **Features** (Initiatives, Projects, Cycles, Triage, AI, Customer requests, Pulse…).
- Settings are reachable from the **command menu** (Cmd+K, type "theme"). That acts as settings search.
- Every page has a clean URL (`/settings/account/preferences`).

### Sections and contents (account level)
- **Preferences**:
  - General: Default home view (dropdown), Display names (full name or username), First day of the week, Convert text emoticons into emojis (toggle), "Send comment on" (Cmd+Enter vs Enter).
  - Interface and theme: Font size, "Use pointer cursors" toggle, "Show links as underlined text" toggle, Theme (Light / Dark / System, plus presets and a **custom theme builder** with base, accent, and contrast sliders, shareable through linear.style).
  - Desktop app: open Linear links in the desktop app, notification badge on app icon, spell check.
  - Automations and workflows: auto-assign to self on create, auto-assign when moved to started, Git branch format (Code & reviews page).
- **Profile**: avatar upload, full name, username, email (change with verification), and **Leave workspace** (danger).
- **Notifications**: per-channel matrix (Desktop / Mobile push / Email / Slack). Rows per event type (assigned to me, mentions, status changes, comments, reactions, SLA…). There is an email digest frequency and "Delay low-priority emails" or "only when offline" (inferred).
- **Security & access**:
  - Sessions list: device/browser, location, source type, last seen, Revoke per session plus "Revoke all other sessions". Inactive sessions expire after 30 days.
  - Passkeys: register multiple devices.
  - Personal API keys: create with name, scope, and team restriction; shown once.
  - Authorized applications (OAuth apps): Revoke.
  - Security emails for new sessions and API key changes.
- **Connected accounts**: GitHub, GitLab, Slack, Google, Figma, Sentry personal links.

### Row and control design
- Signature Linear "**setting card**": a rounded bordered container that groups rows, with hairline dividers. Each row has a title (medium weight), a one-line muted description, and a right-aligned compact control (segmented select or toggle). Section titles sit outside and above the card.
- **Auto-save on everything**, with no Save buttons except for name/username fields, which save on blur. A tiny toast confirms some changes.
- Danger actions (delete workspace, leave) sit at the bottom as a separate card with a red button. Confirmation uses a modal that sometimes requires typing the workspace name.

### Delightful details
- Theme changes repaint instantly. The custom theme generator has live preview.
- Every setting is reachable from Cmd+K.
- Keyboard shortcuts: `?` opens a shortcuts sheet (not in settings but linked).
- Dense, quiet, high-contrast typography with no heavy shadows. It feels like a native app.

---

## 4. Vercel (account settings)

### Layout and navigation
- A **full page**. Account settings (`/account`) are separate from team settings (`/[team]/settings`). Left vertical nav with no groups.
- Account: **General, Authentication, Login Connections (merged into Authentication), Notifications, Tokens, Sessions (inferred), Billing (for Hobby), Invoices**.
- A newer dashboard has a settings **search/filter** input at the top of the left nav (inferred for teams).

### Sections and contents
- **General**:
  - Avatar: click to upload with a crop dialog ("Set Avatar").
  - Username: max 48 chars, URL namespace `vercel.com/<username>`, prefix shown in the input.
  - Display name.
  - Emails: up to 3. Add Another, verify by link, "…" menu with Set as Primary / Delete; primary cannot be deleted.
  - Phone number.
  - Default team (dropdown).
  - Vercel ID (copy).
  - Delete personal account (danger).
- **Authentication**: login connections (GitHub / GitLab / Bitbucket / Google / email) with Connect / Disconnect, passkeys ("Add New" → Passkey → Continue), and 2FA (TOTP plus recovery codes) in newer versions. SAML SSO is team-level.
- **Notifications**: per-category email and web toggles (deployments, comments, usage alerts, billing).
- **Tokens**: create a token with name, scope (team), and expiration (1 day / 7 / 30 / 90 / 180 / 1 year / no expiration). The token is shown once in a modal. The list shows name, scope, created date, last used, and expires, with a Delete button. Token formats are prefixed and covered by secret scanning.
- **Billing / Usage** (team): usage graphs per resource with a "X of Y used" bar, spend management (budget with hard stop and alerts at 50/75/100%), invoices list.

### Row and control design
- Famous **Vercel settings card** (from Geist): each setting is its own bordered card containing a title, description, and input. A **card footer** with a muted background holds helper text on the left ("Please use 48 characters at maximum.") and a **Save** button on the right. Save is disabled until the value changes.
- So there is an **explicit save per card**, not per page. This is clear and independent.
- **Danger zone**: the last card has a red border and a red footer button "Delete Personal Account". The confirm modal asks you to type your username and then the phrase "delete my account", and it lists consequences.

### Delightful details
- The help line in the card footer reads like documentation.
- Copy buttons on IDs.
- Token "Last used" timestamps.
- Spend alerts at threshold percentages.

---

## 5. GitHub (settings)

### Layout and navigation
- A **full page** at `/settings/*`. The left sidebar has a **user header** (avatar, name, "Your personal account", "Go to your personal profile" button) and **group headings** with icons:
  - (top) Public profile, Account, Appearance, Accessibility, Notifications
  - **Access**: Billing and licensing, Emails, Password and authentication, Sessions, SSH and GPG keys, Organizations, Enterprises, Moderation
  - **Code, planning, and automation**: Repositories, Codespaces, Packages, Copilot, Pages, Saved replies
  - **Security**: Code security, Advanced Security
  - **Integrations**: Applications, Scheduled reminders
  - **Archives**: Security log, Sponsorship log
  - Developer settings (link at bottom)
- An org/account switcher sits at the top of the content ("Switch settings context").
- There is no in-page search. The global command palette (Ctrl+K) finds settings pages.

### Sections and contents
- **Public profile**: name, public email (select from verified), bio, pronouns, URL, social accounts (up to 4), company, location, display local time + timezone, ORCID, profile picture (upload/crop), contributions & activity (private contributions toggle, activity overview), achievements toggle, hiring status.
- **Account**: change username (warning dialog about redirects), link Patreon, export account data (migration archive; emailed link), successor settings, **Danger zone** (Delete your account).
- **Appearance**: theme mode (Single theme / Sync with system); separate day and night theme pickers shown as **visual preview cards** (Light, Light high contrast, Light Protanopia & Deuteranopia, Light Tritanopia, Dark, Dark dimmed, Dark high contrast, Dark colorblind variants…); emoji skin tone; tab size preference; markdown editor font (monospace toggle).
- **Accessibility**: character keys shortcuts (disable / modify), command palette shortcuts, link underlines, hovercards, motion (reduce motion: sync with system or enabled), autoplay animated images.
- **Notifications**: default notification email; Subscriptions (watching, participating & @mentions); delivery checkboxes per type (on GitHub / Email / CLI), custom routing per org email; Actions notifications; Dependabot alerts; email notification preferences (comments, PR reviews, PR pushes, own updates).
- **Billing and licensing**: overview, usage graphs, budgets & alerts, payment information, payment history, licensing, additional billing emails.
- **Emails**: add email, primary email select, backup email, "Keep my email addresses private" (noreply alias), "Block command line pushes that expose my email", email preferences (marketing, receive all/only transactional).
- **Password and authentication**: change password; **passkeys** (add, rename, last used, nudge "Upgrade to passkey"); 2FA (authenticator app, SMS, security keys, GitHub Mobile, preferred 2FA method, **recovery codes** with view, download, print, and copy, plus regenerate); sudo mode.
- **Sessions**: web sessions list (device, location, last active, "See more" with revoke), GitHub Mobile sessions.
- **SSH and GPG keys**: list with fingerprint, added date, last used, Delete; vigilant mode toggle.
- **Applications**: Installed GitHub Apps, Authorized GitHub Apps, Authorized OAuth Apps (each Revoke, plus "Revoke all").
- **Security log**: searchable audit log of account events (export CSV/JSON).
- **Developer settings**: GitHub Apps, OAuth Apps, Personal access tokens (fine-grained with resource owner, expiry, repository access, granular permissions; and classic tokens).

### Row and control design
- **Subhead** pattern: section title in large type with a bottom border, then form groups (label bold, input, note text below).
- **Explicit "Update profile" / "Save" buttons** per form. Toggles and radios in Appearance and Accessibility auto-save with a small "Saved" checkmark flash next to the control.
- **Danger zone**: a red-bordered box titled "Danger zone" (Account and repo settings). Each row has a title, description, and red outline button. The confirm modal requires typing a phrase ("delete my account") and your username plus password, and lists what will be deleted.
- **Sudo mode**: sensitive actions (adding keys, deleting) re-prompt for password/passkey and stay valid for about 2 hours.

### Delightful details
- Theme preview cards render a mini GitHub UI in each theme.
- "Saved" inline flashes next to each auto-saved control.
- Recovery code download as a .txt with print option.
- Security log gives users transparency.
- "Last used" on passkeys, keys, and tokens.

---

## 6. Notion (settings & members modal)

### Layout and navigation
- A **large modal** (about 1150 x 715) with a light-gray left rail and a white content pane. The rail has **group headings**:
  - **Account**: user header (avatar + name + email), then **Account** (My account), **Preferences**, **Notifications**, **Connections**
  - **Workspace**: General, People (members/guests/groups), Teamspaces, Security, Identity, Notion AI, Public pages, Emoji, Connections, Import, Billing/Upgrade, Analytics, Audit log
  - "Upgrade plan" CTA highlighted at the bottom of the rail
- Order: account first, workspace second. Each rail item has a small icon.
- There is no settings search (Notion's main search finds pages).

### Sections and contents
- **Account (My account)**:
  - Photo (click avatar → upload / remove), Preferred name.
  - Account security: email (Manage emails: up to 5, verify by code, Make primary / Remove), Password (Set / Change / Remove), **2-step verification** (Add verification method: authenticator app, SMS; backup codes), **Passkeys** (add, list, delete).
  - Support: support access toggle ("Grant Notion support temporary access to your account", inferred).
  - **Log out of all devices**.
  - **Delete my account** (red text link at the bottom).
  - Devices section listing logged-in devices with location and last active, plus Log out per device (2024+).
- **Preferences**:
  - Appearance (Use system / Light / Dark), High contrast (system / standard / high).
  - "Open links in desktop app".
  - Language & Time: Language dropdown, "Start week on Monday" toggle, Date format and Relative time (inferred), Time zone (auto toggle or manual).
  - Desktop app: on startup, Command Search toggle, menu bar icon, shortcuts, New tab search, open links in browser, desktop beta.
  - Privacy: Cookie settings, "Show my view history" (record / don't record), Profile discoverability toggle.
- **Notifications**: Slack notifications (choose workspace), Mobile push notifications (activity in workspace / always), Email notifications toggles: Activity in your workspace, Always send email notifications, Page updates, Workspace digest, Announcements and update emails (Manage settings link).
- **Connections**: connected integrations (Slack, GitHub, Google Drive, Figma, Jira…) as cards with a "…" menu (Disconnect, Settings), plus a "Browse connections" gallery.
- **Workspace / People**: members table (name, email, role dropdown: Workspace owner / Member / Guest), search, invite link with reset, Add members, Groups tab.
- **Billing**: plan card, AI add-on, invoices, payment method, billing email, tax ID.

### Row and control design
- Rows: label (14 px, medium) plus muted description below on the left; control on the right (toggle, dropdown "Use system setting ⌄", or a button "Change password"). Rows are separated by vertical spacing, not dividers, and sub-sections have small gray headings with a thin rule.
- **Auto-save** for everything. The name field saves on blur.
- Destructive actions: "Delete my account" is red text with no zone. The confirm modal requires typing your email, lists the workspaces that will also be deleted (if you are the sole owner), and shows a red "Permanently delete account" button. "Log out of all devices" asks for confirmation.

### Delightful details
- Upgrade CTA embedded in the rail.
- Keyboard shortcut hints next to related settings (Cmd+Shift+L for dark mode).
- Language change shows a "Notion will reload" notice.
- The calm, airy rail with icons and a user header gives a sense of ownership.

---

## 7. Figma (account settings)

### Layout and navigation
- A **modal** opened from the account menu → Settings. It has **horizontal tabs** at the top rather than a left rail: **Account, Notifications, Security, Community** (tab names have shifted; older layouts had Account plus Notifications only, with security inside Account).
- The modal is narrow (about 640 px) and scrolls internally. There is no search.
- Team and organization admin settings live elsewhere, in a full page Admin area with left-rail tabs (Dashboard, Members, Teams, Billing, Settings, Activity).

### Sections and contents
- **Account**: profile photo (upload / remove), name, email (change → verification), handle (Community), password change, plan & seats overview (which team/org gives you which seat: Full, Dev, Collab, View), connected accounts (Google SSO), language (inferred), **Delete account** at the bottom.
- **Security**: **two-factor authentication** (authenticator app or SMS, plus recovery codes), **Personal access tokens** ("Generate new token" → modal with name, **expiration**, **scopes** per API area; the token is shown only once and Copy is required; the list shows "last used" and scopes on hover; Revoke access), **Connected apps / OAuth apps** (Revoke access), **Active sessions** ("Log out of all other sessions", inferred).
- **Notifications**: email notifications toggles (comments, mentions, invites, file updates, Community activity, product updates & tips, newsletter), in-app / push for the mobile app, and Slack integration (per team).
- **Community**: public profile (handle, bio, website, social links), "Show my profile in Community".
- In-editor preferences (separate from account settings, under Main menu → Preferences): theme (Light / Dark / System), nudge amount, snap to pixel grid, keyboard layout, "Use number keys for opacity", rename duplicated layers, flip scroll zoom, open links in desktop app, and **UI zoom / font size**. These are typically auto-saved toggles in a menu, not in the modal.

### Row and control design
- Settings rows: label left, small link-style action right ("Change email", "Change password", "Generate new token"). Clicking opens an inline sub-view or a small dialog inside the modal, with a back arrow, a form, and an explicit Save. This is a drill-in pattern inside the modal.
- Notifications use simple toggle lists that auto-save.
- Delete account: a red text link at the bottom of Account. The flow asks you to confirm by email, warns about files and teams you own (transfer ownership first), and requires the password.

### Delightful details
- Token creation scopes are grouped by API area, with expiration presets and a "Copy" button that turns into a checkmark.
- "Last used" shown for tokens.
- Clear separation between personal account settings (modal) and editor preferences (menu, live).

---

## Cross-product synthesis

### Navigation patterns
| Product | Container | Rail grouping | Search | Deep links |
|---|---|---|---|---|
| ChatGPT | Modal | Flat, icons | No | Hash URLs |
| Claude.ai | Page | Flat tabs | No | Yes |
| Linear | Full-screen mode | Group headings (Account / Workspace / Teams / Features) | Via Cmd+K | Yes |
| Vercel | Page | Flat; account vs team split | Filter (team) | Yes |
| GitHub | Page | Group headings with icons + user header | Via command palette | Yes |
| Notion | Large modal | Group headings (Account / Workspace) + user header + upgrade CTA | No | Partial |
| Figma | Small modal, top tabs | None | No | No |

Takeaway for Vayra: use a **page** (not a modal), because the panel is already app-like. Add a **left rail with 3-4 group headings** (e.g. Hesap / Üretim / Faturalandırma / Güvenlik), a user header at the top, deep-linkable URLs per section, and a quick settings filter (Cmd+K or an input at the top of the rail).

### Save models
- Auto-save toggles/selects with an instant visual result: ChatGPT, Linear, Notion, GitHub (Appearance).
- Explicit Save per card with a footer: Vercel (best for text fields).
- Hybrid (best practice): toggles, selects, and theme auto-save with a subtle "Kaydedildi" inline flash; text fields get a per-card Save that is disabled until dirty.

### Destructive zone
- GitHub and Vercel use a red-bordered danger card with a title, description, and red button, plus typed confirmation (username + phrase) and re-auth (sudo mode).
- ChatGPT and Notion use an in-list red button or link plus a modal with typed email.
- Consequences are listed explicitly (e.g. "your X files and Y credits will be lost", "cancel subscription first").

### Merged feature inventory (union of all 7)
**Profile**: avatar upload with crop, display name, username/handle with URL prefix, "what should we call you", occupation/role dropdown, bio, links, public profile toggle, copyable account ID.
**Preferences**: theme (Light / Dark / System) as **visual cards**, accent color, font / font size, high contrast, dyslexia-friendly font, reduce motion, link underlines, pointer cursor, language, timezone, first day of week, date format, default home view, desktop-app link handling, keyboard shortcut customization, send-on-Enter behavior.
**AI personalization (ChatGPT/Claude)**: custom instructions / personal preferences, tone presets, memory toggles + manage memories list + import memory, capability toggles (feature flags / beta "Preview" badges).
**Notifications**: per-event × per-channel matrix (email / push / in-app / Slack), digest frequency, product update/marketing opt-out separated from transactional, completion notifications for long jobs.
**Security**: password set/change/remove, 2FA (TOTP, SMS, security keys) with recovery codes (download/print/copy), passkeys (multiple, renamable, last used), sessions/devices list with revoke one/all, sudo/re-auth for sensitive actions, security email alerts for new logins, security/audit log.
**Connections & developer**: connected login providers, connected apps/OAuth with revoke, connector directory, personal API tokens (name, scopes, expiry presets, show-once, last used, revoke), webhooks (inferred).
**Data & privacy**: training opt-out, export all data (emailed archive), shared links manager, archived items, delete all content, view-history privacy, discoverability.
**Billing & usage**: plan card, change/cancel, payment method, invoices (download), billing email/tax ID, usage bars with reset time, extra/pay-as-you-go usage with spend cap, budget alerts at 50/75/100%, gift/redeem codes.
**Account lifecycle**: multiple emails with primary, change email with verification, leave workspace, transfer ownership, delete account with typed confirmation and consequences.

### Most relevant for Vayra (AI creative platform with credits)
1. **Usage page à la Claude**: credit balance bar, monthly allowance vs used, "Yenilenme: 3 gün 4 saat" reset caption, breakdown per modality (image/video/music/3D), recent spend list.
2. **Spend controls à la Vercel/Claude extra usage**: auto top-up toggle, monthly cap, alerts at 50/75/100%.
3. **Generation defaults** (the analogue of ChatGPT Personalization): default model per tool, default aspect ratio/resolution/duration, default style/negative prompt, auto-enhance prompt toggle, watermark, public/private by default, save prompts to history toggle.
4. **Visual theme cards** + accent color (the cyan signature stays default).
5. **Notifications for long jobs**: "video ready" push/email/browser notification (Claude's response-completion notifications).
6. **Security bundle**: sessions list + passkeys + 2FA + recovery codes + new-login email.
7. **Data**: export all generations (zip by email), training opt-out, shared links manager, bulk delete.
8. **API tokens** for power users (scopes, expiry, last used).
9. **Danger zone** at the end with typed confirmation and a consequence list (credits forfeited, subscription cancel first).
