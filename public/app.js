const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const previewWrapper = document.getElementById('previewWrapper');
const wordCountEl = document.getElementById('wordCount');
const charCountEl = document.getElementById('charCount');
const readTimeEl = document.getElementById('readTime');
const themeSelect = document.getElementById('themeSelect');
const cheatsheetSidebar = document.getElementById('cheatsheetSidebar');
const customCSSModal = document.getElementById('customCSSModal');
const customCSSTextarea = document.getElementById('customCSS');
const fileInput = document.getElementById('fileInput');

let customCSS = '';

marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

const defaultMarkdown = `# Markdown to PDF Converter

Welcome to the **Markdown to PDF Converter**! This tool lets you write Markdown and export it as a beautifully formatted PDF.

## Features

- **Live Preview** - See your changes in real-time
- **Multiple Themes** - Choose from Default, GitHub, Dark, or Academic
- **Export Options** - PDF, HTML, or Markdown
- **Custom CSS** - Style your PDF output
- **Keyboard Shortcuts** - Ctrl+S to save, Ctrl+P to export

## Getting Started

Start typing in the editor panel on the left, and see the live preview on the right. When you're ready, click **Export PDF** to download your document.

### Code Blocks

\`\`\`javascript
function greet(name) {
    console.log(\`Hello, \${name}!\`);
}
greet('World');
\`\`\`

### Tables

| Feature | Status |
|---------|--------|
| Markdown Editor | ✅ |
| Live Preview | ✅ |
| PDF Export | ✅ |
| Custom Themes | ✅ |

### Blockquotes

> "The best way to predict the future is to invent it."
> — Alan Kay

---

Start editing to see your changes!
`;

editor.value = defaultMarkdown;

function updatePreview() {
    const markdown = editor.value;
    const html = marked.parse(markdown);

    const themeClass = `pdf-theme-${themeSelect.value}`;
    preview.className = `preview markdown-body ${themeClass}`;

    if (customCSS) {
        let styleEl = document.getElementById('custom-pdf-style');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'custom-pdf-style';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = customCSS;
    }

    preview.innerHTML = html;

    const text = editor.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const minutes = Math.max(1, Math.ceil(words / 200));

    wordCountEl.textContent = `${words} words`;
    charCountEl.textContent = `${chars} chars`;
    readTimeEl.textContent = `${minutes} min read`;
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function saveToStorage() {
    localStorage.setItem('md2pdf-editor', editor.value);
    localStorage.setItem('md2pdf-theme', themeSelect.value);
    localStorage.setItem('md2pdf-css', customCSS);
    showToast('Saved to browser storage');
}

function loadFromStorage() {
    const saved = localStorage.getItem('md2pdf-editor');
    const savedTheme = localStorage.getItem('md2pdf-theme');
    const savedCSS = localStorage.getItem('md2pdf-css');

    if (saved !== null) {
        editor.value = saved;
    }
    if (savedTheme) {
        themeSelect.value = savedTheme;
    }
    if (savedCSS) {
        customCSS = savedCSS;
        customCSSTextarea.value = savedCSS;
    }
}

function exportPDF() {
    showToast('Generating PDF...');

    const clone = preview.cloneNode(true);
    clone.style.padding = '40px';

    const opt = {
        margin: [15, 15, 15, 15],
        filename: 'document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(clone).save().then(() => {
        showToast('PDF exported successfully!');
    }).catch(() => {
        showToast('Error exporting PDF', 'error');
    });
}

function exportHTML() {
    const themeClass = `pdf-theme-${themeSelect.value}`;
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Document</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; line-height: 1.7; }
        h1 { font-size: 2em; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; }
        pre { background: #0f172a; color: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; }
        code { font-family: 'JetBrains Mono', monospace; font-size: 0.9em; }
        :not(pre) > code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
        blockquote { border-left: 4px solid #22c55e; margin: 0 0 16px; padding: 12px 20px; background: #f8fafc; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; }
        th { background: #f1f5f9; font-weight: 600; }
        img { max-width: 100%; }
        ${customCSS}
    </style>
</head>
<body>
${preview.innerHTML}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast('HTML exported successfully!');
}

function exportMarkdown() {
    const blob = new Blob([editor.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Markdown exported!');
}

function importFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        editor.value = e.target.result;
        updatePreview();
        showToast('File imported successfully!');
    };
    reader.readAsText(file);
}

// Event Listeners
editor.addEventListener('input', updatePreview);

themeSelect.addEventListener('change', () => {
    updatePreview();
    localStorage.setItem('md2pdf-theme', themeSelect.value);
});

document.getElementById('toggleCheatsheet').addEventListener('click', () => {
    cheatsheetSidebar.classList.toggle('open');
});

document.getElementById('closeCheatsheet').addEventListener('click', () => {
    cheatsheetSidebar.classList.remove('open');
});

document.getElementById('toggleCustomCSS').addEventListener('click', () => {
    customCSSModal.classList.add('open');
});

document.getElementById('closeCustomCSS').addEventListener('click', () => {
    customCSSModal.classList.remove('open');
});

customCSSModal.addEventListener('click', (e) => {
    if (e.target === customCSSModal) {
        customCSSModal.classList.remove('open');
    }
});

document.getElementById('applyCSS').addEventListener('click', () => {
    customCSS = customCSSTextarea.value;
    localStorage.setItem('md2pdf-css', customCSS);
    updatePreview();
    customCSSModal.classList.remove('open');
    showToast('Custom CSS applied!');
});

document.getElementById('resetCSS').addEventListener('click', () => {
    customCSS = '';
    customCSSTextarea.value = '';
    localStorage.removeItem('md2pdf-css');
    updatePreview();
    showToast('CSS reset to default');
});

document.getElementById('exportPdfBtn').addEventListener('click', exportPDF);
document.getElementById('exportHtmlBtn').addEventListener('click', exportHTML);
document.getElementById('exportMdBtn').addEventListener('click', exportMarkdown);
document.getElementById('importBtn').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        importFile(e.target.files[0]);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
            e.preventDefault();
            saveToStorage();
        } else if (e.key === 'p') {
            e.preventDefault();
            exportPDF();
        }
    }
});

// Resizer
const resizer = document.getElementById('resizer');
const editorPanel = document.querySelector('.editor-panel');
const previewPanel = document.querySelector('.preview-panel');

let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizer.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const container = document.querySelector('.main');
    const containerRect = container.getBoundingClientRect();
    const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    if (percentage > 20 && percentage < 80) {
        editorPanel.style.flex = `0 0 ${percentage}%`;
        previewPanel.style.flex = `0 0 ${100 - percentage}%`;
    }
});

document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false;
        resizer.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
});

// Initialize
loadFromStorage();
updatePreview();
