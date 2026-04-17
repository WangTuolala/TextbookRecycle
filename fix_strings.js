const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Fix any literal newline inside string literals (not actual line breaks in code)
// Replace patterns like: '...\n...' that span actual newlines in the file
// by finding single-quoted strings that contain literal newlines

// Simple approach: find the saveCheckResult function and rewrite it
const badFn = `window.saveCheckResult = function() {
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
};`;

const goodFn = `window.saveCheckResult = function() {
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
};`;

if (c.includes(badFn)) {
    c = c.replace(badFn, goodFn);
    console.log('Replaced saveCheckResult');
} else {
    // Try to find and fix by counting single-quote strings with embedded newlines
    // Strategy: locate the saveCheckResult function and rewrite it
    const idx = c.indexOf('window.saveCheckResult = function()');
    const endIdx = c.indexOf('function bindInventoryCheckEvents()');
    if (idx !== -1 && endIdx !== -1) {
        const before = c.slice(0, idx);
        const after = c.slice(endIdx);
        c = before + goodFn + '\n\n' + after;
        console.log('Replaced by extraction+replacement');
    } else {
        console.log('Could not find function boundaries', idx, endIdx);
    }
}

fs.writeFileSync(path, c, 'utf8');
console.log('done');
