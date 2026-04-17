const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

const openBookModalCode = `window.openBookModal = function(bookId) {
    const isEdit = bookId && bookId !== 'undefined' && bookId !== '';
    document.getElementById('bookModalTitle').innerText = isEdit ? '&#128214; 编辑书籍' : '&#128218; 新增书籍';
    document.getElementById('bookForm').reset();
    document.getElementById('coverPreview').innerHTML = '';

    if (isEdit) {
        const books = window.allBooks || [];
        const book = books.find(b => String(b.id) === String(bookId));
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
    }

    Modal.open('bookModal');
};

`;

const marker = "window.openBookModalWithPrefill = function(prefill)";
if (c.includes(marker)) {
    c = c.replace(marker, openBookModalCode + marker);
    console.log('Inserted openBookModal before openBookModalWithPrefill');
} else {
    // Just append before the init block or anywhere
    console.log('openBookModalWithPrefill not found, appending at end');
    c = c + '\n' + openBookModalCode;
}

fs.writeFileSync(path, c, 'utf8');
console.log('done, new size:', c.length);
