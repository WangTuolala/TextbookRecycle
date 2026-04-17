const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Fix loadInventoryBooks to use the new endpoint
c = c.replace(
    "const result = await adminApiCall('/inventory/books', 'GET');\n        window.inventoryBooks = result.data || [];",
    "const result = await adminApiCall('/inventory/books-with-operators', 'GET');\n        window.inventoryBooks = result.data || [];"
);

// Fix renderInventoryTable: 5 columns, operator column
const oldRender = `function renderInventoryTable() {
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
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;">暂无库存数据</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(book => {
        return '<tr>' +
            '<td>' + escapeHtml(book.name || '-') + '</td>' +
            '<td>' + (book.isbn||'-') + '</td>' +
            '<td>' + (book.stock||0) + '</td>' +
            '<td>' + (book.updateTime ? formatDateTime(book.updateTime) : '-') + '</td></tr>';
    }).join('');
}

function searchInventoryTable() {
    renderInventoryTable();
}`;

const newRender = `function renderInventoryTable() {
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
}

function searchInventoryTable() {
    renderInventoryTable();
}`;

if (c.includes(oldRender)) {
    c = c.replace(oldRender, newRender);
    console.log('Fixed renderInventoryTable');
} else {
    console.log('Old render not found');
}

fs.writeFileSync(path, c, 'utf8');
