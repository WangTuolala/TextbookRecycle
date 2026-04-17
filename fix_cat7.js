const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Insert toggleCategory between saveCategory's closing brace and renderCategoryTable
const insertPoint = `    }
}

function renderCategoryTable(cats) {`;

const newContent = `    }
}

async function toggleCategory(id) {
    const cats = window.allCategories || [];
    const cat = cats.find(c => c.id == id);
    if (!cat) return;
    const newStatus = cat.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
        await adminApiCall('/categories/' + id, 'PUT', { name: cat.name, status: newStatus });
        await loadCategories();
    } catch (e) {
        alert('操作失败: ' + (e.message || ''));
    }
}

function renderCategoryTable(cats) {`;

if (c.includes(insertPoint)) {
    c = c.replace(insertPoint, newContent);
    fs.writeFileSync(path, c, 'utf8');
    console.log('Inserted toggleCategory');
} else {
    console.log('Insert point not found');
}
