const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

function load() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const init = { exams: [], submissions: [], users: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2));
      return init;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');

    // dedupe helper: keep first occurrence by id
    const dedupeById = (arr) => {
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

    parsed.exams = dedupeById(parsed.exams || []);
    parsed.submissions = dedupeById(parsed.submissions || []);
    parsed.users = dedupeById(parsed.users || []);

    // persist cleaned DB if it differs
    try {
      const cleaned = JSON.stringify(parsed, null, 2);
      if (cleaned !== raw) fs.writeFileSync(DB_FILE, cleaned);
    } catch (e) {
      // ignore write issues
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load DB', err);
    return { exams: [], submissions: [], users: [] };
  }
}

function save(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to save DB', err);
  }
}

const state = load();

// Add reload function to refresh state from file
function reload() {
  Object.assign(state, load());
}

module.exports = {
  reload, // Export the reload function
  getExams() { return state.exams; },
  addExam(exam) {
    state.exams = state.exams || [];
    // assign id if missing
    if (exam.id === undefined || exam.id === null) {
      const maxId = state.exams.length ? Math.max(...state.exams.map(e => Number(e.id))) : 0;
      exam.id = Number(maxId) + 1 || Date.now();
    }
    // ensure createdAt
    if (!exam.createdAt) exam.createdAt = new Date().toISOString();

    // prevent exact-duplicate by id or same title+createdAt
    const existsById = state.exams.some(e => Number(e.id) === Number(exam.id));
    const existsByKey = exam.title && exam.createdAt && state.exams.some(e => e.title === exam.title && e.createdAt === exam.createdAt);
    if (existsById || existsByKey) return null;

    state.exams.push(exam);
    save(state);
    return exam;
  },
  findExamById(id) { return state.exams.find(e => e.id === Number(id)); },
  getSubmissions() { return state.submissions; },
  addSubmission(submission) {
    state.submissions = state.submissions || [];
    // prevent duplicate submissions (same examId + studentName + createdAt)
    const dup = state.submissions.find(s => s.examId === submission.examId && s.studentName === submission.studentName && s.createdAt === submission.createdAt);
    if (dup) return null;
    
    // ALWAYS assign a sequential ID starting from 1
    if (submission.id === undefined || submission.id === null) {
      // Find the highest existing ID and assign the next one
      const existingIds = state.submissions
        .map(s => s.id)
        .filter(id => id !== undefined && id !== null)
        .map(id => Number(id));
      
      const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
      submission.id = maxId + 1;
      
      console.log(`Assigned sequential ID ${submission.id} to submission for ${submission.studentName}`);
    }
    
    state.submissions.push(submission);
    save(state);
    return submission;
  },
  updateSubmission(sub) {
    const idx = state.submissions.findIndex(s => s.id === sub.id);
    if (idx !== -1) state.submissions[idx] = sub;
    save(state);
  }
  ,
  // Users
  getUsers() { return state.users || []; },
  addUser(user) {
    state.users = state.users || [];
    // prevent duplicate emails
    if (state.users.find(u => u.email === user.email)) return null;
    // assign id if missing
    if (!user.id) user.id = (state.users.length ? Math.max(...state.users.map(u => Number(u.id))) + 1 : 1);
    state.users.push(user);
    save(state);
    return user;
  },
  findUserByEmail(email) { return (state.users || []).find(u => u.email === email); }
  ,
  // Exams
  deleteExam(id) {
    const before = state.exams.length;
    state.exams = (state.exams || []).filter(e => Number(e.id) !== Number(id));
    // also remove submissions for this exam
    const beforeSubs = state.submissions ? state.submissions.length : 0;
    state.submissions = (state.submissions || []).filter(s => Number(s.examId) !== Number(id));
    const after = state.exams.length;
    const afterSubs = state.submissions.length;
    if (after !== before || afterSubs !== beforeSubs) {
      save(state);
      return { removedExams: before - after, removedSubmissions: beforeSubs - afterSubs };
    }
    return null;
  }
  ,
  // Clear all submissions
  clearSubmissions() {
    const before = state.submissions ? state.submissions.length : 0;
    state.submissions = [];
    save(state);
    return { removed: before };
  },
  // Clear all exams (and their submissions)
  clearExams() {
    const before = state.exams ? state.exams.length : 0;
    state.exams = [];
    const beforeSubs = state.submissions ? state.submissions.length : 0;
    state.submissions = [];
    save(state);
    return { removedExams: before, removedSubmissions: beforeSubs };
  },
  // Clear everything except users
  clearAllExceptUsers() {
    const beforeExams = state.exams ? state.exams.length : 0;
    const beforeSubs = state.submissions ? state.submissions.length : 0;
    state.exams = [];
    state.submissions = [];
    save(state);
    return { removedExams: beforeExams, removedSubmissions: beforeSubs };
  }
  ,
  // Migrate plaintext passwords to bcrypt hashes (idempotent)
  migrateUserPasswords() {
    let changed = 0;
    if (!Array.isArray(state.users)) return { migrated: 0 };
    for (let u of state.users) {
      if (!u || !u.password) continue;
      // naive check: bcrypt hashes start with $2a$ or $2b$ or $2y$
      if (typeof u.password === 'string' && !u.password.startsWith('$2')) {
        try {
          const bcrypt = require('bcryptjs');
          u.password = bcrypt.hashSync(String(u.password), 10);
          changed += 1;
        } catch (e) {
          // ignore hashing errors
        }
      }
    }
    if (changed) save(state);
    return { migrated: changed };
  }
};
