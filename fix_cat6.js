const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Add toggleCategory after saveCategory
const saveCategoryEnd = "alert('保存失败: ' + (e.message || ''));\n    }\n}\n\nasync function loadCategories()";
const toggleCategoryFunc = `alert('保存失败: ' + (e.message || ''));\n    }\n}\n\nasync function toggleCategory(id) {\n    const cats = window.allCategories || [];\n    const cat = cats.find(c => c.id == id);\n    if (!cat) return;\n    const newStatus = cat.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';\n    try {\n        await adminApiCall('/categories/' + id, 'PUT', { name: cat.name, status: newStatus });\n        await loadCategories();\n    } catch (e) {\n        alert('操作失败: ' + (e.message || ''));\n    }\n}\n\nasync function loadCategories()`;

if (c.includes(saveCategoryEnd)) {
    c = c.replace(saveCategoryEnd, toggleCategoryFunc);
    fs.writeFileSync(path, c, 'utf8');
    console.log('Added toggleCategory');
} else {
    console.log('Not found, searching...');
    // Find the line with alert保存
    const lines = c.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("alert('保存失败")) {
            console.log('Found at line', i+1, ':', lines[i]);
        }
    }
}
