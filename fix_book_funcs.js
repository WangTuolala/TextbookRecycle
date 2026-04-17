const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

const newFunctions = `
// ==================== 书籍管理功能 ====================
async function loadBooksForMgmt() {
    try {
        const result = await adminApiCall('/books', 'GET');
        window.allBooks = result.data || [];
        renderBookTable();
    } catch (error) {
        console.error('加载书籍失败:', error);
    }
}

async function loadCategoriesForBookForm() {
    try {
        const result = await adminApiCall('/categories', 'GET');
        const categories = result.data || [];
        const selects = [
            document.getElementById('bookMajorFilter'),
            document.getElementById('bookMajor')
        ];
        selects.forEach(sel => {
            if (!sel) return;
            const currentVal = sel.value;
            sel.innerHTML = '<option value="">全部专业</option>' +
                categories.map(c => '<option value="' + c.name + '">' + c.name + '</option>').join('');
            sel.value = currentVal;
        });
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

async function loadPointsRuleForBook() {
    try {
        const result = await adminApiCall('/points-rule', 'GET');
        const rule = result.data || {};
        window.bookPointsRule = {
            '全新': rule.ruleNew || 200,
            '良好': rule.ruleGood || 150,
            '一般': rule.ruleNormal || 80,
            '陈旧': rule.ruleOld || 40
        };
    } catch (error) {
        window.bookPointsRule = { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };
    }
}

function renderBookTable() {
    const tbody = document.getElementById('bookTbody');
    if (!tbody) return;

    const statusFilter = document.getElementById('bookStatusFilter') ? document.getElementById('bookStatusFilter').value : 'all';
    const majorFilter = document.getElementById('bookMajorFilter') ? document.getElementById('bookMajorFilter').value : '';
    const searchTerm = document.getElementById('bookSearchInput') ? document.getElementById('bookSearchInput').value.toLowerCase() : '';

    let filtered = (window.allBooks || []).slice();
    if (statusFilter !== 'all') filtered = filtered.filter(b => b.status === statusFilter);
    if (majorFilter) filtered = filtered.filter(b => b.major === majorFilter);
    if (searchTerm) {
        filtered = filtered.filter(b =>
            (b.bookName || '').toLowerCase().includes(searchTerm) ||
            (b.author || '').toLowerCase().includes(searchTerm) ||
            (b.isbn || '').toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">暂无书籍数据</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(book => {
        const cover = book.coverImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='80'%3E%3Crect width='60' height='80' fill='%23d0e2f2'/%3E%3Ctext x='30' y='40' text-anchor='middle' fill='%231e6d8f' font-size='10'%3E%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E";
        const statusClass = book.status === 'LISTED' ? 'listed' : 'delisted';
        const statusText = book.status === 'LISTED' ? '上架' : '下架';
        const editBtn = '<button class="btn-sm" onclick="openBookModal(' + book.id + ')">编辑</button>';
        const toggleBtn = book.status === 'LISTED'
            ? '<button class="btn-sm btn-danger" onclick="updateBookStatus(' + book.id + ', \\'DELISTED\\')">下架</button>'
            : '<button class="btn-sm btn-pass" onclick="updateBookStatus(' + book.id + ', \\'LISTED\\')">上架</button>';

        return '<tr>' +
            '<td><img src="' + cover + '" style="width:40px;height:50px;object-fit:cover;border-radius:4px;" onerror="this.src=\\'data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'60\\' height=\\'80\\'%3E%3Crect width=\\'60\\' height=\\'80\\' fill=\\'%23d0e2f2\\'/%3E%3Ctext x=\\'30\\' y=\\'40\\' text-anchor=\\'middle\\' fill=\\'%231e6d8f\\' font-size=\\'10\\'%3E%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E\\'"></td>' +
            '<td style="text-align:left;">' + (book.bookName||'-').replace(/</g,'&lt;') + '<br><small>' + (book.author||'').replace(/</g,'&lt;') + '</small></td>' +
            '<td>' + (book.major||'-') + '</td>' +
            '<td>' + (book.condition||'-') + '</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span><br><small>' + (book.stock||0) + ' 本</small></td>' +
            '<td>' + editBtn + ' ' + toggleBtn + '</td></tr>';
    }).join('');
}

window.searchBooks = function() { renderBookTable(); };
window.resetBookFilters = function() {
    const s = document.getElementById('bookStatusFilter');
    const m = document.getElementById('bookMajorFilter');
    const si = document.getElementById('bookSearchInput');
    if (s) s.value = 'all';
    if (m) m.value = '';
    if (si) si.value = '';
    renderBookTable();
};

window.updateBookStatus = async function(id, status) {
    if (!confirm('确认' + (status === 'LISTED' ? '上架' : '下架') + '？')) return;
    try {
        await adminApiCall('/books/' + id + '/status', 'PUT', { status });
        await loadBooksForMgmt();
    } catch (error) {
        alert(error.message);
    }
};

window.openBookModal = function(bookId) {
    const isEdit = bookId && bookId !== 'undefined' && bookId !== '';
    document.getElementById('bookModalTitle').innerText = isEdit ? '&#128214; 编辑书籍' : '&#128218; 新增书籍';
    document.getElementById('bookForm').reset();
    document.getElementById('coverPreview').innerHTML = '';

    if (isEdit) {
        const book = (window.allBooks || []).find(b => String(b.id) === String(bookId));
        if (book) {
            document.getElementById('bookId').value = book.id;
            document.getElementById('bookName').value = book.bookName || '';
            document.getElementById('bookAuthor').value = book.author || '';
            document.getElementById('bookPublisher').value = book.publisher || '';
            document.getElementById('bookIsbn').value = book.isbn || '';
            document.getElementById('bookMajor').value = book.major || '';
            document.getElementById('bookCondition').value = book.condition || '良好';
            document.getElementById('bookStock').value = book.stock || 0;
            document.getElementById('bookStatus').value = book.status || 'LISTED';
            document.getElementById('bookPoints').value = book.points || 0;
            document.getElementById('bookCoverFile').required = false;
            const ptsDisplay = document.getElementById('bookPointsDisplay');
            if (ptsDisplay) ptsDisplay.innerText = (book.points || 0) + ' 积分';
            if (book.coverImage) {
                document.getElementById('coverPreview').innerHTML =
                    '<img src="' + book.coverImage + '" style="max-width:80px;max-height:100px;border-radius:8px;object-fit:cover;">';
            }
        }
    } else {
        document.getElementById('bookId').value = '';
        document.getElementById('bookCoverFile').required = true;
        const ptsDisplay = document.getElementById('bookPointsDisplay');
        if (ptsDisplay) ptsDisplay.innerText = '0 积分';
    }

    Modal.open('bookModal');
};

window.openBookModalWithPrefill = function(prefill) {
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

window.updateBookPointsByCondition = function() {
    const cond = document.getElementById('bookCondition').value;
    const rule = window.bookPointsRule || { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };
    const pts = rule[cond] || 0;
    document.getElementById('bookPoints').value = pts;
    const ptsDisplay = document.getElementById('bookPointsDisplay');
    if (ptsDisplay) ptsDisplay.innerText = pts + ' 积分';
};

window.previewBookCover = function(input) {
    const preview = document.getElementById('coverPreview');
    if (!preview) return;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = '<img src="' + e.target.result + '" style="max-width:80px;max-height:100px;border-radius:8px;object-fit:cover;">';
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.saveBook = async function() {
    const form = document.getElementById('bookForm');
    const bookId = document.getElementById('bookId').value;
    const isEdit = !!bookId;

    const formData = new FormData();
    formData.append('bookName', document.getElementById('bookName').value);
    formData.append('author', document.getElementById('bookAuthor').value);
    formData.append('publisher', document.getElementById('bookPublisher').value);
    formData.append('isbn', document.getElementById('bookIsbn').value);
    formData.append('major', document.getElementById('bookMajor').value);
    formData.append('condition', document.getElementById('bookCondition').value);
    formData.append('stock', document.getElementById('bookStock').value);
    formData.append('status', document.getElementById('bookStatus').value);
    formData.append('points', document.getElementById('bookPoints').value);

    const coverFile = document.getElementById('bookCoverFile').files[0];
    if (coverFile) formData.append('coverImage', coverFile);

    try {
        let result;
        if (isEdit) {
            result = await adminApiCall('/books/' + bookId, 'PUT', formData);
        } else {
            result = await adminApiCall('/books', 'POST', formData);
        }

        if (result.code === 0 || result.code === 200 || result.success) {
            Modal.close('bookModal');
            await loadBooksForMgmt();
        } else {
            alert(result.message || '保存失败');
        }
    } catch (error) {
        alert(error.message);
    }
};

`;

// Find the initBookMgmtPage function and insert the new functions before it
const initMarker = '// ==================== 书籍管理页面 ====================\nasync function initBookMgmtPage()';
if (c.includes(initMarker)) {
    c = c.replace(initMarker, newFunctions + initMarker);
    console.log('Inserted new functions before initBookMgmtPage');
} else {
    // Try finding initBookMgmtPage another way
    const idx = c.indexOf('async function initBookMgmtPage()');
    if (idx !== -1) {
        c = c.slice(0, idx) + newFunctions + c.slice(idx);
        console.log('Inserted before initBookMgmtPage at', idx);
    } else {
        console.log('initBookMgmtPage not found, appending at end');
        c = c + '\n' + newFunctions;
    }
}

fs.writeFileSync(path, c, 'utf8');
console.log('done, new size:', c.length);
