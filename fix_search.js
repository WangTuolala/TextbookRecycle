const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Fix search filter - remove author and isbn, keep only name
const old = `(b.name || '').toLowerCase().includes(searchTerm) ||
            (b.author || '').toLowerCase().includes(searchTerm) ||
            (b.isbn || '').toLowerCase().includes(searchTerm)`;
const rep = `(b.name || '').toLowerCase().includes(searchTerm) ||
            (b.isbn || '').toLowerCase().includes(searchTerm)`;

if (c.includes(old)) {
    c = c.replace(old, rep);
    fs.writeFileSync(path, c, 'utf8');
    console.log('Fixed');
} else {
    console.log('Not found');
}
