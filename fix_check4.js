const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Remove the duplicate "async function initInventoryCheckPage" at the start of the 库存盘点 section
// Keep the rest of the section (loadCheckItems, renderCheckTable, etc.)
const dupStart = `\n// ---- 库存盘点 ----
async function initInventoryCheckPage() {
    if (!document.querySelector('.inventory-check-page')) return;
    await loadCheckItems();
}

`;

const cleanStart = `\n// ---- 库存盘点 ----
`;

if (c.includes(dupStart)) {
    c = c.replace(dupStart, cleanStart);
    console.log('Removed duplicate initInventoryCheckPage');
} else {
    // Try without leading newline
    const alt = `// ---- 库存盘点 ----
async function initInventoryCheckPage() {
    if (!document.querySelector('.inventory-check-page')) return;
    await loadCheckItems();
}

`;
    if (c.includes(alt)) {
        c = c.replace(alt, cleanStart);
        console.log('Removed duplicate (alt)');
    } else {
        console.log('Pattern not found');
    }
}

fs.writeFileSync(path, c, 'utf8');
