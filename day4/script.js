const textarea = document.querySelector('#note-text');
const charCount = document.querySelector('#char-count');
const wordCount = document.querySelector('#word-count');
const clearBtn = document.querySelector('#clear-btn');
const themeToggleBtn = document.querySelector('#theme-toggle');

// 1. Core update function for characters and words
function updateCounts() {
    const text = textarea.value;
    const currentLength = text.length;
    
    // Word count logic (splits by whitespace and filters out empty strings)
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    charCount.textContent = `${currentLength} / 200 characters`;
    wordCount.textContent = `${words} words`;

    // Manage warning classes
    charCount.className = ''; // Reset classes
    if (currentLength > 200) {
        charCount.classList.add('over');
    } else if (currentLength > 180) {
        charCount.classList.add('warning');
    }
}

// 2. Load saved draft and theme preferences on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedDraft = localStorage.getItem('noteDraft');
    if (savedDraft) {
        textarea.value = savedDraft;
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggleBtn.textContent = 'Light mode';
    } else {
        themeToggleBtn.textContent = 'Dark mode';
    }

    updateCounts();
});

// 3. Input event listener for real-time saving and counting
textarea.addEventListener('input', () => {
    updateCounts();
    localStorage.setItem('noteDraft', textarea.value);
});

// 4. Clear button functionality
clearBtn.addEventListener('click', () => {
    textarea.value = '';
    localStorage.removeItem('noteDraft');
    updateCounts();
});

// 5. Escape key shortcut inside textarea to clear text
textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        textarea.value = '';
        localStorage.removeItem('noteDraft');
        updateCounts();
    }
});

// 6. Theme toggle button functionality
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    
    if (document.body.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.textContent = 'Light mode';
    } else {
        localStorage.setItem('theme', 'light');
        themeToggleBtn.textContent = 'Dark mode';
    }
});