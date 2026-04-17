const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

const oldFn = `function renderCategoryTable() {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;
    const cats = window.allCategories || [];
    if (cats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:40px;">暂无分类数据</td></tr>';
        return;
    }
    tbody.innerHTML = cats.map(cat => '<tr>' +
        '<td>' + (cat.id||'-') + '</td>' +
        '<td>' + (cat.name||'-').replace(/</g,'&lt;') + '</td>' +
        '<td>' + (cat.code||'-') + '</td>' +
        '<td><span class="status-badge ' + (cat.status==='ACTIVE'?'listed':'delisted') + '">' + (cat.status==='ACTIVE'?'启用':'停用') + '</span></td></tr>'
    ).join('');
}`;

const newFn = `function renderCategoryTable() {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;
    const cats = window.allCategories || [];
    if (cats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">暂无分类数据</td></tr>';
        return;
    }
    tbody.innerHTML = cats.map((cat, idx) => '<tr>' +
        '<td>' + (idx+1) + '</td>' +
        '<td>' + (cat.name||'-').replace(/</g,'&lt;') + '</td>' +
        '<td>' + (cat.code||'-') + '</td>' +
        '<td><span class="status-badge ' + (cat.status==='ACTIVE'?'listed':'delisted') + '">' + (cat.status==='ACTIVE'?'启用':'停用') + '</span></td>' +
        '<td><button class="btn-sm" onclick="openCategoryModal(\\'' + cat.id + '\\')">编辑</button></td></tr>'
    ).join('');
}`;

if (c.includes(oldFn)) {
    c = c.replace(oldFn, newFn);
    console.log('Replaced renderCategoryTable');
} else {
    console.log('Not found');
}

fs.writeFileSync(path, c, 'utf8');
console.log('done');
