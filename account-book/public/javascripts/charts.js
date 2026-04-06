// Chart.js 数据可视化

async function loadChartData() {
  try {
    const response = await fetch('/api/chart-data');
    const data = await response.json();
    renderTrendChart(data.monthlyTrend);
    renderCategoryChart(data.categoryData);
  } catch (error) {
    console.error('加载图表数据失败:', error);
  }
}

// 支出趋势折线图
function renderTrendChart(monthlyTrend) {
  const ctx = document.getElementById('trendChart');
  const wrapper = ctx?.closest('.chart-wrapper');

  if (!ctx) return;

  // 空数据时显示提示
  if (!monthlyTrend || monthlyTrend.length === 0) {
    if (wrapper) {
      wrapper.innerHTML = `
        <div class="chart-empty">
          <p>暂无支出数据</p>
          <span>添加账单后即可查看趋势</span>
        </div>
      `;
    }
    return;
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyTrend.map(item => item.month),
      datasets: [{
        label: '月支出',
        data: monthlyTrend.map(item => item.amount),
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#e74c3c',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: '支出趋势',
          font: { size: 16 }
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => '¥' + value.toFixed(0)
          }
        }
      }
    }
  });
}

// 分类占比环形图
function renderCategoryChart(categoryData) {
  const ctx = document.getElementById('categoryChart');
  const wrapper = ctx?.closest('.chart-wrapper');

  if (!ctx) return;

  // 空数据时显示提示
  if (!categoryData || categoryData.length === 0) {
    if (wrapper) {
      wrapper.innerHTML = `
        <div class="chart-empty">
          <p>暂无分类数据</p>
          <span>添加支出账单后即可查看分类统计</span>
        </div>
      `;
    }
    return;
  }

  const colors = [
    '#e74c3c', '#3498db', '#27ae60', '#f39c12',
    '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
  ];

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categoryData.map(item => item.category),
      datasets: [{
        data: categoryData.map(item => item.amount),
        backgroundColor: colors.slice(0, categoryData.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: '支出分类',
          font: { size: 16 }
        },
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ¥' + context.raw.toFixed(2);
            }
          }
        }
      }
    }
  });
}

// 页面加载完成后初始化图表
document.addEventListener('DOMContentLoaded', loadChartData);
