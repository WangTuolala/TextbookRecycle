const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Remove the OLD duplicate loadCategories and renderCategoryTable (the stubs that preceded the new ones)
const oldBlock = `async function loadCategories() {
    try {
        const result = await adminApiCall('/categories', 'GET');
        window.allCategories = result.data || [];
        renderCategoryTable();
    } catch (error) {
        console.error('加载分类失败', error);
    }
}

function renderCategoryTable() {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;
    const cats = window.allCategories || [];
    if (cats.length === 0) {
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

`;

if (c.includes(oldBlock)) {
    c = c.replace(oldBlock, '');
    fs.writeFileSync(path, c, 'utf8');
    console.log('Removed duplicate');
} else {
    console.log('Not found, trying partial match');
    // Try removing just loadCategories stub
    const pat1 = /\nasync function loadCategories\(\) \{\n[\s\S]*?renderCategoryTable\(\);\n[\s\S]*?\n\}\n/;
    if (pat1.test(c)) {
        c = c.replace(pat1, '\n');
        fs.writeFileSync(path, c, 'utf8');
        console.log('Removed loadCategories stub via regex');
    }
}
