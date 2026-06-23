(function() {
  // 1. Session check
  const isLoggedIn = localStorage.getItem("adminLoggedIn") === "yes";
  const currentPath = window.location.pathname;
  const filename = currentPath.split("/").pop();
  const isLoginPage = filename === "login.html";
  const isRegisterPage = filename === "registration.html";

  if (!isLoggedIn && !isLoginPage && !isRegisterPage) {
    // Redirect to login if trying to access protected page
    window.location.href = "login.html";
    return;
  }

  if (isLoggedIn && (isLoginPage || isRegisterPage)) {
    // Redirect to dashboard if already logged in and on login or register page
    window.location.href = "dashboard.html";
    return;
  }

  // 2. Global logout function
  window.logout = function() {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminName");
    window.location.href = "login.html";
  };

  // 3. Highlight current page in navbar & bind logout
  document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelectorAll(".navbar .nav-right a, .navbar a");
    navLinks.forEach(link => {
      const href = link.getAttribute("href");
      if (href) {
        const linkFile = href.split("/").pop();
        if (linkFile === filename || (linkFile === "dashboard.html" && filename === "")) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      }

      // Bind logout if link has logout class or text contains logout
      if (link.classList.contains("logout") || link.textContent.toLowerCase().includes("logout")) {
        link.removeAttribute("href"); // Remove href to prevent direct nav
        link.style.cursor = "pointer";
        link.addEventListener("click", (e) => {
          e.preventDefault();
          window.logout();
        });
      }
    });
  });
})();
