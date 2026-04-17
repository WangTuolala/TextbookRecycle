const fs = require('fs');
const c = fs.readFileSync('C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/admin/category-mgmt.html', 'utf8');
const ids = c.match(/id="([^"]+)"/g) || [];
console.log('IDs:', ids.join(', '));
const classes = c.match(/class="([^"]+)"/g) || [];
console.log('Classes:');
classes.forEach(cl => console.log(' ', cl));
