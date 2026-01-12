/**
 * Auth Check Script
 * Include this in all admin pages to protect them with authentication
 *
 * Usage: <script src="./auth-check.js"></script>
 */

(function() {
  'use strict';

  const authToken = localStorage.getItem('scrumAuthToken');

  if (!authToken) {
    // No token, redirect to login
    window.location.href = './login.html';
    return;
  }

  // Validate token with server
  fetch('/api/auth/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authToken: authToken })
  })
  .then(response => response.json())
  .then(data => {
    if (!data.success) {
      // Invalid token, clear and redirect
      localStorage.removeItem('scrumAuthToken');
      window.location.href = './login.html';
    } else {
      // Token valid, store user info
      if (data.user) {
        localStorage.setItem('scrumUser', JSON.stringify(data.user));
      }
    }
  })
  .catch(error => {
    console.error('Auth validation error:', error);
    // On error, redirect to login to be safe
    localStorage.removeItem('scrumAuthToken');
    window.location.href = './login.html';
  });

  // Add logout function to window
  window.logout = function() {
    if (confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('scrumAuthToken');
      localStorage.removeItem('scrumUser');
      window.location.href = './login.html';
    }
  };

  // Display user info in header if element exists
  window.addEventListener('DOMContentLoaded', () => {
    const userInfo = localStorage.getItem('scrumUser');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      const headerEl = document.querySelector('header');
      if (headerEl) {
        const userDisplay = document.createElement('div');
        userDisplay.style.cssText = 'position: absolute; top: 1rem; right: 1rem; display: flex; align-items: center; gap: 1rem;';
        userDisplay.innerHTML = `
          <span style="color: var(--text-secondary); font-size: 0.9rem;">
            ${user.email}
          </span>
          <button onclick="logout()" style="
            padding: 0.5rem 1rem;
            background: var(--bg-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border-subtle);
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
            font-size: 0.85rem;
            font-weight: 600;
          ">
            Logout
          </button>
        `;
        headerEl.appendChild(userDisplay);
      }
    }
  });
})();
