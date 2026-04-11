const STUDENT_API = '/student';

async function studentApiCall(endpoint, method, body) {
    const currentUser = getCurrentUser();
    const headers = {};
    if (currentUser && currentUser.id) {
        headers['X-User-Id'] = currentUser.id;
    }
    return apiCall(STUDENT_API + endpoint, method, body, headers);
}

// ==================== 渲染书籍卡片 ====================
async function loadBooks() {
    try {
        const majorSelect = document.getElementById('majorFilter');
        const sortSelect = document.getElementById('sortFilter');
        const searchInput = document.getElementById('searchInput');
        
        const major = majorSelect?.value || 'all';
        const keyword = searchInput?.value || '';
        
        let url = '/books?';
        if (major !== 'all') url += 'major=' + encodeURIComponent(major) + '&';
        if (keyword) url += 'keyword=' + encodeURIComponent(keyword) + '&';
        
        const result = await studentApiCall(url, 'GET');
        renderBookCards(result.data || []);
    } catch (error) {
        console.error('加载书籍失败:', error);
        const container = document.getElementById('bookGrid');
        if (container) container.innerHTML = '<div class="no-books-message">加载失败，请刷新重试</div>';
    }
}

function renderBookCards(books) {
    const container = document.getElementById('bookGrid');
    if (!container) return;

    // 保存书籍数据到全局变量
    window.currentBooks = books;

    if (books.length === 0) {
        container.innerHTML = '<div class="no-books-message">暂无教材，请尝试其他筛选条件</div>';
        return;
    }

    const sortSelect = document.getElementById('sortFilter');
    const sortBy = sortSelect?.value || 'points_asc';
    
    let sortedBooks = [...books];
    if (sortBy === 'points_asc') {
        sortedBooks.sort((a, b) => a.points - b.points);
    } else if (sortBy === 'points_desc') {
        sortedBooks.sort((a, b) => b.points - a.points);
    } else if (sortBy === 'latest') {
        sortedBooks.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    let html = '';
    sortedBooks.forEach(book => {
        const coverImg = book.coverImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='150' viewBox='0 0 120 150'%3E%3Crect width='120' height='150' fill='%23d0e2f2'/%3E%3Ctext x='60' y='70' text-anchor='middle' fill='%231e6d8f' font-size='14'%3E教材%3C/text%3E%3C/svg%3E";
        html += `<div class="book-card-full" data-id="${book.id}">
            <div class="book-cover-full"><img src="${book.coverImage}" alt="${escapeHtml(book.name)}" class="book-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'150\' viewBox=\'0 0 120 150\'%3E%3Crect width=\'120\' height=\'150\' fill=\'%23d0e2f2\'/%3E%3Ctext x=\'60\' y=\'70\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'14\'%3E教材%3C/text%3E%3C/svg%3E'"></div>
            <div class="book-info-full">
                <h3>${escapeHtml(book.name)}</h3>
                <p>${escapeHtml(book.author || '')}</p>
                <div class="book-major">📚 ${escapeHtml(book.major || '通用')}</div>
                <div class="points-badge-full">${book.points} 积分</div>
                <div class="stock-full">库存 ${book.stock} 本</div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
    bindBookCards();
}

function bindBookCards() {
    document.querySelectorAll('.book-card-full').forEach(card => {
        if (card.hasAttribute('data-bound')) return;
        card.setAttribute('data-bound', 'true');
        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            const bookId = parseInt(card.getAttribute('data-id'));
            const book = window.currentBooks?.find(b => b.id === bookId);
            if (book) updateBookModal(book);
            Modal.open('bookModal');
        });
    });
}

function updateBookModal(book) {
    document.getElementById('modalBookTitle').innerText = book.name;
    document.getElementById('modalMajor').innerText = book.major || '通用';
    document.getElementById('modalBookName').innerText = book.name;
    document.getElementById('modalIsbn').innerText = book.isbn || '-';
    document.getElementById('modalPublisher').innerText = book.publisher || '-';
    document.getElementById('modalCondition').innerText = book.condition || '-';
    document.getElementById('modalPoints').innerText = book.points;
    document.getElementById('modalStock').innerText = book.stock + ' 本';
    
    const imgEl = document.getElementById('modalBookImg');
    if (imgEl) {
        imgEl.src = book.coverImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='150' viewBox='0 0 120 150'%3E%3Crect width='120' height='150' fill='%23d0e2f2'/%3E%3Ctext x='60' y='75' text-anchor='middle' fill='%231e6d8f' font-size='16'%3E封面图%3C/text%3E%3C/svg%3E";
        imgEl.onerror = function() { this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='150' viewBox='0 0 120 150'%3E%3Crect width='120' height='150' fill='%23d0e2f2'/%3E%3Ctext x='60' y='75' text-anchor='middle' fill='%231e6d8f' font-size='16'%3E封面图%3C/text%3E%3C/svg%3E"; };
    }

    // 存储当前书籍数据到按钮上，避免重复克隆
    const exchangeBtn = document.getElementById('exchangeBookBtn');
    exchangeBtn.setAttribute('data-book-id', book.id);
    exchangeBtn.setAttribute('data-book-stock', book.stock);
    exchangeBtn.setAttribute('data-book-points', book.points);
    exchangeBtn.setAttribute('data-book-name', book.name);
}

// ==================== 筛选功能 ====================
function initFilterButtons() {
    const filterBtn = document.getElementById('filterBtn');
    const searchInput = document.getElementById('searchInput');
    const majorSelect = document.getElementById('majorFilter');
    const sortSelect = document.getElementById('sortFilter');
    
    const applyFilters = () => {
        loadBooks();
    };
    
    if (filterBtn) filterBtn.addEventListener('click', applyFilters);
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') applyFilters(); });
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);
    
    loadBooks();
}

// ==================== 首页预约表单功能 ====================
function initHomeImagePreview() {
    const coverInput = document.getElementById('coverImage');
    if (coverInput) {
        coverInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.querySelector('#coverPreview img');
                    if (preview) preview.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function openHomeRecycleModal() {
    resetHomeRecycleForm();
    Modal.open('recycleFormModal');
}

window.closeRecycleModal = function() {
    const modal = document.getElementById('recycleFormModal');
    if (modal) {
        modal.style.display = 'none';
        resetHomeRecycleForm();
    }
};

function resetHomeRecycleForm() {
    const form = document.getElementById('recycleForm');
    if (form) form.reset();
    const coverPreview = document.querySelector('#coverPreview img');
    if (coverPreview) {
        coverPreview.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='104' viewBox='0 0 80 104'%3E%3Crect width='80' height='104' fill='%23e1eff8'/%3E%3Ctext x='40' y='52' text-anchor='middle' fill='%239ac2d9' font-size='12'%3E封面图%3C/text%3E%3C/svg%3E";
    }
    const coverInput = document.getElementById('coverImage');
    if (coverInput) coverInput.value = '';
}

async function addHomeRecycleRecord(bookData) {
    try {
        const result = await studentApiCall('/appointments', 'POST', {
            bookName: bookData.bookName,
            isbn: bookData.isbn,
            publisher: bookData.publisher,
            condition: bookData.condition,
            quantity: bookData.quantity,
            remark: bookData.remark,
            coverImage: bookData.coverImage
        });
        addToAppointmentTable(result.data);
        alert('预约提交成功，等待管理员审核！');
    } catch (error) {
        alert('预约提交失败: ' + error.message);
    }
}

function addToAppointmentTable(appointment) {
    const tbody = document.getElementById('appointmentTbody');
    if (!tbody) return;

    const coverImgSrc = appointment.coverImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='65' viewBox='0 0 50 65'%3E%3Crect width='50' height='65' fill='%23d0e2f2'/%3E%3Ctext x='25' y='35' text-anchor='middle' fill='%231e6d8f' font-size='10'%3E新书%3C/text%3E%3C/svg%3E";
    
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-status', appointment.status);
    newRow.innerHTML = `
        <td class="record-cover"><img src="${coverImgSrc}" alt="封面" class="record-img" style="width:50px;height:65px;object-fit:cover;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'65\' viewBox=\'0 0 50 65\'%3E%3Crect width=\'50\' height=\'65\' fill=\'%23d0e2f2\'/%3E%3Ctext x=\'25\' y=\'35\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'10\'%3E新书%3C/text%3E%3C/svg%3E'"></td>
        <td>${escapeHtml(appointment.bookName)}</td>
        <td>${appointment.condition}</td>
        <td>${appointment.quantity}</td>
        <td>${formatDate(appointment.submitTime)}</td>
        <td><span class="status-badge pending">待审核</span></td>
        <td>—</td>
    `;
    tbody.insertBefore(newRow, tbody.firstChild);
    updateAppointmentStats();
}

function bindHomeRecycleFormSubmit() {
    const recycleForm = document.getElementById('recycleForm');
    if (recycleForm && !recycleForm.hasAttribute('data-home-bound')) {
        recycleForm.setAttribute('data-home-bound', 'true');
        recycleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const bookName = document.getElementById('bookName')?.value.trim();
            const isbn = document.getElementById('isbn')?.value.trim();
            const publisher = document.getElementById('publisher')?.value.trim();
            const condition = document.getElementById('condition')?.value;
            const quantity = document.getElementById('quantity')?.value || '1';
            
            if (!bookName) { alert('请填写教材名称'); return; }
            if (!isbn) { alert('请填写ISBN'); return; }
            if (!publisher) { alert('请填写出版社'); return; }
            if (!condition) { alert('请选择品相预估'); return; }

            let coverImgSrc = '';
            const coverPreview = document.querySelector('#coverPreview img');
            if (coverPreview && coverPreview.src && !coverPreview.src.includes('封面图')) {
                coverImgSrc = coverPreview.src;
            }

            const bookData = {
                bookName, isbn, publisher, condition,
                quantity: parseInt(quantity),
                remark: document.getElementById('remark')?.value || '',
                coverImage: coverImgSrc
            };

            await addHomeRecycleRecord(bookData);
            closeRecycleModal();
        });
    }
}

function bindHomeOpenModalButton() {
    const openBtn = document.getElementById('openRecycleBtnOnHome');
    if (openBtn && !openBtn.hasAttribute('data-home-bound')) {
        openBtn.setAttribute('data-home-bound', 'true');
        openBtn.addEventListener('click', openHomeRecycleModal);
    }
}

function bindHomeModalCloseButtons() {
    const modal = document.getElementById('recycleFormModal');
    if (modal) {
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn && !closeBtn.hasAttribute('data-home-bound')) {
            closeBtn.setAttribute('data-home-bound', 'true');
            closeBtn.addEventListener('click', closeRecycleModal);
        }
    }
}

function initHomeRecycleForm() {
    if (document.querySelector('.stu-main-full')) {
        bindHomeOpenModalButton();
        bindHomeRecycleFormSubmit();
        initHomeImagePreview();
        bindHomeModalCloseButtons();
    }
}

// ==================== 积分收支页面功能 ====================
async function initPointsPage() {
    if (!document.querySelector('.points-main-full')) return;
    
    try {
        const result = await studentApiCall('/points', 'GET');
        const data = result.data;
        
        const totalPointsEl = document.getElementById('totalPoints');
        if (totalPointsEl) totalPointsEl.innerText = data.points || 0;
        
        const records = data.records || [];
        const tbody = document.getElementById('pointsTableBody');
        if (tbody) {
            if (records.length === 0) {
                document.getElementById('noDataMessage').style.display = 'block';
                tbody.innerHTML = '';
            } else {
                document.getElementById('noDataMessage').style.display = 'none';
                let html = '';
                records.forEach(item => {
                    const pointsClass = item.points > 0 ? 'points-income' : 'points-expense';
                    const categoryClass = item.category === 'BOOK' ? 'category-badge book' : 'category-badge prize';
                    const categoryIcon = item.category === 'BOOK' ? '📚' : '🎁';
                    const categoryName = item.category === 'BOOK' ? '教材' : '奖品';
                    html += `<tr>
                        <td>${formatDate(item.createTime)}</td>
                        <td>${item.type}</td>
                        <td class="${pointsClass}">${item.points > 0 ? '+' : ''}${item.points}</td>
                        <td>${item.balance}</td>
                        <td>${escapeHtml(item.description || '')}</td>
                        <td><span class="${categoryClass}">${categoryIcon} ${categoryName}</span></td>
                    </tr>`;
                });
                tbody.innerHTML = html;
            }
        }
        
        // Filter functionality
        const typeFilter = document.getElementById('typeFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const resetBtn = document.getElementById('resetFilterBtn');
        
        const applyFilter = () => {
            const typeVal = typeFilter?.value || 'all';
            const catVal = categoryFilter?.value || 'all';
            
            let filtered = [...records];
            if (typeVal === 'income') filtered = filtered.filter(item => item.points > 0);
            else if (typeVal === 'expense') filtered = filtered.filter(item => item.points < 0);
            if (catVal === 'book') filtered = filtered.filter(item => item.category === 'BOOK');
            else if (catVal === 'prize') filtered = filtered.filter(item => item.category === 'PRIZE');
            
            const tbody = document.getElementById('pointsTableBody');
            if (tbody) {
                if (filtered.length === 0) {
                    document.getElementById('noDataMessage').style.display = 'block';
                    tbody.innerHTML = '';
                } else {
                    document.getElementById('noDataMessage').style.display = 'none';
                    let html = '';
                    filtered.forEach(item => {
                        const pointsClass = item.points > 0 ? 'points-income' : 'points-expense';
                        const categoryClass = item.category === 'BOOK' ? 'category-badge book' : 'category-badge prize';
                        const categoryIcon = item.category === 'BOOK' ? '📚' : '🎁';
                        const categoryName = item.category === 'BOOK' ? '教材' : '奖品';
                        html += `<tr>
                            <td>${formatDate(item.createTime)}</td>
                            <td>${item.type}</td>
                            <td class="${pointsClass}">${item.points > 0 ? '+' : ''}${item.points}</td>
                            <td>${item.balance}</td>
                            <td>${escapeHtml(item.description || '')}</td>
                            <td><span class="${categoryClass}">${categoryIcon} ${categoryName}</span></td>
                        </tr>`;
                    });
                    tbody.innerHTML = html;
                }
            }
        };
        
        if (typeFilter) typeFilter.addEventListener('change', applyFilter);
        if (categoryFilter) categoryFilter.addEventListener('change', applyFilter);
        if (resetBtn) resetBtn.addEventListener('click', () => {
            if (typeFilter) typeFilter.value = 'all';
            if (categoryFilter) categoryFilter.value = 'all';
            applyFilter();
        });
        
    } catch (error) {
        console.error('加载积分信息失败:', error);
    }
}

// ==================== 积分兑换页面功能 ====================
async function initExchangePage() {
    if (!document.querySelector('.exchange-main-full')) return;
    
    try {
        const [prizesResult, pointsResult] = await Promise.all([
            studentApiCall('/prizes', 'GET'),
            studentApiCall('/points', 'GET')
        ]);
        
        const prizes = prizesResult.data || [];
        const currentPoints = pointsResult.data?.points || 0;
        
        // Update nav points
        const navPointsEl = document.getElementById('navUserPoints');
        if (navPointsEl) navPointsEl.innerText = currentPoints;
        
        const container = document.getElementById('prizeGrid');
        if (!container) return;
        
        if (prizes.length === 0) {
            container.innerHTML = '<div class="no-prizes-message" style="text-align:center;padding:40px;">暂无奖品</div>';
            return;
        }
        
        const defaultIcons = ['🍰', '📓', '👜', '✏️', '☕', '🎁', '📦', '🎯'];
        
        container.innerHTML = prizes.map((prize, index) => {
            const icon = defaultIcons[index % defaultIcons.length];
            const imgSrc = prize.imageData || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e1eff8' rx='20'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='%231e6d8f' font-size='40'%3E${encodeURIComponent(icon)}%3C/text%3E%3C/svg%3E`;
            const canExchange = currentPoints >= prize.points && prize.stock > 0;
            return `<div class="prize-card" data-id="${prize.id}">
                <div class="prize-img">
                    <img src="${imgSrc}" alt="${escapeHtml(prize.name)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23e1eff8\' rx=\'20\'/%3E%3Ctext x=\'50\' y=\'60\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'40\'%3E🎁%3C/text%3E%3C/svg%3E'">
                </div>
                <h4>${escapeHtml(prize.name)}</h4>
                <div class="points-badge">${prize.points} 积分</div>
                <p>库存 ${prize.stock}${prize.stock === 1 ? '张' : ''}</p>
                <button class="btn-primary exchange-btn" data-prize-id="${prize.id}" data-points="${prize.points}" ${canExchange ? '' : 'disabled'}>
                    ${prize.stock <= 0 ? '已售罄' : (currentPoints < prize.points ? '积分不足' : '兑换')}
                </button>
            </div>`;
        }).join('');
        
        // Bind exchange buttons
        container.querySelectorAll('.exchange-btn').forEach(btn => {
            if (btn.hasAttribute('data-bound')) return;
            btn.setAttribute('data-bound', 'true');
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const prizeId = parseInt(btn.getAttribute('data-prize-id'));
                const prizeName = btn.closest('.prize-card')?.querySelector('h4')?.innerText || '奖品';
                const points = parseInt(btn.getAttribute('data-points')) || 0;

                if (points > currentPoints) {
                    alert(`积分不足！您当前只有 ${currentPoints} 积分，需要 ${points} 积分。`);
                    return;
                }

                if (confirm(`确定要兑换 ${prizeName} 吗？需要 ${points} 积分。`)) {
                    try {
                        await studentApiCall('/prizes/exchange', 'POST', { prizeId: prizeId, quantity: 1 });
                        alert(`兑换成功！${prizeName}已兑换，请前往后勤中心领取。`);
                        initExchangePage();
                    } catch (error) {
                        alert(error.message);
                    }
                }
            });
        });
    } catch (error) {
        console.error('加载奖品失败:', error);
    }
}

// ==================== 公告通知页面功能 ====================
async function initNoticePage() {
    if (!document.querySelector('.notice-main-full')) return;

    try {
        const [annResult, noticeResult, locationResult] = await Promise.all([
            studentApiCall('/announcements', 'GET'),
            studentApiCall('/notices', 'GET'),
            studentApiCall('/location-notice', 'GET')
        ]);

        const announcements = annResult.data || [];
        const notices = noticeResult.data || [];
        const locationNotice = locationResult.data;

        // 将 locationNotice 也加入到 noticeList 中显示为"领取须知"
        const allNotices = [...notices];
        if (locationNotice && locationNotice.id) {
            allNotices.unshift({
                id: locationNotice.id,
                title: locationNotice.notice || '领取须知',
                content: `领取地点：${locationNotice.location || '-'}\n发布人：${locationNotice.publisher || '-'}\n发布时间：${formatDate(locationNotice.publishTime)}`,
                publishTime: locationNotice.publishTime,
                isLocationNotice: true
            });
        }

        const renderList = (containerId, data, type) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            if (data.length === 0) {
                container.innerHTML = '<div class="list-item" style="justify-content: center;">暂无数据</div>';
                return;
            }
            let html = '';
            data.forEach((item, index) => {
                html += `<div class="list-item" data-type="${type}" data-index="${index}">
                    <span class="list-title">${item.title}</span>
                    <span class="list-date">${formatDate(item.publishTime || item.createTime)}</span>
                </div>`;
            });
            container.innerHTML = html;
            
            document.querySelectorAll(`#${containerId} .list-item`).forEach(item => {
                item.addEventListener('click', () => {
                    document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    const idx = parseInt(item.getAttribute('data-index'));
                    // 根据类型选择正确的数据数组
                    const dataArray = type === 'announcement' ? announcements : allNotices;
                    const d = dataArray[idx];
                    if (d) {
                        document.getElementById('detailTitle').innerText = d.title;
                        document.getElementById('detailDate').innerText = formatDate(d.publishTime || d.createTime);
                        document.getElementById('detailContent').innerHTML = (d.content || '').replace(/\n/g, '<br>');
                    }
                });
            });
        };

        renderList('announcementList', announcements, 'announcement');
        renderList('noticeList', allNotices, 'notice');

        if (document.getElementById('announcementCount')) {
            document.getElementById('announcementCount').innerText = announcements.length;
        }
        if (document.getElementById('noticeCount')) {
            document.getElementById('noticeCount').innerText = allNotices.length;
        }

        // Stock warnings
        try {
            const booksResult = await studentApiCall('/books', 'GET');
            const lowStockBooks = (booksResult.data || []).filter(b => b.stock <= 3);
            const warningCount = document.getElementById('stockWarningCount');
            const warningList = document.getElementById('stockWarningList');
            if (warningCount) warningCount.innerText = lowStockBooks.length;
            if (warningList) {
                if (lowStockBooks.length === 0) {
                    warningList.innerHTML = '<div class="list-item" style="justify-content: center;">暂无库存预警</div>';
                } else {
                    warningList.innerHTML = lowStockBooks.map(b => 
                        `<div class="stock-item">
                            <span class="stock-name">${escapeHtml(b.name)}</span>
                            <span class="stock-status ${b.stock === 0 ? 'out' : 'low'}">${b.stock === 0 ? '已缺货' : `库存不足 (仅剩${b.stock}本)`}</span>
                        </div>`
                    ).join('');
                }
            }
        } catch (e) {}

    } catch (error) {
        console.error('加载通知信息失败:', error);
    }
}

// ==================== 个人信息页面功能 ====================
async function initProfilePage() {
    if (!document.querySelector('.profile-main')) return;
    
    try {
        // Load profile info and points
        const [profileResult, pointsResult] = await Promise.all([
            studentApiCall('/profile', 'GET'),
            studentApiCall('/points', 'GET')
        ]);
        
        const profile = profileResult.data || {};
        const pointsData = pointsResult.data || {};
        
        // 保存到全局变量，供弹窗使用
        window.currentProfile = profile;
        
        // Fill profile fields (display only - span elements)
        const fields = ['displayName', 'displayCollege', 'displayMajor', 'displayClass', 'displayYear', 'displayPhone'];
        const values = [profile.name, profile.college, profile.major, profile.className, profile.entryYear ? profile.entryYear + '年' : '-', profile.phone];
        fields.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) el.innerText = values[i] || '-';
        });
        
        // Fill username separately (not editable)
        const usernameEl = document.getElementById('profileUsername');
        if (usernameEl) usernameEl.innerText = profile.username || '-';
        
        // Fill modal fields
        const modalFields = ['profileName', 'profileCollege', 'profileMajor', 'profileClass', 'profilePhone'];
        const modalValues = [profile.name, profile.college, profile.major, profile.className, profile.phone];
        modalFields.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) el.value = modalValues[i] || '';
        });
        
        // Fill stats
        if (document.getElementById('totalPoints')) {
            document.getElementById('totalPoints').innerText = pointsData.points || 0;
        }
        
        const recycles = pointsData.recycles || [];
        const exchanges = pointsData.exchanges || [];
        const completedRecycles = recycles.filter(r => r.status === 'LISTED' || r.status === 'SYNCED');
        const completedExchanges = exchanges.filter(e => e.status === 'COMPLETED');
        
        if (document.getElementById('recycleCount')) {
            document.getElementById('recycleCount').innerText = completedRecycles.length;
        }
        if (document.getElementById('exchangeBookCount')) {
            document.getElementById('exchangeBookCount').innerText = completedExchanges.filter(e => e.prizeName).length;
        }
        if (document.getElementById('exchangePrizeCount')) {
            document.getElementById('exchangePrizeCount').innerText = completedExchanges.length;
        }
    } catch (error) {
        console.error('加载个人信息失败:', error);
        alert('加载个人信息失败: ' + error.message);
    }
}

async function saveProfileInfo() {
    const profileData = {
        name: document.getElementById('profileName')?.value,
        college: document.getElementById('profileCollege')?.value,
        major: document.getElementById('profileMajor')?.value,
        className: document.getElementById('profileClass')?.value,
        phone: document.getElementById('profilePhone')?.value
    };
    
    try {
        const result = await studentApiCall('/profile', 'PUT', profileData);
        if (result.success) {
            alert('保存成功');
            Modal.close('infoModal');
            await initProfilePage();
        } else {
            alert(result.message || '保存失败');
        }
    } catch (error) {
        alert('保存失败: ' + error.message);
    }
}

function changePassword() {
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
    
    alert('密码修改功能开发中');
    Modal.close('pwdModal');
}

// ==================== 回收记录页面功能 ====================
async function initRecycleRecordsPage() {
    if (!document.querySelector('.recycle-records-main')) return;

    try {
        const [appointResult, exchangesResult, pointsResult] = await Promise.all([
            studentApiCall('/appointments', 'GET'),
            studentApiCall('/prizes', 'GET').then(r => ({ data: [] })),
            studentApiCall('/points', 'GET')
        ]);

        const appointments = appointResult.data || [];
        const exchanges = pointsResult.data?.exchanges || [];

        // Render appointment table
        const appointmentTbody = document.getElementById('appointmentTbody');
        if (appointmentTbody) {
            if (appointments.length === 0) {
                appointmentTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">暂无预约记录</td></tr>';
            } else {
                appointmentTbody.innerHTML = appointments.map(app => {
                    const statusMap = {
                        'PENDING': '<span class="status-badge pending">待审核</span>',
                        'APPROVED': '<span class="status-badge approved">已通过</span>',
                        'REJECTED': '<span class="status-badge completed">已拒绝</span>',
                        'COMPLETED': '<span class="status-badge completed">已完成</span>'
                    };
                    return `<tr data-status="${app.status}">
                        <td class="record-cover">
                            <img src="${app.coverImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='65' viewBox='0 0 50 65'%3E%3Crect width='50' height='65' fill='%23d0e2f2'/%3E%3Ctext x='25' y='35' text-anchor='middle' fill='%231e6d8f' font-size='10'%3E教材%3C/text%3E%3C/svg%3E"}" alt="封面" class="record-img" style="width:50px;height:65px;object-fit:cover;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'65\' viewBox=\'0 0 50 65\'%3E%3Crect width=\'50\' height=\'65\' fill=\'%23d0e2f2\'/%3E%3Ctext x=\'25\' y=\'35\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'10\'%3E教材%3C/text%3E%3C/svg%3E'">
                        </td>
                        <td>${escapeHtml(app.bookName)}</td>
                        <td>${app.condition || '-'}</td>
                        <td>${app.quantity}</td>
                        <td>${formatDate(app.submitTime)}</td>
                        <td>${statusMap[app.status] || app.status}</td>
                        <td>${app.status === 'COMPLETED' ? '+' + (app.points || 0) : '—'}</td>
                    </tr>`;
                }).join('');
            }
        }

        // Render exchange table
        const exchangeTbody = document.getElementById('exchangeTbody');
        if (exchangeTbody && exchanges.length > 0) {
            exchangeTbody.innerHTML = exchanges.map(ex => {
                const statusMap = {
                    'PENDING': '<span class="status-badge pending">待领取</span>',
                    'COMPLETED': '<span class="status-badge completed">已领取</span>'
                };
                return `<tr data-status="${ex.status}">
                    <td class="record-cover">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='65' viewBox='0 0 50 65'%3E%3Crect width='50' height='65' fill='%23e1d5e7'/%3E%3Ctext x='25' y='35' text-anchor='middle' fill='%231e6d8f' font-size='10'%3E奖品%3C/text%3E%3C/svg%3E" alt="奖品" class="record-img">
                    </td>
                    <td>${escapeHtml(ex.prizeName || '')}</td>
                    <td>奖品</td>
                    <td>${ex.quantity}</td>
                    <td>${formatDate(ex.exchangeTime)}</td>
                    <td>${statusMap[ex.status] || ex.status}</td>
                    <td>${ex.points}</td>
                </tr>`;
            }).join('');
        }

        const tabs = document.querySelectorAll('.records-tabs .tab-btn');
        const appointmentTab = document.getElementById('appointmentTab');
        const exchangeTab = document.getElementById('exchangeTab');

        tabs.forEach(tab => {
            if (tab.hasAttribute('data-tab-bound')) return;
            tab.setAttribute('data-tab-bound', 'true');
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                const target = this.getAttribute('data-tab');
                if (appointmentTab) appointmentTab.style.display = target === 'appointment' ? 'block' : 'none';
                if (exchangeTab) exchangeTab.style.display = target === 'exchange' ? 'block' : 'none';
            });
        });

        updateAppointmentStats();
        updateExchangeStats();

    } catch (error) {
        console.error('加载回收记录失败:', error);
    }
}

function updateAppointmentStats() {
    const tbody = document.getElementById('appointmentTbody');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    let pending = 0, completed = 0;
    rows.forEach(row => {
        const status = row.getAttribute('data-status');
        if (status === 'PENDING') pending++;
        else if (status === 'APPROVED' || status === 'COMPLETED') completed++;
    });
    const totalEl = document.getElementById('appointmentTotal');
    const pendingEl = document.getElementById('appointmentPending');
    const completedEl = document.getElementById('appointmentCompleted');
    if (totalEl) totalEl.innerText = rows.length;
    if (pendingEl) pendingEl.innerText = pending;
    if (completedEl) completedEl.innerText = completed;
}

function updateExchangeStats() {
    const tbody = document.getElementById('exchangeTbody');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    let pending = 0, completed = 0;
    rows.forEach(row => {
        const status = row.getAttribute('data-status');
        if (status === 'PENDING') pending++;
        else if (status === 'COMPLETED') completed++;
    });
    const totalEl = document.getElementById('exchangeTotal');
    const pendingEl = document.getElementById('exchangePending');
    const completedEl = document.getElementById('exchangeCompleted');
    if (totalEl) totalEl.innerText = rows.length;
    if (pendingEl) pendingEl.innerText = pending;
    if (completedEl) completedEl.innerText = completed;
}

// ==================== 导航栏用户信息 ====================
async function initNavUserInfo() {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) return;
        
        const [profileResult, pointsResult] = await Promise.all([
            studentApiCall('/profile', 'GET'),
            studentApiCall('/points', 'GET')
        ]);
        
        const profile = profileResult.data || {};
        const points = pointsResult.data?.points || 0;
        
        const nameEl = document.getElementById('navUserName');
        const pointsEl = document.getElementById('navUserPoints');
        
        if (nameEl) nameEl.innerText = profile.name || currentUser.name || '同学';
        if (pointsEl) pointsEl.innerText = points;
    } catch (error) {
        console.error('加载用户信息失败:', error);
    }
}

// ==================== 辅助函数 ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCurrentUser() {
    const userStr = sessionStorage.getItem('current_user');
    if (userStr) return JSON.parse(userStr);
    return null;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initNavUserInfo();
    initFilterButtons();
    initHomeRecycleForm();
    initPointsPage();
    initExchangePage();
    initNoticePage();
    initProfilePage();
    initRecycleRecordsPage();
    
    // 绑定兑换按钮事件（只绑定一次）
    document.addEventListener('click', (e) => {
        const exchangeBtn = e.target.closest('#exchangeBookBtn');
        if (!exchangeBtn || exchangeBtn.hasAttribute('data-exchange-bound')) return;
        exchangeBtn.setAttribute('data-exchange-bound', 'true');
        
        exchangeBtn.addEventListener('click', async () => {
            const bookId = parseInt(exchangeBtn.getAttribute('data-book-id'));
            const bookName = exchangeBtn.getAttribute('data-book-name');
            const bookPoints = parseInt(exchangeBtn.getAttribute('data-book-points'));
            const bookStock = parseInt(exchangeBtn.getAttribute('data-book-stock'));
            
            if (bookStock <= 0) {
                alert('库存不足！');
                return;
            }
            if (confirm(`确定要兑换《${bookName}》吗？需要 ${bookPoints} 积分。`)) {
                try {
                    await studentApiCall('/prizes/exchange', 'POST', { prizeId: bookId, quantity: 1 });
                    alert(`兑换成功！《${bookName}》已兑换，请前往教材管理中心领取。`);
                    Modal.close('bookModal');
                    loadBooks();
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    });
});
