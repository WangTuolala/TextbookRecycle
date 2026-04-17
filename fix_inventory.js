const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

const newBlock = `
// ==================== 库存管理页面 ====================
async function initInventoryPage() {
    if (!document.querySelector('.inventory-page')) return;
    await loadInventoryBooks();
    bindInventoryEvents();
}

async function initInventoryInPage() {
    if (!document.querySelector('.inventory-in-page')) return;
    await loadInventoryInRecords();
    bindInventoryInEvents();
}

async function initInventoryOutPage() {
    if (!document.querySelector('.inventory-out-page')) return;
    await loadInventoryOutRecords();
    bindInventoryOutEvents();
}

async function initInventoryCheckPage() {
    if (!document.querySelector('.inventory-check-page')) return;
    // 生成盘点单号
    const now = new Date();
    const checkNo = 'CHK-' + now.getFullYear() +
        String(now.getMonth()+1).padStart(2,'0') +
        String(now.getDate()).padStart(2,'0') + '-' +
        String(now.getHours()).padStart(2,'0') +
        String(now.getMinutes()).padStart(2,'0') +
        String(now.getSeconds()).padStart(2,'0');
    const el = document.getElementById('checkNo');
    if (el) el.value = checkNo;
    const dateEl = document.getElementById('checkDate');
    if (dateEl) dateEl.value = now.toISOString().slice(0,10);
    const opEl = document.getElementById('checkOperator');
    if (opEl) opEl.value = window.currentAdminName || '管理员';
    bindInventoryCheckEvents();
}

// ---- 全部库存 ----
async function loadInventoryBooks() {
    try {
        const result = await adminApiCall('/inventory/books', 'GET');
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
}

function bindInventoryEvents() {
    const inp = document.getElementById('inventorySearchInput');
    if (inp) {
        inp.addEventListener('input', renderInventoryTable);
        inp.addEventListener('keypress', e => { if (e.key === 'Enter') renderInventoryTable(); });
    }
    loadStockInBookSelect();
    loadStockOutBookSelect();
}

async function loadStockInBookSelect() {
    try {
        const result = await adminApiCall('/inventory/books', 'GET');
        const books = result.data || [];
        const sel = document.getElementById('stockInBookSelect');
        if (!sel) return;
        sel.innerHTML = '<option value="">-- 请选择教材 --</option>' +
            books.map(b => '<option value="' + b.id + '">' + (b.name||'-') + '（库存:' + (b.stock||0) + '）</option>').join('');
    } catch (error) { console.error('加载教材下拉失败', error); }
}

async function loadStockOutBookSelect() {
    try {
        const result = await adminApiCall('/inventory/books', 'GET');
        const books = result.data || [];
        const sel = document.getElementById('stockOutBookSelect');
        if (!sel) return;
        sel.innerHTML = '<option value="">-- 请选择教材 --</option>' +
            books.map(b => '<option value="' + b.id + '">' + (b.name||'-') + '（库存:' + (b.stock||0) + '）</option>').join('');
    } catch (error) { console.error('加载教材下拉失败', error); }
}

window.openStockInModal = function() {
    loadStockInBookSelect();
    Modal.open('stockInModal');
};

window.openStockOutModal = function() {
    loadStockOutBookSelect();
    Modal.open('stockOutModal');
};

window.openStockInForBook = function(bookId) {
    document.getElementById('stockInBookSelect').value = bookId;
    Modal.open('stockInModal');
};

window.openStockOutForBook = function(bookId) {
    document.getElementById('stockOutBookSelect').value = bookId;
    Modal.open('stockOutModal');
};

window.submitStockIn = async function() {
    const bookId = document.getElementById('stockInBookSelect').value;
    const qty = document.getElementById('stockInQuantity').value;
    const remark = document.getElementById('stockInRemark').value;
    if (!bookId) { alert('请选择教材'); return; }
    if (!qty || qty <= 0) { alert('请输入正确的数量'); return; }
    try {
        await adminApiCall('/inventory/in', 'POST', {
            bookId: parseInt(bookId),
            quantity: parseInt(qty),
            remark: remark || ''
        });
        Modal.close('stockInModal');
        document.getElementById('stockInQuantity').value = '1';
        document.getElementById('stockInRemark').value = '';
        await loadInventoryBooks();
        renderInventoryTable();
        alert('入库成功');
    } catch (error) {
        alert(error.message);
    }
};

window.submitStockOut = async function() {
    const bookId = document.getElementById('stockOutBookSelect').value;
    const qty = document.getElementById('stockOutQuantity').value;
    const remark = document.getElementById('stockOutRemark').value;
    if (!bookId) { alert('请选择教材'); return; }
    if (!qty || qty <= 0) { alert('请输入正确的数量'); return; }
    try {
        await adminApiCall('/inventory/out', 'POST', {
            bookId: parseInt(bookId),
            quantity: parseInt(qty),
            remark: remark || ''
        });
        Modal.close('stockOutModal');
        document.getElementById('stockOutQuantity').value = '1';
        document.getElementById('stockOutRemark').value = '';
        await loadInventoryBooks();
        renderInventoryTable();
        alert('出库成功');
    } catch (error) {
        alert(error.message);
    }
};

// ---- 入库记录 ----
async function loadInventoryInRecords() {
    try {
        const result = await adminApiCall('/inventory/records', 'GET');
        window.inventoryInRecords = (result.data || []).filter(r => r.type === 'IN');
        renderInventoryInTable();
    } catch (error) {
        window.inventoryInRecords = [];
    }
}

function renderInventoryInTable() {
    const tbody = document.getElementById('inventoryInTableBody');
    if (!tbody) return;
    const records = window.inventoryInRecords || [];
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无入库记录</td></tr>';
        return;
    }
    tbody.innerHTML = records.map(r => '<tr>' +
        '<td>' + (r.id||'-') + '</td>' +
        '<td style="text-align:left;">' + (r.bookName||'-').replace(/</g,'&lt;') + '</td>' +
        '<td>' + (r.isbn||'-') + '</td>' +
        '<td>+' + (r.quantity||0) + '</td>' +
        '<td>' + formatDateTime(r.createTime) + '</td>' +
        '<td>' + (r.operator||'-') + '</td>' +
        '<td>' + (r.remark||'-') + '</td></tr>'
    ).join('');
}

function bindInventoryInEvents() {
    const inp = document.querySelector('.inventory-in-page input[type="text"]');
    if (inp) inp.addEventListener('input', e => {
        const term = e.target.value.toLowerCase();
        const filtered = (window.inventoryInRecords||[]).filter(r =>
            (r.bookName||'').toLowerCase().includes(term) ||
            (r.isbn||'').toLowerCase().includes(term)
        );
        const tbody = document.getElementById('inventoryInTableBody');
        if (!tbody) return;
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无入库记录</td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(r => '<tr>' +
            '<td>' + (r.id||'-') + '</td>' +
            '<td style="text-align:left;">' + (r.bookName||'-').replace(/</g,'&lt;') + '</td>' +
            '<td>' + (r.isbn||'-') + '</td>' +
            '<td>+' + (r.quantity||0) + '</td>' +
            '<td>' + formatDateTime(r.createTime) + '</td>' +
            '<td>' + (r.operator||'-') + '</td>' +
            '<td>' + (r.remark||'-') + '</td></tr>'
        ).join('');
    });
}

// ---- 出库记录 ----
async function loadInventoryOutRecords() {
    try {
        const result = await adminApiCall('/inventory/records', 'GET');
        window.inventoryOutRecords = (result.data || []).filter(r => r.type === 'OUT');
        renderInventoryOutTable();
    } catch (error) {
        window.inventoryOutRecords = [];
    }
}

function renderInventoryOutTable() {
    const tbody = document.getElementById('inventoryOutTableBody');
    if (!tbody) return;
    const records = window.inventoryOutRecords || [];
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无出库记录</td></tr>';
        return;
    }
    tbody.innerHTML = records.map(r => '<tr>' +
        '<td>' + (r.id||'-') + '</td>' +
        '<td style="text-align:left;">' + (r.bookName||'-').replace(/</g,'&lt;') + '</td>' +
        '<td>' + (r.isbn||'-') + '</td>' +
        '<td>-' + (r.quantity||0) + '</td>' +
        '<td>' + formatDateTime(r.createTime) + '</td>' +
        '<td>' + (r.operator||'-') + '</td>' +
        '<td>' + (r.remark||'-') + '</td></tr>'
    ).join('');
}

function bindInventoryOutEvents() {
    const inp = document.querySelector('.inventory-out-page input[type="text"]');
    if (inp) inp.addEventListener('input', e => {
        const term = e.target.value.toLowerCase();
        const filtered = (window.inventoryOutRecords||[]).filter(r =>
            (r.bookName||'').toLowerCase().includes(term) ||
            (r.isbn||'').toLowerCase().includes(term)
        );
        const tbody = document.getElementById('inventoryOutTableBody');
        if (!tbody) return;
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无出库记录</td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(r => '<tr>' +
            '<td>' + (r.id||'-') + '</td>' +
            '<td style="text-align:left;">' + (r.bookName||'-').replace(/</g,'&lt;') + '</td>' +
            '<td>' + (r.isbn||'-') + '</td>' +
            '<td>-' + (r.quantity||0) + '</td>' +
            '<td>' + formatDateTime(r.createTime) + '</td>' +
            '<td>' + (r.operator||'-') + '</td>' +
            '<td>' + (r.remark||'-') + '</td></tr>'
        ).join('');
    });
}

// ---- 库存盘点 ----
window.loadInventoryCheckData = async function() {
    try {
        const result = await adminApiCall('/inventory/books', 'GET');
        const books = result.data || [];
        window.checkBooks = books;
        renderInventoryCheckTable();
    } catch (error) {
        alert('加载盘点数据失败');
    }
};

function renderInventoryCheckTable() {
    const tbody = document.getElementById('inventoryCheckTableBody');
    if (!tbody) return;
    const books = window.checkBooks || [];
    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">暂无库存数据</td></tr>';
        return;
    }
    tbody.innerHTML = books.map(book => '<tr data-id="' + book.id + '">' +
        '<td style="text-align:left;">' + (book.name||'-').replace(/</g,'&lt;') + '</td>' +
        '<td>' + (book.isbn||'-') + '</td>' +
        '<td id="sys-' + book.id + '">' + (book.stock||0) + '</td>' +
        '<td><input type="number" class="check-input" id="actual-' + book.id + '" value="' + (book.stock||0) + '" min="0" onchange="updateCheckDiff(' + book.id + ')"></td>' +
        '<td id="diff-' + book.id + '" class="diff-cell">0</td>' +
        '<td><input type="text" class="check-remark" id="remark-' + book.id + '" placeholder="备注"></td></tr>'
    ).join('');
    updateCheckSummary();
}

window.updateCheckDiff = function(bookId) {
    const sysStock = parseInt(document.getElementById('sys-' + bookId)?.innerText || '0');
    const actualStock = parseInt(document.getElementById('actual-' + bookId)?.value || '0');
    const diff = actualStock - sysStock;
    const diffEl = document.getElementById('diff-' + bookId);
    if (diffEl) {
        diffEl.innerText = (diff > 0 ? '+' : '') + diff;
        diffEl.className = 'diff-cell ' + (diff > 0 ? 'profit' : diff < 0 ? 'loss' : '');
    }
    updateCheckSummary();
};

function updateCheckSummary() {
    const books = window.checkBooks || [];
    let totalSpecies = books.length;
    let totalStock = 0;
    let profitCount = 0;
    let lossCount = 0;
    books.forEach(book => {
        const sysStock = parseInt(document.getElementById('sys-' + book.id)?.innerText || '0');
        const actualStock = parseInt(document.getElementById('actual-' + book.id)?.value || '0');
        const diff = actualStock - sysStock;
        totalStock += actualStock;
        if (diff > 0) profitCount += diff;
        if (diff < 0) lossCount += Math.abs(diff);
    });
    const totalDiff = profitCount - lossCount;
    const diffNumEl = document.querySelector('.diff-number');
    if (diffNumEl) diffNumEl.innerText = (totalDiff > 0 ? '+' : '') + totalDiff;
    const el = id => document.getElementById(id);
    if (el('totalSpecies')) el('totalSpecies').innerText = totalSpecies;
    if (el('totalStock')) el('totalStock').innerText = totalStock;
    if (el('profitCount')) el('profitCount').innerText = profitCount;
    if (el('lossCount')) el('lossCount').innerText = lossCount;
}

window.saveCheckResult = function() {
    const books = window.checkBooks || [];
    let html = '盘点结果汇总：\n';
    let hasDiff = false;
    books.forEach(book => {
        const sysStock = parseInt(document.getElementById('sys-' + book.id)?.innerText || '0');
        const actualStock = parseInt(document.getElementById('actual-' + book.id)?.value || '0');
        const diff = actualStock - sysStock;
        const remark = document.getElementById('remark-' + book.id)?.value || '';
        if (diff !== 0) {
            hasDiff = true;
            html += book.name + '：系统' + sysStock + '，实际' + actualStock + '，差异' + (diff>0?'+':'') + diff + (remark ? '（'+remark+'）' : '') + '\n';
        }
    });
    if (!hasDiff) html += '所有库存账实一致，无差异。\n';
    alert(html);
};

function bindInventoryCheckEvents() {
    // 初始化时自动加载
    loadInventoryCheckData();
}

`;
const domMarker = "// ==================== 初始化 ====================\ndocument.addEventListener('DOMContentLoaded', () => {";
if (c.includes(domMarker)) {
    c = c.replace(domMarker, newBlock + '\n' + domMarker);
    console.log('Inserted inventory functions');
} else {
    c = c + '\n' + newBlock;
    console.log('Appended at end');
}

// Update DOMContentLoaded to include inventory inits
const oldInit = `    initInventoryPage();`;
const newInit = `    initInventoryPage();
    initInventoryInPage();
    initInventoryOutPage();
    initInventoryCheckPage();`;
if (!c.includes('initInventoryInPage')) {
    c = c.replace(oldInit, newInit);
    console.log('Added inventory init calls');
}

fs.writeFileSync(path, c, 'utf8');
console.log('done, new size:', c.length);
