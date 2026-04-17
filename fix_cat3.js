const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// The loadCategories function calls renderCategoryTable(window.allCategories) but the function is missing
// Add it before loadCategories
const insertBefore = `async function loadCategories() {`;
const newFunc = `function renderCategoryTable(cats) {
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
}

async function loadCategories() {`;

if (c.includes(insertBefore) && !c.includes('function renderCategoryTable(cats)')) {
    c = c.replace(insertBefore, newFunc);
    fs.writeFileSync(path, c, 'utf8');
    console.log('Added renderCategoryTable');
} else {
    console.log('Already exists or insert point not found');
}
