const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const db = require('./db');

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-dev-secret';

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// 1. INITIALIZE & MIGRATE
if (db.migrateUserPasswords) {
    const m = db.migrateUserPasswords();
    if (m && m.migrated) console.log(`✅ Migrated ${m.migrated} passwords.`);
}

// 2. MIDDLEWARE
function authenticateToken(req, res, next) {
    const auth = req.headers['authorization'];
    const token = auth && auth.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Access Denied: No Token' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ success: false, message: 'Invalid Token' });
    }
}

// 3. AUTH ROUTES
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.findUserByEmail(email);

    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    try {
        const isMatch = bcrypt.compareSync(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
            const { password: _, ...userInfo } = user;
            return res.json({ success: true, user: userInfo, token });
        }
    } catch (e) {
        console.error("Bcrypt error:", e);
    }
    res.status(401).json({ success: false, message: "Invalid credentials" });
});

// 4. EXAM ROUTES
app.get("/api/exams", (req, res) => {
    res.json({ success: true, exams: db.getExams() });
});

app.post("/api/exams", authenticateToken, (req, res) => {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Instructor only' });
    }
    
    const added = db.addExam({
        ...req.body,
        createdBy: req.user.email,
        createdAt: new Date().toISOString()
    });

    if (!added) return res.status(409).json({ success: false, message: 'Exam creation failed' });
    res.json({ success: true, exam: added });
});

app.delete('/api/exams/:id', authenticateToken, (req, res) => {
    const result = db.deleteExam(req.params.id);
    if (result) {
        res.json({ success: true, message: "Exam deleted", details: result });
    } else {
        res.status(404).json({ success: false, message: "Exam not found" });
    }
});

// 5. SUBMISSION & GRADING ROUTES
app.post('/api/submissions', (req, res) => {
    const { studentName, examId, answers, metadata } = req.body;
    const exam = db.findExamById(examId);

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Auto-grading Logic
    const perQuestion = exam.questions.map(q => {
        const studentAns = answers[q.id];
        let awarded = 0;
        let autoGraded = false;

        // Strict matching for MCQ/TF/Numeric
        const cleanStudent = String(studentAns || "").trim().toLowerCase();
        const cleanCorrect = String(q.correct || q.answer || "").trim().toLowerCase();

        if (['mcq', 'truefalse', 'numeric'].includes(q.type)) {
            if (cleanStudent === cleanCorrect) awarded = Number(q.marks);
            autoGraded = true;
        } else if (q.type === 'short') {
            // Auto-grade short answers with exact matching
            if (cleanStudent === cleanCorrect) {
                awarded = Number(q.marks);
                autoGraded = true;
            } else {
                autoGraded = false; // Will need manual grading
            }
        }

        return {
            questionId: q.id,
            questionText: q.text,
            type: q.type,
            studentAnswer: studentAns,
            correctAnswer: q.correct || q.answer,
            marks: Number(q.marks),
            awarded: awarded,
            autoGraded
        };
    });

    const submission = {
        id: Date.now(), // Always assign a unique ID
        examId: Number(examId),
        examTitle: exam.title,
        studentName: studentName || 'Anonymous',
        perQuestion,
        metadata: metadata || {},
        totalMarks: exam.totalMarks,
        awarded: perQuestion.reduce((sum, q) => sum + q.awarded, 0),
        createdAt: new Date().toISOString()
    };

    const saved = db.addSubmission(submission);
    res.json({ success: true, submission: saved });
});

app.get('/api/submissions', authenticateToken, (req, res) => {
    let subs = db.getSubmissions();
    if (req.query.examId) {
        subs = subs.filter(s => s.examId === Number(req.query.examId));
    }
    res.json({ success: true, submissions: subs });
});

// Manual Grading Update
app.post('/api/submissions/:id/grade', authenticateToken, (req, res) => {
    const gradeData = req.body; // Expect array of {questionId, awarded, feedback}
    let submissionId = req.params.id;
    
    // Handle both string and number IDs
    if (typeof submissionId === 'string') {
        submissionId = Number(submissionId);
    }
    
    console.log('Grading request for submission ID:', submissionId);
    console.log('Grade data received:', gradeData);
    
    const subs = db.getSubmissions();
    const sub = subs.find(s => s.id === submissionId || String(s.id) === String(submissionId));

    console.log('Found submission:', sub ? 'Yes' : 'No');
    console.log('All submissions IDs:', subs.map(s => ({ id: s.id, type: typeof s.id, name: s.studentName })));

    if (!sub) {
        console.log('Available submissions:', subs.map(s => ({ id: s.id, name: s.studentName })));
        return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Update each question in the gradeData array
    let updated = false;
    if (Array.isArray(gradeData)) {
        gradeData.forEach(grade => {
            const qIndex = sub.perQuestion.findIndex(pq => pq.questionId === grade.questionId);
            if (qIndex !== -1) {
                sub.perQuestion[qIndex].awarded = Number(grade.awarded);
                sub.perQuestion[qIndex].feedback = grade.feedback;
                updated = true;
            }
        });
    } else {
        // Handle single question update (backward compatibility)
        const { questionId, awarded, feedback } = gradeData;
        const qIndex = sub.perQuestion.findIndex(pq => pq.questionId === questionId);
        if (qIndex !== -1) {
            sub.perQuestion[qIndex].awarded = Number(awarded);
            sub.perQuestion[qIndex].feedback = feedback;
            updated = true;
        }
    }

    if (updated) {
        // Recalculate total marks awarded
        sub.awarded = sub.perQuestion.reduce((sum, q) => sum + (Number(q.awarded) || 0), 0);
        db.updateSubmission(sub);
        console.log('Grades updated successfully');
        return res.json({ success: true, submission: sub });
    }

    res.status(404).json({ success: false, message: 'No valid questions to update' });
});

// Add database reload endpoint
app.post('/api/admin/reload-db', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin/Instructor only' });
  }
  
  try {
    db.reload();
    console.log('Database reloaded from file');
    res.json({ success: true, message: 'Database reloaded successfully' });
  } catch (err) {
    console.error('Failed to reload database:', err);
    res.status(500).json({ success: false, message: 'Failed to reload database' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server locked and loaded at http://localhost:${PORT}`);
});