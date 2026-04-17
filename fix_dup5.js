const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Remove the duplicate searchPickupList function
const dup = `}

function searchPickupList() { filterPickupList(); }

function resetPickupFilters`;

const good = `}

function resetPickupFilters`;

if (c.includes(dup)) {
    c = c.replace(dup, good);
    fs.writeFileSync(path, c, 'utf8');
    console.log('Fixed');
} else {
    console.log('Not found');
}
