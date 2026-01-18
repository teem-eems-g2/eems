

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const users = [
  { id: 1, email: "instructor@test.com", password: "instructor123", role: "instructor" },
  { id: 2, email: "student@test.com", password: "student123", role: "student" },
  { id: 3, email: "grader@test.com", password: "grader123", role: "grader" },
  { id: 4, email: "admin@test.com", password: "admin123", role: "admin" }
];

const exams = [];

app.get("/", (req, res) => {
  res.json({ 
    message: "EEMS API is running", 
    version: "1.0.0",
    endpoints: ["/api/login", "/api/exams", "/api/grading"]
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      token: "mock-jwt-token"
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }
});

app.get("/api/exams", (req, res) => {
  res.json({
    success: true,
    exams: exams
  });
});

app.post("/api/exams", (req, res) => {
  const exam = {
    id: exams.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    status: "draft"
  };
  exams.push(exam);
  res.json({
    success: true,
    message: "Exam created successfully",
    exam: exam
  });
});

app.post("/api/grade/auto", (req, res) => {
  const { answers } = req.body;
  let score = 0;
  
  Object.values(answers).forEach(answer => {
    if (answer && answer !== "") score++;
  });
  
  res.json({
    success: true,
    score: score,
    total: Object.keys(answers).length,
    message: "Auto-grading completed"
  });
});

app.listen(PORT, () => {
  console.log("🚀 EEMS Backend running on http://localhost:" + PORT);
});
