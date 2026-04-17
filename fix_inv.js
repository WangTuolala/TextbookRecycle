const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Fix renderInventoryTable: 4 columns, search by name only, no in/out buttons
const oldRender = `function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    const searchTerm = document.getElementById('inventorySearchInput')
        ? document.getElementById('inventorySearchInput').value.toLowerCase() : '';

    let filtered = (window.inventoryBooks || []).slice();
    if (searchTerm) {
        filtered = filtered.filter(b =>
            (b.name||'').toLowerCase().includes(searchTerm) ||
            (b.isbn||'').toLowerCase().includes(searchTerm) ||
            (b.author||'').toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">暂无库存数据</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(book => {
        const cover = book.coverImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='50'%3E%3Crect width='40' height='50' fill='%23d0e2f2'/%3E%3Ctext x='20' y='25' text-anchor='middle' fill='%231e6d8f' font-size='8'%3E%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E";
        const loc = book.location || '-';
        return '<tr>' +
            '<td style="text-align:left;"><img src="' + cover + '" style="width:30px;height:40px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:8px;">' + (book.name||'-').replace(/</g,'&lt;') + '</td>' +
            '<td>' + (book.isbn||'-') + '</td>' +
            '<td>' + (book.stock||0) + '</td>' +
            '<td>' + loc + '</td>' +
            '<td>' + formatDate(book.updateTime) + '</td>' +
            '<td>' +
                '<button class="btn-sm" onclick="openStockInForBook(' + book.id + ')">入库</button> ' +
                '<button class="btn-sm" onclick="openStockOutForBook(' + book.id + ')">出库</button>' +
            '</td></tr>';
    }).join('');
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

if (c.includes(oldRender)) {
    c = c.replace(oldRender, newRender);
    console.log('Fixed renderInventoryTable');
} else {
    console.log('Old render not found');
}

fs.writeFileSync(path, c, 'utf8');
