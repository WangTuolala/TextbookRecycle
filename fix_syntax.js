const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

const i = c.indexOf('async function loadProfileData()');
const j = c.indexOf('async function saveProfile()');
console.log('loadProfileData at', i, 'saveProfile at', j);
console.log('--- loadProfileData ---');
console.log(c.slice(i, j));
