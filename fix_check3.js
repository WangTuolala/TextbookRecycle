const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Remove the duplicate // ---- 库存盘点 ---- section
// It starts with // ---- 库存盘点 ---- and ends before // ==================== 公共函数
const marker1 = '// ---- 库存盘点 ----';
const marker2 = '// ==================== 公共函数';

const idx1 = c.indexOf(marker1);
const idx2 = c.indexOf(marker2);

if (idx1 !== -1 && idx2 !== -1 && idx1 < idx2) {
    // Count how many occurrences of marker1 there are
    let count = 0;
    let searchFrom = 0;
    while (true) {
        const f = c.indexOf(marker1, searchFrom);
        if (f === -1 || f >= idx2) break;
        count++;
        searchFrom = f + marker1.length;
    }
    console.log('Found', count, 'occurrences of 库存盘点 section before 公共函数');
    if (count >= 2) {
        // Remove just the second occurrence (the one fix_check.js added)
        let firstIdx = c.indexOf(marker1);
        // Find second occurrence
        let secondIdx = c.indexOf(marker1, firstIdx + marker1.length);
        if (secondIdx !== -1 && secondIdx < idx2) {
            const toRemove = c.slice(secondIdx, idx2);
            c = c.replace(toRemove, '');
            fs.writeFileSync(path, c, 'utf8');
            console.log('Removed duplicate 库存盘点 section');
        } else {
            console.log('Could not find second occurrence');
        }
    }
} else {
    console.log('Markers not found or in wrong order', idx1, idx2);
}
