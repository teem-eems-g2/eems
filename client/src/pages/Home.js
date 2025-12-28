export function renderHome() {
  document.body.innerHTML = `
    <main class="home-container">
      <div class="home-card">
        <div class="home-card-content">
          <div class="logo-container">
            <div class="logo">EEMS</div>
          </div>
          <h1>Welcome to <span class="highlight">EEMS</span></h1>
          <p class="subtitle">Your comprehensive examination management system</p>
          <div class="cta-buttons">
            <button id="login-link" class="btn btn-primary">Login</button>
            <button id="register-link" class="btn btn-secondary">Create Account</button>
          </div>
          <div class="features">
            <div class="feature">
              <i class="feature-icon">📊</i>
              <span>Track Progress</span>
            </div>
            <div class="feature">
              <i class="feature-icon">📝</i>
              <span>Create Exams</span>
            </div>
            <div class="feature">
              <i class="feature-icon">📱</i>
              <span>Any Device</span>
            </div>
          </div>
        </div>
        <div class="home-card-image">
          <div class="floating-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
          </div>
        </div>
      </div>
    </main>
  `;

  document.getElementById("login-link").addEventListener("click", (e) => {
    e.preventDefault();
    import("./Login.js").then((module) => module.renderLogin());
  });

  document.getElementById("register-link").addEventListener("click", (e) => {
    e.preventDefault();
    import("./Register.js").then((module) => module.renderRegister());
  });
}
