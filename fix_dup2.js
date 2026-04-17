const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Remove the duplicate leftover code from filterPickupList
const dup = `        filtered = filtered.filter(e =>
            (e.studentName && e.studentName.toLowerCase().includes(searchTerm)) ||
            (e.prizeName && e.prizeName.toLowerCase().includes(searchTerm))
        );
    }
    renderPickupTable(filtered);
}

function searchPickupList() { filterPickupList(); }`;

const correct = `}

function searchPickupList() { filterPickupList(); }`;

if (c.includes(dup)) {
    c = c.replace(dup, correct);
    fs.writeFileSync(path, c, 'utf8');
    console.log('Fixed duplicate');
} else {
    console.log('Duplicate not found');
}
