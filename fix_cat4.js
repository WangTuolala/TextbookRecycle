const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Replace the entire renderCategoryTable and surrounding functions
const oldBlock = `function renderCategoryTable(cats) {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;
    if (!cats || cats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;">暂无分类数据</td></tr>';
        return;
    }
    tbody.innerHTML = cats.map((cat, idx) => '<tr>' +
        '<td>' + (idx+1) + '</td>' +
        '<td>' + (cat.name||'-').replace(/</g,'&lt;') + '</td>' +
        '<td><span class="status-badge ' + (cat.status==='ACTIVE'?'listed':'delisted') + '">' + (cat.status==='ACTIVE'?'启用':'停用') + '</span></td>' +
        '<td><button class="btn-sm" onclick="openCategoryModal(\\'' + cat.id + '\\')">编辑</button></td></tr>'
    ).join('');
}`;

const newBlock = `function renderCategoryTable(cats) {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;
    if (!cats || cats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;">暂无分类数据</td></tr>';
        return;
    }
    tbody.innerHTML = cats.map((cat) => {
        const isActive = cat.status === 'ACTIVE';
        const statusLabel = isActive ? '启用' : '禁用';
        const statusClass = isActive ? 'listed' : 'delisted';
        const toggleLabel = isActive ? '禁用' : '启用';
        const toggleClass = isActive ? 'btn-danger' : 'btn-pass';
        const createdTime = cat.createdAt ? formatDateTime(cat.createdAt) : '-';
        return '<tr>' +
            '<td>' + escapeHtml(cat.name || '-') + '</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></td>' +
            '<td>' + createdTime + '</td>' +
            '<td>' +
                '<button class="btn-sm" onclick="openCategoryModal(\\'' + cat.id + '\\')">编辑</button> ' +
                '<button class="btn-sm ' + toggleClass + '" onclick="toggleCategory(\\'' + cat.id + '\\')">' + toggleLabel + '</button>' +
            '</td></tr>';
    }).join('');
}`;

if (c.includes(oldBlock)) {
    c = c.replace(oldBlock, newBlock);
    console.log('Replaced renderCategoryTable');
} else {
    console.log('Old block not found');
}

fs.writeFileSync(path, c, 'utf8');
