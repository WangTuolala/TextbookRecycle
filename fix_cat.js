const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Fix renderCategoryTable: 4 columns (remove code column, update colspan)
const old1 = `        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">暂无分类数据</td></tr>'`;
const new1 = `        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;">暂无分类数据</td></tr>'`;
c = c.replace(old1, new1);

const old2 = `        '<td>' + (cat.code||'-') + '</td>' +`;
c = c.replace(old2, '');

// Add saveCategory and openCategoryModal after renderCategoryTable
const insertAfter = `}

function bindCategoryEvents()`;
const newFuncs = `}

async function openCategoryModal(id) {
    document.getElementById('categoryId').value = id || '';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryModalTitle').textContent = id ? '📂 编辑专业' : '📂 新增专业';
    if (id) {
        const cats = window.allCategories || [];
        const cat = cats.find(c => c.id == id);
        if (cat) document.getElementById('categoryName').value = cat.name || '';
    }
    Modal.open('categoryModal');
}

async function saveCategory() {
    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value.trim();
    if (!name) { alert('请输入专业名称'); return; }
    const payload = { name: name, status: 'ACTIVE' };
    try {
        if (id) {
            await adminApiCall('/categories/' + id, 'PUT', payload);
            alert('更新成功');
        } else {
            await adminApiCall('/categories', 'POST', payload);
            alert('新增成功');
        }
        Modal.close('categoryModal');
        await loadCategories();
    } catch (e) {
        alert('保存失败: ' + (e.message || ''));
    }
}

async function loadCategories() {
    try {
        const result = await adminApiCall('/categories', 'GET');
        window.allCategories = result.data || [];
        renderCategoryTable(window.allCategories);
    } catch (e) { console.error('加载分类失败', e); }
}

function bindCategoryEvents()`;

c = c.replace(insertAfter, newFuncs);

fs.writeFileSync(path, c, 'utf8');
console.log('Done');
