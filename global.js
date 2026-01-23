document.addEventListener('DOMContentLoaded', () => {
  // Select all code elements
  const codeElements = document.querySelectorAll('code');

  codeElements.forEach(code => {
    // Add a class to indicate it's copyable
    code.classList.add('copyable');
    code.title = 'Click to copy';

    code.addEventListener('click', async () => {
      const textToCopy = code.innerText;

      try {
        await navigator.clipboard.writeText(textToCopy);

        // Visual feedback
        showToast(`Copied: "${textToCopy}"`);

        // Temporary style change
        const originalBg = code.style.backgroundColor; // Store original inline, though usually computed
        code.classList.add('copied-success');

        setTimeout(() => {
          code.classList.remove('copied-success');
        }, 500);

      } catch (err) {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy', true);
      }
    });
  });
});

// Simple Toast Notification
function showToast(message, isError = false) {
  // Check if toast container exists, create if not
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  if (isError) toast.classList.add('error');
  toast.innerText = message;

  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode === toastContainer) {
        toastContainer.removeChild(toast);
      }
    }, 300); // Wait for fade out
  }, 3000);
}

// Tab Switching Logic
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  if (tabButtons.length === 0) return;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Get target id
      const targetId = btn.getAttribute('data-target');

      // 1. Remove active class from all buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      // 2. Add active class to clicked button
      btn.classList.add('active');

      // 3. Hide all tab contents
      const allContents = document.querySelectorAll('.tab-content');
      allContents.forEach(content => content.classList.remove('active'));

      // 4. Show target tab content
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

// Initialize Tabs on Load
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupCopyButtons();
});

// Copy Button Logic
function setupCopyButtons() {
  const copyBtns = document.querySelectorAll('.copy-btn');

  copyBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const terminalCard = btn.closest('.terminal-card');
      const codeBlock = terminalCard.querySelector('code');

      if (codeBlock) {
        try {
          await navigator.clipboard.writeText(codeBlock.innerText);
          btn.innerHTML = '✓ Copied!';
          btn.classList.add('copied');

          setTimeout(() => {
            btn.innerHTML = '📋 Copy code';
            btn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Copy failed:', err);
        }
      }
    });
  });
}
