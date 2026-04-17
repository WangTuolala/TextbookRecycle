const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

// 1. Update adminApiCall to accept optional extra headers
const oldApiCall = `async function adminApiCall(endpoint, method, body) {
    const headers = {};
    try {
        const u = getCurrentUser();
        if (u && u.id) headers['X-User-Id'] = u.id;
    } catch(e) {}
    return apiCall(ADMIN_API + endpoint, method, body, headers);
}`;

const newApiCall = `async function adminApiCall(endpoint, method, body, extraHeaders) {
    const headers = {};
    try {
        const u = getCurrentUser();
        if (u && u.id) headers['X-User-Id'] = u.id;
    } catch(e) {}
    if (extraHeaders) {
        Object.assign(headers, extraHeaders);
    }
    return apiCall(ADMIN_API + endpoint, method, body, headers);
}`;

if (c.includes(oldApiCall)) {
    c = c.replace(oldApiCall, newApiCall);
    console.log('Updated adminApiCall');
} else {
    console.log('adminApiCall not found');
}

// 2. Update submitStockIn to pass operator name
const oldSubmitStockIn = `window.submitStockIn = async function() {
    const bookId = document.getElementById('stockInBookSelect').value;
    const qty = document.getElementById('stockInQuantity').value;
    const remark = document.getElementById('stockInRemark').value;
    if (!bookId) { alert('请选择教材'); return; }
    if (!qty || qty <= 0) { alert('请输入正确的数量'); return; }
    try {
        await adminApiCall('/inventory/in', 'POST', {
            bookId: parseInt(bookId),
            quantity: parseInt(qty),
            remark: remark || ''
        });`;

const newSubmitStockIn = `window.submitStockIn = async function() {
    const bookId = document.getElementById('stockInBookSelect').value;
    const qty = document.getElementById('stockInQuantity').value;
    const remark = document.getElementById('stockInRemark').value;
    if (!bookId) { alert('请选择教材'); return; }
    if (!qty || qty <= 0) { alert('请输入正确的数量'); return; }
    try {
        const u = getCurrentUser();
        const operatorName = u && u.name ? u.name : '管理员';
        await adminApiCall('/inventory/in', 'POST', {
            bookId: parseInt(bookId),
            quantity: parseInt(qty),
            remark: remark || ''
        }, { 'X-Operator-Name': operatorName });`;

if (c.includes(oldSubmitStockIn)) {
    c = c.replace(oldSubmitStockIn, newSubmitStockIn);
    console.log('Updated submitStockIn');
} else {
    console.log('submitStockIn not found');
}

fs.writeFileSync(path, c, 'utf8');
