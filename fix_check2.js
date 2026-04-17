const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

const oldStub = `async function initInventoryCheckPage() {
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
`;

const newStub = `async function initInventoryCheckPage() {
    if (!document.querySelector('.inventory-check-page')) return;
    await loadCheckItems();
}
`;

if (c.includes(oldStub)) {
    c = c.replace(oldStub, newStub);
    console.log('Replaced old initInventoryCheckPage');
} else {
    console.log('Old stub not found');
}

fs.writeFileSync(path, c, 'utf8');
