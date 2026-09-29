/* ═══════════════════════════════════════════
   CONTENT SCHEMA
   Describes every editable thing on the site. The admin panel builds
   its forms from these definitions; the renderers read the same keys.

   Field types:
     text, textarea, rich, url, image, file, youtube, icon, select,
     bool, number, datetime, lines, list (with nested `fields`)
   ═══════════════════════════════════════════ */

import { ICON_OPTIONS } from './icons.js';

const HEADING_HELP = 'Wrap words in *stars* to highlight them. Press Enter for a new line.';
const TEXT_HELP = 'Leave an empty line between paragraphs. **bold**, *italic*, [link text](https://…)';

const kicker = { key: 'kicker', label: 'Small label above heading', type: 'text' };
const heading = { key: 'heading', label: 'Heading', type: 'textarea', rows: 2, help: HEADING_HELP };
const intro = { key: 'intro', label: 'Introduction', type: 'textarea', rows: 3 };
const iconField = { key: 'icon', label: 'Icon', type: 'icon', options: ICON_OPTIONS };

// ── Home page section types ──────────────────────────────────────
export const HOME_TYPES = {
  hero: {
    label: 'Hero banner (top of page)',
    description: 'Big welcome banner with background photo, buttons and highlights.',
    fields: [
      { key: 'tagline', label: 'Tagline (small text above heading)', type: 'text' },
      { key: 'heading', label: 'Main heading', type: 'textarea', rows: 2, help: HEADING_HELP },
      { key: 'subtitle', label: 'Sub-text', type: 'textarea', rows: 3 },
      { key: 'background', label: 'Background photo', type: 'image' },
      { key: 'buttons', label: 'Buttons', type: 'list', itemLabel: 'label', fields: [
        { key: 'label', label: 'Button text', type: 'text' },
        { key: 'href', label: 'Link', type: 'url', help: 'tel:+91…, #section-id, or a web address' },
        { key: 'style', label: 'Style', type: 'select', options: [
          { value: 'saffron', label: 'Solid orange' },
          { value: 'ghost', label: 'Outline' },
        ] },
      ] },
      { key: 'badges', label: 'Highlights', type: 'list', itemLabel: 'value', fields: [
        { key: 'value', label: 'Big text', type: 'text' },
        { key: 'label', label: 'Small text', type: 'text' },
      ] },
    ],
    defaults: { tagline: '', heading: 'Welcome to *Agratha.*', subtitle: '', background: '', buttons: [], badges: [] },
  },

  stats: {
    label: 'Numbers strip',
    description: 'A band of animated numbers (years, acres, classrooms…).',
    fields: [
      { key: 'items', label: 'Numbers', type: 'list', itemLabel: 'label', fields: [
        { key: 'number', label: 'Number', type: 'number' },
        { key: 'suffix', label: 'After number (e.g. +, %)', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
      ] },
    ],
    defaults: { items: [{ number: 100, suffix: '+', label: 'Years of Legacy' }] },
  },

  about: {
    label: 'About / text with photo',
    description: 'Heading, paragraphs, value tags and a photo with a badge.',
    fields: [
      kicker, heading,
      { key: 'lead', label: 'Opening paragraph (larger)', type: 'textarea', rows: 3 },
      { key: 'body', label: 'Paragraphs', type: 'textarea', rows: 8, help: TEXT_HELP },
      { key: 'values', label: 'Value tags (one per line)', type: 'lines' },
      { key: 'image', label: 'Photo', type: 'image' },
      { key: 'image_alt', label: 'Photo description (for accessibility)', type: 'text' },
      { key: 'badge_small', label: 'Photo badge – top text', type: 'text' },
      { key: 'badge_big', label: 'Photo badge – big text', type: 'text' },
      { key: 'badge_sub', label: 'Photo badge – bottom text', type: 'text' },
    ],
    defaults: { kicker: 'About', heading: 'About *us.*', lead: '', body: '', values: [], image: '', image_alt: '', badge_small: '', badge_big: '', badge_sub: '' },
  },

  vision: {
    label: 'Vision & mission cards',
    description: 'Dark band with a heading and three (or more) cards.',
    fields: [
      kicker, heading,
      { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
      { key: 'cards', label: 'Cards', type: 'list', itemLabel: 'title', fields: [
        iconField,
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'text', label: 'Text', type: 'textarea', rows: 3 },
      ] },
    ],
    defaults: { kicker: 'Our Purpose', heading: '', description: '', cards: [] },
  },

  leadership: {
    label: 'Leadership messages',
    description: 'Chairman / CEO / Principal messages and committee members.',
    fields: [
      { key: 'blocks', label: 'People', type: 'list', itemLabel: 'name', fields: [
        { key: 'layout', label: 'Layout', type: 'select', options: [
          { value: 'feature', label: 'Large message – photo left' },
          { value: 'feature-reverse', label: 'Large message – photo right' },
          { value: 'compact', label: 'Small message card' },
          { value: 'member', label: 'Committee member (photo card)' },
        ] },
        { key: 'photo', label: 'Photo', type: 'image' },
        { key: 'photo_position', label: 'Photo focus (e.g. center 20%)', type: 'text', help: 'Optional. Moves the crop of the photo.' },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'role', label: 'Role / designation', type: 'text' },
        { key: 'kicker', label: 'Small label (e.g. Message from the Chairman)', type: 'text', showIf: (b) => b.layout !== 'member' },
        { key: 'heading', label: 'Heading', type: 'textarea', rows: 2, help: HEADING_HELP, showIf: (b) => b.layout !== 'member' },
        { key: 'quote', label: 'Quote', type: 'textarea', rows: 3 },
        { key: 'body', label: 'Message paragraphs', type: 'textarea', rows: 6, help: TEXT_HELP, showIf: (b) => b.layout !== 'member' },
      ] },
    ],
    defaults: { blocks: [] },
  },

  academics: {
    label: 'Academics & timings',
    description: 'Class timings cards and board results.',
    fields: [
      kicker, heading, intro,
      { key: 'schedules', label: 'Timing cards', type: 'list', itemLabel: 'title', fields: [
        { key: 'badge', label: 'Badge', type: 'text' },
        { key: 'title', label: 'Classes', type: 'text' },
        { key: 'days', label: 'Days', type: 'text' },
        { key: 'time', label: 'Time', type: 'text' },
        { key: 'note', label: 'Note', type: 'textarea', rows: 2 },
        { key: 'color', label: 'Colour', type: 'select', options: [
          { value: 'saffron', label: 'Orange' }, { value: 'maroon', label: 'Maroon' },
        ] },
      ] },
      { key: 'results_label', label: 'Results heading', type: 'text' },
      { key: 'results', label: 'Results', type: 'list', itemLabel: 'value', fields: [
        { key: 'value', label: 'Big text', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'note', label: 'Note', type: 'text' },
      ] },
    ],
    defaults: { kicker: 'Academics', heading: '', intro: '', schedules: [], results_label: '', results: [] },
  },

  admissions: {
    label: 'Admissions',
    description: 'Age table, admission steps and info cards.',
    fields: [
      kicker, heading,
      { key: 'lead', label: 'Introduction', type: 'textarea', rows: 3 },
      { key: 'age_label', label: 'Age table heading', type: 'text' },
      { key: 'ages', label: 'Age table rows', type: 'list', itemLabel: 'class', fields: [
        { key: 'class', label: 'Class', type: 'text' },
        { key: 'age', label: 'Minimum age', type: 'text' },
      ] },
      { key: 'age_note', label: 'Note under age table', type: 'text' },
      { key: 'process_label', label: 'Process heading', type: 'text' },
      { key: 'steps', label: 'Admission steps', type: 'list', itemLabel: 'title', fields: [
        { key: 'title', label: 'Step title', type: 'text' },
        { key: 'text', label: 'Description', type: 'textarea', rows: 2 },
      ] },
      { key: 'cta_label', label: 'Button text', type: 'text' },
      { key: 'cta_href', label: 'Button link', type: 'url', showIf: (d) => !!d.cta_label },
      { key: 'badge', label: 'Green badge text (e.g. Enrolments Open)', type: 'text' },
      { key: 'cards', label: 'Info cards', type: 'list', itemLabel: 'title', fields: [
        iconField,
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'text', label: 'Text', type: 'textarea', rows: 2 },
      ] },
      { key: 'hours', label: 'Office hours', type: 'text' },
      { key: 'phone', label: 'Phone number', type: 'text' },
    ],
    defaults: { kicker: 'Admissions', heading: '', lead: '', age_label: 'Age Eligibility', ages: [], age_note: '', process_label: 'Admission Process', steps: [], cta_label: '', cta_href: '#contact', badge: '', cards: [], hours: '', phone: '' },
  },

  testimonials: {
    label: 'Testimonials',
    description: 'Parent quotes: one featured plus cards.',
    fields: [
      kicker, heading,
      { key: 'subhead', label: 'Introduction', type: 'textarea', rows: 2 },
      { key: 'featured_quote', label: 'Featured quote', type: 'textarea', rows: 4 },
      { key: 'featured_name', label: 'Featured – name', type: 'text' },
      { key: 'featured_role', label: 'Featured – role', type: 'text' },
      { key: 'items', label: 'Quote cards', type: 'list', itemLabel: 'name', fields: [
        { key: 'quote', label: 'Quote', type: 'textarea', rows: 3 },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'role', label: 'Role', type: 'text' },
        { key: 'stars', label: 'Stars (1–5)', type: 'number' },
      ] },
    ],
    defaults: { kicker: 'What Parents Say', heading: '', subhead: '', featured_quote: '', featured_name: '', featured_role: '', items: [] },
  },

  activities: {
    label: 'Activities (photo cards)',
    description: 'Photo cards with a title and a short description.',
    fields: [
      kicker, heading, intro,
      { key: 'items', label: 'Cards', type: 'list', itemLabel: 'title', fields: [
        { key: 'image', label: 'Photo', type: 'image' },
        { key: 'alt', label: 'Photo description', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'text', label: 'Text', type: 'textarea', rows: 2 },
      ] },
    ],
    defaults: { kicker: 'Co-Curricular', heading: '', intro: '', items: [] },
  },

  campus: {
    label: 'Campus facilities',
    description: 'Two photos and facility cards with icons.',
    fields: [
      kicker, heading, intro,
      { key: 'photos', label: 'Photos', type: 'list', itemLabel: 'alt', fields: [
        { key: 'image', label: 'Photo', type: 'image' },
        { key: 'alt', label: 'Photo description', type: 'text' },
      ] },
      { key: 'facts', label: 'Facilities', type: 'list', itemLabel: 'title', fields: [
        iconField,
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'text', label: 'Text', type: 'textarea', rows: 2 },
      ] },
    ],
    defaults: { kicker: 'Campus', heading: '', intro: '', photos: [], facts: [] },
  },

  gallery: {
    label: 'Photo gallery',
    description: 'Grid of photos that open full-screen when clicked.',
    fields: [
      kicker, heading, intro,
      { key: 'images', label: 'Photos', type: 'list', itemLabel: 'caption', fields: [
        { key: 'image', label: 'Photo', type: 'image' },
        { key: 'caption', label: 'Caption', type: 'text' },
        { key: 'size', label: 'Size', type: 'select', options: [
          { value: '', label: 'Normal' }, { value: 'wide', label: 'Wide' }, { value: 'tall', label: 'Tall' },
        ] },
      ] },
    ],
    defaults: { kicker: 'Gallery', heading: 'Moments at *Agratha.*', intro: '', images: [] },
  },

  video: {
    label: 'Video',
    description: 'Play a YouTube video on the page.',
    fields: [
      kicker, heading,
      { key: 'text', label: 'Text', type: 'textarea', rows: 3, help: TEXT_HELP },
      { key: 'video', label: 'YouTube link', type: 'youtube', help: 'On YouTube, press Share → Copy link, then paste it here. The video must be Public or Unlisted.' },
      { key: 'theme', label: 'Background', type: 'select', options: [
        { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' },
      ] },
    ],
    defaults: { kicker: 'Watch', heading: 'Life at *Agratha.*', text: '', video: '', theme: 'dark' },
  },

  text: {
    label: 'Text block (with optional photo)',
    description: 'Free-form section: heading, formatted text, optional photo and button.',
    fields: [
      kicker, heading,
      { key: 'body', label: 'Text', type: 'rich', rows: 10, help: 'Empty line = new paragraph. "- " starts a bullet, "1. " a numbered list, "## " a sub-heading. **bold**, *italic*, [link](https://…)' },
      { key: 'image', label: 'Photo (optional)', type: 'image' },
      { key: 'image_side', label: 'Photo position', type: 'select', showIf: (d) => !!d.image, options: [
        { value: 'right', label: 'Right' }, { value: 'left', label: 'Left' },
      ] },
      { key: 'button_label', label: 'Button text (optional)', type: 'text' },
      { key: 'button_href', label: 'Button link', type: 'url', showIf: (d) => !!d.button_label },
      { key: 'theme', label: 'Background', type: 'select', options: [
        { value: 'light', label: 'White' }, { value: 'cream', label: 'Cream' }, { value: 'dark', label: 'Dark' },
      ] },
    ],
    defaults: { kicker: '', heading: 'New *section.*', body: '', image: '', image_side: 'right', button_label: '', button_href: '', theme: 'light' },
  },

  notices: {
    label: 'Notice board',
    description: 'Lists the announcements marked "Show on notice board".',
    fields: [
      kicker, heading, intro,
      { key: 'limit', label: 'How many to show', type: 'number' },
      { key: 'empty_text', label: 'Text when there are no notices', type: 'text' },
    ],
    defaults: { kicker: 'Notice Board', heading: 'Latest *Announcements.*', intro: '', limit: 6, empty_text: 'No announcements right now. Please check back soon.' },
  },

  downloads: {
    label: 'Downloads (PDF list)',
    description: 'Circulars, forms, fee structure, calendars…',
    fields: [
      kicker, heading, intro,
      { key: 'items', label: 'Files', type: 'list', itemLabel: 'title', fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'text', label: 'Description', type: 'text' },
        { key: 'file', label: 'File', type: 'file' },
        { key: 'button', label: 'Button text', type: 'text' },
      ] },
    ],
    defaults: { kicker: 'Downloads', heading: 'Forms & *Circulars.*', intro: '', items: [] },
  },

  faculty: {
    label: 'Staff directory',
    description: 'Grid of staff names with filter buttons by role.',
    fields: [
      kicker, heading, intro,
      { key: 'staff', label: 'Staff', type: 'list', itemLabel: 'name', fields: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'detail', label: 'Qualification / subject', type: 'text' },
        { key: 'role', label: 'Role (used for the filter)', type: 'text' },
      ] },
    ],
    defaults: { kicker: 'Our Faculty', heading: 'Meet our *teachers.*', intro: '', staff: [] },
  },

  cta: {
    label: 'Call-to-action banner',
    description: 'Coloured banner with a heading, text and one button.',
    fields: [
      kicker,
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'text', label: 'Text', type: 'textarea', rows: 2 },
      { key: 'button_label', label: 'Button text', type: 'text' },
      { key: 'button_href', label: 'Button link', type: 'url', showIf: (d) => !!d.button_label },
      { key: 'new_tab', label: 'Open link in new tab', type: 'bool', showIf: (d) => !!d.button_label },
    ],
    defaults: { kicker: '', heading: 'Heading', text: '', button_label: 'Learn more', button_href: '#', new_tab: false },
  },

  contact: {
    label: 'Contact',
    description: 'Address and contact buttons (phone, e-mail, maps…).',
    fields: [
      kicker, heading,
      { key: 'text', label: 'Text', type: 'textarea', rows: 3 },
      { key: 'address', label: 'Address', type: 'textarea', rows: 2 },
      { key: 'buttons', label: 'Contact buttons', type: 'list', itemLabel: 'value', fields: [
        { key: 'icon', label: 'Icon', type: 'select', options: [
          { value: 'phone', label: 'Phone' }, { value: 'mail', label: 'E-mail' },
          { value: 'map', label: 'Map' }, { value: 'whatsapp', label: 'Chat / WhatsApp' },
        ] },
        { key: 'label', label: 'Small label', type: 'text' },
        { key: 'value', label: 'Main text', type: 'text' },
        { key: 'href', label: 'Link', type: 'url', help: 'tel:+91…, mailto:…, https://wa.me/91…, or a map link' },
        { key: 'primary', label: 'Highlight this button', type: 'bool' },
      ] },
      { key: 'map_embed', label: 'Google Map (optional)', type: 'url', help: 'In Google Maps: Share → Embed a map → copy only the https://www.google.com/maps/embed?… link.' },
    ],
    defaults: { kicker: 'Get in Touch', heading: '', text: '', address: '', buttons: [], map_embed: '' },
  },

  embed: {
    label: 'Embed (form, map, custom HTML)',
    description: 'Google Form, map or other embed code. Admins only – use trusted code.',
    fields: [
      kicker, heading, intro,
      { key: 'code', label: 'Embed code (HTML)', type: 'textarea', rows: 6, help: 'Paste the <iframe …> code from Google Forms, Maps, etc.' },
    ],
    defaults: { kicker: '', heading: '', intro: '', code: '' },
  },
};

// ── Disclosure page section types ────────────────────────────────
const discBase = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'subtitle', label: 'Subtitle', type: 'text' },
];
const miniStats = { key: 'stats', label: 'Number boxes', type: 'list', itemLabel: 'label', fields: [
  { key: 'value', label: 'Value', type: 'text' },
  { key: 'label', label: 'Label', type: 'text' },
] };
const infoRows = (key = 'rows', label = 'Rows') => ({ key, label, type: 'list', itemLabel: 'label', fields: [
  { key: 'label', label: 'Label', type: 'text' },
  { key: 'value', label: 'Value', type: 'textarea', rows: 2, help: 'Links: [text](https://…) · phone: [call](tel:+91…)' },
  { key: 'highlight', label: 'Highlight row', type: 'bool' },
] });

export const DISCLOSURE_TYPES = {
  disc_info: {
    label: 'Information table',
    description: 'Two-column table of label / value rows.',
    fields: [...discBase, infoRows()],
    defaults: { title: 'New section', subtitle: '', rows: [] },
  },
  disc_documents: {
    label: 'Documents (PDF list)',
    description: 'Certificates and documents with “View PDF” buttons.',
    fields: [...discBase,
      { key: 'items', label: 'Documents', type: 'list', itemLabel: 'title', fields: [
        iconField,
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'text', label: 'Description', type: 'text' },
        { key: 'files', label: 'Files', type: 'list', itemLabel: 'label', fields: [
          { key: 'label', label: 'Button text', type: 'text' },
          { key: 'url', label: 'File', type: 'file' },
        ] },
      ] },
    ],
    defaults: { title: 'Documents', subtitle: '', items: [] },
  },
  disc_results: {
    label: 'Results table',
    description: 'Number boxes, a results table and a note.',
    fields: [...discBase, miniStats,
      { key: 'rows', label: 'Table rows', type: 'list', itemLabel: 'class', fields: [
        { key: 'class', label: 'Class', type: 'text' },
        { key: 'stream', label: 'Stream', type: 'text' },
        { key: 'registered', label: 'Students registered', type: 'text' },
        { key: 'passed', label: 'Students passed', type: 'text' },
        { key: 'rate', label: 'Pass rate', type: 'text' },
        { key: 'year', label: 'Academic year', type: 'text' },
        { key: 'highlight', label: 'Highlight row', type: 'bool' },
      ] },
      { key: 'note', label: 'Note', type: 'textarea', rows: 3 },
    ],
    defaults: { title: 'Results', subtitle: '', stats: [], rows: [], note: '' },
  },
  disc_staff: {
    label: 'Staff list',
    description: 'Number boxes, principal and full staff table.',
    fields: [...discBase, miniStats,
      { key: 'principal_label', label: 'Principal table heading', type: 'text' },
      { key: 'principals', label: 'Principal', type: 'list', itemLabel: 'name', fields: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'designation', label: 'Designation', type: 'text' },
        { key: 'qualification', label: 'Qualification', type: 'text' },
      ] },
      { key: 'staff_label', label: 'Staff table heading', type: 'text' },
      { key: 'staff', label: 'Staff members', type: 'list', itemLabel: 'name', fields: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'qualification', label: 'Qualification', type: 'text' },
        { key: 'role', label: 'Role', type: 'text', help: 'PGT, TGT, PRT, Teacher, Admin, Support, Part-time…' },
      ] },
    ],
    defaults: { title: 'Staff Details', subtitle: '', stats: [], principal_label: 'Principal', principals: [], staff_label: 'Teaching Staff', staff: [] },
  },
  disc_infra: {
    label: 'Infrastructure grid',
    description: 'Facility boxes and an optional table.',
    fields: [...discBase,
      { key: 'items', label: 'Facility boxes', type: 'list', itemLabel: 'title', fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'check', label: 'Green tick text (optional, e.g. ✓ Available)', type: 'text' },
        { key: 'value', label: 'Detail', type: 'text' },
      ] },
      infoRows('rows', 'Extra table rows'),
    ],
    defaults: { title: 'Infrastructure', subtitle: '', items: [], rows: [] },
  },
  disc_text: {
    label: 'Text note',
    description: 'Free text section.',
    fields: [...discBase,
      { key: 'body', label: 'Text', type: 'rich', rows: 8 },
    ],
    defaults: { title: 'Note', subtitle: '', body: '' },
  },
};

export const SECTION_TYPES = { home: HOME_TYPES, disclosure: DISCLOSURE_TYPES };

// ── Site-wide settings ───────────────────────────────────────────
const linkFields = [
  { key: 'label', label: 'Text', type: 'text' },
  { key: 'href', label: 'Link', type: 'url', help: '#section-id for a section on the home page, or a full address' },
  { key: 'new_tab', label: 'Open in new tab', type: 'bool' },
];

export const SITE_SETTINGS_FIELDS = [
  { group: 'School identity' },
  { key: 'school_name', label: 'School name (header)', type: 'text' },
  { key: 'school_tagline', label: 'Small line under the name (header)', type: 'text' },
  { key: 'logo', label: 'Logo', type: 'image' },
  { group: 'Menu' },
  { key: 'nav', label: 'Top menu links', type: 'list', itemLabel: 'label', fields: [
    ...linkFields,
    { key: 'highlight', label: 'Show as highlighted button', type: 'bool' },
  ] },
  { group: 'Announcements' },
  { key: 'ticker_label', label: 'Label on the scrolling notice bar', type: 'text' },
  { key: 'ticker_enabled', label: 'Show the scrolling notice bar', type: 'bool' },
  { key: 'popup_enabled', label: 'Show pop-up announcements', type: 'bool' },
  { group: 'Footer' },
  { key: 'footer_name', label: 'Footer – school name', type: 'text' },
  { key: 'footer_lines', label: 'Footer – lines under name (one per line)', type: 'lines' },
  { key: 'footer_nav', label: 'Footer links', type: 'list', itemLabel: 'label', fields: linkFields },
  { key: 'motto', label: 'Motto', type: 'text' },
  { key: 'motto_translation', label: 'Motto translation', type: 'text' },
  { key: 'footer_tagline', label: 'Small line under motto', type: 'text' },
  { key: 'copyright', label: 'Copyright line', type: 'text' },
  { group: 'Floating WhatsApp button' },
  { key: 'whatsapp', label: 'WhatsApp number (with country code, e.g. 919537331834)', type: 'text', help: 'Leave empty to hide the button.' },
  { group: 'Search engines (Google)' },
  { key: 'seo_title', label: 'Browser tab / Google title', type: 'text' },
  { key: 'seo_description', label: 'Google description', type: 'textarea', rows: 3 },
];

export const DISCLOSURE_SETTINGS_FIELDS = [
  { key: 'brand_line', label: 'Top bar text', type: 'text' },
  { key: 'badge', label: 'Badge above title', type: 'text' },
  { key: 'title', label: 'Page title', type: 'text' },
  { key: 'intro', label: 'Introduction', type: 'textarea', rows: 3 },
  { key: 'updated', label: 'Last updated (e.g. May 2026)', type: 'text' },
  { key: 'sidebar_title', label: 'Sidebar – box title', type: 'text' },
  { key: 'sidebar_text', label: 'Sidebar – box text', type: 'textarea', rows: 3 },
  { key: 'footer', label: 'Footer text', type: 'textarea', rows: 5, help: 'Links: [text](https://…)' },
];

export const ANNOUNCEMENT_FIELDS = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'body', label: 'Message', type: 'textarea', rows: 5, help: TEXT_HELP },
  { key: 'image_url', label: 'Image / poster (optional)', type: 'image' },
  { key: 'link_url', label: 'Button link (optional)', type: 'url' },
  { key: 'link_label', label: 'Button text', type: 'text', showIf: (d) => !!d.link_url },
  { key: 'show_popup', label: 'Show as pop-up when the website opens', type: 'bool' },
  { key: 'show_ticker', label: 'Show in the scrolling notice bar', type: 'bool' },
  { key: 'show_on_board', label: 'Show on the notice board section', type: 'bool' },
  { key: 'pinned', label: 'Pin to top', type: 'bool' },
  { key: 'active', label: 'Active (published)', type: 'bool' },
  { key: 'starts_at', label: 'Start showing from (optional)', type: 'datetime' },
  { key: 'ends_at', label: 'Stop showing after (optional)', type: 'datetime' },
];
