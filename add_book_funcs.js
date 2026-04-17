const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

const marker = `function renderBookTable`;

const newFuncs = `// ==================== 书籍新增/编辑弹窗 ====================
function openBookModal(book) {
    document.getElementById('bookForm').reset();
    document.getElementById('bookId').value = '';
    document.getElementById('coverPreview').innerHTML = '';
    document.getElementById('bookPointsDisplay').innerText = '—';
    document.getElementById('bookPoints').value = '0';
    document.getElementById('bookModalTitle').innerText = '📖 新增书籍';
    document.getElementById('bookCoverFile').required = true;

    if (book) {
        document.getElementById('bookId').value = book.id;
        document.getElementById('bookName').value = book.name || '';
        document.getElementById('bookAuthor').value = book.author || '';
        document.getElementById('bookPublisher').value = book.publisher || '';
        document.getElementById('bookIsbn').value = book.isbn || '';
        document.getElementById('bookMajor').value = book.major || '';
        document.getElementById('bookCondition').value = book.condition || '';
        document.getElementById('bookStock').value = book.stock || 0;
        document.getElementById('bookStatus').value = book.status || 'LISTED';
        document.getElementById('bookPoints').value = book.points || 0;
        document.getElementById('bookPointsDisplay').innerText = book.points || 0;
        document.getElementById('bookCoverFile').required = false;
        if (book.coverImage) {
            document.getElementById('coverPreview').innerHTML =
                '<img src="' + book.coverImage + '" style="max-width:120px;max-height:120px;border-radius:4px;">';
        }
        document.getElementById('bookModalTitle').innerText = '📖 编辑书籍';
    }

    Modal.open('bookModal');
}

function openBookModalWithPrefill(prefill) {
    openBookModal();
    if (prefill.name) document.getElementById('bookName').value = prefill.name;
    if (prefill.author) document.getElementById('bookAuthor').value = prefill.author;
    if (prefill.publisher) document.getElementById('bookPublisher').value = prefill.publisher;
    if (prefill.isbn) document.getElementById('bookIsbn').value = prefill.isbn;
    if (prefill.condition) {
        document.getElementById('bookCondition').value = prefill.condition;
        updateBookPointsByCondition();
    }
    if (prefill.points) {
        document.getElementById('bookPoints').value = prefill.points;
        document.getElementById('bookPointsDisplay').innerText = prefill.points;
    }
    document.getElementById('bookCoverFile').required = false;
}

function previewBookCover(input) {
    const preview = document.getElementById('coverPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = '<img src="' + e.target.result + '" style="max-width:120px;max-height:120px;border-radius:4px;">';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = '';
    }
}

function updateBookPointsByCondition() {
    const condition = document.getElementById('bookCondition').value;
    const rule = window.bookPointsRule || {};
    const points = rule[condition] || 0;
    document.getElementById('bookPoints').value = points;
    document.getElementById('bookPointsDisplay').innerText = points > 0 ? points : '—';
}

async function saveBook() {
    const formData = new FormData();
    const id = document.getElementById('bookId').value;
    const name = document.getElementById('bookName').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const publisher = document.getElementById('bookPublisher').value.trim();
    const isbn = document.getElementById('bookIsbn').value.trim();
    const major = document.getElementById('bookMajor').value;
    const condition = document.getElementById('bookCondition').value;
    const points = parseInt(document.getElementById('bookPoints').value) || 0;
    const stock = parseInt(document.getElementById('bookStock').value) || 0;
    const status = document.getElementById('bookStatus').value;
    const coverFile = document.getElementById('bookCoverFile').files[0];

    if (!name) { alert('请填写书籍名称'); return; }
    if (!author) { alert('请填写作者'); return; }
    if (!publisher) { alert('请填写出版社'); return; }
    if (!isbn) { alert('请填写ISBN'); return; }
    if (!major) { alert('请选择专业'); return; }
    if (!condition) { alert('请选择品相'); return; }
    if (!id && !coverFile) { alert('请上传教材封面图'); return; }

    formData.append('name', name);
    formData.append('author', author);
    formData.append('publisher', publisher);
    formData.append('isbn', isbn);
    formData.append('major', major);
    formData.append('condition', condition);
    formData.append('points', points);
    formData.append('stock', stock);
    formData.append('status', status);
    if (coverFile) formData.append('coverImageFile', coverFile);

    try {
        let result;
        if (id) {
            result = await adminApiCall('/books/' + id, 'PUT', formData);
        } else {
            result = await adminApiCall('/books', 'POST', formData);
        }
        if (result.success) {
            alert(id ? '修改成功' : '新增成功');
            Modal.close('bookModal');
            await loadBooksForMgmt();
        } else {
            alert(result.message || '操作失败');
        }
    } catch (error) {
        alert(error.message);
    }
}

`;

if (c.includes(marker)) {
    c = c.replace(marker, newFuncs + marker);
    fs.writeFileSync(path, c, 'utf8');
    console.log('done');
} else {
    console.log('marker not found');
}
