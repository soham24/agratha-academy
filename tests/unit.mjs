globalThis.location = { host: 'theagrathaacademy.in' };
// Unit tests for the text/link/video helpers.  Run: node tests/unit.mjs
const { inline, videoEmbed, rich } = await import('../assets/cms/format.js');
const cases = [
  ['[a](https://x.com/*b*) and *em*', 'href="https://x.com/*b*"'],
  ['**bold** [Call](tel:+91123)', '<strong>bold</strong> <a href="tel:+91123">Call</a>'],
  ['[x](javascript:alert(1))', 'x'],
  ['<script>', '&lt;script&gt;'],
  ['[*Styled* label](https://a.in)', '<em>Styled</em> label</a>'],
  ['line1\nline2', 'line1<br>line2'],
  ['"quote" & it\'s', '&quot;quote&quot; &amp; it&#39;s'],
];
let bad = 0;
for (const [input, expect] of cases) {
  const out = inline(input);
  const ok = out.includes(expect) && !/[\u0000-\u0002]/.test(out);
  if (!ok) bad++;
  console.log(ok ? 'PASS' : 'FAIL', JSON.stringify(input), '→', out);
}
for (const [u, want] of [['https://youtu.be/dQw4w9WgXcQ','youtube-nocookie'],['https://www.youtube.com/shorts/dQw4w9WgXcQ','youtube-nocookie'],['https://vimeo.com/123','vimeo'],['javascript:x', null]]) {
  const v = videoEmbed(u); const ok = want ? v?.src.includes(want) : v === null; if (!ok) bad++;
  console.log(ok ? 'PASS' : 'FAIL', u, '→', v?.src ?? null);
}
const r = rich('## Head\n\n- a\n- b\n\n1. x\n2. y\n\nPara'); const ok = r.includes('<h3>Head</h3>') && r.includes('<ul><li>a</li>') && r.includes('<ol>'); if (!ok) bad++;
console.log(ok ? 'PASS' : 'FAIL', 'rich blocks');
console.log(bad ? `${bad} FAILED` : 'all unit tests passed');
process.exit(bad ? 1 : 0);
