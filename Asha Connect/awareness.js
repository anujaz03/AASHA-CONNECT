const panels = document.querySelectorAll(".panel");

window.addEventListener("scroll", () => {
  panels.forEach(panel => {
    const rect = panel.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.6) {
      panel.style.opacity = "1";
      panel.style.transform = "translateY(0)";
    }
  });
});
