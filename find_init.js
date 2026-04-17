const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static';
const jsFiles = [];
function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
        const fp = path.join(d, e.name);
        if (e.isDirectory()) walk(fp);
        else if (e.name.endsWith('.js')) jsFiles.push(fp);
    }
}
walk(dir);
for (const fp of jsFiles) {
    const c = fs.readFileSync(fp, 'utf8');
    const matches = c.match(/initBookMgmtPage/g);
    if (matches) {
        const idx = c.indexOf('function initBookMgmtPage');
        console.log(fp, 'count:', matches.length, 'def idx:', idx);
    }
}
