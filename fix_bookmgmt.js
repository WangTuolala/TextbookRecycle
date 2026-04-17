const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Add prefill check to initBookMgmtPage
const oldInit = 'async function initBookMgmtPage() {\n    if (!document.querySelector(\'.book-mgmt-main\')) return;\n    await Promise.all([\n        loadBooksForMgmt(),\n        loadCategoriesForBookForm(),\n        loadPointsRuleForBook()\n    ]);\n    initNavUserInfo();\n}';
const newInit = `async function initBookMgmtPage() {
    if (!document.querySelector('.book-mgmt-main')) return;
    await Promise.all([
        loadBooksForMgmt(),
        loadCategoriesForBookForm(),
        loadPointsRuleForBook()
    ]);
    initNavUserInfo();

    // 检查是否有从评估页面跳转过来的预填数据
    const prefillStr = sessionStorage.getItem('bookPrefill');
    if (prefillStr) {
        try {
            const prefill = JSON.parse(prefillStr);
            sessionStorage.removeItem('bookPrefill');
            setTimeout(() => openBookModalWithPrefill(prefill), 100);
        } catch (e) {
            console.error('预填数据解析失败', e);
        }
    }
}`;

if (c.includes(oldInit)) {
    c = c.replace(oldInit, newInit);
    console.log('Replaced initBookMgmtPage');
} else {
    console.log('initBookMgmtPage pattern not found');
    // Try to find it with different whitespace
    const idx = c.indexOf('async function initBookMgmtPage()');
    if (idx !== -1) {
        console.log('Found at index', idx, 'next 200 chars:', c.slice(idx, idx+200));
    }
}

// Add openBookModalWithPrefill function before openBookModal
const openBookModalFn = `window.openBookModalWithPrefill = function(prefill) {
    document.getElementById('bookModalTitle').innerText = '&#128218; 新增书籍（来自评估）';
    document.getElementById('bookForm').reset();
    document.getElementById('coverPreview').innerHTML = '';

    document.getElementById('bookId').value = '';
    document.getElementById('bookName').value = prefill.bookName || '';
    document.getElementById('bookAuthor').value = prefill.author || '';
    document.getElementById('bookPublisher').value = prefill.publisher || '';
    document.getElementById('bookIsbn').value = prefill.isbn || '';
    document.getElementById('bookMajor').value = ''; // 让管理员手动选择
    document.getElementById('bookCondition').value = prefill.condition || '良好';
    document.getElementById('bookStock').value = 1;
    document.getElementById('bookStatus').value = 'LISTED';
    document.getElementById('bookCoverFile').required = false;

    const pts = prefill.points || 0;
    document.getElementById('bookPoints').value = pts;
    const ptsDisplay = document.getElementById('bookPointsDisplay');
    if (ptsDisplay) ptsDisplay.innerText = pts + ' 积分';

    if (prefill.coverImage) {
        document.getElementById('coverPreview').innerHTML =
            '<img src="' + prefill.coverImage + '" style="max-width:80px;max-height:100px;border-radius:8px;object-fit:cover;">';
    }

    Modal.open('bookModal');
};

`;

const openBookModalIdx = c.indexOf('function openBookModal(bookId)');
if (openBookModalIdx !== -1) {
    c = c.slice(0, openBookModalIdx) + openBookModalFn + c.slice(openBookModalIdx);
    console.log('Added openBookModalWithPrefill');
} else {
    console.log('openBookModal not found');
}

fs.writeFileSync(path, c, 'utf8');
console.log('done');
