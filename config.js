// Centralized API configuration for AASHA Connect
window.API_BASE_URL = "https://aasha-connect.onrender.com";

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        console.log('Service Worker Registered');
      })
      .catch(err => {
        console.error('Service Worker Registration Failed', err);
      });
  });
}
