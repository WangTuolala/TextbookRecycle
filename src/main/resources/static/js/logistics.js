const LOGISTICS_API = '/logistics';

async function logisticsApiCall(endpoint, method, body) {
    const currentUser = getCurrentUser();
    const headers = {};
    if (currentUser && currentUser.name) {
        // 对中文进行编码，避免 HTTP header 不支持非 ISO-8859-1 字符
        headers['X-Operator-Name'] = encodeURIComponent(currentUser.name);
    }
    return apiCall(LOGISTICS_API + endpoint, method, body, headers);
}

// ==================== 领取管理页面功能 ====================
async function loadPickupList() {
    try {
        const [pendingResult, completedResult] = await Promise.all([
            logisticsApiCall('/exchanges/pending', 'GET'),
            logisticsApiCall('/exchanges/completed', 'GET')
        ]);
        window.pendingExchanges = pendingResult.data || [];
        window.completedExchanges = completedResult.data || [];
        window.allExchanges = [...window.pendingExchanges, ...window.completedExchanges];
        renderPickupTable(window.allExchanges);
        updatePickupStats();
    } catch (error) {
        console.error('加载领取列表失败:', error);
        window.pendingExchanges = [];
        window.completedExchanges = [];
        window.allExchanges = [];
    }
}

function renderPickupTable(exchanges) {
    const tbody = document.getElementById('pickupBody');
    if (!tbody) return;

    if (exchanges.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">暂无领取记录</td></tr>';
        return;
    }

    const defaultIcons = { '甜点券': '🍰', '笔记本套装': '📓', '帆布袋': '👜', '文具礼包': '✏️', '咖啡券': '☕' };

    tbody.innerHTML = exchanges.map(ex => {
        const icon = defaultIcons[ex.prizeName] || '🎁';
        const imgSrc = ex.prizeImageData || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23e1eff8' rx='10'/%3E%3Ctext x='25' y='33' text-anchor='middle' fill='%231e6d8f' font-size='24'%3E${encodeURIComponent(icon)}%3C/text%3E%3C/svg%3E`;
        const statusBadge = ex.status === 'COMPLETED'
            ? '<span class="status-badge completed">已领取</span>'
            : '<span class="status-badge pending">待领取</span>';
        const actionBtn = ex.status === 'PENDING'
            ? `<button class="btn-sm btn-pass" onclick="confirmPickup(${ex.id})">确认领取</button>`
            : '-';
        return `<tr data-status="${ex.status}" data-student="${ex.studentName || ''}" data-prize="${ex.prizeName || ''}">
            <td><a href="javascript:void(0)" class="student-link" onclick="showStudentInfo(${ex.studentId})">${escapeHtml(ex.studentName || '-')}</a></td>
            <td class="prize-img-cell"><img src="${imgSrc}" alt="" class="prize-table-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'50\' viewBox=\'0 0 50 50\'%3E%3Crect width=\'50\' height=\'50\' fill=\'%23e1eff8\' rx=\'10\'/%3E%3Ctext x=\'25\' y=\'33\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'24\'%3E🎁%3C/text%3E%3C/svg%3E'"></td>
            <td>${escapeHtml(ex.prizeName || '-')}</td>
            <td>${ex.points || 0}</td>
            <td>${formatDate(ex.exchangeTime)}</td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td>
        </tr>`;
    }).join('');
}

async function confirmPickup(id) {
    if (!confirm('确认该学生已领取此奖品吗？')) return;
    try {
        await logisticsApiCall(`/exchanges/${id}/pickup`, 'POST');
        alert('确认成功！');
        await loadPickupList();
        if (document.getElementById('prizeTableBody')) {
            await loadPrizes();
        }
    } catch (error) {
        alert(error.message);
    }
}

window.showStudentInfo = async function(studentId) {
    try {
        const result = await apiCall(`/admin/users/${studentId}`, 'GET');
        const u = result.data;
        if (!u) return;
        const content = document.getElementById('studentInfoContent');
        if (content) {
            content.innerHTML = `
                <div class="student-info-row"><span class="student-info-label">学号：</span><span class="student-info-value">${escapeHtml(u.username || '-')}</span></div>
                <div class="student-info-row"><span class="student-info-label">姓名：</span><span class="student-info-value">${escapeHtml(u.name || '-')}</span></div>
                <div class="student-info-row"><span class="student-info-label">学院：</span><span class="student-info-value">${escapeHtml(u.college || '-')}</span></div>
                <div class="student-info-row"><span class="student-info-label">专业：</span><span class="student-info-value">${escapeHtml(u.major || '-')}</span></div>
                <div class="student-info-row"><span class="student-info-label">班级：</span><span class="student-info-value">${escapeHtml(u.className || '-')}</span></div>
                <div class="student-info-row"><span class="student-info-label">联系电话：</span><span class="student-info-value">${escapeHtml(u.phone || '-')}</span></div>
                <div class="student-info-row"><span class="student-info-label">当前积分：</span><span class="student-info-value">${u.points ?? 0}</span></div>`;
        }
        Modal.open('studentInfoModal');
    } catch (error) {
        alert('获取学生信息失败');
    }
};

function updatePickupStats() {
    const all = window.allExchanges || [];
    const pending = all.filter(ex => ex.status === 'PENDING').length;
    const completed = all.filter(ex => ex.status === 'COMPLETED').length;
    const totalEl = document.getElementById('pickupTotal');
    const pendingEl = document.getElementById('pickupPending');
    const completedEl = document.getElementById('pickupCompleted');
    if (totalEl) totalEl.innerText = all.length;
    if (pendingEl) pendingEl.innerText = pending;
    if (completedEl) completedEl.innerText = completed;
}

function filterPickupList() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchPickup')?.value.toLowerCase() || '';
    const exchanges = window.allExchanges || [];

    let filtered = [...exchanges];
    if (statusFilter === 'pending') filtered = filtered.filter(ex => ex.status === 'PENDING');
    else if (statusFilter === 'completed') filtered = filtered.filter(ex => ex.status === 'COMPLETED');
    if (searchTerm) {
        filtered = filtered.filter(ex =>
            (ex.studentName && ex.studentName.toLowerCase().includes(searchTerm)) ||
            (ex.prizeName && ex.prizeName.toLowerCase().includes(searchTerm))
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
    renderPickupTable(window.allExchanges || []);
}

function updateVisibleStats() {
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
        // Try to get student info from API via admin controller
        const result = await apiCall('/admin/users/' + studentId, 'GET');
        const student = result.data;
        
        let infoHtml = '';
        if (student && student.profile) {
            const p = student.profile;
            infoHtml = `
                <div class="student-info-row"><span class="student-info-label">学号：</span><span class="student-info-value">${p.studentId || studentId}</span></div>
                <div class="student-info-row"><span class="student-info-label">姓名：</span><span class="student-info-value">${p.name || studentName}</span></div>
                <div class="student-info-row"><span class="student-info-label">学院：</span><span class="student-info-value">${p.college || '未填写'}</span></div>
                <div class="student-info-row"><span class="student-info-label">专业：</span><span class="student-info-value">${p.major || '未填写'}</span></div>
                <div class="student-info-row"><span class="student-info-label">班级：</span><span class="student-info-value">${p.class || '未填写'}</span></div>
                <div class="student-info-row"><span class="student-info-label">入学年份：</span><span class="student-info-value">${p.entryYear || '未填写'}</span></div>
                <div class="student-info-row"><span class="student-info-label">联系电话：</span><span class="student-info-value">${p.phone || '未填写'}</span></div>
            `;
        } else {
            infoHtml = `
                <div class="student-info-row"><span class="student-info-label">学号：</span><span class="student-info-value">${studentId}</span></div>
                <div class="student-info-row"><span class="student-info-label">姓名：</span><span class="student-info-value">${studentName}</span></div>
                <div class="student-info-row"><span class="student-info-label">学院：</span><span class="student-info-value">-</span></div>
                <div class="student-info-row"><span class="student-info-label">专业：</span><span class="student-info-value">-</span></div>
                <div class="student-info-row"><span class="student-info-label">班级：</span><span class="student-info-value">-</span></div>
                <div class="student-info-row"><span class="student-info-label">入学年份：</span><span class="student-info-value">-</span></div>
                <div class="student-info-row"><span class="student-info-label">联系电话：</span><span class="student-info-value">-</span></div>
            `;
        }
        
        const contentEl = document.getElementById('studentInfoContent');
        if (contentEl) {
            contentEl.innerHTML = infoHtml;
            Modal.open('studentInfoModal');
        }
    } catch (error) {
        console.error('获取学生信息失败:', error);
        // Fallback to basic info
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

// ==================== 奖品管理页面功能 ====================
async function loadPrizes() {
    try {
        const prizesResult = await logisticsApiCall('/prizes', 'GET');
        const completedResult = await logisticsApiCall('/exchanges/completed', 'GET');
        window.prizes = prizesResult.data || [];
        window.completedExchanges = completedResult.data || [];
        renderPrizeTable();
        updatePrizeStats();
    } catch (error) {
        console.error('加载奖品失败:', error);
        window.prizes = [];
        window.completedExchanges = [];
    }
}

function renderPrizeTable() {
    const tbody = document.getElementById('prizeTableBody');
    if (!tbody) return;

    if (window.prizes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">暂无奖品数据</td></tr>';
        return;
    }

    const defaultIcons = { '甜点券': '🍰', '笔记本套装': '📓', '帆布袋': '👜', '文具礼包': '✏️', '咖啡券': '☕' };

    tbody.innerHTML = window.prizes.map(prize => {
        const icon = defaultIcons[prize.name] || '🎁';
        const imgSrc = prize.imageData || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23e1eff8' rx='10'/%3E%3Ctext x='25' y='33' text-anchor='middle' fill='%231e6d8f' font-size='24'%3E${encodeURIComponent(icon)}%3C/text%3E%3C/svg%3E`;
        return `<tr data-id="${prize.id}">
            <td class="prize-img-cell"><img src="${imgSrc}" alt="${prize.name}" class="prize-table-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'50\' viewBox=\'0 0 50 50\'%3E%3Crect width=\'50\' height=\'50\' fill=\'%23e1eff8\' rx=\'10\'/%3E%3Ctext x=\'25\' y=\'33\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'24\'%3E🎁%3C/text%3E%3C/svg%3E'"></td>
            <td>${escapeHtml(prize.name)}</td>
            <td>${prize.points}</td>
            <td><span class="stock-num">${prize.stock}</span></td>
            <td>
                <button class="edit-btn" onclick="openEditPrizeModal(${prize.id})">编辑</button>
                <button class="delete-btn" onclick="deletePrize(${prize.id})">删除</button>
            </td>
        </tr>`;
    }).join('');
}

function updatePrizeStats() {
    const completed = window.completedExchanges || [];
    const totalEl = document.getElementById('totalCount');
    const mostPopularEl = document.getElementById('mostPopular');

    if (totalEl) totalEl.innerText = completed.reduce((sum, ex) => sum + (ex.quantity || 1), 0);

    if (mostPopularEl) {
        const countMap = {};
        completed.forEach(ex => {
            const name = ex.prizeName || '未知';
            countMap[name] = (countMap[name] || 0) + (ex.quantity || 1);
        });
        const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
        mostPopularEl.innerText = sorted.length > 0 ? sorted[0][0] + ' (' + sorted[0][1] + '次)' : '-';
    }
}

window.addNewPrize = function() {
    const name = document.getElementById('prizeName')?.value.trim();
    const points = parseInt(document.getElementById('prizePoints')?.value);
    const stock = parseInt(document.getElementById('prizeStock')?.value);
    const imageFile = document.getElementById('prizeImage')?.files[0];

    if (!name) { alert('请填写奖品名称'); return; }
    if (isNaN(points) || points < 0) { alert('请填写有效的所需积分'); return; }
    if (isNaN(stock) || stock < 0) { alert('请填写有效的库存数量'); return; }
    if (!imageFile) { alert('请上传奖品图片'); return; }

    let imageData = null;
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            imageData = e.target.result;
            await savePrize(name, points, stock, imageData);
        };
        reader.readAsDataURL(imageFile);
    } else {
        savePrize(name, points, stock, null);
    }
};

async function savePrize(name, points, stock, imageData) {
    try {
        await logisticsApiCall('/prizes', 'POST', { name, points, stock, imageData });
        alert(`奖品"${name}"已添加成功！`);
        Modal.close('addPrizeModal');
        resetPrizeForm();
        await loadPrizes();
    } catch (error) {
        alert(error.message);
    }
}

window.deletePrize = async function(id) {
    if (!confirm('确定要删除这个奖品吗？')) return;
    try {
        await logisticsApiCall(`/prizes/${id}`, 'DELETE');
        alert('删除成功');
        await loadPrizes();
    } catch (error) {
        alert(error.message);
    }
};

window.openEditPrizeModal = function(id) {
    const prize = window.prizes.find(p => p.id === id);
    if (!prize) return;
    document.getElementById('editPrizeId').value = prize.id;
    document.getElementById('editPrizeName').value = prize.name || '';
    document.getElementById('editPrizePoints').value = prize.points || 0;
    document.getElementById('editPrizeStock').value = prize.stock || 0;
    const previewImg = document.querySelector('#editPrizePreview img');
    if (previewImg) {
        previewImg.src = prize.imageData || previewImg.src;
    }
    document.getElementById('editPrizeImage').value = '';

    // 绑定图片上传预览：上传即更新预览图
    const imageInput = document.getElementById('editPrizeImage');
    const newInput = imageInput.cloneNode(true);
    imageInput.parentNode.replaceChild(newInput, imageInput);
    newInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const preview = document.querySelector('#editPrizePreview img');
                if (preview) preview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    Modal.open('editPrizeModal');
};

window.saveEditPrize = async function() {
    const id = parseInt(document.getElementById('editPrizeId').value);
    const name = document.getElementById('editPrizeName')?.value.trim();
    const points = parseInt(document.getElementById('editPrizePoints')?.value);
    const stock = parseInt(document.getElementById('editPrizeStock')?.value);
    const imageFile = document.getElementById('editPrizeImage')?.files[0];

    if (!name) { alert('请填写奖品名称'); return; }
    if (isNaN(points) || points < 0) { alert('请填写有效的所需积分'); return; }
    if (isNaN(stock) || stock < 0) { alert('请填写有效的库存数量'); return; }

    let imageData = window.prizes.find(p => p.id === id)?.imageData || null;
    if (imageFile) {
        imageData = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(imageFile);
        });
    }

    try {
        await logisticsApiCall(`/prizes/${id}`, 'PUT', { name, points, stock, imageData });
        alert('修改成功');
        Modal.close('editPrizeModal');
        await loadPrizes();
    } catch (error) {
        alert(error.message);
    }
};

function resetPrizeForm() {
    ['prizeName', 'prizePoints', 'prizeStock'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const imageInput = document.getElementById('prizeImage');
    if (imageInput) imageInput.value = '';
    const previewImg = document.querySelector('#prizeUploadPreview img');
    if (previewImg) previewImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23e1eff8' rx='10'/%3E%3Ctext x='40' y='45' text-anchor='middle' fill='%239ac2d9' font-size='14'%3E图片%3C/text%3E%3C/svg%3E";
}

function bindAddPrizeButton() {
    const addBtn = document.getElementById('addPrizeBtn');
    if (addBtn && !addBtn.hasAttribute('data-bound')) {
        addBtn.setAttribute('data-bound', 'true');
        addBtn.addEventListener('click', () => {
            updatePointsHint();
            resetPrizeForm();
            Modal.open('addPrizeModal');
        });
    }
    const imageInput = document.getElementById('prizeImage');
    if (imageInput && !imageInput.hasAttribute('data-bound')) {
        imageInput.setAttribute('data-bound', 'true');
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const previewImg = document.querySelector('#prizeUploadPreview img');
                    if (previewImg) previewImg.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

async function updatePointsHint() {
    try {
        const result = await logisticsApiCall('/points-rule', 'GET');
        const rule = result.data;
        const hint = document.getElementById('pointsHint');
        if (hint) hint.innerText = `积分上限: ${rule.prizeMax || 500}`;
    } catch (error) {
        console.error('加载积分规则失败:', error);
    }
}

window.viewPointsRule = async function() {
    try {
        const result = await logisticsApiCall('/points-rule', 'GET');
        const rule = result.data;
        if (rule) {
            document.getElementById('rulePointsNew').innerText = rule.ruleNew;
            document.getElementById('rulePointsGood').innerText = rule.ruleGood;
            document.getElementById('rulePointsNormal').innerText = rule.ruleNormal;
            document.getElementById('rulePointsOld').innerText = rule.ruleOld;
            document.getElementById('rulePrizeMax').innerText = rule.prizeMax;
        }
    } catch (error) {
        console.error('获取积分规则失败:', error);
    }
    Modal.open('ruleModal');
};

window.viewUpdatedRule = function() {
    Modal.close('ruleUpdateModal');
    viewPointsRule();
};

function bindViewRuleButton() {
    const viewBtn = document.getElementById('viewRuleBtn');
    if (viewBtn && !viewBtn.hasAttribute('data-bound')) {
        viewBtn.setAttribute('data-bound', 'true');
        viewBtn.addEventListener('click', () => viewPointsRule());
    }
}

function checkForRuleUpdate() {
    // Check if admin updated rules
}

function showRuleUpdateNotification(newRules) {
    const modal = document.getElementById('ruleUpdateModal');
    const content = document.getElementById('ruleUpdateContent');
    if (content) {
        content.innerHTML = `
            <p>管理员已更新积分规则：</p>
            <ul style="margin-top: 10px; padding-left: 20px;">
                <li>全新教材: ${newRules.ruleNew} 积分</li>
                <li>良好教材: ${newRules.ruleGood} 积分</li>
                <li>一般教材: ${newRules.ruleNormal} 积分</li>
                <li>陈旧教材: ${newRules.ruleOld} 积分</li>
                <li>奖品积分上限: ${newRules.prizeMax} 积分</li>
            </ul>
        `;
    }
    if (modal) Modal.open('ruleUpdateModal');
}

function listenToRuleUpdates() {
    window.addEventListener('storage', (e) => {
        if (e.key === 'admin_points_rules') {
            try {
                const newRules = JSON.parse(e.newValue);
                if (newRules) showRuleUpdateNotification(newRules);
            } catch (err) {}
        }
    });
}

// ==================== 公告通知页面功能 ====================
async function loadAnnouncementsAndNotices() {
    try {
        const [annResult, locationResult] = await Promise.all([
            apiCall('/admin/announcements', 'GET'),
            apiCall('/admin/location-notices?role=LOGISTICS', 'GET')
        ]);
        window.announcements = annResult.data || [];
        window.locationNotices = locationResult.data || [];
        renderAnnouncementHistory();
        renderLocationHistory();
    } catch (error) {
        console.error('加载公告失败:', error);
    }
}

async function publishLocationNotice() {
    const location = document.getElementById('editLocation')?.value.trim();
    const notice = document.getElementById('editNotice')?.value.trim();
    if (!location) { alert('请填写领取地点'); return; }
    if (!notice) { alert('请填写注意事项'); return; }

    try {
        await logisticsApiCall('/location-notices', 'POST', { location, notice });
        alert('领取地点和注意事项已发布！');
        await loadAnnouncementsAndNotices();
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
        await logisticsApiCall('/announcements', 'POST', { title, content });
        alert('公告已发布！');
        await loadAnnouncementsAndNotices();
        resetAnnouncementForm();
    } catch (error) {
        alert(error.message);
    }
}

function renderAnnouncementHistory(searchTerm = '') {
    const tbody = document.getElementById('announcementHistoryBody');
    if (!tbody) return;

    let filtered = [...(window.announcements || [])];
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

function renderLocationHistory(searchTerm = '') {
    const tbody = document.getElementById('locationHistoryBody');
    if (!tbody) return;

    let filtered = [...(window.locationNotices || [])];
    if (searchTerm) {
        filtered = filtered.filter(n => n.location.includes(searchTerm) || (n.notice && n.notice.includes(searchTerm)));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">暂无记录</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((item, index) => {
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
        await logisticsApiCall(`/announcements/${id}`, 'DELETE');
        alert('公告已删除');
        await loadAnnouncementsAndNotices();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteLocationNotice(id) {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
        await logisticsApiCall(`/location-notices/${id}`, 'DELETE');
        alert('记录已删除');
        await loadAnnouncementsAndNotices();
    } catch (error) {
        alert(error.message);
    }
}

function searchAnnouncements() {
    renderAnnouncementHistory(document.getElementById('searchAnnouncement')?.value || '');
}

function searchLocationNotices() {
    renderLocationHistory(document.getElementById('searchLocationNotice')?.value || '');
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

// ==================== 个人信息页面功能 ====================
function initProfilePage() {
    const infoModal = document.getElementById('infoModal');
    const pwdModal = document.getElementById('pwdModal');
    if (infoModal) {
        const saveBtn = infoModal.querySelector('.btn-primary');
        if (saveBtn) saveBtn.onclick = function() { saveLogisticsProfile(); };
    }
    if (pwdModal) {
        const saveBtn = pwdModal.querySelector('.btn-primary');
        if (saveBtn) saveBtn.onclick = function() { changePassword(); };
    }
    // 恢复保存的数据
    loadLogisticsProfile();
}

function saveLogisticsProfile() {
    const name = document.getElementById('logiProfileName')?.value || '';
    const dept = document.getElementById('logiProfileDept')?.value || '';
const year = document.getElementById('logiProfileYear')?.value || '';
    const phone = document.getElementById('logiProfilePhone')?.value || '';
    const workplace = document.getElementById('logiProfileWorkplace')?.value || '';
    
    sessionStorage.setItem('logisticsProfile', JSON.stringify({ name, dept, year, phone, workplace }));
    
    // 同时更新 currentUser，这样导航栏也会显示新名字
    const currentUser = getCurrentUser();
    if (currentUser) {
        currentUser.name = name;
        sessionStorage.setItem('current_user', JSON.stringify(currentUser));
    }
    
    const rows = document.querySelectorAll('.profile-info-grid .info-value');
    if (rows.length >= 6) {
        rows[1].innerText = name || '-';
        rows[2].innerText = dept || '-';
        rows[3].innerText = year ? year + '年' : '-';
        rows[4].innerText = phone || '-';
        rows[5].innerText = workplace || '-';
    }
    
    const navUserName = document.querySelector('.nav-user-info');
    if (navUserName) navUserName.innerHTML = '👤 ' + name + ' <span class="points">后勤</span>';
    
    Modal.close('infoModal');
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
        const result = await logisticsApiCall('/password', 'PUT', { oldPassword: oldPwd, newPassword: newPwd });
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

function updateNavUserName(name) {
    const navUserName = document.querySelector('.nav-user-info');
    if (navUserName) navUserName.innerHTML = '👤 ' + name + ' <span class="points">后勤</span>';
}

function loadLogisticsProfile() {
    const saved = sessionStorage.getItem('logisticsProfile');
    if (saved) {
        try {
            const p = JSON.parse(saved);
            const rows = document.querySelectorAll('.profile-info-grid .info-value');
            if (rows.length >= 6) {
                rows[1].innerText = p.name || '-';
                rows[2].innerText = p.dept || '-';
                rows[3].innerText = p.year ? p.year + '年' : '-';
                rows[4].innerText = p.phone || '-';
                rows[5].innerText = p.workplace || '-';
            }
            if (document.getElementById('logiProfileName')) document.getElementById('logiProfileName').value = p.name || '';
            if (document.getElementById('logiProfileDept')) document.getElementById('logiProfileDept').value = p.dept || '';
            if (document.getElementById('logiProfileYear')) document.getElementById('logiProfileYear').value = p.year || '';
            if (document.getElementById('logiProfilePhone')) document.getElementById('logiProfilePhone').value = p.phone || '';
            if (document.getElementById('logiProfileWorkplace')) document.getElementById('logiProfileWorkplace').value = p.workplace || '';
            updateNavUserName(p.name || '王师傅');
        } catch (e) { console.error('恢复后勤个人信息失败:', e); }
    }
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

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    // Load user name
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.name) {
        const userNameEl = document.getElementById('logisticsUserName');
        if (userNameEl) userNameEl.innerText = '👤 ' + currentUser.name;
    }
    
    listenToRuleUpdates();
    checkForRuleUpdate();

    console.log('当前页面路径:', window.location.pathname);
    console.log('是否匹配领取管理:', window.location.pathname.includes('/logistics/index.html'));
    if (window.location.pathname.includes('/logistics/index.html')) {
        console.log('开始加载领取列表...');
        loadPickupList();
    }

    if (window.location.pathname.includes('/logistics/prize-mgmt.html')) {
        loadPrizes();
        bindAddPrizeButton();
        bindViewRuleButton();
    }

    if (window.location.pathname.includes('/logistics/notice.html')) {
        loadAnnouncementsAndNotices();
    }

    if (window.location.pathname.includes('/logistics/profile.html')) {
        initProfilePage();
    }
});
