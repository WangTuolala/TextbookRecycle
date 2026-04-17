const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Find saveCategory function and add toggleCategory after it
const idx = c.indexOf("alert('保存失败: ' + (e.message || ''));\n    }\n}");
console.log('saveCategory ends at:', idx);
