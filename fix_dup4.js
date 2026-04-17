const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Fix: remove stray closing brace after filterPickupList
const bad = `}
}

function searchPickupList() { filterPickupList(); }

function resetPickupFilters()`;

const good = `}

function searchPickupList() { filterPickupList(); }

function resetPickupFilters()`;

if (c.includes(bad)) {
    c = c.replace(bad, good);
    fs.writeFileSync(path, c, 'utf8');
    console.log('Fixed');
} else {
    console.log('Not found');
}
