const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Replace the entire 全部库存 block
const oldBlock = `// ---- 全部库存 ----
async function loadInventoryBooks() {
    try {
        const result = await adminApiCall('/inventory/books-with-operators', 'GET');
        window.inventoryBooks = result.data || [];
        renderInventoryTable();
    } catch (error) {
        console.error('加载库存失败:', error);
        window.inventoryBooks = [];
    }
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    const searchTerm = document.getElementById('inventorySearchInput')
        ? document.getElementById('inventorySearchInput').value.toLowerCase() : '';

    let filtered = (window.inventoryBooks || []).slice();
    if (searchTerm) {
        filtered = filtered.filter(b =>
            (b.name||'').toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">暂无库存数据</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(book => {
        const operator = book.lastOperator || '-';
        const time = book.lastRecordTime ? formatDateTime(book.lastRecordTime) : (book.updateTime ? formatDateTime(book.updateTime) : '-');
        return '<tr>' +
            '<td>' + escapeHtml(book.name || '-') + '</td>' +
            '<td>' + (book.isbn||'-') + '</td>' +
            '<td>' + (book.stock||0) + '</td>' +
            '<td>' + time + '</td>' +
            '<td>' + escapeHtml(operator) + '</td></tr>';
    }).join('');
}`;

const newBlock = `// ---- 全部库存 ----
async function loadInventoryBooks() {
    try {
        const result = await adminApiCall('/inventory/all-records', 'GET');
        window.inventoryBooks = result.data || [];
        renderInventoryTable();
    } catch (error) {
        console.error('加载库存失败:', error);
        window.inventoryBooks = [];
    }
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    const searchTerm = document.getElementById('inventorySearchInput')
        ? document.getElementById('inventorySearchInput').value.toLowerCase() : '';

    let filtered = (window.inventoryBooks || []).slice();
    if (searchTerm) {
        filtered = filtered.filter(b =>
            (b.bookName||'').toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">暂无库存数据</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(r => {
        const typeLabel = r.type === 'IN' ? '入库' : '出库';
        const typeClass = r.type === 'IN' ? 'listed' : 'delisted';
        return '<tr>' +
            '<td>' + escapeHtml(r.bookName || '-') + '</td>' +
            '<td>-</td>' +
            '<td><span class="status-badge ' + typeClass + '">' + typeLabel + '</span></td>' +
            '<td>' + (r.quantity||0) + '</td>' +
            '<td>' + (r.time ? formatDateTime(r.time) : '-') + '</td>' +
            '<td>' + escapeHtml(r.operator || '-') + '</td></tr>';
    }).join('');
}`;

if (c.includes(oldBlock)) {
    c = c.replace(oldBlock, newBlock);
    console.log('Replaced inventory block');
} else {
    console.log('Old block not found');
}

fs.writeFileSync(path, c, 'utf8');
