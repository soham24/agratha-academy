// Prints SQL that loads the original website content (assets/cms/defaults.js)
// into an empty database. Usage:  node supabase/seed.mjs > seed.sql
// The admin panel can do the same thing with its "Load current website
// content" button, so this is only needed for scripted setups.

import {
  DEFAULT_SITE, DEFAULT_HOME_SECTIONS, DEFAULT_DISCLOSURE, DEFAULT_DISCLOSURE_SECTIONS,
} from '../assets/cms/defaults.js';

const q = (v) => `'${String(v ?? '').replace(/'/g, "''")}'`;
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;

const rows = [
  ...DEFAULT_HOME_SECTIONS.map((s, i) => ({ page: 'home', position: (i + 1) * 10, ...s })),
  ...DEFAULT_DISCLOSURE_SECTIONS.map((s, i) => ({ page: 'disclosure', position: (i + 1) * 10, ...s })),
];

console.log('begin;');
console.log(`insert into public.aa_settings (key, data) values
  ('site', ${j(DEFAULT_SITE)}),
  ('disclosure', ${j(DEFAULT_DISCLOSURE)})
on conflict (key) do nothing;`);
console.log(`insert into public.aa_sections (page, type, anchor, label, position, visible, data)
select * from (values
${rows.map((r) => `  (${q(r.page)}, ${q(r.type)}, ${q(r.anchor)}, ${q(r.label)}, ${r.position}, true, ${j(r.data)})`).join(',\n')}
) as v(page, type, anchor, label, position, visible, data)
where not exists (select 1 from public.aa_sections);`);
console.log('commit;');
