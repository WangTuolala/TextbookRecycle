const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Replace the entire inventory check section with new implementation
const oldBlock = `// ---- 库存盘点 ----
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
    let html = '盘点结果汇总：\\n';
    let hasDiff = false;
    books.forEach(book => {
        const sysStock = parseInt(document.getElementById('sys-' + book.id)?.innerText || '0');
        const actualStock = parseInt(document.getElementById('actual-' + book.id)?.value || '0');
        const diff = actualStock - sysStock;
        const remark = document.getElementById('remark-' + book.id)?.value || '';
        if (diff !== 0) {
            hasDiff = true;
            html += book.name + '：系统' + sysStock + '，实际' + actualStock + '，差异' + (diff>0?'+':'') + diff + (remark ? '（'+remark+'）' : '') + '\\n';
        }
    });
    if (!hasDiff) html += '所有库存账实一致，无差异。\\n';
    alert(html);
};

function bindInventoryCheckEvents() {
    // 初始化时自动加载
    loadInventoryCheckData();
}`;

const newBlock = `// ---- 库存盘点 ----
async function initInventoryCheckPage() {
    if (!document.querySelector('.inventory-check-page')) return;
    await loadCheckItems();
}

async function loadCheckItems() {
    try {
        const [checksResult, booksResult] = await Promise.all([
            adminApiCall('/stock-checks', 'GET'),
            adminApiCall('/inventory/books', 'GET')
        ]);
        window.stockChecks = checksResult.data || [];
        window.allBooksForCheck = booksResult.data || [];
        renderCheckTable();
        updateCheckStats();
    } catch (error) {
        console.error('加载盘点数据失败', error);
        window.stockChecks = [];
    }
}

function renderCheckTable() {
    const tbody = document.getElementById('checkTableBody');
    if (!tbody) return;
    const searchTerm = (document.getElementById('checkSearchInput')?.value || '').toLowerCase();
    let filtered = (window.stockChecks || []).slice();
    if (searchTerm) {
        filtered = filtered.filter(c =>
            (c.bookName||'').toLowerCase().includes(searchTerm)
        );
    }
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无盘点记录</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(c => {
        const diff = c.diff || 0;
        const diffStr = (diff > 0 ? '+' : '') + diff;
        const diffClass = diff > 0 ? 'profit' : diff < 0 ? 'loss' : '';
        return '<tr>' +
            '<td style="text-align:left;">' + escapeHtml(c.bookName || '-') + '</td>' +
            '<td>' + (c.isbn || '-') + '</td>' +
            '<td>' + (c.systemStock || 0) + '</td>' +
            '<td>' + (c.actualStock || 0) + '</td>' +
            '<td class="diff-cell ' + diffClass + '">' + diffStr + '</td>' +
            '<td>' + (c.remark || '-') + '</td>' +
            '<td>' + escapeHtml(c.operator || '-') + '</td></tr>';
    }).join('');
    updateCheckStats();
}

function searchCheckTable() {
    renderCheckTable();
}

function updateCheckStats() {
    const checks = window.stockChecks || [];
    let totalStock = 0;
    let profit = 0;
    let loss = 0;
    checks.forEach(c => {
        if (c.diff > 0) profit += c.diff;
        if (c.diff < 0) loss += Math.abs(c.diff);
    });
    const el = id => document.getElementById(id);
    if (el('statTotalStock')) el('statTotalStock').innerText = checks.reduce((s, c) => s + (c.actualStock||0), 0);
    if (el('statProfit')) el('statProfit').innerText = profit;
    if (el('statLoss')) el('statLoss').innerText = loss;
    if (el('diffTotal')) {
        const net = profit - loss;
        el('diffTotal').innerText = (net > 0 ? '+' : '') + net;
    }
}

window.openCheckModal = function() {
    // 填充书籍下拉
    const sel = document.getElementById('checkBookSelect');
    if (sel) {
        sel.innerHTML = '<option value="">-- 请选择教材 --</option>' +
            (window.allBooksForCheck||[]).map(b =>
                '<option value="' + b.id + '" data-isbn="' + (b.isbn||'') + '" data-stock="' + (b.stock||0) + '">' +
                (b.name||'-') + '（库存:' + (b.stock||0) + '）</option>'
            ).join('');
    }
    document.getElementById('checkIsbn').value = '';
    document.getElementById('checkSystemStock').value = '';
    document.getElementById('checkActualStock').value = '0';
    document.getElementById('checkDiff').value = '0';
    document.getElementById('checkRemark').value = '';
    document.getElementById('checkOperatorInput').value = '';
    Modal.open('checkModal');
};

window.onCheckBookChange = function() {
    const sel = document.getElementById('checkBookSelect');
    const opt = sel?.selectedOptions[0];
    if (opt) {
        document.getElementById('checkIsbn').value = opt.dataset.isbn || '';
        document.getElementById('checkSystemStock').value = opt.dataset.stock || '0';
    } else {
        document.getElementById('checkIsbn').value = '';
        document.getElementById('checkSystemStock').value = '';
    }
    calcCheckDiff();
};

window.calcCheckDiff = function() {
    const sys = parseInt(document.getElementById('checkSystemStock')?.value || '0');
    const actual = parseInt(document.getElementById('checkActualStock')?.value || '0');
    const diff = actual - sys;
    document.getElementById('checkDiff').value = (diff > 0 ? '+' : '') + diff;
};

window.submitCheckItem = async function() {
    const sel = document.getElementById('checkBookSelect');
    const bookId = sel?.value;
    const bookName = sel?.selectedOptions[0]?.text?.split('（')[0] || '';
    const isbn = document.getElementById('checkIsbn')?.value || '';
    const systemStock = parseInt(document.getElementById('checkSystemStock')?.value || '0');
    const actualStock = parseInt(document.getElementById('checkActualStock')?.value || '0');
    const diff = actualStock - systemStock;
    const remark = document.getElementById('checkRemark')?.value;
    const operator = document.getElementById('checkOperatorInput')?.value?.trim();
    if (!bookId) { alert('请选择教材'); return; }
    if (!remark) { alert('请选择备注'); return; }
    if (!operator) { alert('请输入经手人'); return; }
    try {
        await adminApiCall('/stock-checks', 'POST', {
            bookId: parseInt(bookId),
            bookName: bookName.trim(),
            isbn: isbn,
            systemStock: systemStock,
            actualStock: actualStock,
            diff: diff,
            remark: remark,
            operator: operator,
            checkTime: new Date().toISOString()
        });
        alert('盘点已添加');
        Modal.close('checkModal');
        await loadCheckItems();
    } catch (e) {
        alert('添加失败: ' + (e.message||''));
    }
};`;

if (c.includes(oldBlock)) {
    c = c.replace(oldBlock, newBlock);
    console.log('Replaced inventory check block');
} else {
    console.log('Old block not found');
}

fs.writeFileSync(path, c, 'utf8');
