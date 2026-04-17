const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Add initBookMgmtPage before the DOMContentLoaded initialization block
const domReadyMarker = "// ==================== 初始化 ====================\ndocument.addEventListener('DOMContentLoaded', () => {";
const initBookMgmtBlock = `// ==================== 书籍管理页面 ====================
async function initBookMgmtPage() {
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
            setTimeout(() => openBookModalWithPrefill(prefill), 200);
        } catch (e) {
            console.error('预填数据解析失败', e);
        }
    }
}

window.openBookModalWithPrefill = function(prefill) {
    document.getElementById('bookModalTitle').innerText = '📖 新增书籍（来自评估）';
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

if (c.includes(domReadyMarker)) {
    c = c.replace(domReadyMarker, initBookMgmtBlock + domReadyMarker);
    console.log('Added initBookMgmtPage + openBookModalWithPrefill');
} else {
    console.log('DOMContentLoaded marker not found');
    // Just append before the last line
    const lastBrace = c.lastIndexOf('});');
    if (lastBrace !== -1) {
        c = c.slice(0, lastBrace) + initBookMgmtBlock + '\n' + c.slice(lastBrace);
        console.log('Appended before last });');
    }
}

fs.writeFileSync(path, c, 'utf8');
console.log('done, new size:', c.length);
