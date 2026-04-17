const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');
const start = '// ==================== 评估核算页面功能 ====================';
const end = '// ==================== 个人设置页面 ====================';
const si = c.indexOf(start);
const ei = c.indexOf(end);
if (si === -1 || ei === -1) { console.log('NOT FOUND', si, ei); process.exit(1); }
const before = c.slice(0, si);
const after = c.slice(ei);

const newBlock = `// ==================== 评估核算页面功能 ====================
async function initEvaluatePage() {
    if (!document.querySelector('.evaluate-page')) return;
    await loadEvaluateData();
    await loadPointsRule();
    renderEvaluateTable();
    bindEvaluateEvents();
}

async function loadEvaluateData() {
    try {
        const result = await adminApiCall('/evaluations', 'GET');
        window.evaluateData = result.data || [];
    } catch (error) {
        console.error('加载评估数据失败:', error);
        window.evaluateData = [];
    }
}

async function loadPointsRule() {
    try {
        const result = await adminApiCall('/points-rule', 'GET');
        const rule = result.data;
        window.pointsRuleMap = {
            '全新': rule.ruleNew || 200,
            '良好': rule.ruleGood || 150,
            '一般': rule.ruleNormal || 80,
            '陈旧': rule.ruleOld || 40
        };
    } catch (error) {
        window.pointsRuleMap = { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };
    }
}

function getStatusLabel(status) {
    const map = { 'PENDING': '待审核', 'APPROVED': '已通过', 'LISTED': '已上架', 'DELISTED': '已下架', 'REJECTED': '已拒绝' };
    return map[status] || status;
}
function getStatusClass(status) {
    const map = { 'PENDING': 'pending', 'APPROVED': 'approved', 'LISTED': 'listed', 'DELISTED': 'delisted', 'REJECTED': 'delisted' };
    return map[status] || '';
}

function renderEvaluateTable() {
    const tbody = document.getElementById('evaluateTbody');
    if (!tbody) return;

    const statusFilter = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : 'all';
    const searchTerm = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';

    const all = window.evaluateData || [];
    const total = all.length;
    const pending = all.filter(e => e.status === 'PENDING').length;
    const approved = all.filter(e => e.status === 'APPROVED').length;
    const completed = all.filter(e => e.status === 'LISTED' || e.status === 'DELISTED').length;
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    setEl('evalTotal', total);
    setEl('evalPending', pending);
    setEl('evalApproved', approved);
    setEl('evalCompleted', completed);

    let filtered = all.slice();
    if (statusFilter !== 'all') filtered = filtered.filter(item => item.status === statusFilter);
    if (searchTerm) {
        filtered = filtered.filter(item => {
            const sid = item.studentId ? String(item.studentId) : '';
            const su = item.studentUsername || '';
            const sn = item.studentName || '';
            const bn = item.bookName || '';
            return su.toLowerCase().includes(searchTerm) || sn.toLowerCase().includes(searchTerm) || sid.includes(searchTerm) || bn.toLowerCase().includes(searchTerm);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;">暂无评估数据</td></tr>';
        return;
    }

    const ruleMap = window.pointsRuleMap || { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };
    const esc = s => s ? s.replace(/'/g, "\\'") : '';

    tbody.innerHTML = filtered.map(item => {
        const cond = item.adminCondition || item.selfCondition || '良好';
        const pts = item.points || ruleMap[cond] || 0;
        const sId = item.studentId || '';
        const sName = esc(item.studentName);

        let actions = '';
        if (item.status === 'PENDING') {
            actions = '<button class="btn-sm btn-pass" onclick="approveEvaluate(' + item.id + ',this)">通过</button>';
        } else if (item.status === 'APPROVED') {
            actions = '<button class="btn-sm btn-sync" onclick="syncEvaluate(' + item.id + ',this)">同步积分</button>' +
                      '<button class="btn-sm btn-list" onclick="goToBookMgmt(' + item.id + ')">上架</button>';
        } else if (item.status === 'LISTED') {
            actions = '<span style="color:#28a745;">已上架</span>';
        } else if (item.status === 'DELISTED') {
            actions = '<span style="color:#dc3545;">已下架</span>';
        } else if (item.status === 'REJECTED') {
            actions = '<span style="color:#dc3545;">已拒绝</span>';
        }

        return '<tr data-id="' + item.id + '">' +
            '<td class="appointment-link" onclick="showAppointmentDetail(' + item.id + ')">&#128196; ' + (item.appointmentId || '-') + '</td>' +
            '<td class="student-name-cell" onclick="viewStudentInfo(\\'' + sId + '\\',\\'' + sName + '\\')">' + (item.studentName ? item.studentName.replace(/</g,'&lt;') : '-') + '<br><small>' + (item.studentUsername || sId || '-') + '</small></td>' +
            '<td style="text-align:left;">' + (item.bookName ? item.bookName.replace(/</g,'&lt;') : '-') + '<br><small>' + (item.author || '') + '</small></td>' +
            '<td>' + (item.selfCondition || '-') + '</td>' +
            '<td><select class="evaluate-select" data-id="' + item.id + '" onchange="onConditionChange(this,' + item.id + ')">' +
                '<option value="全新"' + (cond === '全新' ? ' selected' : '') + '>全新</option>' +
                '<option value="良好"' + (cond === '良好' ? ' selected' : '') + '>良好</option>' +
                '<option value="一般"' + (cond === '一般' ? ' selected' : '') + '>一般</option>' +
                '<option value="陈旧"' + (cond === '陈旧' ? ' selected' : '') + '>陈旧</option>' +
            '</select></td>' +
            '<td id="pts-' + item.id + '">' + pts + '</td>' +
            '<td><span class="status-badge ' + getStatusClass(item.status) + '">' + getStatusLabel(item.status) + '</span></td>' +
            '<td>' + actions + '</td></tr>';
    }).join('');
}

function onConditionChange(selectEl, id) {
    const condition = selectEl.value;
    const ruleMap = window.pointsRuleMap || { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };
    const pts = ruleMap[condition] || 0;
    const ptsSpan = document.getElementById('pts-' + id);
    if (ptsSpan) ptsSpan.innerText = pts;
    const item = window.evaluateData.find(e => e.id === id);
    if (item) { item.adminCondition = condition; item.points = pts; }
}

window.approveEvaluate = async function(id, btn) {
    if (!confirm('通过该回收申请？')) return;
    if (btn) btn.disabled = true;
    try {
        const item = window.evaluateData.find(e => e.id === id);
        const cond = (item && item.adminCondition) ? item.adminCondition : '良好';
        await adminApiCall('/evaluations/' + id + '/approve', 'POST', { adminCondition: cond });
        alert('已通过审核');
        await loadEvaluateData();
        renderEvaluateTable();
    } catch (error) {
        alert(error.message);
        if (btn) btn.disabled = false;
    }
};

window.syncEvaluate = async function(id, btn) {
    if (!confirm('确认同步积分？将为学生增加相应积分。')) return;
    if (btn) btn.disabled = true;
    try {
        await adminApiCall('/evaluations/' + id + '/sync', 'POST');
        alert('积分同步成功！');
        await loadEvaluateData();
        renderEvaluateTable();
    } catch (error) {
        alert(error.message);
        if (btn) btn.disabled = false;
    }
};

window.goToBookMgmt = function(id) {
    const item = window.evaluateData.find(e => e.id === id);
    if (!item) return;
    sessionStorage.setItem('bookPrefill', JSON.stringify({
        fromEvaluation: true,
        evaluationId: id,
        bookName: item.bookName || '',
        author: item.author || '',
        publisher: item.publisher || '',
        isbn: item.isbn || '',
        condition: item.adminCondition || item.selfCondition || '良好',
        points: item.points || 0,
        coverImage: item.coverImage || '',
        remark: item.remark || ''
    }));
    window.location.href = '/admin/book-mgmt.html';
};

window.showAppointmentDetail = function(id) {
    const item = window.evaluateData.find(e => e.id === id);
    if (!item) return;
    const e = s => escapeHtml(s || '-');
    const img = item.coverImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='130'%3E%3Crect width='100' height='130' fill='%23d0e2f2'/%3E%3Ctext x='50' y='65' text-anchor='middle' fill='%231e6d8f' font-size='14'%3E%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E";
    document.getElementById('appointmentDetailContent').innerHTML =
        '<div class="detail-section"><h4>&#128196; 预约信息</h4>' +
        '<div class="detail-row"><span class="detail-label">预约单号：</span><span class="detail-value">' + (item.appointmentId || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">提交时间：</span><span class="detail-value">' + formatDate(item.submitTime) + '</span></div></div>' +
        '<div class="detail-section"><h4>&#128100; 学生信息</h4>' +
        '<div class="detail-row"><span class="detail-label">姓名：</span><span class="detail-value">' + e(item.studentName) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">学号：</span><span class="detail-value">' + (item.studentUsername || item.studentId || '-') + '</span></div></div>' +
        '<div class="detail-section"><h4>&#128218; 教材信息</h4>' +
        '<div class="detail-row"><span class="detail-label">教材名称：</span><span class="detail-value">' + e(item.bookName) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">作者：</span><span class="detail-value">' + e(item.author) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">出版社：</span><span class="detail-value">' + e(item.publisher) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">ISBN：</span><span class="detail-value">' + e(item.isbn) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">品相自评：</span><span class="detail-value">' + (item.selfCondition || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">管理员评估：</span><span class="detail-value">' + (item.adminCondition || '-') + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">积分：</span><span class="detail-value">' + (item.points || 0) + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">备注：</span><span class="detail-value">' + e(item.remark || '无') + '</span></div></div>' +
        '<div class="detail-section"><h4>&#128247; 教材图片</h4>' +
        '<img src="' + img + '" style="max-width:120px;border-radius:8px;" onerror="this.src=\\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'130\'%3E%3Crect width=\'100\' height=\'130\' fill=\'%23d0e2f2\'/%3E%3Ctext x=\'50\' y=\'65\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'14\'%3E%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E\\"></div>';
    Modal.open('appointmentModal');
};

function bindEvaluateEvents() {
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetBtn');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    if (searchBtn) searchBtn.addEventListener('click', renderEvaluateTable);
    if (resetBtn) resetBtn.addEventListener('click', () => {
        if (statusFilter) statusFilter.value = 'all';
        if (searchInput) searchInput.value = '';
        renderEvaluateTable();
    });
    if (statusFilter) statusFilter.addEventListener('change', renderEvaluateTable);
    if (searchInput) {
        searchInput.addEventListener('input', renderEvaluateTable);
        searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') renderEvaluateTable(); });
    }
}
`;

fs.writeFileSync(path, before + newBlock + after, 'utf8');
console.log('done, new size:', (before.length + newBlock.length + after.length));
