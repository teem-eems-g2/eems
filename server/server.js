const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors({
  origin: ["https://mu-eems.vercel.app", "http://localhost:5173"], // Add your actual Vercel URL here
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/exams", require("./routes/examRoutes"));
app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/attempts", require("./routes/attemptRoutes"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
