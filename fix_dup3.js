const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Remove the stray closing brace at line 262 (after filterPickupList ends)
const stray = `    renderPickupTable(filtered);
}
}

function searchPickupList() { filterPickupList(); }`;

const fixed = `    renderPickupTable(filtered);
}

function searchPickupList() { filterPickupList(); }`;

if (c.includes(stray)) {
    c = c.replace(stray, fixed);
    fs.writeFileSync(path, c, 'utf8');
    console.log('Fixed');
} else {
    console.log('Not found');
}
