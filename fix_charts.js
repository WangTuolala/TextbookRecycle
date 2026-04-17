const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/js/admin.js';
let c = fs.readFileSync(path, 'utf8');

const oldExchange = `const exchangeCanvas = document.getElementById('exchangeChart');
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
        }`;

const newExchange = `const exchangeCanvas = document.getElementById('exchangeChart');
        if (exchangeCanvas) {
            if (exchangeChartInstance) exchangeChartInstance.destroy();
            const ctx2 = exchangeCanvas.getContext('2d');
            exchangeChartInstance = new Chart(ctx2, {
                type: 'doughnut',
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
                    cutout: '55%',
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
        }`;

const oldPopular = `popularCanvas = document.getElementById('subjectChart');
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
        }`;

const newPopular = `popularCanvas = document.getElementById('subjectChart');
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
                                    return ' 评估量: ' + ctx.parsed.x + ' 本';
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
        }`;

if (c.includes(oldExchange)) {
    c = c.replace(oldExchange, newExchange);
    console.log('Replaced exchange chart');
} else {
    console.log('Exchange chart pattern not found');
}

if (c.includes(oldPopular)) {
    c = c.replace(oldPopular, newPopular);
    console.log('Replaced popular/bar chart');
} else {
    console.log('Popular chart pattern not found');
}

fs.writeFileSync(path, c, 'utf8');
console.log('done');
