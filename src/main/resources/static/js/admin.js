const ADMIN_API = '/admin';

async function adminApiCall(endpoint, method, body) {
    return apiCall(ADMIN_API + endpoint, method, body);
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
        const result = await adminApiCall('/location-notices', 'GET');
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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">暂无公告记录</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((item, index) => `
        <tr>
            <td style="text-align: center;">${index + 1}</td>
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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">暂无记录</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((item, index) => {
        const statusClass = item.isActive ? 'status-active' : 'status-inactive';
        const statusText = item.isActive ? '✅ 当前生效' : '📄 历史版本';
        return `<tr>
            <td style="text-align: center;">${index + 1}</td>
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

// ==================== 回收审核页面功能 ====================
async function initAuditPage() {
    if (!document.querySelector('.audit-page')) return;
    await loadPickupList();
}

async function loadPickupList() {
    try {
        const result = await adminApiCall('/appointments?status=PENDING', 'GET');
        window.pendingAppointments = result.data || [];
        renderPickupTable(window.pendingAppointments);
        updatePickupStats();
    } catch (error) {
        console.error('加载预约列表失败:', error);
    }
}

function renderPickupTable(appointments) {
    const tbody = document.getElementById('pickupBody');
    if (!tbody) return;

    if (appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">暂无待审核预约</td></tr>';
        return;
    }

    tbody.innerHTML = appointments.map((app, index) => `
        <tr data-status="${app.status}" data-student="${app.studentName || ''}" data-book="${app.bookName || ''}">
            <td style="text-align: center;">${index + 1}</td>
            <td>📋 ${app.appointmentId || '-'}</td>
            <td class="student-name-cell" onclick="viewStudentInfo('${app.studentUsername || app.studentId}', '${app.studentName}')">
                ${app.studentName || '-'}
                <br><small>${app.studentUsername || app.studentId || '-'}</small>
            </td>
            <td style="text-align: left;">${escapeHtml(app.bookName || '-')}</td>
            <td>${app.condition || '-'}</td>
            <td>${app.quantity || 1}</td>
            <td><span class="status-badge pending">待审核</span></td>
            <td>
                <button class="btn-sm btn-pass" onclick="confirmPickup(${app.id})">通过</button>
                <button class="btn-sm" style="background:#dc3545;color:white;" onclick="rejectAppointment(${app.id})">拒绝</button>
            </td>
        </tr>
    `).join('');
}

async function confirmPickup(id) {
    if (!confirm('确认通过该预约吗？')) return;
    try {
        await adminApiCall(`/appointments/${id}/approve`, 'POST');
        alert('已通过审核');
        await loadPickupList();
    } catch (error) {
        alert(error.message);
    }
}

async function rejectAppointment(id) {
    if (!confirm('确认拒绝该预约吗？')) return;
    try {
        await adminApiCall(`/appointments/${id}/reject`, 'POST');
        alert('已拒绝该预约');
        await loadPickupList();
    } catch (error) {
        alert(error.message);
    }
}

function updatePickupStats() {
    const rows = document.querySelectorAll('#pickupBody tr');
    let pending = 0, completed = 0;
    rows.forEach(row => {
        const status = row.getAttribute('data-status');
        if (status === 'PENDING') pending++;
        else if (status === 'COMPLETED') completed++;
    });
    const totalEl = document.getElementById('pickupTotal');
    const pendingEl = document.getElementById('pickupPending');
    const completedEl = document.getElementById('pickupCompleted');
    if (totalEl) totalEl.innerText = rows.length;
    if (pendingEl) pendingEl.innerText = pending;
    if (completedEl) completedEl.innerText = completed;
}

function filterPickupList() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchPickup')?.value.toLowerCase() || '';
    const appointments = window.pendingAppointments || [];
    
    let filtered = [...appointments];
    if (statusFilter !== 'all') {
        filtered = filtered.filter(a => a.status === statusFilter);
    }
    if (searchTerm) {
        filtered = filtered.filter(a => 
            (a.studentName && a.studentName.toLowerCase().includes(searchTerm)) ||
            (a.studentId && String(a.studentId).toLowerCase().includes(searchTerm)) ||
            (a.studentUsername && a.studentUsername.toLowerCase().includes(searchTerm)) ||
            (a.bookName && a.bookName.toLowerCase().includes(searchTerm))
        );
    }
    renderPickupTable(filtered);
}

function searchPickupList() {
    filterPickupList();
}

function resetPickupFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchPickup');
    if (statusFilter) statusFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    renderPickupTable(window.pendingAppointments || []);
}

function updateVisiblePickupStats() {
    const rows = document.querySelectorAll('#pickupBody tr');
    let visibleRows = 0, pending = 0, completed = 0;
    rows.forEach(row => {
        if (row.style.display !== 'none') {
            visibleRows++;
            const status = row.getAttribute('data-status');
            if (status === 'PENDING') pending++;
            else if (status === 'COMPLETED') completed++;
        }
    });
    const totalEl = document.getElementById('pickupTotal');
    const pendingEl = document.getElementById('pickupPending');
    const completedEl = document.getElementById('pickupCompleted');
    if (totalEl) totalEl.innerText = visibleRows;
    if (pendingEl) pendingEl.innerText = pending;
    if (completedEl) completedEl.innerText = completed;
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

function renderEvaluateTable() {
    const tbody = document.getElementById('evaluateTbody');
    if (!tbody) return;

    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';

    let filteredData = [...(window.evaluateData || [])];
    if (statusFilter !== 'all') {
        filteredData = filteredData.filter(item => item.status === statusFilter);
    }
    if (searchTerm) {
        filteredData = filteredData.filter(item =>
            (item.studentName && item.studentName.toLowerCase().includes(searchTerm)) ||
            (item.studentId && String(item.studentId).includes(searchTerm)) ||
            (item.studentUsername && item.studentUsername.toLowerCase().includes(searchTerm)) ||
            (item.bookName && item.bookName.toLowerCase().includes(searchTerm))
        );
    }

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">暂无评估数据</td></tr>';
        return;
    }

    const statusMap = {
        'PENDING': '<span class="status-badge pending">待审核</span>',
        'APPROVED': '<span class="status-badge approved">已通过</span>',
        'LISTED': '<span class="status-badge listed">已上架</span>',
        'DELISTED': '<span class="status-badge delisted">已下架</span>',
        'SYNCED': '<span class="status-badge approved">已同步</span>'
    };

    tbody.innerHTML = filteredData.map(item => {
        const ruleMap = window.pointsRuleMap || { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };
        let actionHtml = '';
        if (item.status === 'PENDING') {
            actionHtml = `<button class="btn-sm btn-pass" onclick="approveEvaluate(${item.id})">通过</button>`;
        } else if (item.status === 'APPROVED') {
            actionHtml = `<button class="btn-sm btn-sync" onclick="syncPoints(${item.id})">同步积分</button>
                <button class="btn-sm btn-list" onclick="goToBookMgmt(${item.id})">上架</button>`;
        } else if (item.status === 'LISTED') {
            actionHtml = '<span class="status-text">已上架</span>';
        } else if (item.status === 'DELISTED') {
            actionHtml = '<span class="status-text">已下架</span>';
        }

        return `<tr>
            <td class="appointment-link" onclick="showAppointmentDetail(${item.id})">📋 ${item.appointmentId || '-'}</td>
            <td class="student-name-cell" onclick="viewStudentInfo('${item.studentUsername || item.studentId}', '${item.studentName}')">
                ${item.studentName || '-'}<br><small>${item.studentId || '-'}</small>
            </td>
            <td style="text-align: left;">${escapeHtml(item.bookName || '-')}<br><small>${escapeHtml(item.author || '')}</small></td>
            <td>${item.selfCondition || '-'}</td>
            <td>
                <select class="evaluate-select" data-id="${item.id}" onchange="updatePoints(this, ${item.id})">
                    <option value="全新" ${item.adminCondition === '全新' ? 'selected' : ''}>全新</option>
                    <option value="良好" ${item.adminCondition === '良好' ? 'selected' : ''}>良好</option>
                    <option value="一般" ${item.adminCondition === '一般' ? 'selected' : ''}>一般</option>
                    <option value="陈旧" ${item.adminCondition === '陈旧' ? 'selected' : ''}>陈旧</option>
                </select>
            </td>
            <td class="points-display" id="points-${item.id}">${item.points || 0}</td>
            <td>${statusMap[item.status] || item.status}</td>
            <td class="action-buttons">${actionHtml}</td>
        </tr>`;
    }).join('');
}

window.updatePoints = function(selectEl, id) {
    const condition = selectEl.value;
    const points = window.pointsRuleMap?.[condition] || 0;
    const pointsSpan = document.getElementById('points-' + id);
    if (pointsSpan) pointsSpan.innerText = points;
    
    const item = window.evaluateData?.find(e => e.id === id);
    if (item) {
        item.adminCondition = condition;
        item.points = points;
    }
}

window.approveEvaluate = async function(id) {
    if (!confirm('通过该回收申请？')) return;
    try {
        const item = window.evaluateData?.find(e => e.id === id);
        await adminApiCall(`/evaluations/${id}/approve`, 'POST', { adminCondition: item?.adminCondition || '良好' });
        alert('已通过审核');
        await loadEvaluateData();
        renderEvaluateTable();
    } catch (error) {
        alert(error.message);
    }
};

window.syncPoints = async function(id) {
    if (!confirm('确认同步积分？将为学生增加相应积分。')) return;
    try {
        await adminApiCall(`/evaluations/${id}/sync`, 'POST');
        alert('积分同步成功！');
        await loadEvaluateData();
        renderEvaluateTable();
    } catch (error) {
        alert(error.message);
    }
};

window.goToBookMgmt = async function(id) {
    try {
        await adminApiCall(`/evaluations/${id}/list`, 'POST');
        alert('已上架到书籍库');
        await loadEvaluateData();
        renderEvaluateTable();
    } catch (error) {
        alert(error.message);
    }
};

window.showAppointmentDetail = function(id) {
    const item = window.evaluateData?.find(e => e.id === id);
    if (!item) return;

    const detailHtml = `
        <div class="detail-section">
            <h4>📋 预约信息</h4>
            <div class="detail-row"><span class="detail-label">预约单号：</span><span class="detail-value">${item.appointmentId || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">提交时间：</span><span class="detail-value">${formatDate(item.submitTime)}</span></div>
        </div>
        <div class="detail-section">
            <h4>👤 学生信息</h4>
            <div class="detail-row"><span class="detail-label">姓名：</span><span class="detail-value">${item.studentName || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">学号：</span><span class="detail-value">${item.studentId || '-'}</span></div>
        </div>
        <div class="detail-section">
            <h4>📚 教材信息</h4>
            <div class="detail-row"><span class="detail-label">教材名称：</span><span class="detail-value">${escapeHtml(item.bookName || '-')}</span></div>
            <div class="detail-row"><span class="detail-label">作者：</span><span class="detail-value">${escapeHtml(item.author || '-')}</span></div>
            <div class="detail-row"><span class="detail-label">出版社：</span><span class="detail-value">${escapeHtml(item.publisher || '-')}</span></div>
            <div class="detail-row"><span class="detail-label">ISBN：</span><span class="detail-value">${item.isbn || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">品相自评：</span><span class="detail-value">${item.selfCondition || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">备注说明：</span><span class="detail-value">${item.remark || '无'}</span></div>
        </div>
        <div class="detail-section">
            <h4>🖼️ 教材图片</h4>
            <div class="detail-images">
                <div class="detail-image-item"><div>封面图</div><img src="${item.coverImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='130' viewBox='0 0 100 130'%3E%3Crect width='100' height='130' fill='%23d0e2f2'/%3E%3Ctext x='50' y='65' text-anchor='middle' fill='%231e6d8f' font-size='14'%3E封面%3C/text%3E%3C/svg%3E"}" alt="封面图" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'130\' viewBox=\'0 0 100 130\'%3E%3Crect width=\'100\' height=\'130\' fill=\'%23d0e2f2\'/%3E%3Ctext x=\'50\' y=\'65\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'14\'%3E封面%3C/text%3E%3C/svg%3E'"></div>
            </div>
        </div>`;

    const detailContent = document.getElementById('appointmentDetailContent');
    if (detailContent) {
        detailContent.innerHTML = detailHtml;
        Modal.open('appointmentModal');
    }
};

function bindEvaluateEvents() {
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetBtn');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn) searchBtn.addEventListener('click', () => renderEvaluateTable());
    if (resetBtn) resetBtn.addEventListener('click', () => {
        if (statusFilter) statusFilter.value = 'all';
        if (searchInput) searchInput.value = '';
        renderEvaluateTable();
    });
    if (statusFilter) statusFilter.addEventListener('change', () => renderEvaluateTable());
    if (searchInput) {
        searchInput.addEventListener('input', () => renderEvaluateTable());
        searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') renderEvaluateTable(); });
    }
}

// ==================== 仪表盘初始化 ====================
async function initDashboard() {
    if (!document.querySelector('.admin-main')) return;
    
    // Load user name
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.name) {
        const userNameEl = document.getElementById('adminUserName');
        if (userNameEl) userNameEl.innerText = '👤 ' + currentUser.name;
    }
    
    // Load stats
    try {
        const result = await adminApiCall('/stats', 'GET');
        const data = result.data;
        
        const totalRecycledEl = document.getElementById('totalRecycled');
        if (totalRecycledEl) totalRecycledEl.innerText = data.totalRecycled || 0;
        
        const totalExchangedEl = document.getElementById('totalExchanged');
        if (totalExchangedEl) totalExchangedEl.innerText = data.totalExchanged || 0;
        
        const pendingAppointmentsEl = document.getElementById('pendingAppointments');
        if (pendingAppointmentsEl) pendingAppointmentsEl.innerText = data.pendingAppointments || 0;
        
        // Load low stock warnings
        const lowStockBooks = data.lowStockBooks || [];
        const lowStockList = document.getElementById('lowStockList');
        if (lowStockList) {
            if (lowStockBooks.length === 0) {
                lowStockList.innerHTML = '<div class="warning-item"><span class="warning-book">暂无库存预警</span></div>';
            } else {
                lowStockList.innerHTML = lowStockBooks.map(book => `
                    <div class="warning-item">
                        <span class="warning-book">${escapeHtml(book.name || '-')}</span>
                        <span class="warning-stock">库存: ${book.stock || 0}</span>
                        <span class="warning-threshold">${book.stock === 0 ? '已缺货' : '即将售罄'}</span>
                    </div>
                `).join('');
            }
        }
        
        // Load pending appointments
        const pendingCount = data.pendingAppointments || 0;
        const pendingList = document.getElementById('pendingAppointmentsList');
        if (pendingList) {
            if (pendingCount === 0) {
                pendingList.innerHTML = '<div class="warning-item"><span class="warning-book">暂无待审核预约</span></div>';
            } else {
                pendingList.innerHTML = `<div class="warning-item"><span class="warning-book">当前有 ${pendingCount} 个预约待审核</span></div>`;
            }
        }
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

// ==================== 图表初始化 ====================
let chartInstances = {};

async function initCharts() {
    if (typeof Chart === 'undefined') return;

    try {
        const result = await adminApiCall('/stats/charts', 'GET');
        if (!result.success) throw new Error('获取图表数据失败');
        
        const data = result.data;
        renderRecycleChart(data);
        renderExchangeChart(data);
        renderSubjectChart(data);
    } catch (error) {
        console.error('加载图表数据失败:', error);
        // 显示暂无数据状态
        showNoDataMessage();
    }
}

function showNoDataMessage() {
    ['recycleChart', 'exchangeChart', 'subjectChart'].forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) {
            canvas.style.display = 'none';
            const wrapper = canvas.parentElement;
            if (wrapper && !wrapper.querySelector('.no-data-msg')) {
                const msg = document.createElement('div');
                msg.className = 'no-data-msg';
                msg.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;';
                msg.textContent = '暂无数据';
                wrapper.appendChild(msg);
            }
        }
    });
}

function renderRecycleChart(data) {
    const canvas = document.getElementById('recycleChart');
    if (!canvas) return;
    
    // 清理旧实例
    if (chartInstances.recycle) {
        chartInstances.recycle.destroy();
    }
    
    const labels = data.weeklyLabels || [];
    const values = data.weeklyRecycleData || [];
    const hasData = labels.length > 0 && values.some(v => v > 0);
    
    if (!hasData) {
        canvas.style.display = 'none';
        const wrapper = canvas.parentElement;
        if (wrapper && !wrapper.querySelector('.no-data-msg')) {
            const msg = document.createElement('div');
            msg.className = 'no-data-msg';
            msg.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;';
            msg.textContent = '暂无回收数据';
            wrapper.appendChild(msg);
        }
        return;
    }
    
    canvas.style.display = 'block';
    const noDataMsg = canvas.parentElement?.querySelector('.no-data-msg');
    if (noDataMsg) noDataMsg.remove();
    
    chartInstances.recycle = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ 
                label: '回收量（本）', 
                data: values, 
                backgroundColor: '#1e6d8f', 
                borderRadius: 8 
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

function renderExchangeChart(data) {
    const canvas = document.getElementById('exchangeChart');
    if (!canvas) return;
    
    if (chartInstances.exchange) {
        chartInstances.exchange.destroy();
    }
    
    const labels = data.exchangeLabels || [];
    const values = data.exchangeData || [];
    const hasData = labels.length > 0 && labels[0] !== '暂无数据' && values.some(v => v > 0);
    
    if (!hasData) {
        canvas.style.display = 'none';
        const wrapper = canvas.parentElement;
        if (wrapper && !wrapper.querySelector('.no-data-msg')) {
            const msg = document.createElement('div');
            msg.className = 'no-data-msg';
            msg.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;';
            msg.textContent = '暂无兑换数据';
            wrapper.appendChild(msg);
        }
        return;
    }
    
    canvas.style.display = 'block';
    const noDataMsg = canvas.parentElement?.querySelector('.no-data-msg');
    if (noDataMsg) noDataMsg.remove();
    
    const colors = ['#1e6d8f', '#4794b3', '#6fb3d2', '#9ac2d9', '#d0e2ed', '#c5a3cc', '#f0b8b8'];
    
    chartInstances.exchange = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ 
                data: values, 
                backgroundColor: labels.map((_, i) => colors[i % colors.length]), 
                borderWidth: 0 
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } }
            }
        }
    });
}

function renderSubjectChart(data) {
    const canvas = document.getElementById('subjectChart');
    if (!canvas) return;
    
    if (chartInstances.subject) {
        chartInstances.subject.destroy();
    }
    
    const monthLabels = data.monthLabels || [];
    const monthlyMajorData = data.monthlyMajorData || {};
    const allMajors = data.allMajors || ['通用'];
    const hasData = monthLabels.length > 0 && Object.keys(monthlyMajorData).length > 0;
    
    if (!hasData) {
        canvas.style.display = 'none';
        const wrapper = canvas.parentElement;
        if (wrapper && !wrapper.querySelector('.no-data-msg')) {
            const msg = document.createElement('div');
            msg.className = 'no-data-msg';
            msg.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;';
            msg.textContent = '暂无分类数据';
            wrapper.appendChild(msg);
        }
        return;
    }
    
    canvas.style.display = 'block';
    const noDataMsg = canvas.parentElement?.querySelector('.no-data-msg');
    if (noDataMsg) noDataMsg.remove();
    
    const colors = ['#1e6d8f', '#4794b3', '#6fb3d2', '#9ac2d9', '#d0e2ed'];
    const datasets = allMajors.map((major, i) => ({
        label: major,
        data: monthLabels.map(month => monthlyMajorData[month]?.[major] || 0),
        borderColor: colors[i % colors.length],
        tension: 0.3
    }));
    
    chartInstances.subject = new Chart(canvas, {
        type: 'line',
        data: {
            labels: monthLabels,
            datasets: datasets
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

// ==================== 库存管理功能 ====================
async function initInventoryPage() {
    if (!document.querySelector('.inventory-page') && 
        !document.querySelector('.inventory-in-page') && 
        !document.querySelector('.inventory-out-page') && 
        !document.querySelector('.inventory-check-page')) return;
    
    if (document.querySelector('.inventory-in-page')) {
        await loadInventoryInRecords();
    } else if (document.querySelector('.inventory-out-page')) {
        await loadInventoryOutRecords();
    } else if (document.querySelector('.inventory-check-page')) {
        await loadInventoryCheckData();
    } else {
        // 默认加载全部库存
        await loadInventoryBooks();
    }
    initNavUserInfo();
}

async function loadInventoryBooks() {
    try {
        const result = await adminApiCall('/inventory/books', 'GET');
        window.inventoryBooks = result.data || [];
        renderInventoryTable(window.inventoryBooks);
    } catch (error) {
        console.error('加载库存失败:', error);
    }
}

async function loadInventoryInRecords() {
    try {
        const result = await adminApiCall('/inventory/records', 'GET');
        const records = (result.data || []).filter(r => r.type === 'IN');
        renderInventoryInTable(records);
    } catch (error) {
        console.error('加载入库记录失败:', error);
    }
}

function renderInventoryInTable(records) {
    const tbody = document.getElementById('inventoryInTableBody');
    if (!tbody) return;
    
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">暂无入库记录</td></tr>';
        return;
    }
    
    tbody.innerHTML = records.map((r, i) => `
        <tr>
            <td>${r.id || '-'}</td>
            <td>${escapeHtml(r.bookName || '-')}</td>
            <td>${escapeHtml(r.isbn || '-')}</td>
            <td>+${r.quantity || 0}</td>
            <td>${formatDate(r.createTime)}</td>
            <td>${escapeHtml(r.operator || '-')}</td>
            <td>-</td>
        </tr>
    `).join('');
}

async function loadInventoryOutRecords() {
    try {
        const result = await adminApiCall('/inventory/records', 'GET');
        const records = (result.data || []).filter(r => r.type === 'OUT');
        renderInventoryOutTable(records);
    } catch (error) {
        console.error('加载出库记录失败:', error);
    }
}

function renderInventoryOutTable(records) {
    const tbody = document.getElementById('inventoryOutTableBody');
    if (!tbody) return;
    
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">暂无出库记录</td></tr>';
        return;
    }
    
    tbody.innerHTML = records.map((r, i) => `
        <tr>
            <td>${r.id || '-'}</td>
            <td>${escapeHtml(r.bookName || '-')}</td>
            <td>${escapeHtml(r.isbn || '-')}</td>
            <td>-${r.quantity || 0}</td>
            <td>${formatDate(r.createTime)}</td>
            <td>${escapeHtml(r.operator || '-')}</td>
            <td>-</td>
        </tr>
    `).join('');
}

async function loadInventoryCheckData() {
    try {
        const result = await adminApiCall('/inventory/books', 'GET');
        const books = result.data || [];
        
        // 计算统计数据
        const totalSpecies = books.length;
        const totalStock = books.reduce((sum, b) => sum + (b.stock || 0), 0);
        
        document.getElementById('totalSpecies').innerText = totalSpecies;
        document.getElementById('totalStock').innerText = totalStock;
        document.getElementById('profitCount').innerText = '0';
        document.getElementById('lossCount').innerText = '0';
        
        // 渲染盘点表格
        const tbody = document.getElementById('inventoryCheckTableBody');
        if (tbody) {
            if (books.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">暂无数据</td></tr>';
            } else {
                tbody.innerHTML = books.map(b => `
                    <tr>
                        <td>${escapeHtml(b.name || '-')}</td>
                        <td>${escapeHtml(b.isbn || '-')}</td>
                        <td>${b.stock || 0}</td>
                        <td>${b.stock || 0}</td>
                        <td>0</td>
                        <td>正常</td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('加载盘点数据失败:', error);
    }
}

function renderInventoryTable(books) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">暂无书籍数据</td></tr>';
        return;
    }

    tbody.innerHTML = books.map(book => `
        <tr>
            <td>${escapeHtml(book.name || '-')}</td>
            <td>${escapeHtml(book.isbn || '-')}</td>
            <td>${book.stock || 0}</td>
            <td>-</td>
            <td>${formatDate(book.updateTime)}</td>
            <td>
                <button class="btn-sm btn-primary btn-in-out" onclick="openInModal(${book.id})">入库</button>
                <button class="btn-sm btn-secondary btn-in-out" onclick="openOutModal(${book.id})">出库</button>
            </td>
        </tr>
    `).join('');
}

async function openInModal(bookId) {
    const quantity = prompt('请输入入库数量:');
    if (!quantity || isNaN(parseInt(quantity))) return;
    try {
        await adminApiCall('/inventory/in', 'POST', { bookId, quantity: parseInt(quantity), remark: '' });
        alert('入库成功');
        await loadInventoryBooks();
    } catch (error) {
        alert(error.message);
    }
}

async function openOutModal(bookId) {
    const quantity = prompt('请输入出库数量:');
    if (!quantity || isNaN(parseInt(quantity))) return;
    try {
        await adminApiCall('/inventory/out', 'POST', { bookId, quantity: parseInt(quantity), remark: '' });
        alert('出库成功');
        await loadInventoryBooks();
    } catch (error) {
        alert(error.message);
    }
}

function searchInventoryTable() {
    const searchTerm = document.getElementById('inventorySearchInput')?.value.toLowerCase() || '';
    if (!window.inventoryBooks) return;
    
    if (!searchTerm) {
        renderInventoryTable(window.inventoryBooks);
        return;
    }
    
    const filtered = window.inventoryBooks.filter(book =>
        (book.name && book.name.toLowerCase().includes(searchTerm)) ||
        (book.isbn && book.isbn.toLowerCase().includes(searchTerm)) ||
        (book.author && book.author.toLowerCase().includes(searchTerm))
    );
    renderInventoryTable(filtered);
}

function openStockInModal() {
    const select = document.getElementById('stockInBookSelect');
    if (!select) return;
    
    // 填充教材选项
    select.innerHTML = '<option value="">-- 请选择教材 --</option>';
    if (window.inventoryBooks && window.inventoryBooks.length > 0) {
        window.inventoryBooks.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = `${book.name} (${book.isbn}) - 库存: ${book.stock || 0}`;
            select.appendChild(option);
        });
    }
    
    document.getElementById('stockInQuantity').value = 1;
    document.getElementById('stockInRemark').value = '';
    Modal.open('stockInModal');
}

function openStockOutModal() {
    const select = document.getElementById('stockOutBookSelect');
    if (!select) return;
    
    // 填充教材选项
    select.innerHTML = '<option value="">-- 请选择教材 --</option>';
    if (window.inventoryBooks && window.inventoryBooks.length > 0) {
        window.inventoryBooks.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = `${book.name} (${book.isbn}) - 库存: ${book.stock || 0}`;
            select.appendChild(option);
        });
    }
    
    document.getElementById('stockOutQuantity').value = 1;
    document.getElementById('stockOutRemark').value = '';
    Modal.open('stockOutModal');
}

async function submitStockIn() {
    const bookId = document.getElementById('stockInBookSelect')?.value;
    const quantity = parseInt(document.getElementById('stockInQuantity')?.value) || 0;
    const remark = document.getElementById('stockInRemark')?.value || '';
    
    if (!bookId) {
        alert('请选择教材');
        return;
    }
    if (quantity <= 0) {
        alert('数量必须大于0');
        return;
    }
    
    try {
        const result = await adminApiCall('/inventory/in', 'POST', { bookId: parseInt(bookId), quantity, remark });
        if (result.success) {
            alert('入库成功');
            Modal.close('stockInModal');
            await loadInventoryBooks();
        } else {
            alert(result.message || '入库失败');
        }
    } catch (error) {
        alert('入库失败: ' + error.message);
    }
}

async function submitStockOut() {
    const bookId = document.getElementById('stockOutBookSelect')?.value;
    const quantity = parseInt(document.getElementById('stockOutQuantity')?.value) || 0;
    const remark = document.getElementById('stockOutRemark')?.value || '';
    
    if (!bookId) {
        alert('请选择教材');
        return;
    }
    if (quantity <= 0) {
        alert('数量必须大于0');
        return;
    }
    
    try {
        const result = await adminApiCall('/inventory/out', 'POST', { bookId: parseInt(bookId), quantity, remark });
        if (result.success) {
            alert('出库成功');
            Modal.close('stockOutModal');
            await loadInventoryBooks();
        } else {
            alert(result.message || '出库失败');
        }
    } catch (error) {
        alert('出库失败: ' + error.message);
    }
}

// ==================== 书籍管理功能 ====================
async function initBookMgmtPage() {
    if (!document.querySelector('.book-mgmt-main')) return;
    await loadBooksForMgmt();
    await loadCategoriesForBookForm();
    initNavUserInfo();
}

async function loadCategoriesForBookForm() {
    try {
        const result = await adminApiCall('/categories', 'GET');
        const categories = result.data || [];
        
        // 填充表单中的专业下拉框
        const select = document.getElementById('bookMajor');
        if (select) {
            select.innerHTML = '<option value="">请选择专业</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
        
        // 填充筛选器的专业下拉框
        const filterSelect = document.getElementById('bookMajorFilter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="all">全部专业</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name;
                option.textContent = cat.name;
                filterSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载专业失败:', error);
    }
}

async function loadBooksForMgmt() {
    try {
        const result = await adminApiCall('/books', 'GET');
        window.allBooks = result.data || [];
        renderBookMgmtTable(window.allBooks);
    } catch (error) {
        console.error('加载书籍失败:', error);
    }
}

function renderBookMgmtTable(books) {
    const tbody = document.getElementById('bookTableBody');
    if (!tbody) return;

    if (books.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px;">暂无书籍</td></tr>';
        return;
    }

    tbody.innerHTML = books.map(book => `
        <tr>
            <td><img src="${book.coverImage || ''}" alt="" style="width:40px;height:50px;object-fit:cover;" onerror="this.style.display='none'"></td>
            <td>${escapeHtml(book.name || '-')}</td>
            <td>${escapeHtml(book.isbn || '-')}</td>
            <td>${escapeHtml(book.major || '通用')}</td>
            <td>${book.stock || 0}</td>
            <td>${book.points || 0}</td>
            <td><span class="status-badge ${book.status === 'LISTED' ? 'approved' : 'delisted'}">${book.status === 'LISTED' ? '上架' : '下架'}</span></td>
            <td>
                <button class="btn-sm" onclick="editBook(${book.id})">编辑</button>
                <button class="btn-sm" style="background:#dc3545;color:white;" onclick="deleteBook(${book.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

async function deleteBook(id) {
    if (!confirm('确定要删除这本书吗？')) return;
    try {
        await adminApiCall(`/books/${id}`, 'DELETE');
        alert('删除成功');
        await loadBooksForMgmt();
    } catch (error) {
        alert(error.message);
    }
}

function openBookModal(bookId) {
    document.getElementById('bookModalTitle').innerText = bookId ? '✏️ 编辑书籍' : '📖 新增书籍';
    document.getElementById('bookForm').reset();
    
    if (bookId) {
        // 编辑模式：填充数据
        const book = window.allBooks.find(b => b.id === bookId);
        if (book) {
            document.getElementById('bookId').value = book.id;
            document.getElementById('bookName').value = book.name || '';
            document.getElementById('bookAuthor').value = book.author || '';
            document.getElementById('bookPublisher').value = book.publisher || '';
            document.getElementById('bookIsbn').value = book.isbn || '';
            document.getElementById('bookMajor').value = book.major || '';
            document.getElementById('bookCondition').value = book.condition || 'GOOD';
            document.getElementById('bookPoints').value = book.points || 0;
            document.getElementById('bookStock').value = book.stock || 0;
            document.getElementById('bookStatus').value = book.status || 'LISTED';
            document.getElementById('bookCoverImage').value = book.coverImage || '';
        }
    } else {
        document.getElementById('bookId').value = '';
    }
    
    Modal.open('bookModal');
}

async function saveBook() {
    const bookId = document.getElementById('bookId').value;
    const bookData = {
        name: document.getElementById('bookName').value,
        author: document.getElementById('bookAuthor').value,
        publisher: document.getElementById('bookPublisher').value,
        isbn: document.getElementById('bookIsbn').value,
        major: document.getElementById('bookMajor').value,
        condition: document.getElementById('bookCondition').value,
        points: parseInt(document.getElementById('bookPoints').value) || 0,
        stock: parseInt(document.getElementById('bookStock').value) || 0,
        status: document.getElementById('bookStatus').value,
        coverImage: ''
    };
    
    if (!bookData.name) {
        alert('请输入书籍名称');
        return;
    }
    
    try {
        if (bookId) {
            // 更新
            await adminApiCall(`/books/${bookId}`, 'PUT', bookData);
            alert('更新成功');
        } else {
            // 新增
            await adminApiCall('/books', 'POST', bookData);
            alert('新增成功');
        }
        Modal.close('bookModal');
        await loadBooksForMgmt();
    } catch (error) {
        alert(error.message);
    }
}

function editBook(bookId) {
    openBookModal(bookId);
}

// ==================== 分类管理功能 ====================
async function initCategoryMgmtPage() {
    if (!document.querySelector('.category-mgmt-main')) return;
    await loadCategories();
    initNavUserInfo();
}

async function loadCategories() {
    try {
        const result = await adminApiCall('/categories', 'GET');
        window.allCategories = result.data || [];
        renderCategoryTable(window.allCategories);
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

function renderCategoryTable(categories) {
    const tbody = document.getElementById('categoryTableBody');
    if (!tbody) return;
    
    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">暂无分类</td></tr>';
        return;
    }
    
    tbody.innerHTML = categories.map((cat, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(cat.name || '-')}</td>
            <td>${escapeHtml(cat.code || '-')}</td>
            <td>${cat.sort || 0}</td>
            <td><span class="status-badge ${cat.status === 'ACTIVE' ? 'approved' : 'delisted'}">${cat.status === 'ACTIVE' ? '启用' : '禁用'}</span></td>
            <td>${formatDate(cat.createTime)}</td>
            <td>
                <button class="btn-sm" onclick="editCategory(${cat.id})">编辑</button>
                <button class="btn-sm" style="background:#dc3545;color:white;" onclick="deleteCategory(${cat.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function openCategoryModal(categoryId) {
    document.getElementById('categoryModalTitle').innerText = categoryId ? '✏️ 编辑专业' : '📂 新增专业';
    document.getElementById('categoryForm').reset();
    
    if (categoryId) {
        const cat = window.allCategories.find(c => c.id === categoryId);
        if (cat) {
            document.getElementById('categoryId').value = cat.id;
            document.getElementById('categoryName').value = cat.name || '';
            document.getElementById('categoryCode').value = cat.code || '';
            document.getElementById('categorySort').value = cat.sort || 0;
            document.getElementById('categoryStatus').value = cat.status === 'ACTIVE' ? 'active' : 'inactive';
        }
    } else {
        document.getElementById('categoryId').value = '';
    }
    
    Modal.open('categoryModal');
}

async function saveCategory() {
    const categoryId = document.getElementById('categoryId').value;
    const categoryData = {
        name: document.getElementById('categoryName').value,
        code: document.getElementById('categoryCode').value,
        sort: parseInt(document.getElementById('categorySort').value) || 0,
        status: document.getElementById('categoryStatus').value === 'active' ? 'ACTIVE' : 'INACTIVE'
    };
    
    if (!categoryData.name) {
        alert('请输入专业名称');
        return;
    }
    
    try {
        if (categoryId) {
            await adminApiCall(`/categories/${categoryId}`, 'PUT', categoryData);
            alert('更新成功');
        } else {
            await adminApiCall('/categories', 'POST', categoryData);
            alert('新增成功');
        }
        Modal.close('categoryModal');
        await loadCategories();
        await loadCategoriesForBookForm(); // 同步更新书籍表单的专业下拉框
    } catch (error) {
        alert(error.message);
    }
}

function editCategory(categoryId) {
    openCategoryModal(categoryId);
}

async function deleteCategory(categoryId) {
    if (!confirm('确定要删除这个专业分类吗？')) return;
    try {
        await adminApiCall(`/categories/${categoryId}`, 'DELETE');
        alert('删除成功');
        await loadCategories();
        await loadCategoriesForBookForm();
    } catch (error) {
        alert(error.message);
    }
}

function searchCategories() {
    const statusFilter = document.getElementById('categoryStatusFilter')?.value || 'all';
    const searchTerm = document.getElementById('categorySearchInput')?.value.toLowerCase() || '';
    
    if (!window.allCategories) return;
    
    let filtered = window.allCategories;
    
    if (statusFilter !== 'all') {
        const statusMap = { 'active': 'ACTIVE', 'inactive': 'INACTIVE' };
        filtered = filtered.filter(c => c.status === statusMap[statusFilter]);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(c =>
            (c.name && c.name.toLowerCase().includes(searchTerm)) ||
            (c.code && c.code.toLowerCase().includes(searchTerm))
        );
    }
    
    renderCategoryTable(filtered);
}

function resetCategoryFilters() {
    document.getElementById('categoryStatusFilter').value = 'all';
    document.getElementById('categorySearchInput').value = '';
    renderCategoryTable(window.allCategories || []);
}

function searchBooks() {
    const statusFilter = document.getElementById('bookStatusFilter')?.value || 'all';
    const majorFilter = document.getElementById('bookMajorFilter')?.value || 'all';
    const searchTerm = document.getElementById('bookSearchInput')?.value.toLowerCase() || '';
    
    if (!window.allBooks) return;
    
    let filtered = window.allBooks;
    
    // Status filter
    if (statusFilter !== 'all') {
        const statusMap = { 'listed': 'LISTED', 'delisted': 'DELISTED' };
        filtered = filtered.filter(b => b.status === statusMap[statusFilter]);
    }
    
    // Major filter
    if (majorFilter !== 'all') {
        filtered = filtered.filter(b => b.major === majorFilter);
    }
    
    // Search term
    if (searchTerm) {
        filtered = filtered.filter(b =>
            (b.name && b.name.toLowerCase().includes(searchTerm)) ||
            (b.isbn && b.isbn.toLowerCase().includes(searchTerm)) ||
            (b.author && b.author.toLowerCase().includes(searchTerm))
        );
    }
    
    renderBookMgmtTable(filtered);
}

function resetBookFilters() {
    document.getElementById('bookStatusFilter').value = 'all';
    document.getElementById('bookMajorFilter').value = 'all';
    document.getElementById('bookSearchInput').value = '';
    renderBookMgmtTable(window.allBooks || []);
}

// ==================== 辅助函数 ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getCurrentUser() {
    const userStr = sessionStorage.getItem('current_user');
    if (userStr) return JSON.parse(userStr);
    return null;
}

// ==================== 导航栏用户信息 ====================
async function initNavUserInfo() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) return;
        
        // 从API获取最新用户信息
        const result = await adminApiCall(`/users/${currentUser.id}`, 'GET');
        if (result.success && result.data) {
            const user = result.data;
            const nameEl = document.getElementById('navUserName');
            if (nameEl) nameEl.innerText = user.name || '管理员';
            
            // 更新sessionStorage中的用户信息
            const updatedUser = { ...currentUser, name: user.name };
            sessionStorage.setItem('current_user', JSON.stringify(updatedUser));
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
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
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) return;
        
        const result = await adminApiCall(`/users/${currentUser.id}`, 'GET');
        if (!result.success) return;
        
        const user = result.data;
        
        document.getElementById('profileUsername').innerText = user.username || '-';
        document.getElementById('profileName').innerText = user.name || '-';
        document.getElementById('profileDept').innerText = user.college || '-';
        document.getElementById('profileRole').innerText = user.role === 'ADMIN' ? '系统管理员' : (user.role || '-');
        document.getElementById('profileYear').innerText = user.year || '-';
        document.getElementById('profilePhone').innerText = user.phone || '-';
        document.getElementById('profileLocation').innerText = user.major || '-';
        
        // 更新sessionStorage中的用户信息
        const updatedUser = { ...currentUser, name: user.name };
        sessionStorage.setItem('current_user', JSON.stringify(updatedUser));
        
        // 填充弹窗表单
        document.querySelector('#infoModal input[placeholder="姓名"]').value = user.name || '';
        document.querySelector('#infoModal input[placeholder="部门"]').value = user.college || '';
        document.querySelector('#infoModal input[placeholder="联系电话"]').value = user.phone || '';
        document.querySelector('#infoModal input[placeholder="入职年份"]').value = user.year || '';
        document.querySelector('#infoModal input[placeholder="工作地点"]').value = user.major || '';
        
    } catch (error) {
        console.error('加载个人信息失败:', error);
    }
}

async function saveProfile() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) {
            alert('用户未登录');
            return;
        }
        
        const name = document.querySelector('#infoModal input[placeholder="姓名"]').value.trim();
        const college = document.querySelector('#infoModal input[placeholder="部门"]').value.trim();
        const phone = document.querySelector('#infoModal input[placeholder="联系电话"]').value.trim();
        const year = document.querySelector('#infoModal input[placeholder="入职年份"]').value.trim();
        const major = document.querySelector('#infoModal input[placeholder="工作地点"]').value.trim();
        
        if (!name) {
            alert('姓名不能为空');
            return;
        }
        
        const updateData = {
            name: name,
            college: college,
            phone: phone,
            year: year ? parseInt(year) : null,
            major: major
        };
        
        const result = await adminApiCall(`/users/${currentUser.id}`, 'PUT', updateData);
        if (result.success) {
            alert('信息已更新');
            Modal.close('infoModal');
            await loadProfileData();
            initNavUserInfo();
        } else {
            alert(result.message || '更新失败');
        }
    } catch (error) {
        alert('更新失败: ' + error.message);
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

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initNavUserInfo();
    initDashboard();
    initNoticePage();
    initAuditPage();
    initEvaluatePage();
    initCharts();
    initInventoryPage();
    initBookMgmtPage();
    initCategoryMgmtPage();
    initAdminProfilePage();
    initRulePage();
});
