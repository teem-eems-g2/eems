import { fetchStudentAttempts } from "../api/attempts.js";
import { fetchExamById } from "../api/exams.js";
import "../styles/student-exam.css";

// Add logout button styles
const style = document.createElement('style');
style.textContent = `
  .dashboard-header .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  
  .logout-btn {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
  }
  
  .logout-btn:hover {
    background-color: #d32f2f;
  }
`;
document.head.appendChild(style);

/**
 * Renders the student exams dashboard
 */
export async function renderStudentExams() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="student-exams">
      <div class="loading">Loading your exams...</div>
    </div>
  `;

  try {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      // Redirect to home page
      history.pushState(null, "", "/");
      window.dispatchEvent(new Event("popstate"));
      return;
    }

    // Fetch all student attempts
    const attemptsResponse = await fetchStudentAttempts();
    const attempts = attemptsResponse.attempts || attemptsResponse;

    // Group attempts by exam
    const examAttempts = {};

    // Process each attempt
    for (const attempt of attempts) {
      if (!examAttempts[attempt.examId]) {
        // Fetch exam details if not already fetched
        try {
          const examResponse = await fetchExamById(attempt.exam);
          const exam = examResponse.exam || examResponse;

          examAttempts[attempt.examId] = {
            exam: exam,
            attempts: [],
          };
        } catch (error) {
          console.error(`Error fetching exam ${attempt.examId}:`, error);
          examAttempts[attempt.examId] = {
            exam: { title: "Unknown Exam", id: attempt.examId },
            attempts: [],
          };
        }
      }

      // Add attempt to the exam's attempts array
      examAttempts[attempt.examId].attempts.push(attempt);
    }

    // 1. Render the HTML
    renderExamsDashboard(app, examAttempts);

    // 2. IMPORTANT FIX: Call the event listeners function immediately after rendering
    setupEventListeners();

  } catch (error) {
    console.error("Error loading student exams:", error);
    app.querySelector(".student-exams").innerHTML = `
      <div class="error-message">
        <h3>Error Loading Exams</h3>
        <p>${
          error.message || "Failed to load your exams. Please try again later."
        }</p>
        <button id="refresh-btn" class="primary-btn">Refresh</button>
      </div>
    `;
    // Add listener for the error refresh button
    const refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            renderStudentExams();
        });
    }
  }
}

/**
 * Renders the exams dashboard
 * @param {HTMLElement} app - The app container element
 * @param {Object} examAttempts - Object containing exams and their attempts
 */
function renderExamsDashboard(app, examAttempts) {
  // Check if there are any exams
  const hasExams = Object.keys(examAttempts).length > 0;

  app.innerHTML = `
    <div class="student-exams">
      <header class="dashboard-header">
        <div class="header-content">
          <div>
            <h1>My Exams</h1>
            <p>View your exam history and results</p>
          </div>
          <button id="logout-btn" class="logout-btn">Logout</button>
        </div>
      </header>
      
      <main class="exams-container">
        ${hasExams ? renderExamCards(examAttempts) : renderEmptyState()}
      </main>
    </div>
  `;
}

/**
 * Renders exam cards for each exam
 * @param {Object} examAttempts - Object containing exams and their attempts
 * @returns {string} - HTML string of exam cards
 */
function renderExamCards(examAttempts) {
  return `
    <div class="exam-cards">
      ${Object.values(examAttempts)
        .map(({ exam, attempts }) => {
          // Sort attempts by date (newest first)
          const sortedAttempts = [...attempts].sort(
            (a, b) =>
              new Date(b.endTime || b.startTime) -
              new Date(a.endTime || a.startTime)
          );

          // Get the best score
          const bestScore = sortedAttempts.reduce(
            (best, attempt) => (attempt.score > best ? attempt.score : best),
            0
          );

          // Get the most recent attempt
          const latestAttempt = sortedAttempts[0];

          return `
          <div class="exam-card cursor-default">
            <div class="exam-card-header">
              <h2>${exam.title}</h2>
              <span class="attempt-count">${attempts.length} attempt${
            attempts.length !== 1 ? "s" : ""
          }</span>
            </div>
            
            <div class="exam-card-body">
              <div class="score-summary">
                <div class="score-circle ${getScoreClass(bestScore)}">
                  <span class="score-value">${bestScore}%</span>
                </div>
                <div class="score-label">Best Score</div>
              </div>
              
              <div class="exam-details">
                <div class="detail-item">
                  <span class="detail-label">Last Attempt:</span>
                  <span class="detail-value">${formatDate(
                    latestAttempt.endTime || latestAttempt.startTime
                  )}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Last Score:</span>
                  <span class="detail-value">${latestAttempt.score}%</span>
                </div>
              </div>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

/**
 * Renders an empty state when no exams are found
 * @returns {string} - HTML string for empty state
 */
function renderEmptyState() {
  return `
    <div class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>No Exams Found</h3>
      <p>You haven't taken any exams yet. When you complete an exam, it will appear here.</p>
    </div>
  `;
}

/**
 * Get the CSS class for a score percentage
 * @param {number} percentage - The score percentage
 * @returns {string} - The CSS class
 */
function getScoreClass(percentage) {
  if (percentage >= 80) return "excellent";
  if (percentage >= 60) return "good";
  if (percentage >= 40) return "average";
  return "poor";
}

/**
 * Format a date for display
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  if (!date) return "N/A";

  const dateObj = new Date(date);
  return (
    dateObj.toLocaleDateString() +
    " " +
    dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

/**
 * Set up event listeners after rendering
 */
function setupEventListeners() {
  // FIX: Matches the ID used in renderExamsDashboard ('logout-btn')
  const logoutBtn = document.getElementById('logout-btn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Clear token
      localStorage.removeItem('token');
      // Redirect to home/login
      history.pushState(null, "", "/");
      window.dispatchEvent(new Event('popstate'));
    });
  } else {
    console.warn("Logout button not found in DOM");
  }

  // View details buttons
  document.querySelectorAll(".view-details-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // const examId = btn.dataset.examId; // Unused for now
      showNotification(
        "Exam details view will be implemented in a future update.",
        "info"
      );
    });
  });

  // Retake exam buttons
  document.querySelectorAll(".retake-exam-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const examId = btn.dataset.examId;
      history.pushState(null, "", `/exam/${examId}`);
      window.dispatchEvent(new Event("popstate"));
    });
  });
}

/**
 * Shows a notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = "info") {
  // Check if notification container exists, create if not
  let notificationContainer = document.querySelector(".notification-container");
  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.className = "notification-container";
    document.body.appendChild(notificationContainer);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `;

  // Add to container
  notificationContainer.appendChild(notification);

  // Add close button functionality
  notification
    .querySelector(".notification-close")
    .addEventListener("click", () => {
      notification.classList.add("fade-out");
      setTimeout(() => {
        notificationContainer.removeChild(notification);
      }, 300);
    });

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.add("fade-out");
      setTimeout(() => {
        if (notification.parentNode) {
          notificationContainer.removeChild(notification);
        }
      }, 300);
    }
  }, 5000);
}