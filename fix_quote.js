const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// Find the problematic showAppointmentDetail onerror line
const badStr = 'onerror="this.src=\\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'130\'%3E%3Crect width=\'100\' height=\'130\' fill=\'%23d0e2f2\'/%3E%3Ctext x=\'50\' y=\'65\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'14\'%3E%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E\\"';
if (c.includes(badStr)) {
    // Replace with a clean version using single-quote-safe onerror
    const cleanStr = "onerror='this.src=\"data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22130%22%3E%3Crect width=%22100%22 height=%22130%22 fill=%22%23d0e2f2%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 fill=%22%231e6d8f%22 font-size=%2214%22%3E%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E\"'";
    c = c.replace(badStr, cleanStr);
    console.log('Replaced onerror string');
} else {
    console.log('Pattern not found, trying to find it...');
    const idx = c.indexOf('data:image/svg+xml,%3Csvg');
    if (idx !== -1) {
        console.log('Found at', idx, 'context:', c.slice(Math.max(0,idx-50),idx+100));
    } else {
        console.log('Not found at all');
    }
}

fs.writeFileSync(path, c, 'utf8');
console.log('done');
