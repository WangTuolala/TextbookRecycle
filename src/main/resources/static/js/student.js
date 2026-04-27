const STUDENT_API = '/student';
let isExchanging = false;

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
        const isSoldOut = book.stock <= 0;
        const isDelisted = book.status === 'DELISTED';
        const isMajorDisabled = window.disabledMajors?.includes(book.major) && !isDelisted && !isSoldOut;
        const coverImg = book.coverImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='150' viewBox='0 0 120 150'%3E%3Crect width='120' height='150' fill='%23d0e2f2'/%3E%3Ctext x='60' y='70' text-anchor='middle' fill='%231e6d8f' font-size='14'%3E教材%3C/text%3E%3C/svg%3E";
        html += `<div class="book-card-full${isSoldOut || isDelisted || isMajorDisabled ? ' sold-out' : ''}" data-id="${book.id}" data-major-disabled="${isMajorDisabled ? 'true' : 'false'}">
            ${isDelisted ? '<div class="sold-out-overlay">已下架</div>' : (isSoldOut ? '<div class="sold-out-overlay">已售罄</div>' : (isMajorDisabled ? '<div class="sold-out-overlay">该专业已停止兑换</div>' : ''))}
            <div class="book-cover-full"><img src="${book.coverImage}" alt="${escapeHtml(book.name)}" class="book-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'150\' viewBox=\'0 0 120 150\'%3E%3Crect width=\'120\' height=\'150\' fill=\'%23d0e2f2\'/%3E%3Ctext x=\'60\' y=\'70\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'14\'%3E教材%3C/text%3E%3C/svg%3E'"></div>
            <div class="book-info-full">
                <h3>${escapeHtml(book.name)}</h3>
                <p>${escapeHtml(book.author || '')}</p>
                <div class="book-major">📚 ${escapeHtml(book.major || '通用')}</div>
                <div class="points-badge-full">${book.points} 积分</div>
                <div class="stock-full${isSoldOut || isDelisted || isMajorDisabled ? ' stock-out' : ''}">${isDelisted ? '已下架' : (isSoldOut ? '已售罄' : (isMajorDisabled ? '专业已停用' : '库存 ' + book.stock + ' 本'))}</div>
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
            if (card.classList.contains('sold-out')) return;
            const bookId = parseInt(card.getAttribute('data-id'));
            const book = window.currentBooks?.find(b => b.id === bookId);
            if (book) {
                updateBookModal(book);
                Modal.open('bookModal');
            }
        });
    });
}

function updateBookModal(book) {
    document.getElementById('modalBookTitle').innerText = book.name;
    document.getElementById('modalMajor').innerText = book.major || '通用';
    document.getElementById('modalBookName').innerText = book.name;
    document.getElementById('modalAuthor').innerText = book.author || '-';
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
    const isBookDelisted = book.status === 'DELISTED';
    const isBookSoldOut = book.stock <= 0;
    const isMajorDisabled = window.disabledMajors?.includes(book.major);
    exchangeBtn.setAttribute('data-book-id', book.id);
    exchangeBtn.setAttribute('data-book-stock', book.stock);
    exchangeBtn.setAttribute('data-book-points', book.points);
    exchangeBtn.setAttribute('data-book-name', book.name);
    
    // 根据上下架、库存、专业状态设置按钮状态
    if (isBookDelisted) {
        exchangeBtn.disabled = true;
        exchangeBtn.innerText = '已下架';
    } else if (isBookSoldOut) {
        exchangeBtn.disabled = true;
        exchangeBtn.innerText = '已售罄';
    } else if (isMajorDisabled) {
        exchangeBtn.disabled = true;
        exchangeBtn.innerText = '该专业已停止兑换';
    } else {
        exchangeBtn.disabled = false;
        exchangeBtn.innerText = '立即兑换';
    }

    // 数量输入框
    const quantityInput = document.getElementById('exchangeQuantity');
    if (quantityInput) {
        quantityInput.type = 'number';
        quantityInput.min = 1;
        quantityInput.max = Math.min(book.stock, 5);
        quantityInput.value = 1;
        quantityInput.disabled = isBookDelisted || isBookSoldOut || isMajorDisabled;
    }

    // 兑换按钮点击事件（用标记位避免重复绑定）
    if (exchangeBtn.hasAttribute('data-exchange-bound')) {
        return;
    }
    exchangeBtn.setAttribute('data-exchange-bound', 'true');
    exchangeBtn.addEventListener('click', () => {
        if (isExchanging) return;
        isExchanging = true;
        const bookId = parseInt(exchangeBtn.getAttribute('data-book-id'));
        const stock = parseInt(exchangeBtn.getAttribute('data-book-stock'));
        const qtyInput = document.getElementById('exchangeQuantity');
        const quantity = parseInt(qtyInput?.value) || 1;
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.id) {
            alert('请先登录');
            isExchanging = false;
            return;
        }
        if (quantity < 1 || quantity > stock) {
            alert('兑换数量超出库存范围');
            isExchanging = false;
            return;
        }
        studentApiCall('/books/exchange', 'POST', { bookId, quantity })
            .then(r => {
                isExchanging = false;
                if (r.success) {
                    alert('兑换成功！');
                    Modal.close('bookModal');
                    loadBooks();
                } else {
                    alert('兑换失败：' + (r.message || '库存不足或积分不够'));
                }
            })
            .catch(() => {
                isExchanging = false;
                alert('兑换失败，请重试');
            });
    });
}

// ==================== 专业下拉动态加载 ====================
async function loadMajors() {
    try {
        // 管理员修改专业状态后，sessionStorage 会设置 categories_updated 标记
        // 每次都从 API 获取最新数据，保证下拉框与管理员设置同步
        const statusData = (await studentApiCall('/majors-status', 'GET')).data || [];
        sessionStorage.removeItem('categories_updated');
        sessionStorage.setItem('student_majors_status_cache', JSON.stringify(statusData));
        // 同步更新 window.disabledMajors（供书籍卡片判断专业是否被禁用）
        window.disabledMajors = statusData
            .filter(m => m.status === 'INACTIVE')
            .map(m => m.name);
        // 只取 ACTIVE 的专业填下拉框
        const activeMajors = statusData
            .filter(m => m.status === 'ACTIVE')
            .map(m => m.name)
            .sort();
        const majorSelect = document.getElementById('majorFilter');
        if (!majorSelect) return;
        const currentValue = majorSelect.value;
        majorSelect.innerHTML = '<option value="all">全部专业</option>';
        activeMajors.forEach(major => {
            const opt = document.createElement('option');
            opt.value = major;
            opt.textContent = major;
            majorSelect.appendChild(opt);
        });
        if (currentValue && currentValue !== 'all') {
            majorSelect.value = currentValue;
        }
    } catch (e) {
        console.error('加载专业列表失败:', e);
    }
}

// ==================== 专业状态加载（禁用专业标记） ====================
async function loadMajorsStatus() {
    try {
        const lastUpdated = sessionStorage.getItem('categories_updated');
        const cached = sessionStorage.getItem('student_majors_status_cache');
        const data = (!lastUpdated && cached)
            ? JSON.parse(cached)
            : (await studentApiCall('/majors-status', 'GET')).data || [];
        if (lastUpdated) sessionStorage.removeItem('categories_updated');
        sessionStorage.setItem('student_majors_status_cache', JSON.stringify(data));
        window.disabledMajors = data
            .filter(m => m.status === 'INACTIVE')
            .map(m => m.name);
    } catch (e) {
        console.error('加载专业状态失败:', e);
        window.disabledMajors = [];
    }
}

// ==================== 筛选功能 ====================
function initFilterButtons() {
    const filterBtn = document.getElementById('filterBtn');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortFilter');
    
    const applyFilters = () => {
        loadBooks();
    };
    
    if (filterBtn) filterBtn.addEventListener('click', applyFilters);
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') applyFilters(); });
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);
    
    loadMajorsStatus();
    loadMajors();
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
    const ptsDisplay = document.getElementById('recyclePointsDisplay');
    if (ptsDisplay) ptsDisplay.innerText = '—';
}

// 积分规则映射（从后端积分规则页面获取）
window.recyclePointsRuleMap = { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };

window.updateRecyclePoints = function() {
    const condition = document.getElementById('condition')?.value;
    const pts = window.recyclePointsRuleMap?.[condition] || 0;
    const display = document.getElementById('recyclePointsDisplay');
    if (display) {
        if (condition) {
            display.innerText = pts + ' 积分（参考值，实际以评估为准）';
            display.style.color = '#1e6d8f';
            display.style.fontWeight = '600';
        } else {
            display.innerText = '—';
            display.style.color = '';
            display.style.fontWeight = '';
        }
    }
};

async function addHomeRecycleRecord(bookData) {
    try {
        const result = await studentApiCall('/appointments', 'POST', {
            bookName: bookData.bookName,
            author: bookData.author,
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

    const statusMap = {
        'PENDING': '<span class="status-badge pending">待审核</span>',
        'APPROVED': '<span class="status-badge approved">已通过</span>',
        'REJECTED': '<span class="status-badge" style="background:#dc3545;color:white;">已拒绝</span>',
        'COMPLETED': '<span class="status-badge completed">已完成</span>'
    };
    const coverImgSrc = appointment.coverImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='65' viewBox='0 0 50 65'%3E%3Crect width='50' height='65' fill='%23d0e2f2'/%3E%3Ctext x='25' y='35' text-anchor='middle' fill='%231e6d8f' font-size='10'%3E教材%3C/text%3E%3C/svg%3E";
    
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-status', appointment.status);
    newRow.innerHTML = `
        <td class="record-cover"><img src="${coverImgSrc}" alt="封面" class="record-img" style="width:50px;height:65px;object-fit:cover;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'65\' viewBox=\'0 0 50 65\'%3E%3Crect width=\'50\' height=\'65\' fill=\'%23d0e2f2\'/%3E%3Ctext x=\'25\' y=\'35\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'10\'%3E教材%3C/text%3E%3C/svg%3E'"></td>
        <td>${escapeHtml(appointment.bookName)}</td>
        <td>${appointment.condition || '-'}</td>
        <td>${appointment.quantity}</td>
        <td>${formatDate(appointment.submitTime)}</td>
        <td>${statusMap[appointment.status] || '<span class="status-badge pending">待审核</span>'}</td>
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
            const author = document.getElementById('author')?.value.trim();
            const isbn = document.getElementById('isbn')?.value.trim();
            const publisher = document.getElementById('publisher')?.value.trim();
            const condition = document.getElementById('condition')?.value;
            const quantity = document.getElementById('quantity')?.value || '1';
            
            if (!bookName) { alert('请填写教材名称'); return; }
            if (!author) { alert('请填写作者'); return; }
            if (!isbn) { alert('请填写ISBN'); return; }
            if (!publisher) { alert('请填写出版社'); return; }
            if (!condition) { alert('请选择品相预估'); return; }

            let coverImgSrc = '';
            const coverPreview = document.querySelector('#coverPreview img');
            if (coverPreview && coverPreview.src && !coverPreview.src.includes('封面图') && !coverPreview.src.includes('e1eff8')) {
                coverImgSrc = coverPreview.src;
            }
            if (!coverImgSrc) { alert('请上传教材封面图'); return; }

            const bookData = {
                bookName, author, isbn, publisher, condition,
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
        // 加载积分规则
        loadRecyclePointsRule();
    }
}

async function loadRecyclePointsRule() {
    try {
        const result = await apiCall('/api/admin/points-rule', 'GET');
        const rule = result.data || {};
        window.recyclePointsRuleMap = {
            '全新': rule.ruleNew || 200,
            '良好': rule.ruleGood || 150,
            '一般': rule.ruleNormal || 80,
            '陈旧': rule.ruleOld || 40
        };
    } catch (e) {
        window.recyclePointsRuleMap = { '全新': 200, '良好': 150, '一般': 80, '陈旧': 40 };
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
                    const typeMap = {
                        'RECYCLE': '回收得积分',
                        'EXCHANGE': '兑换消费',
                        'EVALUATE': '评估得积分',
                        'SYNC': '积分同步'
                    };
                    const pointsClass = item.points > 0 ? 'points-income' : 'points-expense';
                    const categoryClass = item.category === 'BOOK' ? 'category-badge book' : 'category-badge prize';
                    const categoryIcon = item.category === 'BOOK' ? '📚' : '🎁';
                    const categoryName = item.category === 'BOOK' ? '教材' : '奖品';
                    html += `<tr>
                        <td>${formatDate(item.createTime)}</td>
                        <td>${typeMap[item.type] || item.type || '-'}</td>
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
                        const typeMap = {
                            'RECYCLE': '回收得积分',
                            'EXCHANGE': '兑换消费',
                            'EVALUATE': '评估得积分',
                            'SYNC': '积分同步'
                        };
                        const pointsClass = item.points > 0 ? 'points-income' : 'points-expense';
                        const categoryClass = item.category === 'BOOK' ? 'category-badge book' : 'category-badge prize';
                        const categoryIcon = item.category === 'BOOK' ? '📚' : '🎁';
                        const categoryName = item.category === 'BOOK' ? '教材' : '奖品';
                        html += `<tr>
                            <td>${formatDate(item.createTime)}</td>
                            <td>${typeMap[item.type] || item.type || '-'}</td>
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
        
        // 缓存奖品数据供弹窗使用
        window.allPrizes = prizes;
        window.currentStudentPoints = currentPoints;

        // Bind exchange buttons
        container.querySelectorAll('.exchange-btn').forEach(btn => {
            if (btn.hasAttribute('data-bound')) return;
            btn.setAttribute('data-bound', 'true');
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const prizeId = parseInt(btn.getAttribute('data-prize-id'));
                const prize = (window.allPrizes || []).find(p => p.id === prizeId);
                if (!prize) return;
                openPrizeExchangeModal(prize, window.currentStudentPoints);
            });
        });

        // 兑换弹窗数量变化时更新总计
        const qtyInput = document.getElementById('prizeExchangeQuantity');
        if (qtyInput) {
            qtyInput.addEventListener('input', updatePrizeExchangeTotal);
        }
    } catch (error) {
        console.error('加载奖品失败:', error);
    }
}

function openPrizeExchangeModal(prize, currentPoints) {
    const defaultIcons = ['🍰', '📓', '👜', '✏️', '☕', '🎁', '📦', '🎯'];
    const prizeIndex = (window.allPrizes || []).indexOf(prize);
    const icon = defaultIcons[prizeIndex % defaultIcons.length];
    const imgSrc = prize.imageData || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23e1eff8' rx='12'/%3E%3Ctext x='40' y='50' text-anchor='middle' fill='%231e6d8f' font-size='36'%3E${encodeURIComponent(icon)}%3C/text%3E%3C/svg%3E`;

    document.getElementById('prizeExchangeImg').innerHTML = `<img src="${imgSrc}" alt="${escapeHtml(prize.name)}">`;
    document.getElementById('prizeExchangeName').innerText = prize.name;
    document.getElementById('prizeExchangePoints').innerText = prize.points + ' 积分/个';
    document.getElementById('prizeExchangeStock').innerText = '库存 ' + prize.stock + ' 个';

    const maxQty = Math.min(prize.stock, Math.floor(currentPoints / prize.points), 10);
    const qtyInput = document.getElementById('prizeExchangeQuantity');
    qtyInput.value = 1;
    qtyInput.min = 1;
    qtyInput.max = maxQty > 0 ? maxQty : 1;

    const confirmBtn = document.getElementById('prizeExchangeConfirmBtn');
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.onclick = async () => {
        const qty = parseInt(qtyInput.value) || 1;
        if (qty < 1 || qty > prize.stock) {
            alert('兑换数量超出库存范围');
            return;
        }
        const totalCost = prize.points * qty;
        if (totalCost > currentPoints) {
            alert('积分不足，当前积分 ' + currentPoints + '，需要 ' + totalCost);
            return;
        }
        if (!confirm('确认兑换 ' + prize.name + ' x' + qty + ' 个，共 ' + totalCost + ' 积分？')) return;
        try {
            await studentApiCall('/prizes/exchange', 'POST', { prizeId: prize.id, quantity: qty });
            alert('兑换成功！' + prize.name + '已兑换，请前往后勤中心领取。');
            Modal.close('prizeExchangeModal');
            initExchangePage();
        } catch (error) {
            alert(error.message || '兑换失败');
        }
    };

    updatePrizeExchangeTotal();
    Modal.open('prizeExchangeModal');
}

function updatePrizeExchangeTotal() {
    const qtyInput = document.getElementById('prizeExchangeQuantity');
    const prizeName = document.getElementById('prizeExchangeName')?.innerText || '';
    const totalEl = document.getElementById('prizeExchangeTotal');
    if (!qtyInput || !totalEl) return;
    const qty = parseInt(qtyInput.value) || 0;
    const prize = (window.allPrizes || []).find(p => p.name === prizeName);
    if (prize && qty > 0) {
        totalEl.innerText = '合计：' + (prize.points * qty) + ' 积分';
    } else {
        totalEl.innerText = '';
    }
}

// ==================== 公告通知页面功能 ====================
let previousAnnouncementCount = 0;
let previousNoticeCount = 0;
let previousAnnouncementIds = [];
let previousNoticeIds = [];

async function initNoticePage() {
    if (!document.querySelector('.notice-main-full')) return;

    try {
        const [annResult, noticeResult, adminLocationResult, logisticsLocationResult, locationReadResult] = await Promise.all([
            studentApiCall('/announcements', 'GET'),
            studentApiCall('/notices', 'GET'),
            studentApiCall('/location-notice/admin', 'GET'),
            studentApiCall('/location-notice/logistics', 'GET'),
            studentApiCall('/location-notice/read-ids', 'GET')
        ]);

        const announcements = annResult.data?.announcements || [];
        const readAnnouncementIds = annResult.data?.readIds || [];
        const notices = noticeResult.data || [];
        const adminLocation = adminLocationResult.data;
        const logisticsLocation = logisticsLocationResult.data;
        const readLocationNoticeIds = locationReadResult.data || [];

        // 构建领取须知列表（附带真实 ID 用于已读状态）
        const allNotices = [];
        
        if (adminLocation && adminLocation.id) {
            allNotices.push({
                id: 'admin-location',
                realId: adminLocation.id,     // 真实的 location_notice 表 ID
                title: '【管理员】领取须知',
                location: adminLocation.location || '-',
                notice: adminLocation.notice || '-',
                publisher: adminLocation.publisher || '-',
                publishTime: adminLocation.publishTime,
                publisherRole: 'ADMIN',
                isLocationNotice: true
            });
        }
        
        if (logisticsLocation && logisticsLocation.id) {
            allNotices.push({
                id: 'logistics-location',
                realId: logisticsLocation.id,  // 真实的 location_notice 表 ID
                title: '【后勤】领取须知',
                location: logisticsLocation.location || '-',
                notice: logisticsLocation.notice || '-',
                publisher: logisticsLocation.publisher || '-',
                publishTime: logisticsLocation.publishTime,
                publisherRole: 'LOGISTICS',
                isLocationNotice: true
            });
        }

        // 检查是否有新公告（弹出提醒）
        const currentAnnouncementIds = announcements.map(a => a.id);
        const currentNoticeIds = allNotices.map(n => n.id);
        
        if (previousAnnouncementIds.length > 0) {
            const newAnnouncements = announcements.filter(a => !previousAnnouncementIds.includes(a.id));
            if (newAnnouncements.length > 0) {
                showNewAnnouncementPopup(newAnnouncements[0]);
            }
        }
        
        previousAnnouncementIds = currentAnnouncementIds;
        previousNoticeIds = currentNoticeIds;

        const renderAnnouncementList = () => {
            const container = document.getElementById('announcementList');
            if (!container) return;
            if (announcements.length === 0) {
                container.innerHTML = '<div class="list-item" style="justify-content: center;">暂无数据</div>';
                return;
            }
            let html = '';
            announcements.forEach((item) => {
                const isRead = readAnnouncementIds.includes(item.id);
                html += `<div class="list-item ${isRead ? '' : 'unread'}" data-type="announcement" data-id="${item.id}">
                    <span class="list-title">${!isRead ? '<span class="unread-dot"></span>' : ''}${escapeHtml(item.title || '')}</span>
                    <span class="list-date">${formatDate(item.publishTime)}</span>
                </div>`;
            });
            container.innerHTML = html;
            
            container.querySelectorAll('.list-item').forEach(item => {
                item.addEventListener('click', () => {
                    document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    // 标记为已读（移除未读样式）
                    item.classList.remove('unread');
                    const dot = item.querySelector('.unread-dot');
                    if (dot) dot.remove();
                    const id = parseInt(item.getAttribute('data-id'));
                    const d = announcements.find(a => a.id === id);
                    const type = item.getAttribute('data-type');
                    if (d) {
                        document.getElementById('detailTitle').innerText = '公告详情';
                        document.getElementById('detailDate').innerText = formatDate(d.publishTime);
                        document.getElementById('detailContent').innerHTML = `
                            <div class="detail-announcement-title">${escapeHtml(d.title || '')}</div>
                            <div class="detail-meta">发布人：${escapeHtml(d.publisher || '-')} &nbsp;&nbsp;发布时间：${formatDate(d.publishTime)}</div>
                            <div class="detail-body">${(d.content || '').replace(/\n/g, '<br>')}</div>
                        `;
                        // 调用标记已读接口
                        if (type === 'announcement') {
                            studentApiCall(`/announcements/${id}/read`, 'POST');
                        }
                    }
                });
            });
        };

        const renderNoticeList = () => {
            const container = document.getElementById('noticeList');
            if (!container) return;
            if (allNotices.length === 0) {
                container.innerHTML = '<div class="list-item" style="justify-content: center;">暂无数据</div>';
                return;
            }
            let html = '';
            allNotices.forEach((item) => {
                const isRead = readLocationNoticeIds.includes(item.realId);
                html += `<div class="list-item ${isRead ? '' : 'unread'}" data-type="location-notice" data-id="${item.id}" data-notice-id="${item.realId}">
                    <span class="list-title">${!isRead ? '<span class="unread-dot"></span>' : ''}${escapeHtml(item.title || '')}</span>
                    <span class="list-date">${formatDate(item.publishTime)}</span>
                </div>`;
            });
            container.innerHTML = html;
            
            container.querySelectorAll('.list-item').forEach(item => {
                item.addEventListener('click', () => {
                    document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    item.classList.remove('unread');
                    const dot = item.querySelector('.unread-dot');
                    if (dot) dot.remove();
                    const d = allNotices.find(n => n.id === item.getAttribute('data-id'));
                    if (d) {
                        document.getElementById('detailTitle').innerText = '公告详情';
                        document.getElementById('detailDate').innerText = formatDate(d.publishTime);
                        document.getElementById('detailContent').innerHTML = `
                            <div class="detail-announcement-title">${escapeHtml(d.title || '')}</div>
                            <div class="detail-meta">发布人：${escapeHtml(d.publisher || '-')} &nbsp;&nbsp;发布时间：${formatDate(d.publishTime)}</div>
                            <div class="detail-body">
                                <p><strong>领取地点：</strong>${escapeHtml(d.location || '-')}</p>
                                <p><strong>注意事项：</strong>${(d.notice || '-').replace(/\n/g, '<br>')}</p>
                            </div>
                        `;
                        const noticeId = item.getAttribute('data-notice-id');
                        if (noticeId) studentApiCall(`/location-notice/${noticeId}/read`, 'POST');
                    }
                });
            });
        };

        renderAnnouncementList();
        renderNoticeList();

        if (document.getElementById('announcementCount')) {
            document.getElementById('announcementCount').innerText = announcements.length;
        }
        if (document.getElementById('noticeCount')) {
            document.getElementById('noticeCount').innerText = allNotices.length;
        }

        // 库存预警（与管理员数据总览一致）
        try {
            const [booksResult, appointmentsResult] = await Promise.all([
                studentApiCall('/books', 'GET'),
                studentApiCall('/appointments', 'GET')
            ]);

            // 卡片1：即将缺货（仅展示库存 ≤3 的书籍）
            const lowStockBooks = (booksResult.data || []).filter(b => b.stock <= 10);
            const lowStockList = document.getElementById('lowStockList');
            if (lowStockList) {
                if (lowStockBooks.length === 0) {
                    lowStockList.innerHTML = '<div class="warning-item"><span class="warning-book">暂无数据</span></div>';
                } else {
                    lowStockList.innerHTML = lowStockBooks.map(b =>
                        `<div class="warning-item">
                            <span class="warning-book">${escapeHtml(b.name)}</span>
                            <span class="stock-status ${b.stock === 0 ? 'out' : 'low'}">${b.stock === 0 ? '已缺货' : `仅剩${b.stock}本`}</span>
                        </div>`
                    ).join('');
                }
            }
        } catch (e) {}

    } catch (error) {
        console.error('加载通知信息失败:', error);
    }
}

// 新公告弹窗提醒
function showNewAnnouncementPopup(announcement) {
    const popup = document.createElement('div');
    popup.className = 'announcement-popup';
    popup.innerHTML = `
        <div class="popup-header">📢 新公告</div>
        <div class="popup-body">
            <div class="popup-title">${escapeHtml(announcement.title || '')}</div>
            <div class="popup-content">${(announcement.content || '').substring(0, 100)}${(announcement.content || '').length > 100 ? '...' : ''}</div>
        </div>
        <button class="popup-close" onclick="this.parentElement.remove()">×</button>
    `;
    popup.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(popup);
    
    // 5秒后自动消失
    setTimeout(() => {
        if (popup.parentElement) popup.remove();
    }, 5000);
}

// 轮询检查新公告（每30秒）
setInterval(() => {
    if (document.querySelector('.notice-main-full')) {
        initNoticePage();
    }
}, 30000);

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
        const fields = ['displayName', 'displayCollege', 'displayMajor', 'displayClass', 'displayPhone'];
        const values = [profile.name, profile.college, profile.major, profile.className, profile.phone];
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
    
    studentApiCall('/password', 'PUT', { oldPassword: oldPwd, newPassword: newPwd })
        .then(result => {
            alert('密码修改成功');
            Modal.close('pwdModal');
        })
        .catch(error => {
            alert(error.message || '密码修改失败');
        });
}

// ==================== 回收记录页面功能 ====================
async function initRecycleRecordsPage() {
    if (!document.querySelector('.recycle-records-main')) return;

    try {
        const [appointResult, exchangesResult, pointsResult] = await Promise.all([
            studentApiCall('/appointments', 'GET'),
            studentApiCall('/exchanges', 'GET'),
            studentApiCall('/points', 'GET')
        ]);

        const appointments = appointResult.data || [];
        const bookExchanges = exchangesResult.data?.bookExchanges || [];
        const prizeExchanges = exchangesResult.data?.prizeExchanges || [];

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
                        <td>${app.status === 'REJECTED' ? '—' : '<span class="points-earned">+' + ((window.recyclePointsRuleMap?.[app.condition] || 0) * (app.quantity || 1)) + '</span>'}</td>
                    </tr>`;
                }).join('');
            }
        }

        // 合并奖品兑换和教材兑换（只显示后勤/管理员已确认的记录）
        const allExchanges = [
            ...prizeExchanges.map(ex => ({ ...ex, _type: 'prize' })),
            ...bookExchanges.map(ex => ({ ...ex, _type: 'book' }))
        ].sort((a, b) => {
            const timeA = a.exchangeTime || a.evaluateTime || '';
            const timeB = b.exchangeTime || b.evaluateTime || '';
            return timeB.localeCompare(timeA);
        });

        const exchangeTbody = document.getElementById('exchangeTbody');
        if (exchangeTbody) {
            if (allExchanges.length === 0) {
                exchangeTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">暂无兑换记录</td></tr>';
            } else {
                exchangeTbody.innerHTML = allExchanges.map(ex => {
                    const isBook = ex._type === 'book';
                    const statusMap = {
                        'PENDING': '<span class="status-badge pending">待领取</span>',
                        'COMPLETED': '<span class="status-badge completed">已领取</span>',
                        'LISTED': '<span class="status-badge listed">已上架</span>',
                        'SYNCED': '<span class="status-badge approved">已同步</span>',
                        'APPROVED': '<span class="status-badge approved">已通过</span>',
                        'DELISTED': '<span class="status-badge delisted">已下架</span>'
                    };
                    const name = isBook ? (ex.bookName || '-') : (ex.prizeName || '-');
                    const qty = ex.quantity || 1;
                    const pts = isBook ? (ex.points || 0) : (ex.points || 0);
                    const time = formatDate(isBook ? (ex.evaluateTime || ex.submitTime) : ex.exchangeTime);
                    const img = isBook
                        ? (ex.coverImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='65' viewBox='0 0 50 65'%3E%3Crect width='50' height='65' fill='%23d0e2f2'/%3E%3Ctext x='25' y='35' text-anchor='middle' fill='%231e6d8f' font-size='10'%3E教材%3C/text%3E%3C/svg%3E")
                        : ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='65' viewBox='0 0 50 65'%3E%3Crect width='50' height='65' fill='%23e1d5e7'/%3E%3Ctext x='25' y='35' text-anchor='middle' fill='%231e6d8f' font-size='10'%3E奖品%3C/text%3E%3C/svg%3E");
                    return `<tr data-status="${ex.status}">
                        <td class="record-cover">
                            <img src="${img}" alt="" class="record-img" style="width:50px;height:65px;object-fit:cover;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'50\' height=\'65\' viewBox=\'0 0 50 65\'%3E%3Crect width=\'50\' height=\'65\' fill=\'%23e1d5e7\'/%3E%3Ctext x=\'25\' y=\'35\' text-anchor=\'middle\' fill=\'%231e6d8f\' font-size=\'10\'%3E奖品%3C/text%3E%3C/svg%3E'">
                        </td>
                        <td>${escapeHtml(name)}</td>
                        <td>${isBook ? '<span class="type-tag type-book">教材</span>' : '<span class="type-tag type-prize">奖品</span>'}</td>
                        <td>${qty}</td>
                        <td>${time}</td>
                        <td>${statusMap[ex.status] || ex.status}</td>
                        <td>${pts}</td>
                    </tr>`;
                }).join('');
            }
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
    // 只统计有 data-status 属性的真实数据行，排除无数据提示行
    const rows = Array.from(tbody.querySelectorAll('tr[data-status]'));
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
            const quantitySelect = document.getElementById('exchangeQuantity');
            const quantity = parseInt(quantitySelect?.value || '1');
            
            if (bookStock <= 0) {
                alert('库存不足！');
                return;
            }
            const totalPoints = bookPoints * quantity;
            if (confirm(`确定要兑换《${bookName}》× ${quantity} 本吗？需要 ${totalPoints} 积分。`)) {
                try {
                    await studentApiCall('/books/exchange', 'POST', { bookId: bookId, quantity: quantity });
                    alert(`兑换成功！《${bookName}》× ${quantity} 本已兑换，请前往教材管理中心领取。`);
                    Modal.close('bookModal');
                    loadBooks();
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    });
});
