const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'data.json');
try {
  let raw = fs.readFileSync(p, 'utf8');
  const state = JSON.parse(raw || '{}');
  const dedupe = (arr) => {
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    const out = [];
    for (const item of arr) {
      if (!item) continue;
      const key = item.id !== undefined ? String(item.id) : JSON.stringify(item);
      if (!seen.has(key)) { seen.add(key); out.push(item); }
    }
    return out;
  };
  state.exams = dedupe(state.exams || []);
  state.submissions = dedupe(state.submissions || []);
  state.users = dedupe(state.users || []);
  fs.writeFileSync(p, JSON.stringify(state, null, 2));
  console.log('Dedupe complete:', 'exams=', state.exams.length, 'subs=', state.submissions.length, 'users=', state.users.length);
} catch (e) {
  console.error('Dedupe failed', e.message);
  process.exit(1);
}
