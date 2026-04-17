const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

const marker = "// ==================== 初始化 ====================\ndocument.addEventListener('DOMContentLoaded', () => {";

const newFuncs = `
// ==================== 公共初始化 ====================
async function initNavUserInfo() {
    if (!document.querySelector('.admin-main') && !document.querySelector('.admin-notice-main') &&
        !document.querySelector('.book-mgmt-main') && !document.querySelector('.rule-page') &&
        !document.querySelector('.admin-profile-main') && !document.querySelector('.evaluate-page')) return;
    try {
        const result = await adminApiCall('/profile', 'GET');
        const user = result.data;
        window.currentAdminName = user?.name || user?.username || '管理员';
        const nameEl = document.getElementById('adminUserName');
        if (nameEl) nameEl.innerHTML = '&#128100; ' + window.currentAdminName;
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
        const books = result.data?.lowStockBooks || [];
        const container = document.getElementById('lowStockList');
        if (!container) return;
        if (books.length === 0) {
            container.innerHTML = '<div class="warning-item"><span class="warning-book">暂无库存预警</span></div>';
            return;
        }
        container.innerHTML = books.map(book =>
            '<div class="warning-item">' +
            '<span class="warning-book">' + (book.name||'-').replace(/</g,'&lt;') + '（库存:' + book.stock + '）</span>' +
            '</div>'
        ).join('');
    } catch (error) {
        console.error('加载库存预警失败', error);
    }
}

let recycleChartInstance = null;
let exchangeChartInstance = null;
let popularChartInstance = null;

async function loadChartData() {
    try {
        const result = await adminApiCall('/chart-stats', 'GET');
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
                        backgroundColor: ['#4a90d9','#50c875','#f5a623','#e74c3c','#9b59b6','#1abc9c']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }

        // 热门教材横向柱状图
        const popularCanvas = document.getElementById('popularBooksChart');
        if (popularCanvas) {
            if (popularChartInstance) popularChartInstance.destroy();
            const ctx3 = popularCanvas.getContext('2d');
            popularChartInstance = new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: (data.popularLabels || []).map(l => l.length > 8 ? l.slice(0,8)+'…' : l),
                    datasets: [{
                        label: '评估量',
                        data: data.popularData || [],
                        backgroundColor: '#50c875'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
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

async function loadCategories() {
    try {
        const result = await adminApiCall('/categories', 'GET');
        window.allCategories = result.data || [];
        renderCategoryTable();
    } catch (error) {
        console.error('加载分类失败', error);
    }
}

function renderCategoryTable() {
    const tbody = document.getElementById('categoryTbody');
    if (!tbody) return;
    const cats = window.allCategories || [];
    if (cats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:40px;">暂无分类数据</td></tr>';
        return;
    }
    tbody.innerHTML = cats.map(cat => '<tr>' +
        '<td>' + (cat.id||'-') + '</td>' +
        '<td>' + (cat.name||'-').replace(/</g,'&lt;') + '</td>' +
        '<td>' + (cat.description||'-').replace(/</g,'&lt;') + '</td></tr>'
    ).join('');
}

function bindCategoryEvents() {
    // handled by inline onclick
}

`;

if (c.includes(marker)) {
    c = c.replace(marker, newFuncs + '\n' + marker);
    console.log('Inserted missing functions before init block');
} else {
    console.log('Marker not found, appending');
    c = c + '\n' + newFuncs;
}

fs.writeFileSync(path, c, 'utf8');
console.log('done, new size:', c.length);
