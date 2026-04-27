const ADMIN_API = '/admin';

async function adminApiCall(endpoint, method, body, extraHeaders) {
    const headers = {};
    try {
        const u = getCurrentUser();
        if (u && u.id) headers['X-User-Id'] = u.id;
    } catch(e) {}
    if (extraHeaders) {
        Object.assign(headers, extraHeaders);
    }
    return apiCall(ADMIN_API + endpoint, method, body, headers);
}

// ==================== 公告通知页面初始化 ====================
async function initNoticePage() {
    if (!document.querySelector('.admin-notice-main')) return;
    await Promise.all([
        loadAnnouncements(),
        loadLocationNotices()
    ]);
}

async function loadAnnouncements() {
    try {
        const result = await adminApiCall('/announcements', 'GET');
        window.adminAnnouncements = result.data || [];
        renderAnnouncementHistory();
    } catch (error) {
        console.error('加载公告失败:', error);
    }
}

async function loadLocationNotices() {
    try {
        const result = await adminApiCall('/location-notices?role=ADMIN', 'GET');
        window.adminLocationNotices = result.data || [];
        renderLocationHistory();
    } catch (error) {
        console.error('加载地点公告失败:', error);
    }
}

async function publishLocationNotice() {
    const location = document.getElementById('editLocation')?.value.trim();
    const notice = document.getElementById('editNotice')?.value.trim();

    if (!location) { alert('请填写领取地点'); return; }
    if (!notice) { alert('请填写注意事项'); return; }

    try {
        await adminApiCall('/location-notices', 'POST', { location, notice });
        alert('教材领取地点和注意事项已发布！');
        await loadLocationNotices();
        resetLocationForm();
    } catch (error) {
        alert(error.message);
    }
}

async function publishAnnouncement() {
    const title = document.getElementById('announcementTitle')?.value.trim();
    const content = document.getElementById('announcementContent')?.value.trim();

    if (!title) { alert('请填写公告标题'); return; }
    if (!content) { alert('请填写公告内容'); return; }

    try {
        await adminApiCall('/announcements', 'POST', { title, content });
        alert('公告已发布！');
        await loadAnnouncements();
        resetAnnouncementForm();
    } catch (error) {
        alert(error.message);
    }
}

function renderAnnouncementHistory(searchTerm) {
    const tbody = document.getElementById('announcementHistoryBody');
    if (!tbody) return;

    let filtered = [...(window.adminAnnouncements || [])];
    if (searchTerm) {
        filtered = filtered.filter(a => a.title.includes(searchTerm) || (a.content && a.content.includes(searchTerm)));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">暂无公告记录</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((item) => `
        <tr>
            <td style="text-align: left;">${escapeHtml(item.title)}</td>
            <td style="text-align: left;">${escapeHtml((item.content || '').substring(0, 100))}...</td>
            <td style="text-align: center;">${formatDate(item.publishTime)}</td>
            <td style="text-align: center;">${item.publisher || '-'}</td>
            <td style="text-align: center;"><span class="status-active">已发布</span></td>
            <td style="text-align: center;"><button class="delete-history-btn" onclick="deleteAnnouncement(${item.id})">🗑️ 删除</button></td>
        </tr>
    `).join('');
}

function renderLocationHistory(searchTerm) {
    const tbody = document.getElementById('locationHistoryBody');
    if (!tbody) return;

    let filtered = [...(window.adminLocationNotices || [])];
    if (searchTerm) {
        filtered = filtered.filter(n => n.location.includes(searchTerm) || (n.notice && n.notice.includes(searchTerm)));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">暂无记录</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((item) => {
        const statusClass = item.isActive ? 'status-active' : 'status-inactive';
        const statusText = item.isActive ? '✅ 当前生效' : '📄 历史版本';
        return `<tr>
            <td style="text-align: left;">${escapeHtml(item.location)}</td>
            <td style="text-align: left;">${escapeHtml((item.notice || '').substring(0, 80))}...</td>
            <td style="text-align: center;">${formatDate(item.publishTime)}</td>
            <td style="text-align: center;">${item.publisher || '-'}</td>
            <td style="text-align: center;"><span class="${statusClass}">${statusText}</span></td>
            <td style="text-align: center;"><button class="delete-history-btn" onclick="deleteLocationNotice(${item.id})">🗑️ 删除</button></td>
        </tr>`;
    }).join('');
}

async function deleteAnnouncement(id) {
    if (!confirm('确定要删除这条公告吗？')) return;
    try {
        await adminApiCall(`/announcements/${id}`, 'DELETE');
        alert('公告已删除');
        await loadAnnouncements();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteLocationNotice(id) {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
        await adminApiCall(`/location-notices/${id}`, 'DELETE');
        alert('记录已删除');
        await loadLocationNotices();
    } catch (error) {
        alert(error.message);
    }
}

function searchAnnouncements() {
    const term = document.getElementById('searchAnnouncement')?.value || '';
    renderAnnouncementHistory(term);
}

function searchLocationNotices() {
    const term = document.getElementById('searchLocationNotice')?.value || '';
    renderLocationHistory(term);
}

function resetLocationForm() {
    const locationInput = document.getElementById('editLocation');
    const noticeTextarea = document.getElementById('editNotice');
    if (locationInput) locationInput.value = '';
    if (noticeTextarea) noticeTextarea.value = '';
}

function resetAnnouncementForm() {
    const titleInput = document.getElementById('announcementTitle');
    const contentInput = document.getElementById('announcementContent');
    if (titleInput) titleInput.value = '';
    if (contentInput) contentInput.value = '';
}

// ==================== 领取管理页面功能 ====================
async function initAuditPage() {
    if (!document.querySelector('.audit-page')) return;
    await loadPickupList();
}

async function loadPickupList() {
    try {
        const result = await adminApiCall('/book-exchanges', 'GET');
        window.allExchanges = result.data || [];
        renderPickupTable(window.allExchanges);
        updatePickupStats();
    } catch (error) {
        console.error('加载领取记录失败:', error);
    }
}

function renderPickupTable(exchanges) {
    const tbody = document.getElementById('pickupBody');
    if (!tbody) return;

    if (exchanges.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">暂无领取记录</td></tr>';
        return;
    }

    tbody.innerHTML = exchanges.map(ex => {
        const statusLabel = ex.status === 'PENDING' ? '待领取' : '已领取';
        const statusClass = ex.status === 'PENDING' ? 'pending' : 'completed';
        const time = ex.exchangeTime ? formatDateTime(ex.exchangeTime) : '-';
        const confirmBtn = ex.status === 'PENDING'
            ? '<button class="btn-sm btn-pass" onclick="confirmBookPickup(' + ex.id + ')">确认领取</button>'
            : '-';
        const sName = ex.studentName ? ex.studentName.replace(/'/g, "\'") : '';
        const imgSrc = ex.coverImage || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23e1eff8' rx='10'/%3E%3Ctext x='25' y='33' text-anchor='middle' fill='%231e6d8f' font-size='24'%3E%F0%9F%93%9A%3C/text%3E%3C/svg%3E`;
        return '<tr data-status="' + (ex.status||'') + '" data-student="' + sName + '">' +
            '<td class="student-name-cell" onclick="viewStudentInfo(\'' + ex.studentId + '\',\'' + sName + '\')">' + escapeHtml(ex.studentName || '-') + '</td>' +
            '<td class="prize-img-cell"><img src="' + imgSrc + '" alt="" class="prize-table-img" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'50\' viewBox=\'0 0 50 50\'%3E%3Crect width=\'50\' height=\'50\' fill=\'%23e1eff8\' rx=\'10\'/%3E%3Ctext x=\'25\' y=\'33\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'24\'%3E%F0%9F%93%9A%3C/text%3E%3C/svg%3E\'"></td>' +
            '<td>' + escapeHtml(ex.bookName || '-') + '</td>' +
            '<td>' + (ex.pointsCost || 0) + '</td>' +
            '<td>' + time + '</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></td>' +
            '<td>' + confirmBtn + '</td></tr>';
    }).join('');
}

async function confirmBookPickup(id) {
    if (!confirm('确认该学生已领取教材？')) return;
    try {
        await adminApiCall('/book-exchanges/' + id + '/confirm', 'PUT');
        alert('领取确认成功');
        await loadPickupList();
    } catch (error) {
        alert(error.message);
    }
}

function updatePickupStats() {
    const all = window.allExchanges || [];
    const pending = all.filter(e => e.status === 'PENDING').length;
    const completed = all.filter(e => e.status === 'COMPLETED').length;
    const totalEl = document.getElementById('pickupTotal');
    const pendingEl = document.getElementById('pickupPending');
    const completedEl = document.getElementById('pickupCompleted');
    if (totalEl) totalEl.innerText = all.length;
    if (pendingEl) pendingEl.innerText = pending;
    if (completedEl) completedEl.innerText = completed;
}

function searchPickupList() { filterPickupList(); }

function filterPickupList() {
    const statusFilter = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : 'all';
    const searchTerm = document.getElementById('searchPickup') ? document.getElementById('searchPickup').value.toLowerCase() : '';
    const all = window.allExchanges || [];
    let filtered = all.slice();
    if (statusFilter !== 'all') {
        const targetStatus = statusFilter === 'pending' ? 'PENDING' : 'COMPLETED';
        filtered = filtered.filter(e => e.status === targetStatus);
    }
    if (searchTerm) {
        filtered = filtered.filter(e =>
            (e.studentName||'').toLowerCase().includes(searchTerm) ||
            (e.bookName||'').toLowerCase().includes(searchTerm)
        );
    }
    renderPickupTable(filtered);
}

function resetPickupFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchPickup');
    if (statusFilter) statusFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    renderPickupTable(window.allExchanges || []);
}

function formatDateTime(dt) {
    if (!dt) return '-';
    const d = new Date(dt);
    const pad = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
// ==================== 查看学生信息功能 ====================
window.viewStudentInfo = async function(studentId, studentName) {
    try {
        const result = await adminApiCall(`/users/${studentId}`, 'GET');
        const user = result.data;
        
        const infoHtml = `
            <div class="student-info-row"><span class="student-info-label">学号：</span><span class="student-info-value">${user.username || studentId}</span></div>
            <div class="student-info-row"><span class="student-info-label">姓名：</span><span class="student-info-value">${user.name || studentName}</span></div>
            <div class="student-info-row"><span class="student-info-label">学院：</span><span class="student-info-value">${user.college || '未填写'}</span></div>
            <div class="student-info-row"><span class="student-info-label">专业：</span><span class="student-info-value">${user.major || '未填写'}</span></div>
            <div class="student-info-row"><span class="student-info-label">班级：</span><span class="student-info-value">${user.className || '未填写'}</span></div>
            <div class="student-info-row"><span class="student-info-label">入学年份：</span><span class="student-info-value">${user.year || '未填写'}</span></div>
            <div class="student-info-row"><span class="student-info-label">联系电话：</span><span class="student-info-value">${user.phone || '未填写'}</span></div>
        `;

        const contentEl = document.getElementById('studentInfoContent');
        if (contentEl) {
            contentEl.innerHTML = infoHtml;
            Modal.open('studentInfoModal');
        }
    } catch (error) {
        // Fallback to basic info if API fails
        const infoHtml = `
            <div class="student-info-row"><span class="student-info-label">学号：</span><span class="student-info-value">${studentId}</span></div>
            <div class="student-info-row"><span class="student-info-label">姓名：</span><span class="student-info-value">${studentName}</span></div>
        `;
        const contentEl = document.getElementById('studentInfoContent');
        if (contentEl) {
            contentEl.innerHTML = infoHtml;
            Modal.open('studentInfoModal');
        }
    }
};

// ==================== 评估核算页面功能 ====================
async function initEvaluatePage() {
    if (!document.querySelector('.evaluate-page')) return;
    await loadEvaluateData();
    await loadPointsRule();
    renderEvaluateTable();
    bindEvaluateEvents();
}

async function loadEvaluateData() {
    try {
        const [evalResult, apptResult] = await Promise.all([
            adminApiCall('/evaluations', 'GET'),
            adminApiCall('/appointments', 'GET')
        ]);
        const evaluations = evalResult.data || [];
        const appointments = (apptResult.data || []).filter(a => a.status === 'PENDING');

        // Normalize appointments to evaluation-like objects (only PENDING ones without evaluation)
        const appointmentMap = {};
        evaluations.forEach(ev => {
            if (ev.appointmentId) appointmentMap[ev.appointmentId] = true;
        });

        const normalizedAppointments = appointments
            .filter(a => !appointmentMap[a.appointmentId])
            .map(a => ({
                _sourceType: 'appointment',
                _origId: a.id,
                id: 'APPT-' + a.id,
                appointmentId: a.appointmentId,
                studentId: a.studentId,
                studentName: a.studentName,
                studentUsername: a.studentUsername,
                bookName: a.bookName,
                author: '',
                publisher: a.publisher || '',
                isbn: a.isbn || '',
                selfCondition: a.condition || '良好',
                adminCondition: null,
                points: 0,
                coverImage: a.coverImage || '',
                remark: a.remark || '',
                status: 'PENDING',
                submitTime: a.submitTime
            }));

        const normalizedEvals = evaluations.map(ev => ({
            _sourceType: 'evaluation',
            _origId: ev.id,
            ...ev
        }));

        window.evaluateData = [...normalizedAppointments, ...normalizedEvals];
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
    const map = { 'PENDING': '待审核', 'APPROVED': '已通过', 'SYNCED': '已同步', 'REJECTED': '已拒绝' };
    return map[status] || status;
}
function getStatusClass(status) {
    const map = { 'PENDING': 'pending', 'APPROVED': 'approved', 'SYNCED': 'approved', 'REJECTED': 'delisted' };
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
    const approved = all.filter(e => e.status !== 'PENDING').length;
    const synced = all.filter(e => e.status === 'SYNCED').length;
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    setEl('evalTotal', total);
    setEl('evalPending', pending);
    setEl('evalApproved', approved);
    setEl('evalCompleted', synced);

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
    const esc = s => s ? s.replace(/'/g, "\'") : '';

    tbody.innerHTML = filtered.map(item => {
        const cond = item.adminCondition || item.selfCondition || '良好';
        const pts = item.points || ruleMap[cond] || 0;
        const sId = item.studentId || '';
        const sName = esc(item.studentName);

        let actions = '';
        if (item.status === 'PENDING') {
            if (item._sourceType === 'appointment') {
                actions = '<button class="btn-sm btn-pass" onclick="approveAppointment(' + item._origId + ',this)">通过</button>' +
                         '<button class="btn-sm btn-reject" onclick="rejectAppointment(' + item._origId + ',this)">拒绝</button>';
            } else {
                actions = '<button class="btn-sm btn-pass" onclick="approveEvaluate(\'' + item.id + '\',this)">通过</button>' +
                         '<button class="btn-sm btn-reject" onclick="rejectEvaluate(\'' + item.id + '\',this)">拒绝</button>';
            }
        } else if (item.status === 'APPROVED') {
            actions = '<button class="btn-sm btn-sync" onclick="openSyncModal(\'' + item.id + '\')">同步积分</button>';
        } else if (item.status === 'SYNCED') {
            actions = '<span style="color:#28a745;">已同步</span>';
        } else if (item.status === 'REJECTED') {
            actions = '<span style="color:#dc3545;">已拒绝</span>';
        }

        const selectDisabled = '';
        return '<tr data-id="' + item.id + '">' +
            '<td class="appointment-link" onclick="showAppointmentDetail(\'' + item.id + '\')">&#128196; ' + (item.appointmentId || '-') + '</td>' +
            '<td class="student-name-cell" onclick="viewStudentInfo(\'' + sId + '\',\'' + esc(item.studentName) + '\')">' + (item.studentName ? item.studentName.replace(/</g,'&lt;') : '-') + '<br><small>' + (item.studentUsername || sId || '-') + '</small></td>' +
            '<td style="text-align:left;">' + (item.bookName ? item.bookName.replace(/</g,'&lt;') : '-') + '<br><small>' + (item.author || '') + '</small></td>' +
            '<td>' + (item.selfCondition || '-') + '</td>' +
            '<td><select class="evaluate-select" data-id="' + item.id + '" onchange="onConditionChange(this,\'' + item.id + '\')"' + selectDisabled + '>' +
                '<option value="全新"' + (cond === '全新' ? ' selected' : '') + '>全新</option>' +
                '<option value="良好"' + (cond === '良好' ? ' selected' : '') + '>良好</option>' +
                '<option value="一般"' + (cond === '一般' ? ' selected' : '') + '>一般</option>' +
                '<option value="陈旧"' + (cond === '陈旧' ? ' selected' : '') + '>陈旧</option>' +
            '</select></td>' +
            '<td id="pts-' + item.id + '">' + pts + '</td>' +
            '<td><span class="status-badge ' + getStatusClass(item.status) + '">' + getStatusLabel(item.status) + '</span></td>' +
            '<td>' + actions + '</td></tr>';
    }).join('');

    // 事件委托：后备路由（同时诊断 onclick 属性内容）
    tbody.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn-sync');
        if (!btn) return;
        const onclick = btn.getAttribute('onclick') || '';
        const match = onclick.match(/openSyncModal\(['"]?([^'"]*)['"]?\)/);
        const id = match ? match[1] : null;
        console.log('[DEBUG-ED] btn-sync click captured, onclick="' + onclick + '", extracted id="' + id + '"');
        if (id && window.openSyncModal) window.openSyncModal(id);
    });
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

window.approveAppointment = async function(appointmentId, btn) {
    if (!confirm('通过该回收预约？')) return;
    if (btn) btn.disabled = true;
    try {
        // Read selected condition from the select element for this row
        const selectEl = document.querySelector('.evaluate-select[data-id="APPT-' + appointmentId + '"]');
        const adminCondition = selectEl ? selectEl.value : '良好';
        await adminApiCall('/appointments/' + appointmentId + '/approve', 'POST', { adminCondition: adminCondition });
        alert('已通过审核，评估记录已创建');
        await loadEvaluateData();
        renderEvaluateTable();
    } catch (error) {
        alert(error.message);
        if (btn) btn.disabled = false;
    }
};

window.openSyncModal = function(id) {
    const item = window.evaluateData.find(e => e.id == id);
    if (!item) return;
    window._syncEvalId = id;
    const ruleMap = window.pointsRuleMap || { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };
    const cond = item.adminCondition || '良好';
    document.getElementById('syncBookName').innerText = item.bookName || '-';
    document.getElementById('syncStudentName').innerText = (item.studentName || '-') + '（' + (item.studentUsername || item.studentId || '-') + '）';
    const condSel = document.getElementById('syncCondition');
    condSel.value = cond;
    document.getElementById('syncPointsDisplay').innerText = ruleMap[cond] || 0;
    document.getElementById('confirmSyncBtn').onclick = function() { confirmSync(id); };
    Modal.open('syncModal');
};

window.updateSyncPoints = function() {
    const cond = document.getElementById('syncCondition').value;
    const ruleMap = window.pointsRuleMap || { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };
    document.getElementById('syncPointsDisplay').innerText = ruleMap[cond] || 0;
};

window.confirmSync = async function(id) {
    console.log('[DEBUG] confirmSync called, id:', id);
    const cond = document.getElementById('syncCondition').value;
    const ruleMap = window.pointsRuleMap || { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };
    const pts = ruleMap[cond] || 0;
    const btn = document.getElementById('confirmSyncBtn');
    if (!btn) { console.error('[DEBUG] confirmSyncBtn not found'); return; }
    console.log('[DEBUG] btn found, about to call API');
    btn.disabled = true;
    try {
        console.log('[DEBUG] calling /condition PUT with', { adminCondition: cond, points: pts });
        await adminApiCall('/evaluations/' + id + '/condition', 'PUT', { adminCondition: cond, points: pts });
        console.log('[DEBUG] /condition PUT success, calling /sync POST');
        await adminApiCall('/evaluations/' + id + '/sync', 'POST');
        alert('积分同步成功！');
        Modal.close('syncModal');
        await loadEvaluateData();
        renderEvaluateTable();
    } catch (error) {
        alert('操作失败：' + (error.message || '请联系管理员'));
        btn.disabled = false;
    }
};

window.rejectAppointment = async function(appointmentId, btn) {
    if (!confirm('确定要拒绝该预约吗？')) return;
    if (btn) btn.disabled = true;
    try {
        await adminApiCall('/appointments/' + appointmentId + '/reject', 'POST');
        alert('已拒绝预约');
        await loadEvaluateData();
        renderEvaluateTable();
    } catch (error) {
        alert(error.message);
        if (btn) btn.disabled = false;
    }
};

window.rejectEvaluate = async function(id, btn) {
    if (!confirm('确定要拒绝该评估吗？')) return;
    if (btn) btn.disabled = true;
    try {
        await adminApiCall('/evaluations/' + id + '/reject', 'POST');
        alert('已拒绝评估');
        await loadEvaluateData();
        renderEvaluateTable();
    } catch (error) {
        alert(error.message);
        if (btn) btn.disabled = false;
    }
};

window.goToBookMgmt = async function(id) {
    if (!confirm('确认上架该教材？系统将自动创建书籍库存记录。')) return;
    try {
        const result = await adminApiCall('/evaluations/' + id + '/list', 'POST');
        if (result.success) {
            alert('上架成功！');
            await loadEvaluateData();
            renderEvaluateTable();
        } else {
            alert(result.message || '上架失败');
        }
    } catch (error) {
        alert(error.message);
    }
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
        '<img src="' + img + '" style="max-width:120px;border-radius:8px;" onerror="this.onerror=null;this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22130%22%3E%3Crect width=%22100%22 height=%22130%22 fill=%22%23d0e2f2%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 fill=%22%231e6d8f%22 font-size=%2214%22%3E%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E\'"></div>';
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
// ==================== 个人设置页面 ====================
async function initAdminProfilePage() {
    if (!document.querySelector('.admin-profile-main')) return;
    initNavUserInfo();
    await loadProfileData();
}

async function loadProfileData() {
    try {
        const result = await adminApiCall('/profile', 'GET');
        console.log('[DEBUG] loadProfileData result:', JSON.stringify(result));
        const user = result.data;
        if (!user) {
            const currentUser = getCurrentUser();
            if (!currentUser || !currentUser.id) {
                // 彻底没有用户信息，跳转到登录页
                document.getElementById('profileUsername').innerText = '请重新登录';
                document.getElementById('profileName').innerText = 'sessionStorage无用户信息';
                return;
            }
            const fallback = await adminApiCall(`/users/${currentUser.id}`, 'GET');
            if (!fallback.success || !fallback.data) return;
            return populateProfileData(fallback.data);
        }
        return populateProfileData(user);
    } catch (error) {
        console.error('加载个人信息失败:', error);
    }
}

function populateProfileData(user) {
        console.log('[DEBUG] populateProfileData user:', JSON.stringify(user));
        const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.innerText = val || '-'; };
        setEl('profileUsername', user.username);
        setEl('profileName', user.name);
        setEl('profileDept', user.dept || user.college || '-');
        setEl('profileYear', user.year || '-');
        setEl('profilePhone', user.phone || '-');
        setEl('profileLocation', user.workplace || '-');

        const updatedUser = { ...getCurrentUser(), name: user.name };
        try { sessionStorage.setItem('current_user', JSON.stringify(updatedUser)); } catch(e) {}

        const fill = (id, val) => { const e = document.getElementById(id); if (e) e.value = val || ''; };
        fill('editName', user.name);
        fill('editDept', user.dept || user.college);
        fill('editYear', user.year);
        fill('editPhone', user.phone);
        fill('editLocation', user.workplace);
}

async function saveProfile() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) {
            alert('用户未登录');
            return;
        }

        const name = document.getElementById('editName').value.trim();
        const dept = document.getElementById('editDept').value.trim();
        const year = document.getElementById('editYear').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const location = document.getElementById('editLocation').value.trim();

        if (!name) {
            alert('姓名不能为空');
            return;
        }

        const payload = { name };
        if (dept) payload.college = dept;
        if (year) payload.year = year;
        if (phone) payload.phone = phone;
        if (location) payload.workplace = location;

        const result = await adminApiCall(`/users/${currentUser.id}`, 'PUT', payload);

        if (result.success) {
            alert('保存成功');
            Modal.close('infoModal');
            await loadProfileData();
            const nameEl = document.getElementById('adminUserName');
            if (nameEl) nameEl.innerHTML = '&#128100; ' + name;
        } else {
            alert(result.message || '保存失败');
        }
    } catch (error) {
        alert(error.message);
    }
}

async function changePassword() {
    const oldPwd = document.getElementById('oldPassword')?.value;
    const newPwd = document.getElementById('newPassword')?.value;
    const confirmPwd = document.getElementById('confirmPassword')?.value;

    if (!oldPwd || !newPwd || !confirmPwd) {
        alert('请填写所有密码字段');
        return;
    }

    if (newPwd !== confirmPwd) {
        alert('新密码和确认密码不一致');
        return;
    }

    if (newPwd.length < 6) {
        alert('新密码长度不能少于6位');
        return;
    }

    try {
        const result = await adminApiCall('/password', 'PUT', { oldPassword: oldPwd, newPassword: newPwd });
        if (result.success) {
            alert('密码修改成功');
            Modal.close('pwdModal');
        } else {
            alert(result.message || '密码修改失败');
        }
    } catch (error) {
        alert(error.message || '密码修改失败');
    }
}

// ==================== 积分规则页面 ====================
async function initRulePage() {
    if (!document.querySelector('.rule-page')) return;
    initNavUserInfo();
    await loadPointsRuleForPage();
    
    // 绑定按钮事件
    const editBtn = document.getElementById('editRuleBtn');
    const syncBtn = document.getElementById('syncToLogisticsBtn');
    
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            openRuleModal();
        });
    }
    
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            syncRulesToLogistics();
        });
    }
}

function openRuleModal() {
    // 填充当前值到弹窗
    const pointsNew = document.getElementById('pointsNew')?.innerText || '0';
    const pointsGood = document.getElementById('pointsGood')?.innerText || '0';
    const pointsNormal = document.getElementById('pointsNormal')?.innerText || '0';
    const pointsOld = document.getElementById('pointsOld')?.innerText || '0';
    const prizeMax = document.getElementById('prizeMaxPoints')?.innerText || '0';
    
    document.getElementById('editPointsNew').value = pointsNew;
    document.getElementById('editPointsGood').value = pointsGood;
    document.getElementById('editPointsNormal').value = pointsNormal;
    document.getElementById('editPointsOld').value = pointsOld;
    document.getElementById('editPrizeMaxPoints').value = prizeMax;
    
    Modal.open('ruleModal');
}

async function saveRuleChanges() {
    try {
        const ruleData = {
            newPoints: parseInt(document.getElementById('editPointsNew').value) || 0,
            goodPoints: parseInt(document.getElementById('editPointsGood').value) || 0,
            normalPoints: parseInt(document.getElementById('editPointsNormal').value) || 0,
            oldPoints: parseInt(document.getElementById('editPointsOld').value) || 0,
            prizeMax: parseInt(document.getElementById('editPrizeMaxPoints').value) || 0
        };
        
        const result = await adminApiCall('/points-rule', 'PUT', ruleData);
        if (result.success) {
            alert('规则已更新');
            Modal.close('ruleModal');
            await loadPointsRuleForPage();
        } else {
            alert(result.message || '更新失败');
        }
    } catch (error) {
        alert('更新失败: ' + error.message);
    }
}

async function syncRulesToLogistics() {
    if (!confirm('确定要同步积分规则给后勤吗？后勤端将立即使用最新的积分规则。')) return;
    
    // 由于管理员和后勤共用同一个数据库，规则更新后后勤端立即可见
    // 此处可以添加通知后勤端的逻辑
    alert('同步成功！后勤端已可以使用最新积分规则。');
}

async function loadPointsRuleForPage() {
    try {
        const result = await adminApiCall('/points-rule', 'GET');
        const rule = result.data || {};
        
        document.getElementById('pointsNew').innerText = rule.ruleNew || 0;
        document.getElementById('pointsGood').innerText = rule.ruleGood || 0;
        document.getElementById('pointsNormal').innerText = rule.ruleNormal || 0;
        document.getElementById('pointsOld').innerText = rule.ruleOld || 0;
        document.getElementById('prizeMaxPoints').innerText = rule.prizeMax || 0;
    } catch (error) {
        console.error('加载积分规则失败:', error);
    }
}


// ==================== 书籍管理功能 ====================
async function loadBooksForMgmt() {
    try {
        const result = await adminApiCall('/books', 'GET');
        window.allBooks = result.data || [];
        renderBookTable();
    } catch (error) {
        console.error('加载书籍失败:', error);
    }
}

async function loadCategoriesForBookForm() {
    try {
        // 联动：检查分类是否在其他页面被更新过，若是则重新加载
        const lastUpdated = sessionStorage.getItem('categories_updated');
        const cached = sessionStorage.getItem('categories_cache');
        const allCategories = (!lastUpdated && cached)
            ? JSON.parse(cached)
            : (await adminApiCall('/categories', 'GET')).data || [];
        if (lastUpdated) sessionStorage.removeItem('categories_updated');
        sessionStorage.setItem('categories_cache', JSON.stringify(allCategories));
        // 只加载 ACTIVE（启用）的专业用于下拉选择
        const activeCategories = allCategories.filter(c => c.status === 'ACTIVE');
        const selects = [
            document.getElementById('bookMajorFilter'),
            document.getElementById('bookMajor')
        ];
        selects.forEach(sel => {
            if (!sel) return;
            const currentVal = sel.value;
            // bookMajorFilter 用全部，bookMajor 只用启用的
            const isFilter = sel.id === 'bookMajorFilter';
            const list = isFilter ? allCategories : activeCategories;
            sel.innerHTML = '<option value="">' + (isFilter ? '全部专业' : '请选择专业') + '</option>' +
                list.map(c => {
                    const disabled = (!isFilter && c.status !== 'ACTIVE') ? ' disabled' : '';
                    const label = c.status !== 'ACTIVE' ? c.name + '（已禁用）' : c.name;
                    return '<option value="' + c.name + '"' + disabled + '>' + label + '</option>';
                }).join('');
            sel.value = currentVal;
        });
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

async function loadPointsRuleForBook() {
    try {
        const result = await adminApiCall('/points-rule', 'GET');
        const rule = result.data || {};
        window.bookPointsRule = {
            '全新': rule.ruleNew || 200,
            '良好': rule.ruleGood || 150,
            '一般': rule.ruleNormal || 80,
            '陈旧': rule.ruleOld || 40
        };
    } catch (error) {
        window.bookPointsRule = { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };
    }
}

// ==================== 书籍新增/编辑弹窗 ====================
function openBookModal(book) {
    document.getElementById('bookForm').reset();
    document.getElementById('bookId').value = '';
    document.getElementById('coverPreview').innerHTML = '';
    document.getElementById('bookPointsDisplay').innerText = '—';
    document.getElementById('bookPoints').value = '0';
    document.getElementById('bookStatus').value = 'LISTED';
    document.getElementById('bookModalTitle').innerText = '📖 新增书籍';
    document.getElementById('bookCoverFile').required = true;

    if (book) {
        document.getElementById('bookId').value = book.id;
        document.getElementById('bookName').value = book.name || '';
        document.getElementById('bookAuthor').value = book.author || '';
        document.getElementById('bookPublisher').value = book.publisher || '';
        document.getElementById('bookIsbn').value = book.isbn || '';
        document.getElementById('bookMajor').value = book.major || '';
        document.getElementById('bookCondition').value = book.condition || '';
        document.getElementById('bookStock').value = book.stock || 0;
        document.getElementById('bookStatus').value = book.status || 'LISTED';
        document.getElementById('bookPoints').value = book.points || 0;
        document.getElementById('bookPointsDisplay').innerText = book.points || 0;
        document.getElementById('bookCoverFile').required = false;
        if (book.coverImage) {
            document.getElementById('coverPreview').innerHTML =
                '<img src="' + book.coverImage + '" style="max-width:120px;max-height:120px;border-radius:4px;">';
        }
        document.getElementById('bookModalTitle').innerText = '📖 编辑书籍';
    }

    Modal.open('bookModal');
}

function openBookModalWithPrefill(prefill) {
    openBookModal();
    document.getElementById('bookStatus').value = 'LISTED';
    if (prefill.name) document.getElementById('bookName').value = prefill.name;
    if (prefill.author) document.getElementById('bookAuthor').value = prefill.author;
    if (prefill.publisher) document.getElementById('bookPublisher').value = prefill.publisher;
    if (prefill.isbn) document.getElementById('bookIsbn').value = prefill.isbn;
    if (prefill.condition) {
        document.getElementById('bookCondition').value = prefill.condition;
        updateBookPointsByCondition();
    }
    if (prefill.points) {
        document.getElementById('bookPoints').value = prefill.points;
        document.getElementById('bookPointsDisplay').innerText = prefill.points;
    }
    document.getElementById('bookCoverFile').required = false;
}

function previewBookCover(input) {
    const preview = document.getElementById('coverPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = '<img src="' + e.target.result + '" style="max-width:120px;max-height:120px;border-radius:4px;">';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = '';
    }
}

function updateBookPointsByCondition() {
    const condition = document.getElementById('bookCondition').value;
    const rule = window.bookPointsRule || {};
    const points = rule[condition] || 0;
    document.getElementById('bookPoints').value = points;
    document.getElementById('bookPointsDisplay').innerText = points > 0 ? points : '—';
}

async function updateBookStatus(id, status) {
    try {
        const result = await adminApiCall('/books/' + id + '/status', 'PUT', { status });
        if (result.success) {
            await loadBooksForMgmt();
        } else {
            alert(result.message || '操作失败');
        }
    } catch (error) {
        alert(error.message);
    }
}

async function saveBook() {
    const formData = new FormData();
    const id = document.getElementById('bookId').value;
    const name = document.getElementById('bookName').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const publisher = document.getElementById('bookPublisher').value.trim();
    const isbn = document.getElementById('bookIsbn').value.trim();
    const major = document.getElementById('bookMajor').value;
    const condition = document.getElementById('bookCondition').value;
    const points = parseInt(document.getElementById('bookPoints').value) || 0;
    const stockRaw = document.getElementById('bookStock').value;
    const stock = stockRaw === '' ? 0 : (parseInt(stockRaw) || 0);
    const status = document.getElementById('bookStatus').value;
    const coverFile = document.getElementById('bookCoverFile').files[0];

    if (!name) { alert('请填写书籍名称'); return; }
    if (!author) { alert('请填写作者'); return; }
    if (!publisher) { alert('请填写出版社'); return; }
    if (!isbn) { alert('请填写ISBN'); return; }
    if (!major) { alert('请选择专业'); return; }
    if (!condition) { alert('请选择品相'); return; }
    if (!id && !coverFile) { alert('请上传教材封面图'); return; }
    if (stock <= 0) { alert('库存数量必须大于0'); return; }

    formData.append('name', name);
    formData.append('author', author);
    formData.append('publisher', publisher);
    formData.append('isbn', isbn);
    formData.append('major', major);
    formData.append('condition', condition);
    formData.append('points', points);
    formData.append('stock', stock);
    formData.append('status', status);
    if (coverFile) formData.append('coverImageFile', coverFile);

    try {
        let result;
        if (id) {
            result = await adminApiCall('/books/' + id, 'PUT', formData);
        } else {
            result = await adminApiCall('/books', 'POST', formData);
        }
        if (result.success) {
            alert(id ? '修改成功' : '新增成功');
            Modal.close('bookModal');
            await loadBooksForMgmt();
        } else {
            alert(result.message || '操作失败');
        }
    } catch (error) {
        alert(error.message);
    }
}

function renderBookTable() {
    const tbody = document.getElementById('bookTableBody');
    if (!tbody) return;

    const statusFilter = document.getElementById('bookStatusFilter') ? document.getElementById('bookStatusFilter').value : 'all';
    const majorFilter = document.getElementById('bookMajorFilter') ? document.getElementById('bookMajorFilter').value : '';
    const searchTerm = document.getElementById('bookSearchInput') ? document.getElementById('bookSearchInput').value.toLowerCase() : '';

    let filtered = (window.allBooks || []).slice();
    if (statusFilter !== 'all') {
        const norm = statusFilter === 'listed' ? 'LISTED' : 'DELISTED';
        filtered = filtered.filter(b => b.status === norm);
    }
    if (majorFilter) filtered = filtered.filter(b => b.major === majorFilter);
    if (searchTerm) {
        filtered = filtered.filter(b =>
            (b.name || '').toLowerCase().includes(searchTerm) ||
            (b.isbn || '').toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">暂无书籍数据</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(book => {
        const cover = book.coverImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='80'%3E%3Crect width='60' height='80' fill='%23d0e2f2'/%3E%3Ctext x='30' y='40' text-anchor='middle' fill='%231e6d8f' font-size='10'%3E%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E";
        const statusClass = book.status === 'LISTED' ? 'listed' : 'delisted';
        const statusText = book.status === 'LISTED' ? '上架' : '下架';
        const editBtn = '<button class="btn-sm" onclick="openBookModal(' + book.id + ')">编辑</button>';
        const toggleBtn = book.status === 'LISTED'
            ? '<button class="btn-sm btn-danger" onclick="updateBookStatus(' + book.id + ', \'DELISTED\')">下架</button>'
            : '<button class="btn-sm btn-pass" onclick="updateBookStatus(' + book.id + ', \'LISTED\')">上架</button>';

        return '<tr>' +
            '<td><img src="' + cover + '" style="width:40px;height:50px;object-fit:cover;border-radius:4px;" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'80\'%3E%3Crect width=\'60\' height=\'80\' fill=\'%23d0e2f2\'/%3E%3Ctext x=\'30\' y=\'40\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'10\'%3E%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E\'"></td>' +
            '<td style="text-align:left;">' + (book.name||'-').replace(/</g,'&lt;') + '</td>' +
            '<td>' + (book.major||'-') + '</td>' +
            '<td>' + (book.condition||'-') + '</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>' +
            '<td>' + editBtn + ' ' + toggleBtn + '</td></tr>';
    }).join('');
}

window.searchBooks = function() { renderBookTable(); };
window.resetBookFilters = function() {
    const s = document.getElementById('bookStatusFilter');
    const m = document.getElementById('bookMajorFilter');
    const si = document.getElementById('bookSearchInput');
    if (s) s.value = 'all';
    if (m) m.value = '';
    if (si) si.value = '';
    renderBookTable();
};

window.updateBookStatus = async function(id, status) {
    if (!confirm('确认' + (status === 'LISTED' ? '上架' : '下架') + '？')) return;
    try {
        await adminApiCall('/books/' + id + '/status', 'PUT', { status });
        await loadBooksForMgmt();
    } catch (error) {
        alert(error.message);
    }
};

window.openBookModal = function(bookId) {
    const isEdit = bookId && bookId !== 'undefined' && bookId !== '';
    document.getElementById('bookModalTitle').innerHTML = isEdit ? '📚 编辑书籍' : '📖 新增书籍';
    document.getElementById('bookForm').reset();
    document.getElementById('coverPreview').innerHTML = '';

    if (isEdit) {
        const book = (window.allBooks || []).find(b => String(b.id) === String(bookId));
        if (book) {
            document.getElementById('bookId').value = book.id;
            document.getElementById('bookName').value = book.name || '';
            document.getElementById('bookAuthor').value = book.author || '';
            document.getElementById('bookPublisher').value = book.publisher || '';
            document.getElementById('bookIsbn').value = book.isbn || '';
            document.getElementById('bookMajor').value = book.major || '';
            document.getElementById('bookCondition').value = book.condition || '良好';
            document.getElementById('bookStock').value = book.stock || 0;
            document.getElementById('bookStatus').value = book.status || 'LISTED';
            document.getElementById('bookPoints').value = book.points || 0;
            document.getElementById('bookCoverFile').required = false;
            const ptsDisplay = document.getElementById('bookPointsDisplay');
            if (ptsDisplay) ptsDisplay.innerText = (book.points || 0) + ' 积分';
            if (book.coverImage) {
                document.getElementById('coverPreview').innerHTML =
                    '<img src="' + book.coverImage + '" style="max-width:80px;max-height:100px;border-radius:8px;object-fit:cover;">';
            }
        }
    } else {
        document.getElementById('bookId').value = '';
        document.getElementById('bookCoverFile').required = true;
        const ptsDisplay = document.getElementById('bookPointsDisplay');
        if (ptsDisplay) ptsDisplay.innerText = '0 积分';
    }

    Modal.open('bookModal');
};

window.openBookModalWithPrefill = function(prefill) {
    document.getElementById('bookModalTitle').innerHTML = '📖 新增书籍（来自评估）';
    document.getElementById('bookForm').reset();
    document.getElementById('coverPreview').innerHTML = '';

    document.getElementById('bookId').value = '';
    document.getElementById('bookName').value = prefill.bookName || '';
    document.getElementById('bookAuthor').value = prefill.author || '';
    document.getElementById('bookPublisher').value = prefill.publisher || '';
    document.getElementById('bookIsbn').value = prefill.isbn || '';
    document.getElementById('bookMajor').value = ''; // 让管理员手动选择
    document.getElementById('bookCondition').value = prefill.condition || '良好';
    document.getElementById('bookStock').value = 1;
    document.getElementById('bookStatus').value = 'LISTED';
    document.getElementById('bookCoverFile').required = false;

    const pts = prefill.points || 0;
    document.getElementById('bookPoints').value = pts;
    const ptsDisplay = document.getElementById('bookPointsDisplay');
    if (ptsDisplay) ptsDisplay.innerText = pts + ' 积分';

    if (prefill.coverImage) {
        document.getElementById('coverPreview').innerHTML =
            '<img src="' + prefill.coverImage + '" style="max-width:80px;max-height:100px;border-radius:8px;object-fit:cover;">';
    }

    Modal.open('bookModal');
};

window.updateBookPointsByCondition = function() {
    const cond = document.getElementById('bookCondition').value;
    const rule = window.bookPointsRule || { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };
    const pts = rule[cond] || 0;
    document.getElementById('bookPoints').value = pts;
    const ptsDisplay = document.getElementById('bookPointsDisplay');
    if (ptsDisplay) ptsDisplay.innerText = pts + ' 积分';
};

window.previewBookCover = function(input) {
    const preview = document.getElementById('coverPreview');
    if (!preview) return;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = '<img src="' + e.target.result + '" style="max-width:80px;max-height:100px;border-radius:8px;object-fit:cover;">';
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.saveBook = async function() {
    const form = document.getElementById('bookForm');
    const bookId = document.getElementById('bookId').value;
    const isEdit = !!bookId;

    const formData = new FormData();
        formData.append('name', document.getElementById('bookName').value);
    formData.append('author', document.getElementById('bookAuthor').value);
    formData.append('publisher', document.getElementById('bookPublisher').value);
    formData.append('isbn', document.getElementById('bookIsbn').value);
    formData.append('major', document.getElementById('bookMajor').value);
    formData.append('condition', document.getElementById('bookCondition').value);
    formData.append('stock', document.getElementById('bookStock').value);
    formData.append('status', document.getElementById('bookStatus').value);
    formData.append('points', document.getElementById('bookPoints').value);

    const coverFile = document.getElementById('bookCoverFile').files[0];
    if (coverFile) formData.append('coverImageFile', coverFile);

    try {
        let result;
        if (isEdit) {
            result = await adminApiCall('/books/' + bookId, 'PUT', formData);
        } else {
            result = await adminApiCall('/books', 'POST', formData);
        }

        if (result.code === 0 || result.code === 200 || result.success) {
            Modal.close('bookModal');
            await loadBooksForMgmt();
        } else {
            alert(result.message || '保存失败');
        }
    } catch (error) {
        alert(error.message);
    }
};

// ==================== 书籍管理页面 ====================
async function initBookMgmtPage() {
    if (!document.querySelector('.book-mgmt-main')) return;

    // 页面加载时强制重置筛选条件，避免残留状态导致书籍不显示
    const statusFilterEl = document.getElementById('bookStatusFilter');
    const majorFilterEl = document.getElementById('bookMajorFilter');
    const searchInputEl = document.getElementById('bookSearchInput');
    if (statusFilterEl) statusFilterEl.value = 'all';
    if (majorFilterEl) majorFilterEl.value = 'all';
    if (searchInputEl) searchInputEl.value = '';

    await Promise.all([
        loadBooksForMgmt(),
        loadCategoriesForBookForm(),
        loadPointsRuleForBook()
    ]);
    initNavUserInfo();

    // 检查是否有从评估页面跳转过来的预填数据
    const prefillStr = sessionStorage.getItem('bookPrefill');
    if (prefillStr) {
        try {
            const prefill = JSON.parse(prefillStr);
            sessionStorage.removeItem('bookPrefill');
            setTimeout(() => openBookModalWithPrefill(prefill), 200);
        } catch (e) {
            console.error('预填数据解析失败', e);
        }
    }
}

window.openBookModalWithPrefill = function(prefill) {
    document.getElementById('bookModalTitle').innerText = '📖 新增书籍（来自评估）';
    document.getElementById('bookForm').reset();
    document.getElementById('coverPreview').innerHTML = '';

    document.getElementById('bookId').value = '';
    document.getElementById('bookName').value = prefill.bookName || '';
    document.getElementById('bookAuthor').value = prefill.author || '';
    document.getElementById('bookPublisher').value = prefill.publisher || '';
    document.getElementById('bookIsbn').value = prefill.isbn || '';
    document.getElementById('bookMajor').value = ''; // 让管理员手动选择
    document.getElementById('bookCondition').value = prefill.condition || '良好';
    document.getElementById('bookStock').value = 1;
    document.getElementById('bookStatus').value = 'LISTED';
    document.getElementById('bookCoverFile').required = false;

    const pts = prefill.points || 0;
    document.getElementById('bookPoints').value = pts;
    const ptsDisplay = document.getElementById('bookPointsDisplay');
    if (ptsDisplay) ptsDisplay.innerText = pts + ' 积分';

    if (prefill.coverImage) {
        document.getElementById('coverPreview').innerHTML =
            '<img src="' + prefill.coverImage + '" style="max-width:80px;max-height:100px;border-radius:8px;object-fit:cover;">';
    }

    Modal.open('bookModal');
};


// ==================== 库存管理页面 ====================
async function initInventoryPage() {
    if (!document.querySelector('.inventory-page')) return;
    await loadInventoryBooks();
    bindInventoryEvents();
}

async function initInventoryInPage() {
    if (!document.querySelector('.inventory-in-page')) return;
    await loadInventoryInRecords();
    bindInventoryInEvents();
}

async function initInventoryOutPage() {
    if (!document.querySelector('.inventory-out-page')) return;
    await loadInventoryOutRecords();
    bindInventoryOutEvents();
}

async function initInventoryCheckPage() {
    if (!document.querySelector('.inventory-check-page')) return;
    await loadCheckItems();
}

// ---- 全部库存 ----
async function loadInventoryBooks() {
    try {
        const result = await adminApiCall('/inventory/summary', 'GET');
        window.inventoryBooks = result.data || [];
        renderInventoryTable();
    } catch (error) {
        console.error('加载库存失败:', error);
        window.inventoryBooks = [];
    }
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    const searchTerm = document.getElementById('inventorySearchInput')
        ? document.getElementById('inventorySearchInput').value.toLowerCase() : '';

    let filtered = (window.inventoryBooks || []).slice();
    if (searchTerm) {
        filtered = filtered.filter(b =>
            (b.bookName||'').toLowerCase().includes(searchTerm) ||
            (b.isbn||'').toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">暂无库存数据</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(r => {
        return '<tr>' +
            '<td style="text-align:left;">' + escapeHtml(r.bookName || '-') + '</td>' +
            '<td>' + escapeHtml(r.isbn || '-') + '</td>' +
            '<td>' + (r.totalStock != null ? r.totalStock : 0) + '</td>' +
            '<td>' + escapeHtml(r.lastOperator || '-') + '</td></tr>';
    }).join('');
}

function searchInventoryTable() {
    renderInventoryTable();
}

function bindInventoryEvents() {
    const inp = document.getElementById('inventorySearchInput');
    if (inp) {
        inp.addEventListener('input', renderInventoryTable);
        inp.addEventListener('keypress', e => { if (e.key === 'Enter') renderInventoryTable(); });
    }
}

window.openStockInModal = function() {
    document.getElementById('stockInBookInput').value = '';
    document.getElementById('stockInBookId').value = '';
    document.getElementById('stockInIsbn').innerText = '-';
    document.getElementById('stockInCurrentStock').innerText = '-';
    document.getElementById('stockInQuantity').value = '1';
    document.getElementById('stockInOperator').value = '';
    document.getElementById('stockInRemark').value = '';
    document.getElementById('stockInDropdown').style.display = 'none';
    const u = getCurrentUser();
    if (u && u.name) document.getElementById('stockInOperator').value = u.name;
    Modal.open('stockInModal');
};

window.openStockOutModal = function() {
    document.getElementById('stockOutBookInput').value = '';
    document.getElementById('stockOutBookId').value = '';
    document.getElementById('stockOutIsbn').innerText = '-';
    document.getElementById('stockOutCurrentStock').innerText = '-';
    document.getElementById('stockOutQuantity').value = '1';
    document.getElementById('stockOutOperator').value = '';
    document.getElementById('stockOutRemark').value = '';
    document.getElementById('stockOutDropdown').style.display = 'none';
    const u = getCurrentUser();
    if (u && u.name) document.getElementById('stockOutOperator').value = u.name;
    Modal.open('stockOutModal');
};

window.filterStockInBooks = async function() {
    const input = document.getElementById('stockInBookInput');
    const keyword = input.value.trim();
    const dropdown = document.getElementById('stockInDropdown');
    if (!keyword) { dropdown.style.display = 'none'; return; }
    try {
        const result = await adminApiCall('/inventory/books?keyword=' + encodeURIComponent(keyword), 'GET');
        const books = result.data || [];
        if (books.length === 0) {
            dropdown.innerHTML = '<div class="book-search-item" style="color:#888;cursor:default;">未找到匹配的教材</div>';
            dropdown.style.display = 'block';
            return;
        }
        dropdown.innerHTML = books.map(b => {
            const stock = b.stock != null ? b.stock : 0;
            const stockClass = stock === 0 ? 'low' : '';
            return '<div class="book-search-item" onclick="window.selectStockInBook(\'' + b.id + '\',\'' + (b.name||'').replace(/'/g, '\\\'') + '\',\'' + (b.isbn||'').replace(/'/g, '\\\'') + '\',' + stock + ')">' +
                '<div><div class="book-name">' + escapeHtml(b.name||'-') + '</div><div class="book-isbn">' + escapeHtml(b.isbn||'-') + '</div></div>' +
                '<div class="book-stock ' + stockClass + '">库存:' + stock + '</div></div>';
        }).join('');
        dropdown.style.display = 'block';
    } catch (e) { console.error(e); }
};

window.filterStockOutBooks = async function() {
    const input = document.getElementById('stockOutBookInput');
    const keyword = input.value.trim();
    const dropdown = document.getElementById('stockOutDropdown');
    if (!keyword) { dropdown.style.display = 'none'; return; }
    try {
        const result = await adminApiCall('/inventory/books?keyword=' + encodeURIComponent(keyword), 'GET');
        const books = result.data || [];
        if (books.length === 0) {
            dropdown.innerHTML = '<div class="book-search-item" style="color:#888;cursor:default;">未找到匹配的教材</div>';
            dropdown.style.display = 'block';
            return;
        }
        dropdown.innerHTML = books.map(b => {
            const stock = b.stock != null ? b.stock : 0;
            const stockClass = stock === 0 ? 'low' : '';
            return '<div class="book-search-item" onclick="window.selectStockOutBook(\'' + b.id + '\',\'' + (b.name||'').replace(/'/g, '\\\'') + '\',\'' + (b.isbn||'').replace(/'/g, '\\\'') + '\',' + stock + ')">' +
                '<div><div class="book-name">' + escapeHtml(b.name||'-') + '</div><div class="book-isbn">' + escapeHtml(b.isbn||'-') + '</div></div>' +
                '<div class="book-stock ' + stockClass + '">库存:' + stock + '</div></div>';
        }).join('');
        dropdown.style.display = 'block';
    } catch (e) { console.error(e); }
};

window.selectStockInBook = function(id, name, isbn, stock) {
    document.getElementById('stockInBookInput').value = name;
    document.getElementById('stockInBookId').value = id;
    document.getElementById('stockInIsbn').innerText = isbn || '-';
    document.getElementById('stockInCurrentStock').innerText = stock;
    document.getElementById('stockInDropdown').style.display = 'none';
};

window.selectStockOutBook = function(id, name, isbn, stock) {
    document.getElementById('stockOutBookInput').value = name;
    document.getElementById('stockOutBookId').value = id;
    document.getElementById('stockOutIsbn').innerText = isbn || '-';
    document.getElementById('stockOutCurrentStock').innerText = stock;
    document.getElementById('stockOutDropdown').style.display = 'none';
};

window.onStockInBlur = function() {
    setTimeout(() => { document.getElementById('stockInDropdown').style.display = 'none'; }, 200);
};

window.onStockOutBlur = function() {
    setTimeout(() => { document.getElementById('stockOutDropdown').style.display = 'none'; }, 200);
};

window.submitStockIn = async function() {
    const bookId = document.getElementById('stockInBookId').value;
    const qty = document.getElementById('stockInQuantity').value;
    const operator = document.getElementById('stockInOperator').value.trim();
    const remark = document.getElementById('stockInRemark').value.trim();
    if (!bookId) { alert('请选择教材'); return; }
    if (!qty || parseInt(qty) <= 0) { alert('请输入正确的数量'); return; }
    if (!operator) { alert('请输入经手人'); return; }
    try {
        await adminApiCall('/inventory/in', 'POST', {
            bookId: parseInt(bookId),
            quantity: parseInt(qty),
            remark: operator + (remark ? ' ' + remark : '')
        });
        Modal.close('stockInModal');
        await loadInventoryBooks();
        renderInventoryTable();
        alert('入库成功！');
    } catch (error) {
        alert(error.message);
    }
};

window.submitStockOut = async function() {
    const bookId = document.getElementById('stockOutBookId').value;
    const qty = document.getElementById('stockOutQuantity').value;
    const operator = document.getElementById('stockOutOperator').value.trim();
    const remark = document.getElementById('stockOutRemark').value.trim();
    if (!bookId) { alert('请选择教材'); return; }
    if (!qty || parseInt(qty) <= 0) { alert('请输入正确的数量'); return; }
    if (!operator) { alert('请输入经手人'); return; }
    try {
        await adminApiCall('/inventory/out', 'POST', {
            bookId: parseInt(bookId),
            quantity: parseInt(qty),
            remark: operator + (remark ? ' ' + remark : '')
        });
        Modal.close('stockOutModal');
        await loadInventoryBooks();
        renderInventoryTable();
        alert('出库成功！');
    } catch (error) {
        alert(error.message);
    }
};

// ---- 入库记录 ----
async function loadInventoryInRecords() {
    try {
        const result = await adminApiCall('/inventory/records', 'GET');
        window.inventoryInRecords = (result.data || []).filter(r => r.type === 'IN');
        renderInventoryInTable();
    } catch (error) {
        window.inventoryInRecords = [];
    }
}

function renderInventoryInTable() {
    const tbody = document.getElementById('inventoryInTableBody');
    if (!tbody) return;
    const records = window.inventoryInRecords || [];
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无入库记录</td></tr>';
        return;
    }
    tbody.innerHTML = records.map(r => '<tr>' +
        '<td>' + (r.id||'-') + '</td>' +
        '<td style="text-align:left;">' + (r.bookName||'-').replace(/</g,'&lt;') + '</td>' +
        '<td>' + (r.isbn||'-') + '</td>' +
        '<td>+' + (r.quantity||0) + '</td>' +
        '<td>' + formatDate(r.createTime) + '</td>' +
        '<td>' + (r.operator||'-') + '</td>' +
        '<td>' + (r.remark||'-') + '</td></tr>'
    ).join('');
}

function bindInventoryInEvents() {
    const inp = document.getElementById('inventoryInSearchInput');
    const btn = document.getElementById('inventoryInSearchBtn');
    if (inp) {
        inp.addEventListener('input', searchInventoryInTable);
        inp.addEventListener('keypress', e => { if (e.key === 'Enter') searchInventoryInTable(); });
    }
    if (btn) btn.addEventListener('click', searchInventoryInTable);
}

function searchInventoryInTable() {
    const tbody = document.getElementById('inventoryInTableBody');
    if (!tbody) return;
    const term = (document.getElementById('inventoryInSearchInput')?.value || '').toLowerCase();
    const filtered = (window.inventoryInRecords||[]).filter(r =>
        (r.bookName||'').toLowerCase().includes(term) ||
        (r.isbn||'').toLowerCase().includes(term)
    );
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无入库记录</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(r => '<tr>' +
        '<td>' + (r.id||'-') + '</td>' +
        '<td style="text-align:left;">' + (r.bookName||'-').replace(/</g,'&lt;') + '</td>' +
        '<td>' + (r.isbn||'-') + '</td>' +
        '<td>+' + (r.quantity||0) + '</td>' +
        '<td>' + formatDate(r.createTime) + '</td>' +
        '<td>' + (r.operator||'-') + '</td>' +
        '<td>' + (r.remark||'-') + '</td></tr>'
    ).join('');
}

// ---- 出库记录 ----
async function loadInventoryOutRecords() {
    try {
        const result = await adminApiCall('/inventory/records', 'GET');
        window.inventoryOutRecords = (result.data || []).filter(r => r.type === 'OUT');
        renderInventoryOutTable();
    } catch (error) {
        window.inventoryOutRecords = [];
    }
}

function renderInventoryOutTable() {
    const tbody = document.getElementById('inventoryOutTableBody');
    if (!tbody) return;
    const records = window.inventoryOutRecords || [];
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无出库记录</td></tr>';
        return;
    }
    tbody.innerHTML = records.map(r => '<tr>' +
        '<td>' + (r.id||'-') + '</td>' +
        '<td style="text-align:left;">' + (r.bookName||'-').replace(/</g,'&lt;') + '</td>' +
        '<td>' + (r.isbn||'-') + '</td>' +
        '<td>-' + (r.quantity||0) + '</td>' +
        '<td>' + formatDate(r.createTime) + '</td>' +
        '<td>' + (r.operator||'-') + '</td>' +
        '<td>' + (r.remark||'-') + '</td></tr>'
    ).join('');
}

function bindInventoryOutEvents() {
    const inp = document.getElementById('inventoryOutSearchInput');
    const btn = document.getElementById('inventoryOutSearchBtn');
    if (inp) {
        inp.addEventListener('input', searchInventoryOutTable);
        inp.addEventListener('keypress', e => { if (e.key === 'Enter') searchInventoryOutTable(); });
    }
    if (btn) btn.addEventListener('click', searchInventoryOutTable);
}

function searchInventoryOutTable() {
    const tbody = document.getElementById('inventoryOutTableBody');
    if (!tbody) return;
    const term = (document.getElementById('inventoryOutSearchInput')?.value || '').toLowerCase();
    const filtered = (window.inventoryOutRecords||[]).filter(r =>
        (r.bookName||'').toLowerCase().includes(term) ||
        (r.isbn||'').toLowerCase().includes(term)
    );
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无出库记录</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(r => '<tr>' +
        '<td>' + (r.id||'-') + '</td>' +
        '<td style="text-align:left;">' + (r.bookName||'-').replace(/</g,'&lt;') + '</td>' +
        '<td>' + (r.isbn||'-') + '</td>' +
        '<td>-' + (r.quantity||0) + '</td>' +
        '<td>' + formatDate(r.createTime) + '</td>' +
        '<td>' + (r.operator||'-') + '</td>' +
        '<td>' + (r.remark||'-') + '</td></tr>'
    ).join('');
}

// ---- 库存盘点 ----
async function loadCheckItems() {
    try {
        const [checksResult, booksResult] = await Promise.all([
            adminApiCall('/stock-checks', 'GET'),
            adminApiCall('/inventory/books', 'GET')
        ]);
        window.stockChecks = checksResult.data || [];
        window.allBooksForCheck = booksResult.data || [];
        renderCheckTable();
        updateCheckStats();
    } catch (error) {
        console.error('加载盘点数据失败', error);
        window.stockChecks = [];
    }
}

function renderCheckTable() {
    const tbody = document.getElementById('checkTableBody');
    if (!tbody) return;
    const searchTerm = (document.getElementById('checkSearchInput')?.value || '').toLowerCase();
    let filtered = (window.stockChecks || []).slice();
    if (searchTerm) {
        filtered = filtered.filter(c =>
            (c.bookName||'').toLowerCase().includes(searchTerm) ||
            (c.isbn||'').toLowerCase().includes(searchTerm)
        );
    }
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无盘点记录</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(c => {
        const diff = c.diff || 0;
        const diffStr = (diff > 0 ? '+' : '') + diff;
        const diffClass = diff > 0 ? 'profit' : diff < 0 ? 'loss' : '';
        return '<tr>' +
            '<td style="text-align:left;">' + escapeHtml(c.bookName || '-') + '</td>' +
            '<td>' + (c.isbn || '-') + '</td>' +
            '<td>' + (c.systemStock || 0) + '</td>' +
            '<td>' + (c.actualStock || 0) + '</td>' +
            '<td class="diff-cell ' + diffClass + '">' + diffStr + '</td>' +
            '<td>' + (c.remark || '-') + '</td>' +
            '<td>' + escapeHtml(c.operator || '-') + '</td>' +
            '<td>' + formatDate(c.checkTime) + '</td></tr>';
    }).join('');
    updateCheckStats();
}

function searchCheckTable() {
    renderCheckTable();
}

function updateCheckStats() {
    const checks = window.stockChecks || [];
    let profit = 0;
    let loss = 0;
    checks.forEach(c => {
        if (c.diff > 0) profit += c.diff;
        if (c.diff < 0) loss += Math.abs(c.diff);
    });
    const el = id => document.getElementById(id);
    // 总库存 = 所有图书的系统库存总和（从 Book 表）
    const totalStock = (window.allBooksForCheck || []).reduce((s, b) => s + (b.stock || 0), 0);
    if (el('statTotalStock')) el('statTotalStock').innerText = totalStock;
    if (el('statProfit')) el('statProfit').innerText = profit;
    if (el('statLoss')) el('statLoss').innerText = loss;
    if (el('diffTotal')) {
        const net = profit - loss;
        el('diffTotal').innerText = (net > 0 ? '+' : '') + net;
    }
}

window.openCheckModal = function() {
    // 填充书籍下拉
    const sel = document.getElementById('checkBookSelect');
    if (sel) {
        sel.innerHTML = '<option value="">-- 请选择教材 --</option>' +
            (window.allBooksForCheck||[]).map(b =>
                '<option value="' + b.id + '" data-isbn="' + (b.isbn||'') + '" data-stock="' + (b.stock||0) + '">' +
                (b.name||'-') + '（库存:' + (b.stock||0) + '）</option>'
            ).join('');
    }
    document.getElementById('checkIsbn').value = '';
    document.getElementById('checkSystemStock').value = '';
    document.getElementById('checkActualStock').value = '0';
    document.getElementById('checkDiff').value = '0';
    document.getElementById('checkRemark').value = '';
    document.getElementById('checkOperatorInput').value = '';
    Modal.open('checkModal');
};

window.onCheckBookChange = function() {
    const sel = document.getElementById('checkBookSelect');
    const opt = sel?.selectedOptions[0];
    if (opt) {
        document.getElementById('checkIsbn').value = opt.dataset.isbn || '';
        document.getElementById('checkSystemStock').value = opt.dataset.stock || '0';
    } else {
        document.getElementById('checkIsbn').value = '';
        document.getElementById('checkSystemStock').value = '';
    }
    calcCheckDiff();
};

window.calcCheckDiff = function() {
    const sys = parseInt(document.getElementById('checkSystemStock')?.value || '0');
    const actual = parseInt(document.getElementById('checkActualStock')?.value || '0');
    const diff = actual - sys;
    document.getElementById('checkDiff').value = (diff > 0 ? '+' : '') + diff;
};

window.submitCheckItem = async function() {
    const sel = document.getElementById('checkBookSelect');
    const bookId = sel?.value;
    const bookName = sel?.selectedOptions[0]?.text?.split('（')[0] || '';
    const isbn = document.getElementById('checkIsbn')?.value || '';
    const systemStock = parseInt(document.getElementById('checkSystemStock')?.value || '0');
    const actualStock = parseInt(document.getElementById('checkActualStock')?.value || '0');
    const diff = actualStock - systemStock;
    const remark = document.getElementById('checkRemark')?.value;
    const operator = document.getElementById('checkOperatorInput')?.value?.trim();
    if (!bookId) { alert('请选择教材'); return; }
    if (!remark) { alert('请选择备注'); return; }
    if (!operator) { alert('请输入经手人'); return; }
    try {
        await adminApiCall('/stock-checks', 'POST', {
            bookId: parseInt(bookId),
            bookName: bookName.trim(),
            isbn: isbn,
            systemStock: systemStock,
            actualStock: actualStock,
            diff: diff,
            remark: remark,
            operator: operator,
            checkTime: new Date().toISOString()
        });
        alert('盘点已添加');
        Modal.close('checkModal');
        await loadCheckItems();
    } catch (e) {
        alert('添加失败: ' + (e.message||''));
    }
};



// ==================== 公共函数 ====================
function initCharts() { /* chart instances created in loadChartData() */ }

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getCurrentUser() {
    try {
        const stored = sessionStorage.getItem('current_user');
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (e) {
        return null;
    }
}

// ==================== 公共初始化 ====================
async function initNavUserInfo() {
    if (!document.querySelector('.audit-page') &&
        !document.querySelector('.admin-main') && !document.querySelector('.admin-notice-main') &&
        !document.querySelector('.book-mgmt-main') && !document.querySelector('.rule-page') &&
        !document.querySelector('.admin-profile-main') && !document.querySelector('.evaluate-page') &&
        !document.querySelector('.category-mgmt-main') &&
        !document.querySelector('.inventory-page') && !document.querySelector('.inventory-check-page') &&
        !document.querySelector('.inventory-in-page') && !document.querySelector('.inventory-out-page') &&
        !document.querySelector('.redirect-page')) return;
    try {
        const result = await adminApiCall('/profile', 'GET');
        const user = result.data;
        if (user) {
            window.currentAdminName = user.name || user.username || '管理员';
            const nameEl = document.getElementById('adminUserName');
            if (nameEl) nameEl.innerHTML = '&#128100; ' + window.currentAdminName;
            // 同步到sessionStorage
            if (user.id) {
                try {
                    let stored = null;
                    const s = sessionStorage.getItem('current_user');
                    if (s) stored = JSON.parse(s);
                    if (!stored || stored.id !== user.id) {
                        sessionStorage.setItem('current_user', JSON.stringify({
                            id: user.id, username: user.username, role: user.role, name: user.name
                        }));
                    }
                } catch(e) {}
            }
        }
    } catch (error) {
        console.error('加载用户信息失败', error);
    }
}

// ==================== 数据总览页面 ====================
async function initDashboard() {
    if (!document.querySelector('.admin-main')) return;
    await Promise.all([
        loadDashboardStats(),
        loadChartData(),
        loadLowStockBooks()
    ]);
}

async function loadDashboardStats() {
    try {
        const result = await adminApiCall('/stats', 'GET');
        const stats = result.data || {};
        const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.innerText = val; };
        setEl('totalRecycled', stats.totalRecycled || 0);
        setEl('totalExchanged', stats.totalExchanged || 0);
        setEl('pendingEvaluations', stats.pendingEvaluations || 0);
        setEl('completedEvaluations', stats.completedEvaluations || 0);
        setEl('totalAppointments', stats.approvedAppointments || 0);
        setEl('pendingAppointments', stats.pendingAppointments || 0);
    } catch (error) {
        console.error('加载统计数据失败', error);
    }
}

async function loadLowStockBooks() {
    try {
        const result = await adminApiCall('/stats', 'GET');
        const stats = result.data || {};

        // 库存预警
        const books = stats.lowStockBooks || [];
        const container = document.getElementById('lowStockList');
        if (container) {
            if (books.length === 0) {
                container.innerHTML = '<div class="warning-item"><span class="warning-book">暂无库存预警</span></div>';
            } else {
                container.innerHTML = books.map(book =>
                    '<div class="warning-item">' +
                    '<span class="warning-book">' + (book.name||'-').replace(/</g,'&lt;') + '</span>' +
                    '<span class="warning-stock">库存:' + book.stock + '</span>' +
                    '</div>'
                ).join('');
            }
        }

    } catch (error) {
        console.error('加载库存预警失败', error);
    }
}

let recycleChartInstance = null;
let exchangeChartInstance = null;
let popularChartInstance = null;

async function loadChartData() {
    try {
        const result = await adminApiCall('/stats/charts', 'GET');
        const data = result.data || {};

        // 回收量折线图
        const recycleCanvas = document.getElementById('recycleChart');
        if (recycleCanvas) {
            if (recycleChartInstance) recycleChartInstance.destroy();
            const ctx = recycleCanvas.getContext('2d');
            recycleChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.dailyLabels || [],
                    datasets: [{
                        label: '日回收量',
                        data: data.dailyRecycleData || [],
                        borderColor: '#4a90d9',
                        backgroundColor: 'rgba(74,144,217,0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        }

        // 兑换率饼图
        const exchangeCanvas = document.getElementById('exchangeChart');
        if (exchangeCanvas) {
            if (exchangeChartInstance) exchangeChartInstance.destroy();
            const ctx2 = exchangeCanvas.getContext('2d');
            exchangeChartInstance = new Chart(ctx2, {
                type: 'pie',
                data: {
                    labels: data.exchangeLabels || [],
                    datasets: [{
                        data: data.exchangeData || [],
                        backgroundColor: [
                            'rgba(99, 102, 241, 0.85)',
                            'rgba(59, 130, 246, 0.85)',
                            'rgba(14, 165, 233, 0.85)',
                            'rgba(34, 197, 94, 0.85)',
                            'rgba(249, 115, 22, 0.85)',
                            'rgba(236, 72, 153, 0.85)'
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff',
                        hoverOffset: 12
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(ctx) {
                                    const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                    const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                                    return ' ' + ctx.label + ': ' + ctx.parsed + ' 本 (' + pct + '%)';
                                }
                            }
                        }
                    }
                }
            });
        }

        // 学科分类统计横向柱状图
        const popularCanvas = document.getElementById('subjectChart');
        if (popularCanvas) {
            if (popularChartInstance) popularChartInstance.destroy();
            const ctx3 = popularCanvas.getContext('2d');
            const barColors = [
                'rgba(99, 102, 241, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(14, 165, 233, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(249, 115, 22, 0.8)'
            ];
            popularChartInstance = new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: (data.popularLabels || []).map(l => l.length > 10 ? l.slice(0,10)+'…' : l),
                    datasets: [{
                        label: '评估量',
                        data: data.popularData || [],
                        backgroundColor: barColors,
                        borderRadius: 8,
                        borderSkipped: false,
                        hoverBackgroundColor: barColors.map(c => c.replace('0.8', '1'))
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(ctx) {
                                    return ' 兑换量: ' + ctx.parsed.x + ' 本';
                                }
                            }
                        }
                    },
                    scales: {
                        x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
                        y: { grid: { display: false } }
                    }
                }
            });
        }
    } catch (error) {
        console.error('加载图表数据失败', error);
    }
}

// ==================== 分类管理页面 ====================
async function initCategoryMgmtPage() {
    if (!document.querySelector('.category-mgmt-main')) return;
    await loadCategories();
    bindCategoryEvents();
}

async function openCategoryModal(id) {
    document.getElementById('categoryId').value = id || '';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryModalTitle').textContent = id ? '📂 编辑专业' : '📂 新增专业';
    if (id) {
        const cats = window.allCategories || [];
        const cat = cats.find(c => c.id == id);
        if (cat) document.getElementById('categoryName').value = cat.name || '';
    }
    Modal.open('categoryModal');
}

async function saveCategory() {
    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value.trim();
    if (!name) { alert('请输入专业名称'); return; }
    const actionLabel = id ? '更新' : '新增';
    if (!confirm('确定要' + actionLabel + '专业分类 "' + name + '" 吗？')) return;
    const payload = { name: name, status: 'ACTIVE' };
    try {
        if (id) {
            await adminApiCall('/categories/' + id, 'PUT', payload);
            alert('更新成功');
        } else {
            await adminApiCall('/categories', 'POST', payload);
            alert('新增成功');
        }
        sessionStorage.setItem('categories_updated', Date.now().toString());
        Modal.close('categoryModal');
        await loadCategories();
    } catch (e) {
        alert('保存失败: ' + (e.message || ''));
    }
}

async function toggleCategory(id) {
    const cats = window.allCategories || [];
    const cat = cats.find(c => c.id == id);
    if (!cat) return;
    const newStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? '启用' : '禁用';
    if (!confirm('确定要' + actionLabel + '该专业分类 "' + (cat.name || '') + '" 吗？')) return;
    try {
        await adminApiCall('/categories/' + id, 'PUT', { name: cat.name, status: newStatus });
        sessionStorage.setItem('categories_updated', Date.now().toString());
        await loadCategories();
    } catch (e) {
        alert('操作失败: ' + (e.message || ''));
    }
}

function renderCategoryTable(cats) {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;
    if (!cats || cats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;">暂无分类数据</td></tr>';
        return;
    }
    tbody.innerHTML = cats.map((cat) => {
        const isActive = cat.status === 'ACTIVE';
        const statusLabel = isActive ? '启用' : '禁用';
        const statusClass = isActive ? 'listed' : 'delisted';
        const toggleLabel = isActive ? '禁用' : '启用';
        const toggleClass = isActive ? 'btn-danger' : 'btn-pass';
        const createdTime = cat.createTime ? formatDate(cat.createTime) : '-';
        return '<tr>' +
            '<td>' + escapeHtml(cat.name || '-') + '</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></td>' +
            '<td>' + createdTime + '</td>' +
            '<td>' +
                '<button class="btn-sm" onclick="openCategoryModal(\'' + cat.id + '\')">编辑</button> ' +
                '<button class="btn-sm ' + toggleClass + '" onclick="toggleCategory(\'' + cat.id + '\')">' + toggleLabel + '</button>' +
            '</td></tr>';
    }).join('');
}

async function loadCategories() {
    try {
        const result = await adminApiCall('/categories', 'GET');
        window.allCategories = result.data || [];
        renderCategoryTable(window.allCategories);
    } catch (e) { console.error('加载分类失败', e); }
}

function bindCategoryEvents() {
    // handled by inline onclick
}


// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initNavUserInfo();
    initDashboard();
    initNoticePage();
    initAuditPage();
    initEvaluatePage();
    initInventoryPage();
    initInventoryInPage();
    initInventoryOutPage();
    initInventoryCheckPage();
    initBookMgmtPage();
    initCategoryMgmtPage();
    initAdminProfilePage();
    initRulePage();
});
