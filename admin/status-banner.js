(function() {
  const css = `
    .offline-status-banner {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background-color: #ff9800;
      color: white;
      text-align: center;
      padding: 8px 10px;
      font-size: 14px;
      font-family: sans-serif;
      font-weight: bold;
      z-index: 99999;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .offline-status-banner.online {
      background-color: #4caf50;
      transform: translateY(-100%);
      opacity: 0;
      pointer-events: none;
    }
    .offline-status-banner .dot {
      width: 8px;
      height: 8px;
      background-color: white;
      border-radius: 50%;
      margin-right: 8px;
      display: inline-block;
      animation: blinker 1.5s linear infinite;
    }
    @keyframes blinker {
      50% { opacity: 0; }
    }
    body {
      transition: padding-top 0.3s ease;
    }
    body.has-offline-banner {
      padding-top: 36px;
    }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // Create banner elements
  const banner = document.createElement('div');
  banner.className = 'offline-status-banner';
  banner.style.display = 'none'; // hidden by default until checked

  function updateStatus() {
    if (navigator.onLine) {
      if (banner.classList.contains('offline-mode')) {
        banner.classList.add('online');
        banner.classList.remove('offline-mode');
        banner.innerHTML = '🟢 Back Online! Connected to central server.';
        banner.style.backgroundColor = '#4caf50';
        document.body.classList.remove('has-offline-banner');
        
        // Auto hide success banner after 3 seconds
        setTimeout(() => {
          if (navigator.onLine) {
            banner.style.display = 'none';
          }
        }, 3000);
      } else {
        banner.style.display = 'none';
        document.body.classList.remove('has-offline-banner');
      }
    } else {
      banner.style.display = 'flex';
      banner.classList.remove('online');
      banner.classList.add('offline-mode');
      banner.style.backgroundColor = '#ff9800';
      banner.innerHTML = '<span class="dot"></span> 🟡 Operating in Offline Mode (Data saved locally)';
      document.body.classList.add('has-offline-banner');
    }
  }

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);

  // Initial check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(banner);
      updateStatus();
    });
  } else {
    document.body.appendChild(banner);
    updateStatus();
  }
})();
