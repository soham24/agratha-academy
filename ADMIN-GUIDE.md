# Website admin panel — guide

The website can now be edited from a browser (phone or computer) at
**https://theagrathaacademy.in/admin/** — no coding needed.

## What can be edited

| Area | Where in the admin panel |
|---|---|
| Pop-up announcement when the site opens | **Announcements → New** (tick “Show as pop-up”) |
| Scrolling notice bar at the top | **Announcements** (tick “Show in the scrolling notice bar”) |
| Notice board section | **Announcements** (tick “Show on the notice board”) |
| Every section of the home page: text, photos, people, timings, results, contact… | **Home page → Edit** |
| Add a new section (video, photo gallery, text + photo, downloads/PDFs, staff directory, Google Form / map embed, banner…) | **Home page → + Add section** |
| Remove / hide / reorder sections | **Home page** (✕, the switch, ↑ ↓ arrows) |
| Mandatory Public Disclosure page (tables, PDFs, staff list, results, infrastructure) | **Disclosure page** |
| School name, logo, top menu, footer, WhatsApp button, Google title/description | **Menu, footer & site** |
| Upload photos, PDFs, videos | **Photos & files** (or the Upload button next to any photo field) |
| Who can log in | **Admins** |

Changes appear on the website as soon as you press **Save** (or Ctrl + S).

### Live preview
The Home page, Disclosure page and *Menu, footer & site* screens show a
**live preview** of the real page next to the form. On a phone, use the
**Edit / Preview** tabs.
- Everything you type shows in the preview straight away. Visitors see
  nothing until you press **Save**.
- **Click any part of the preview** to open that section's editor.
- Switch the preview between **Computer** and **Phone** size.
- Hidden sections appear faded in the preview. Visitors don't see them.
- **Undo changes** puts back the last saved version.

### Arranging sections
- Drag the **⋮⋮** handle to move a section. On phones, use the **⋯** menu:
  Move up / Move down.
- **⋯ → Add a section above/below** inserts a new section in that exact spot.
- The switch on each row shows or hides a section instantly.
- To add a photo, drop the file straight onto any photo box.

Announcements can be scheduled with **Start showing from** / **Stop
showing after**. They appear and disappear by themselves.

### Formatting in text boxes
- `*words*`: highlighted/italic. In headings this gives the gold or maroon accent.
- `**words**`: bold
- `[text](https://example.com)`: a link. Phone: `[Call us](tel:+919537331834)`
- An empty line starts a new paragraph.

## First-time setup (one time only)

1. Open `/admin/`, click **First time? Create account**, and sign up with
   an e-mail that is on the admin list. The developer's e-mail is on it to
   start with.
2. Click the confirmation link that arrives by e-mail, then log in.
3. Go to **Admins → Invite** and add the principal's e-mail. The principal
   then does steps 1–2 with their own e-mail.

### Supabase settings to check (developer)
In the Supabase dashboard for the **NAMASMARAN** project → *Authentication*:

- **URL Configuration → Redirect URLs**: add
  `https://theagrathaacademy.in/admin/`. Confirmation and password-reset
  e-mails then bring people back to the admin panel. Without this they land
  on the project's default *Site URL*. The account still gets confirmed.
- **Sign In / Providers → Email → Confirm email** must stay **ON**.
  Otherwise someone could sign up with an invited address they don't own.
- The built-in e-mail sender is limited to a few e-mails per hour. That's
  fine for a couple of admins. For more, set up custom SMTP under
  *Authentication → Emails*.

## How it works (developer notes)

- **Hosting:** GitHub Pages, unchanged. The site is still plain static files.
- **Backend:** Supabase (free tier). It shares the NAMASMARAN project, and
  every table is prefixed `aa_`:
  - `aa_sections`: page sections (`page` = `home` | `disclosure`, `type`, `position`, `visible`, `data` JSON)
  - `aa_settings`: `site` and `disclosure` settings JSON
  - `aa_announcements`: pop-up / ticker / notice board
  - `aa_admins`, `aa_admin_invites`: who may edit
  - Storage bucket `agratha-media`: uploaded files (max 50 MB each)
- **Security:** row-level security lets anyone *read* published content.
  Only signed-in users listed in `aa_admins` can write. See
  `supabase/migrations/0001_agratha_cms.sql`.
- **Public pages** (`index.html`, `mandatory-public-disclosure.html`) still
  contain the original HTML as a fallback. `assets/cms/site.js` /
  `disclosure.js` fetch the content and re-render it. They cache the last
  version in the browser, so repeat visits paint instantly.
- **Adding a new section type:** add its fields to `assets/cms/schema.js`
  and a renderer to `assets/cms/render-home.js` (or `render-disclosure.js`).
  The admin form is generated from the schema.
- `assets/cms/defaults.js` holds the original content. The admin panel's
  “Load current website content” button uses it on an empty database, and so
  does `node supabase/seed.mjs`.
- **Free-tier note:** Supabase pauses free projects after about a week with
  no traffic. Normal site visits count as traffic. If it ever pauses, the
  site shows the built-in fallback content until the project is resumed from
  the Supabase dashboard.
