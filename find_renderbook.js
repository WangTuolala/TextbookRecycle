const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');
const i = c.indexOf('function renderBookTable');
const j = c.indexOf('function loadBooksForMgmt');
console.log(c.slice(i, j));
