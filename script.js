// 頁面載入時檢查是否有已保存的分析結果
window.addEventListener('load', function() {
  const savedResult = localStorage.getItem('analysisResult');
  if (savedResult) {
    document.getElementById('initial-view').classList.add('hidden');
    document.getElementById('result-view').classList.remove('hidden');
    document.getElementById('result').innerHTML = savedResult;
    
    // 從 localStorage 獲取分析數據
    const savedData = JSON.parse(localStorage.getItem('analysisData') || '{}');
    if (savedData.monthlyData && savedData.breakdown) {
      // 恢復原始數據，以便日期變更時重新分析
      if (savedData.originalData) {
        window.originalData = savedData.originalData;
      }
      
      // 恢復allExpenses數據，用於分類支出佔比圖
      if (savedData.allExpenses) {
        window.allExpenses = savedData.allExpenses;
      }
      
      // 重新初始化圖表
      initializeCharts(savedData.monthlyData, savedData.breakdown);
      
      // 重新初始化時段分析圖表
      if (savedData.timePeriodData) {
        initializeTimePeriodCharts(savedData.timePeriodData);
      }
      
      // 設置數據日期
      const startDate = savedData.startDate || '';
      const endDate = savedData.endDate || '';
      
      if (startDate || endDate) {
        if (startDate) {
          document.getElementById('startDatePicker').value = startDate;
        }
        if (endDate) {
          document.getElementById('endDatePicker').value = endDate;
        }
        
        // 更新頂部的數據日期顯示
        const headerHTML = `
          <div class="flex items-center gap-2">
            <div class="logo-text text-2xl cursor-pointer" onclick="window.location.href='index.html'">
              <span class="text-primary">MPAY</span>
              <span class="logo-dot"></span>
              <span class="text-gray-700">WORK</span>
            </div>
            <span class="text-gray-300 mx-3">|</span>
            <span class="slogan text-gray-500 text-sm">智能收支・輕鬆管理</span>
            <span class="text-gray-300 mx-3">|</span>
            <span class="text-gray-500 text-sm">數據日期範圍: <span id="currentDataDate" class="text-primary">${getDateRangeText(startDate, endDate)}</span></span>
          </div>
          <div class="flex items-center gap-4">
            <button 
              onclick="resetView()"
              class="px-4 py-2 text-sm text-primary border border-primary/20 rounded-full hover:bg-primary/5 transition-colors">
              重新上傳
            </button>
            <h1 class="text-lg font-medium text-gray-600">支出分析報表</h1>
          </div>
        `;
        
        // 更新頂部區域
        const headerContainer = document.querySelector('#result-view .container > div:first-child');
        if (headerContainer) {
          headerContainer.innerHTML = headerHTML;
        }
      } else {
        // 如果沒有保存日期範圍，設置為當天
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('startDatePicker').value = today;
        document.getElementById('endDatePicker').value = today;
      }
      
      // 添加數據日期更新事件
      document.getElementById('updateDataDateBtn').addEventListener('click', updateDataDateAnalysis);
    }
    
    // 設置表格篩選功能
    setupTableFilter();
    
    // 確保月度分析內容預設為收起狀態
    const content = document.getElementById('monthlyAnalysisContent');
    const button = document.getElementById('toggleMonthlyBtn');
    if (content && button) {
      content.style.display = 'none';
      content.style.maxHeight = '0';
      button.textContent = '展開 ▼';
    }
    
    // 確保圖表內容預設為展開狀態
    const chartsContent = document.getElementById('chartsContent');
    const chartsButton = document.getElementById('toggleChartsBtn');
    if (chartsContent && chartsButton) {
      chartsContent.style.display = 'block';
      chartsContent.style.maxHeight = chartsContent.scrollHeight + 'px';
      chartsContent.style.opacity = '1';
      chartsButton.textContent = '收起 ▲';
    }

    // 確保商戶明細內容預設為收起狀態
    const merchantContent = document.getElementById('merchantDetailsContent');
    const merchantButton = document.getElementById('toggleMerchantBtn');
    if (merchantContent && merchantButton) {
      merchantContent.style.display = 'none';
      merchantContent.style.maxHeight = '0';
      merchantContent.style.opacity = '0';
      merchantButton.textContent = '展開 ▼';
    }
    
    // 確保時段分析內容預設為展開狀態
    const timeContent = document.getElementById('timeAnalysisContent');
    const timeButton = document.getElementById('toggleTimeBtn');
    if (timeContent && timeButton) {
      timeContent.style.display = 'block';
      timeContent.style.maxHeight = timeContent.scrollHeight + 'px';
      timeContent.style.opacity = '1';
      timeButton.textContent = '收起 ▲';
    }
    
    // 確保所有支出明細內容預設為收起狀態
    const expenseContent = document.getElementById('expenseDetailsContent');
    const expenseButton = document.getElementById('toggleExpenseBtn');
    if (expenseContent && expenseButton) {
      expenseContent.style.display = 'none';
      expenseContent.style.maxHeight = '0';
      expenseContent.style.opacity = '0';
      expenseButton.textContent = '展開 ▼';
    }

    // 添加返回按钮功能
    setupBackToTopButton();
  }
});

// 當使用者選擇檔案時觸發
document.getElementById('fileInput').addEventListener('change', handleFile, false);

// 添加拖放功能
const dropArea = document.getElementById('drop-area');

// 监听整个文档的拖拽事件
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  document.body.addEventListener(eventName, preventDefaults, false);
});

// 当文件拖入文档时显示拖放区域
document.body.addEventListener('dragenter', function(e) {
  if (e.dataTransfer.types.includes('Files')) {
    dropArea.classList.remove('hidden');
    highlight();
  }
});

// 当文件拖离文档时隐藏拖放区域
document.body.addEventListener('dragleave', function(e) {
  // 只有当拖离的是整个文档时才隐藏
  if (e.currentTarget.contains(e.relatedTarget)) {
    return;
  }
  if (e.relatedTarget === null) {
    unhighlight();
    setTimeout(() => {
      dropArea.classList.add('hidden');
    }, 300); // 添加延迟，使过渡效果更平滑
  }
});

// 处理拖放区域的事件
dropArea.addEventListener('dragover', highlight, false);
dropArea.addEventListener('dragleave', unhighlight, false);
dropArea.addEventListener('drop', function(e) {
  handleDrop(e);
  // 放下文件后隐藏拖放区域
  unhighlight();
  setTimeout(() => {
    dropArea.classList.add('hidden');
  }, 300);
}, false);

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight() {
  dropArea.classList.add('border-primary');
  dropArea.classList.add('bg-primary/5');
}

function unhighlight() {
  dropArea.classList.remove('border-primary');
  dropArea.classList.remove('bg-primary/5');
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  
  if (files.length > 0) {
    // 更新文件输入框，以便显示选择的文件名
    document.getElementById('fileInput').files = files;
    // 处理文件
    handleFile({target: {files: files}});
  }
}

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  // 檢查檔案類型
  const fileType = file.name.split('.').pop().toLowerCase();
  if (fileType !== 'xlsx' && fileType !== 'xls') {
    alert('請上傳 Excel 檔案 (.xlsx 或 .xls)');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    // 讀取檔案內容
    const data = new Uint8Array(e.target.result);
    // 解析 Excel 檔（讀取第一個工作表）
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // 將工作表轉換成二維陣列 (每一列為一個陣列)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // 保存原始數據到全局變量，以便日期變更時重新分析
    window.originalData = jsonData;
    
    // 設置默認日期範圍
    // 找出數據中的最早和最晚日期
    let earliestDate = null;
    let latestDate = null;
    
    jsonData.forEach(function(row) {
      if (row.length < 7 || row[3] !== '交易') return;
      
      const date = new Date(row[1]);
      if (!isNaN(date.getTime())) {
        if (!earliestDate || date < earliestDate) {
          earliestDate = new Date(date);
        }
        if (!latestDate || date > latestDate) {
          latestDate = new Date(date);
        }
      }
    });
    
    const startDate = earliestDate ? earliestDate.toISOString().split('T')[0] : null;
    const endDate = latestDate ? latestDate.toISOString().split('T')[0] : null;
    
    // 將最早和最晚日期設置為日期選擇器的值
    if (startDate) {
      document.getElementById('startDatePicker').value = startDate;
    }
    if (endDate) {
      document.getElementById('endDatePicker').value = endDate;
    }
    
    analyzeData(jsonData, startDate, endDate);
  };
  reader.readAsArrayBuffer(file);
}

// 分析資料
function analyzeData(data, startDate, endDate) {
  // 檢查是否有資料
  if (data.length === 0) {
    document.getElementById('result').innerHTML = '<p>沒有資料。</p>';
    return;
  }

  /**
   * 假設 Excel 資料格式如下 (每一列共 7 欄)：
   * [0] 交易ID
   * [1] 日期時間
   * [2] 商戶名稱
   * [3] 交易類型 (例：「交易」或「轉入」)
   * [4] 備註／附加資訊 (例如電話號碼)
   * [5] 金額
   * [6] 付款方式或其他資訊
   */

  // 根據商戶名稱判斷分類的函數
  function getCategoryFromMerchant(merchantName) {
    merchantName = merchantName.toLowerCase();
    
    // 定義各類別的關鍵詞列表
    const categories = {
      '餐飲': ['遊泰號', '餐饮', '餐廳', '茶餐廳', '食堂', '餐飲', '小吃', '飯店', '麵', '麥當勞', 'cafe', '茶', '酒吧', '烘焙', 'bar', '飲食', '小食', '美食', '大家樂', '食品', '甜品', 'cake'],
      '咖啡': ['咖啡' ],
      '外賣APP': ['mfood', '澳覓', '閃蜂'],
      '超市/雜貨': ['7-ELEVEN', '超市', '超級市場', '便利店', 'ok', 'brisbo', '便利商店', '7-11', '雜貨', '士多', 'supermarket', 'sanmiu'],
      '交通': ['的士', 'taxi', '計程車', '巴士', '公交', '地鐵', '輕軌', '加油', '交通', '停車', '泊車', '治安警察局', '船務'],
      '購物': ['商場', '百貨', '商店', '店', 'mall', '超市', '市場', '手信', '淘寶天貓'],
      '娛樂': ['電影院', '戲院', '遊戲', '娛樂', '游樂', '主題公園', 'ktv', '唱'],
      '住宿': ['酒店', '旅館', '賓館', 'hotel', '住宿'],
      '醫療健康': ['醫院', '診所', '藥房', '藥店', '保健', '健康', '醫藥', '醫療'],
      '教育': ['學校', '教育', '補習', '書店', '學院', '大學'],
      '售賣機': ['點指BuyBuy', 'DGbuybuy', 'Vita']
    };
    
    // 將商戶名稱轉為小寫
    merchantName = merchantName.toLowerCase();
    
    // 檢查商戶名稱是否包含各類別的關鍵詞
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => merchantName.includes(keyword))) {
        return category;
      }
    }
    
    // 如果沒有匹配到任何類別，返回「其他」
    return '其他';
  }

  let totalExpense = 0;    // 總支出金額
  let expenseCount = 0;    // 支出筆數
  let breakdown = {};      // 依商戶分類的支出明細
  
  // 新增時段分析數據
  let timePeriodData = {
    morning: { total: 0, count: 0, merchants: {} },    // 上午 (06:00-12:00)
    afternoon: { total: 0, count: 0, merchants: {} },  // 下午 (12:00-18:00)
    evening: { total: 0, count: 0, merchants: {} }     // 晚上 (18:00-06:00)
  };

  // 新增保存所有交易記錄
  let allExpenses = [];
  
  // 將選擇的日期轉換為Date對象
  const selectedStartDate = startDate ? new Date(startDate) : null;
  const selectedEndDate = endDate ? new Date(endDate) : null;
  
  // 如果有設置開始日期，則設置時間為當天的00:00:00
  if (selectedStartDate) {
    selectedStartDate.setHours(0, 0, 0, 0);
  }
  
  // 如果有設置結束日期，則設置時間為當天的23:59:59
  if (selectedEndDate) {
    selectedEndDate.setHours(23, 59, 59, 999);
  }

  // 遍歷每一列 (注意：若檔案中有標題列，可適當跳過第一列)
  data.forEach(function(row) {
    // 若欄位數不足則略過
    if (row.length < 7) return;
    
    // 僅分析「交易」的資料（支出），不包含「轉入」等
    const transactionType = row[3];
    if (transactionType !== '交易') return;
    
    // 解析交易日期
    const transactionDate = new Date(row[1]);
    
    // 如果選擇了日期範圍，則只分析該範圍內的數據
    if (selectedStartDate && transactionDate < selectedStartDate) {
      return; // 早於開始日期，跳過此交易
    }
    
    if (selectedEndDate && transactionDate > selectedEndDate) {
      return; // 晚於結束日期，跳過此交易
    }
    
    const merchant = row[2];              // 商戶名稱
    let amount = parseFloat(row[5]);        // 金額欄
    if (isNaN(amount)) amount = 0;
    
    totalExpense += amount;
    expenseCount++;
    
    // 如果該商戶尚未出現在 breakdown 物件中，先初始化
    if (!breakdown[merchant]) {
      breakdown[merchant] = { count: 0, total: 0 };
    }
    breakdown[merchant].count += 1;
    breakdown[merchant].total += amount;
    
    // 處理時段分析
    try {
      const dateTime = new Date(row[1]);
      if (!isNaN(dateTime.getTime())) {
        const hour = dateTime.getHours();
        let timePeriod;
        
        // 根據小時判斷時段
        if (hour >= 6 && hour < 12) {
          // 上午 (06:00-12:00)
          timePeriod = timePeriodData.morning;
        } else if (hour >= 12 && hour < 18) {
          // 下午 (12:00-18:00)
          timePeriod = timePeriodData.afternoon;
        } else {
          // 晚上 (18:00-06:00)
          timePeriod = timePeriodData.evening;
        }
        
        timePeriod.total += amount;
        timePeriod.count += 1;
        
        // 記錄每個時段的商戶消費
        if (!timePeriod.merchants[merchant]) {
          timePeriod.merchants[merchant] = 0;
        }
        timePeriod.merchants[merchant] += amount;
      }
      
      // 保存交易記錄，使用根據商戶名稱判斷的分類
      allExpenses.push({
        datetime: dateTime,
        merchant: merchant,
        category: getCategoryFromMerchant(merchant),
        amount: amount
      });
    } catch (e) {
      console.error('日期時間解析錯誤:', e);
    }
  });
  
  // 將交易記錄保存為全局變量，以便圖表使用
  window.allExpenses = allExpenses;
  
  // 處理每個時段的前三大消費商戶
  ['morning', 'afternoon', 'evening'].forEach(period => {
    const merchants = timePeriodData[period].merchants;
    timePeriodData[period].topMerchants = Object.entries(merchants)
      .map(([merchant, amount]) => ({ merchant, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
      
    // 如果不足三個商戶，填充空值
    while (timePeriodData[period].topMerchants.length < 3) {
      timePeriodData[period].topMerchants.push({ merchant: '無數據', amount: 0 });
    }
  });

  // 添加月度分析
  let monthlyData = {};
  let totalMonths = 0;
  let totalMonthlyExpense = 0;
  
  data.forEach(function(row) {
    if (row.length < 7 || row[3] !== '交易') return;
    
    const date = new Date(row[1]);
    
    // 如果選擇了日期範圍，則只分析該範圍內的數據
    if (selectedStartDate && date < selectedStartDate) {
      return; // 早於開始日期，跳過此交易
    }
    
    if (selectedEndDate && date > selectedEndDate) {
      return; // 晚於結束日期，跳過此交易
    }
    
    const monthKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    const amount = parseFloat(row[5]);
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        total: 0,
        count: 0,
        transactions: []
      };
      totalMonths++;
    }
    
    monthlyData[monthKey].total += amount;
    totalMonthlyExpense += amount;
    monthlyData[monthKey].count += 1;
    monthlyData[monthKey].transactions.push({
      merchant: row[2],
      amount: amount
    });
  });

  const avgMonthlyExpense = totalMonthlyExpense / totalMonths;
  // console.log(totalMonthlyExpense)
  // console.log(totalMonths , avgMonthlyExpense);

  // 生成月度分析HTML
  let monthlyAnalysisHTML = '';
  Object.keys(monthlyData)
    .sort((a, b) => b.localeCompare(a))
    .forEach(month => {
      const data = monthlyData[month];
      const avgPerTransaction = data.total / data.count;
      const maxTransaction = data.transactions.reduce((max, curr) => 
        curr.amount > max.amount ? curr : max
      , {amount: 0});

      monthlyAnalysisHTML += `
        <div class="bg-gray-50/30 p-4 rounded-lg hover:tab_box transition-colors">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-medium text-gray-700">${month} 月</h4>
            <span class="text-primary font-medium">$${data.total.toFixed(2)}</span>
          </div>
          <div class="space-y-2 text-sm text-gray-600">
            <p>・共 ${data.count} 筆交易</p>
            <p>・平均每筆 $${avgPerTransaction.toFixed(2)}</p>
            <p>・最大支出：${maxTransaction.merchant} ($${maxTransaction.amount.toFixed(2)})</p>
          </div>
        </div>
      `;
    });

  // 生成支出明細表格行 HTML
  let expenseTableRows = '';
  allExpenses.sort((a, b) => b.datetime - a.datetime).forEach(expense => {
    const formattedDate = expense.datetime.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    expenseTableRows += `
      <tr class="hover:bg-gray-50/30 transition-colors">
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formattedDate}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${expense.merchant}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${expense.category}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${expense.amount.toFixed(2)}</td>
      </tr>
    `;
  });

  // 添加总计行
  expenseTableRows += `
    <tr class="bg-gray-50/50 font-medium">
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">總計</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700"></td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700"></td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">$${totalExpense.toFixed(2)}</td>
    </tr>
  `;

  // 生成商户表格行 HTML
  let merchantTableRows = '';
  for (let merchant in breakdown) {
    const count = breakdown[merchant].count;
    const total = breakdown[merchant].total;
    const avg = total / count;
    merchantTableRows += `
      <tr class="hover:bg-gray-50/30 transition-colors">
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${merchant}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${count}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${total.toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${avg.toFixed(2)}</td>
      </tr>
    `;
  }

  // 切換視圖
  document.getElementById('initial-view').classList.add('hidden');
  document.getElementById('result-view').classList.remove('hidden');

  // 更新顯示的數據日期範圍
  const dateRangeText = getDateRangeText(startDate, endDate);
  
  // 更新頂部的數據日期顯示
  const headerHTML = `
    <div class="flex items-center gap-2">
      <div class="logo-text text-2xl cursor-pointer" onclick="window.location.href='index.html'">
        <span class="text-primary">MPAY</span>
        <span class="logo-dot"></span>
        <span class="text-gray-700">WORK</span>
      </div>
      <span class="text-gray-300 mx-3">|</span>
      <span class="slogan text-gray-500 text-sm">智能收支・輕鬆管理</span>
      <span class="text-gray-300 mx-3">|</span>
      <span class="text-gray-500 text-sm">數據日期範圍: <span id="currentDataDate" class="text-primary">${getDateRangeText(startDate, endDate)}</span></span>
    </div>
    <div class="flex items-center gap-4">
      <button 
        onclick="resetView()"
        class="px-4 py-2 text-sm text-primary border border-primary/20 rounded-full hover:bg-primary/5 transition-colors">
        重新上傳
      </button>
      <h1 class="text-lg font-medium text-gray-600">支出分析報表</h1>
    </div>
  `;
  
  // 更新頂部區域
  const headerContainer = document.querySelector('#result-view .container > div:first-child');
  if (headerContainer) {
    headerContainer.innerHTML = headerHTML;
  }

  // 更新結果顯示的 HTML 生成部分
  let resultHTML = `
    <div class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="tab_box rounded-xl p-6">
          <p class="text-gray-500 text-sm mb-2">支出總筆數</p>
          <p class="text-3xl font-bold text-primary">${expenseCount}</p>
        </div>
        <div class="tab_box rounded-xl p-6">
          <p class="text-gray-500 text-sm mb-2">支出總金額</p>
          <p class="text-3xl font-bold text-primary">$${totalExpense.toFixed(2)}</p>
        </div>
      </div>

      <!-- 新增時段分析模塊 -->
      <div class="bg-white rounded-xl overflow-hidden">
        <div class="px-6 py-4 tab_box flex justify-between items-center cursor-pointer"
             onclick="toggleTimeAnalysis()">
          <h3 class="text-gray-700 font-medium">時段消費分析</h3>
          <button class="text-gray-500 text-sm" id="toggleTimeBtn">
            收起 ▲
          </button>
        </div>
        <div id="timeAnalysisContent" class="p-6 transition-all duration-300">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-gray-50/30 rounded-xl p-6">
              <h3 class="text-gray-700 font-medium mb-4">各時段消費佔比</h3>
              <div class="chart-container">
                <canvas id="timePeriodPie"></canvas>
              </div>
            </div>
            <div class="bg-gray-50/30 rounded-xl p-6">
              <h3 class="text-gray-700 font-medium mb-4">支出分類佔比</h3>
              <div class="chart-container">
                <canvas id="categoryPie"></canvas>
              </div>
            </div>
            <div class="bg-gray-50/30 rounded-xl p-6">
              <h3 class="text-gray-700 font-medium mb-4">各時段消費金額</h3>
              <div class="chart-container">
                <canvas id="timePeriodBar"></canvas>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div class="bg-gray-50/30 rounded-xl p-6">
              <h3 class="text-gray-700 font-medium mb-2">上午消費 (06:00-12:00)</h3>
              <p class="text-2xl font-bold text-primary mb-2">$${timePeriodData.morning.total.toFixed(2)}</p>
              <p class="text-sm text-gray-500">共 ${timePeriodData.morning.count} 筆交易</p>
              <p class="text-sm text-gray-500">平均每筆 $${(timePeriodData.morning.total / timePeriodData.morning.count || 0).toFixed(2)}</p>
              <div class="mt-4 pt-4 border-t border-gray-100">
                <h4 class="text-sm font-medium text-gray-600 mb-2">前五大消費商戶：</h4>
                <ul class="text-sm text-gray-500 space-y-1">
                  ${timePeriodData.morning.topMerchants.map(m => 
                    `<li>・${m.merchant}: $${m.amount.toFixed(2)}</li>`
                  ).join('')}
                </ul>
              </div>
            </div>
            <div class="bg-gray-50/30 rounded-xl p-6">
              <h3 class="text-gray-700 font-medium mb-2">下午消費 (12:00-18:00)</h3>
              <p class="text-2xl font-bold text-primary mb-2">$${timePeriodData.afternoon.total.toFixed(2)}</p>
              <p class="text-sm text-gray-500">共 ${timePeriodData.afternoon.count} 筆交易</p>
              <p class="text-sm text-gray-500">平均每筆 $${(timePeriodData.afternoon.total / timePeriodData.afternoon.count || 0).toFixed(2)}</p>
              <div class="mt-4 pt-4 border-t border-gray-100">
                <h4 class="text-sm font-medium text-gray-600 mb-2">前五大消費商戶：</h4>
                <ul class="text-sm text-gray-500 space-y-1">
                  ${timePeriodData.afternoon.topMerchants.map(m => 
                    `<li>・${m.merchant}: $${m.amount.toFixed(2)}</li>`
                  ).join('')}
                </ul>
              </div>
            </div>
            <div class="bg-gray-50/30 rounded-xl p-6">
              <h3 class="text-gray-700 font-medium mb-2">晚上消費 (18:00-06:00)</h3>
              <p class="text-2xl font-bold text-primary mb-2">$${timePeriodData.evening.total.toFixed(2)}</p>
              <p class="text-sm text-gray-500">共 ${timePeriodData.evening.count} 筆交易</p>
              <p class="text-sm text-gray-500">平均每筆 $${(timePeriodData.evening.total / timePeriodData.evening.count || 0).toFixed(2)}</p>
              <div class="mt-4 pt-4 border-t border-gray-100">
                <h4 class="text-sm font-medium text-gray-600 mb-2">前五大消費商戶：</h4>
                <ul class="text-sm text-gray-500 space-y-1">
                  ${timePeriodData.evening.topMerchants.map(m => 
                    `<li>・${m.merchant}: $${m.amount.toFixed(2)}</li>`
                  ).join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 圖表區域 -->
      <div class="bg-white rounded-xl overflow-hidden">
        <div class="px-6 py-4 tab_box flex justify-between items-center cursor-pointer"
             onclick="toggleCharts()">
          <h3 class="text-gray-700 font-medium">圖表分析</h3>
          <button class="text-gray-500 text-sm" id="toggleChartsBtn">
            收起 ▲
          </button>
        </div>
        <div id="chartsContent" class="p-6 transition-all duration-300">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gray-50/30 rounded-xl p-6">
              <h3 class="text-gray-700 font-medium mb-4">月度支出趨勢</h3>
              <div class="chart-container">
                <canvas id="expenseTrend"></canvas>
              </div>
            </div>
            <div class="bg-gray-50/30 rounded-xl p-6">
              <h3 class="text-gray-700 font-medium mb-4">前五大商戶支出</h3>
              <div class="chart-container">
                <canvas id="merchantPie"></canvas>
              </div>
            </div>
            <div class="bg-gray-50/30 rounded-xl p-6">
              <h3 class="text-gray-700 font-medium mb-4">每月交易筆數</h3>
              <div class="chart-container">
                <canvas id="transactionCount"></canvas>
              </div>
            </div>
            <div class="bg-gray-50/30 rounded-xl p-6">
              <h3 class="text-gray-700 font-medium mb-4">平均交易金額趨勢</h3>
              <div class="chart-container">
                <canvas id="avgTransaction"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 月度消費分析 -->
      <div class="bg-white rounded-xl overflow-hidden">
        <div class="px-6 py-4 tab_box flex justify-between items-center cursor-pointer"
             onclick="toggleMonthlyAnalysis()">
          <div class="flex items-center gap-4">
            <h3 class="text-gray-700 font-medium">月度消費分析</h3>
            <span class="text-sm text-gray-500">
              平均每月支出：<span class="text-primary font-medium">$${avgMonthlyExpense.toFixed(2)}</span>
            </span>
          </div>
          <button class="text-gray-500 text-sm" id="toggleMonthlyBtn">
            展開 ▼
          </button>
        </div>
        <div id="monthlyAnalysisContent" class="p-6 space-y-4" style="display: none; max-height: 0;">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${monthlyAnalysisHTML}
          </div>
        </div>
      </div>

      <!-- 修改商戶支出明細區域 -->
      <div class="bg-white rounded-xl overflow-hidden">
        <div class="px-6 py-4 tab_box flex justify-between items-center cursor-pointer"
             onclick="toggleMerchantDetails()">
          <div class="flex items-center gap-4">
            <h3 class="text-gray-700 font-medium">各商戶支出明細</h3>
            <span class="text-sm text-gray-500">
              共 <span class="text-primary font-medium">${Object.keys(breakdown).length}</span> 個商戶
            </span>
          </div>
          <div class="flex items-center gap-4">
            <input 
              type="text" 
              id="merchantFilter" 
              placeholder="搜尋商戶..." 
              class="px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-primary/30"
              onclick="event.stopPropagation()"
            >
            <button class="text-gray-500 text-sm" id="toggleMerchantBtn">
              展開 ▼
            </button>
          </div>
        </div>
        <div id="merchantDetailsContent" class="transition-all duration-300" style="display: none; max-height: 0; opacity: 0;">
          <div class="overflow-x-auto">
            <table class="min-w-full" id="merchantTable">
              <thead class="bg-gray-50/30">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortTable(0)">
                    商戶
                    <span class="ml-1 sort-icon">↕</span>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortTable(1)">
                    筆數
                    <span class="ml-1 sort-icon">↕</span>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortTable(2)">
                    總金額
                    <span class="ml-1 sort-icon">↕</span>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortTable(3)">
                    平均金額
                    <span class="ml-1 sort-icon">↕</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${merchantTableRows}
                <!-- 添加总计行 -->
                <tr class="tab_box font-medium">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">總計</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${expenseCount}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">$${totalExpense.toFixed(2)}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">$${(totalExpense / expenseCount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 添加所有支出明細區域 -->
      <div class="bg-white rounded-xl overflow-hidden">
        <div class="px-6 py-4 tab_box flex justify-between items-center cursor-pointer"
             onclick="toggleExpenseDetails()">
          <div class="flex items-center gap-4">
            <h3 class="text-gray-700 font-medium">所有支出明細</h3>
            <span class="text-sm text-gray-500">
              共 <span class="text-primary font-medium">${expenseCount}</span> 筆交易
            </span>
          </div>
          <div class="flex items-center gap-4">
            <input 
              type="text" 
              id="expenseFilter" 
              placeholder="搜尋項目..." 
              class="px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-primary/30"
              onclick="event.stopPropagation()"
            >
            <button class="text-gray-500 text-sm" id="toggleExpenseBtn">
              展開 ▼
            </button>
          </div>
        </div>
        <div id="expenseDetailsContent" class="transition-all duration-300" style="display: none; max-height: 0; opacity: 0;">
          <div class="overflow-x-auto">
            <table class="min-w-full" id="expenseTable">
              <thead class="bg-gray-50/30">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortExpenseTable(0)">
                    交易時間
                    <span class="ml-1 sort-icon">↕</span>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortExpenseTable(1)">
                    項目名稱
                    <span class="ml-1 sort-icon">↕</span>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortExpenseTable(2)">
                    分類
                    <span class="ml-1 sort-icon">↕</span>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortExpenseTable(3)">
                    金額
                    <span class="ml-1 sort-icon">↕</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100" id="expenseTableBody">
                ${expenseTableRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('result').innerHTML = resultHTML;
  
  // 保存分析結果到 localStorage
  localStorage.setItem('analysisResult', document.getElementById('result').innerHTML);
  localStorage.setItem('analysisData', JSON.stringify({
    monthlyData: monthlyData,
    breakdown: breakdown,
    timePeriodData: timePeriodData,
    startDate: startDate || null,
    endDate: endDate || null,
    allExpenses: allExpenses,
    originalData: window.originalData // 保存原始數據
  }));
  
  // 保存時段分析數據為全局變量
  window.timePeriodData = timePeriodData;
  
  // 保存月度數據和商戶明細為全局變量
  window.monthlyData = monthlyData;
  window.breakdown = breakdown;
  
  // 生成圖表
  initializeCharts(monthlyData, breakdown);
  
  // 初始化時段分析圖表
  initializeTimePeriodCharts(timePeriodData);
  
  // 設置表格篩選功能
  setupTableFilter();
  
  // 添加數據日期更新事件
  document.getElementById('updateDataDateBtn').addEventListener('click', updateDataDateAnalysis);
  
  // 添加返回按钮功能
  setupBackToTopButton();
}

// 更新數據日期範圍並重新分析
function updateDataDateAnalysis() {
  const startDate = document.getElementById('startDatePicker').value;
  const endDate = document.getElementById('endDatePicker').value;
  
  if ((!startDate && !endDate) || !window.originalData) {
    alert('請選擇有效日期範圍或重新上傳數據');
    return;
  }
  
  // 檢查日期範圍是否有效
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    alert('開始日期不能晚於結束日期');
    return;
  }
  
  // 顯示加載動畫
  const updateBtn = document.getElementById('updateDataDateBtn');
  const originalBtnText = updateBtn.textContent;
  updateBtn.disabled = true;
  updateBtn.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>更新中...';
  
  // 清除之前的圖表實例，避免重複創建
  Chart.helpers.each(Chart.instances, function(instance) {
    instance.destroy();
  });
  
  // 延遲 0.5 秒後更新數據
  setTimeout(() => {
    // 使用選擇的日期範圍重新分析數據
    analyzeData(window.originalData, startDate, endDate);
    
    // 更新頂部的數據日期顯示
    const headerHTML = `
      <div class="flex items-center gap-2">
        <div class="logo-text text-2xl cursor-pointer" onclick="window.location.href='index.html'">
          <span class="text-primary">MPAY</span>
          <span class="logo-dot"></span>
          <span class="text-gray-700">WORK</span>
        </div>
        <span class="text-gray-300 mx-3">|</span>
        <span class="slogan text-gray-500 text-sm">智能收支・輕鬆管理</span>
        <span class="text-gray-300 mx-3">|</span>
        <span class="text-gray-500 text-sm">數據日期範圍: <span id="currentDataDate" class="text-primary">${getDateRangeText(startDate, endDate)}</span></span>
      </div>
      <div class="flex items-center gap-4">
        <button 
          onclick="resetView()"
          class="px-4 py-2 text-sm text-primary border border-primary/20 rounded-full hover:bg-primary/5 transition-colors">
          重新上傳
        </button>
        <h1 class="text-lg font-medium text-gray-600">支出分析報表</h1>
      </div>
    `;
    
    // 更新頂部區域
    const headerContainer = document.querySelector('#result-view .container > div:first-child');
    if (headerContainer) {
      headerContainer.innerHTML = headerHTML;
    }
    
    // 保存分析結果和數據到 localStorage
    const resultHTML = document.getElementById('result').innerHTML;
    localStorage.setItem('analysisResult', resultHTML);
    
    // 保存分析數據，以便在頁面刷新後恢復圖表
    localStorage.setItem('analysisData', JSON.stringify({
      monthlyData: window.monthlyData,
      breakdown: window.breakdown,
      timePeriodData: window.timePeriodData,
      originalData: window.originalData,
      startDate: startDate,
      endDate: endDate,
      allExpenses: window.allExpenses
    }));
    
    // 恢復按鈕狀態
    updateBtn.disabled = false;
    updateBtn.textContent = originalBtnText;
  }, 500);
}

// 修改重置函數
function resetView() {
  // 清除 localStorage 中的分析結果
  localStorage.removeItem('analysisResult');
  localStorage.removeItem('analysisData');
  
  // 清除原始數據
  window.originalData = null;
  
  // 重置視圖
  document.getElementById('initial-view').classList.remove('hidden');
  document.getElementById('result-view').classList.add('hidden');
  
  // 清空文件輸入框
  document.getElementById('fileInput').value = '';
}

// 添加表格篩選功能
function setupTableFilter() {
  // 商戶明細表格篩選
  const merchantFilter = document.getElementById('merchantFilter');
  if (merchantFilter) {
    merchantFilter.addEventListener('input', function(e) {
      filterTable('merchantTable', e.target.value.toLowerCase(), 0);
    });
  }
  
  // 交易明細表格篩選
  const expenseFilter = document.getElementById('expenseFilter');
  if (expenseFilter) {
    expenseFilter.addEventListener('input', function(e) {
      filterTable('expenseTable', e.target.value.toLowerCase(), 1, true);
    });
  }
}

// 通用表格篩選函數
function filterTable(tableId, searchText, searchColumnIndex, searchMultipleColumns = false) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  const tbody = table.getElementsByTagName('tbody')[0];
  const rows = Array.from(tbody.getElementsByTagName('tr'));
  
  // 移除可能存在的空结果提示
  const existingEmptyMessage = tbody.querySelector('.empty-result-message');
  if (existingEmptyMessage) {
    tbody.removeChild(existingEmptyMessage);
  }
  
  // 获取总计行（如果存在）
  let totalRow = rows.find(row => row.cells[0] && row.cells[0].textContent === '總計');
  const totalRowIndex = totalRow ? rows.indexOf(totalRow) : -1;
  
  // 获取普通行（排除总计行和可能存在的空结果提示）
  const normalRows = totalRowIndex > -1 ? rows.slice(0, totalRowIndex) : rows;
  
  let visibleCount = 0;
  let visibleTotal = 0;
  let hasVisibleRows = false;
  
  // 过滤普通行
  for (let row of normalRows) {
    let match = false;
    
    if (searchMultipleColumns) {
      // 搜索多个列
      for (let i = 0; i < row.cells.length; i++) {
        const cellText = row.cells[i].textContent.toLowerCase();
        if (cellText.includes(searchText)) {
          match = true;
          break;
        }
      }
    } else {
      // 只搜索指定列
      const cellText = row.cells[searchColumnIndex].textContent.toLowerCase();
      match = cellText.includes(searchText);
    }
    
    if (match) {
      row.style.display = '';
      hasVisibleRows = true;
      
      // 累计可见行的数据（如果表格有总计行）
      if (totalRow) {
        const countColumn = tableId === 'merchantTable' ? 1 : -1;
        const amountColumn = tableId === 'merchantTable' ? 2 : 3;
        
        if (countColumn > -1) {
          visibleCount += parseInt(row.cells[countColumn].textContent);
        }
        
        // 从金额列中提取数字（移除货币符号等）
        const amountText = row.cells[amountColumn].textContent;
        const amount = parseFloat(amountText.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(amount)) {
          visibleTotal += amount;
        }
      }
    } else {
      row.style.display = 'none';
    }
  }
  
  // 处理总计行和空结果提示
  if (totalRow) {
    if (hasVisibleRows) {
      // 有符合条件的行，显示总计行
      totalRow.style.display = ''; // 显示总计行
      
      // 更新总计行数据
      if (searchText) {
        if (tableId === 'merchantTable') {
          const countColumn = 1;
          const amountColumn = 2;
          const avgColumn = 3;
          
          totalRow.cells[countColumn].textContent = visibleCount;
          totalRow.cells[amountColumn].textContent = `$${visibleTotal.toFixed(2)}`;
          totalRow.cells[avgColumn].textContent = `$${(visibleTotal / visibleCount).toFixed(2)}`;
        } else {
          // 对于支出明细表格，只更新金额列
          const amountColumn = 3;
          totalRow.cells[amountColumn].textContent = `$${visibleTotal.toFixed(2)}`;
        }
      } else {
        // 如果搜索框为空，恢复原始总计数据
        const savedData = JSON.parse(localStorage.getItem('analysisData') || '{}');
        if (savedData) {
          if (tableId === 'merchantTable' && savedData.breakdown) {
            const expenseCount = Object.values(savedData.breakdown).reduce((sum, item) => sum + item.count, 0);
            const totalExpense = Object.values(savedData.breakdown).reduce((sum, item) => sum + item.total, 0);
            
            totalRow.cells[countColumn].textContent = expenseCount;
            totalRow.cells[amountColumn].textContent = `$${totalExpense.toFixed(2)}`;
            totalRow.cells[avgColumn].textContent = `$${(totalExpense / expenseCount).toFixed(2)}`;
          } else if (tableId === 'expenseTable' && savedData.allExpenses) {
            const totalExpense = savedData.allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
            totalRow.cells[amountColumn].textContent = `$${totalExpense.toFixed(2)}`;
          }
        }
      }
    } else if (searchText) {
      // 没有符合条件的行，隐藏总计行并显示提示
      totalRow.style.display = 'none'; // 隐藏总计行
      
      // 创建并添加空结果提示
      addEmptyResultMessage(tbody, tableId === 'merchantTable' ? '沒有符合條件的商戶' : '沒有符合條件的交易');
    } else {
      // 搜索框为空，显示总计行
      totalRow.style.display = ''; // 显示总计行
    }
  } else if (!hasVisibleRows && searchText) {
    // 没有总计行，也没有符合条件的行，显示提示
    addEmptyResultMessage(tbody, tableId === 'merchantTable' ? '沒有符合條件的商戶' : '沒有符合條件的交易');
  }
}

// 添加空結果提示
function addEmptyResultMessage(tbody, message) {
  const emptyRow = document.createElement('tr');
  emptyRow.className = 'empty-result-message';
  const emptyCell = document.createElement('td');
  emptyCell.colSpan = 4;
  emptyCell.className = 'px-6 py-8 text-center text-gray-500';
  emptyCell.textContent = message;
  emptyRow.appendChild(emptyCell);
  tbody.appendChild(emptyRow);
}

// 添加表格排序功能
let currentSortColumn = -1;
let isAscending = true;

function sortTable(columnIndex) {
  sortTableGeneric('merchantTable', columnIndex);
}

function sortExpenseTable(columnIndex) {
  sortTableGeneric('expenseTable', columnIndex);
}

function sortTableGeneric(tableId, columnIndex) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  const tbody = table.getElementsByTagName('tbody')[0];
  const rows = Array.from(tbody.getElementsByTagName('tr'));
  
  // 分离总计行和普通行
  let totalRow = rows.find(row => row.cells[0] && row.cells[0].textContent === '總計');
  let normalRows = rows;
  
  if (totalRow) {
    const totalRowIndex = rows.indexOf(totalRow);
    normalRows = rows.slice(0, totalRowIndex);
  } else {
    // 没有总计行
    normalRows = rows.filter(row => !row.classList.contains('empty-result-message'));
  }
  
  // 更新排序方向
  if (currentSortColumn === columnIndex) {
    isAscending = !isAscending;
  } else {
    isAscending = true;
    currentSortColumn = columnIndex;
  }

  // 更新所有排序图标
  const icons = table.getElementsByClassName('sort-icon');
  Array.from(icons).forEach((icon, index) => {
    if (index === columnIndex) {
      icon.textContent = isAscending ? '↑' : '↓';
    } else {
      icon.textContent = '↕';
    }
  });

  // 排序函数
  const compareFn = (a, b) => {
    let aValue = a.cells[columnIndex].textContent;
    let bValue = b.cells[columnIndex].textContent;
    
    // 處理日期时间列（针对交易明细表的第一列）
    if (tableId === 'expenseTable' && columnIndex === 0) {
      const parseDate = (dateStr) => {
        const parts = dateStr.match(/(\d+)/g);
        // 假设格式为 yyyy/mm/dd hh:mm
        if (parts && parts.length >= 5) {
          return new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4]);
        }
        return new Date(0);
      };
      
      const aDate = parseDate(aValue);
      const bDate = parseDate(bValue);
      
      return isAscending ? aDate - bDate : bDate - aDate;
    }
    
    // 处理数字列（移除货币符号并转换为数字）
    if ((tableId === 'merchantTable' && columnIndex > 0) || 
        (tableId === 'expenseTable' && columnIndex === 3)) {
      aValue = parseFloat(aValue.replace(/[^0-9.-]+/g, ''));
      bValue = parseFloat(bValue.replace(/[^0-9.-]+/g, ''));
      
      return isAscending ? aValue - bValue : bValue - aValue;
    }
    
    // 文本比较
    return isAscending ? 
      aValue.localeCompare(bValue, 'zh-Hant') : 
      bValue.localeCompare(aValue, 'zh-Hant');
  };

  // 排序普通行
  normalRows.sort(compareFn);
  
  // 重新插入行
  normalRows.forEach(row => {
    tbody.appendChild(row);
  });
  
  // 如果有总计行，放到最后
  if (totalRow) {
    tbody.appendChild(totalRow);
  }
}

// 添加展開/收起功能
function toggleMonthlyAnalysis() {
  const content = document.getElementById('monthlyAnalysisContent');
  const button = document.getElementById('toggleMonthlyBtn');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    button.textContent = '收起 ▲';
    // 使用動畫效果展開
    setTimeout(() => {
      content.style.maxHeight = content.scrollHeight + 'px';
    }, 0);
  } else {
    content.style.maxHeight = '0';
    button.textContent = '展開 ▼';
    // 等待動畫完成後隱藏內容
    setTimeout(() => {
      content.style.display = 'none';
    }, 300);
  }
}

// 添加圖表初始化函數
function initializeCharts(monthlyData, breakdown) {
  const monthLabels = Object.keys(monthlyData).sort();
  
  // 共用的圖表配置選項
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };
  
  // 1. 支出趨勢圖
  new Chart(document.getElementById('expenseTrend'), {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [{
        label: '月度支出',
        data: monthLabels.map(month => monthlyData[month].total),
        borderColor: '#fd8204',
        backgroundColor: 'rgba(253, 130, 4, 0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `$${value.toFixed(0)}`
          }
        }
      }
    }
  });

  // 2. 商戶支出佔比圖（改為棒形圖）
  const merchantData = Object.entries(breakdown)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  new Chart(document.getElementById('merchantPie'), {
    type: 'bar',
    data: {
      labels: merchantData.map(([merchant]) => merchant),
      datasets: [{
        data: merchantData.map(([, data]) => data.total),
        backgroundColor: 'rgba(253, 130, 4, 0.7)',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',  // 使用水平棒形圖
      ...commonOptions,
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: value => `$${value.toFixed(0)}`
          }
        },
        y: {
          ticks: {
            font: {
              size: 11  // 調整商戶名稱字體大小
            }
          }
        }
      }
    }
  });

  // 3. 每月交易筆數圖
  new Chart(document.getElementById('transactionCount'), {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [{
        label: '交易筆數',
        data: monthLabels.map(month => monthlyData[month].count),
        backgroundColor: 'rgba(253, 130, 4, 0.7)',
        borderRadius: 4
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });

  // 4. 平均交易金額趨勢圖
  new Chart(document.getElementById('avgTransaction'), {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [{
        label: '平均交易金額',
        data: monthLabels.map(month => 
          monthlyData[month].total / monthlyData[month].count
        ),
        borderColor: '#fd8204',
        backgroundColor: 'rgba(253, 130, 4, 0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `$${value.toFixed(0)}`
          }
        }
      }
    }
  });
}

// 初始化分類支出佔比圖
function initializeCategoryPieChart() {
  // 從全局變量中獲取所有支出記錄
  const allExpenses = window.allExpenses || [];
  
  if (!allExpenses || allExpenses.length === 0) {
    console.warn('沒有支出數據，無法創建分類支出圖表');
    return;
  }
  
  // 按分類統計支出
  const categoryData = {};
  let totalAmount = 0;
  
  allExpenses.forEach(expense => {
    const category = expense.category || '其他';
    if (!categoryData[category]) {
      categoryData[category] = 0;
    }
    categoryData[category] += expense.amount;
    totalAmount += expense.amount;
  });
  
  // 將分類數據轉換為數組並排序
  const sortedCategories = Object.entries(categoryData)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalAmount * 100).toFixed(1)
    }))
    .sort((a, b) => b.amount - a.amount);
  
  // 生成隨機顏色，但保持橙色系列
  const generateColors = (count) => {
    // 使用多種不同的顏色
    const colorPalette = [
      'rgba(255, 99, 132, 0.8)',    // 紅色
      'rgba(54, 162, 235, 0.8)',    // 藍色
      'rgba(255, 206, 86, 0.8)',    // 黃色
      'rgba(75, 192, 192, 0.8)',    // 綠色
      'rgba(153, 102, 255, 0.8)',   // 紫色
      'rgba(255, 159, 64, 0.8)',    // 橙色
      'rgba(199, 199, 199, 0.8)',   // 灰色
      'rgba(83, 102, 255, 0.8)',    // 藍紫色
      'rgba(78, 205, 196, 0.8)',    // 青綠色
      'rgba(255, 99, 71, 0.8)',     // 番茄紅
      'rgba(255, 215, 0, 0.8)',     // 金色
      'rgba(124, 252, 0, 0.8)',     // 草綠色
      'rgba(147, 112, 219, 0.8)',   // 淡紫色
      'rgba(250, 128, 114, 0.8)',   // 鮭魚色
      'rgba(0, 128, 128, 0.8)'      // 藍綠色
    ];
    
    const colors = [];
    
    // 如果分類數量超過預設顏色數量，則循環使用
    for (let i = 0; i < count; i++) {
      colors.push(colorPalette[i % colorPalette.length]);
    }
    
    return colors;
  };
  
  // 創建餅圖
  const ctx = document.getElementById('categoryPie');
  if (ctx) {
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: sortedCategories.map(c => `${c.category} (${c.percentage}%)`),
        datasets: [{
          data: sortedCategories.map(c => c.amount),
          backgroundColor: generateColors(sortedCategories.length),
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 11
              },
              boxWidth: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `$${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } else {
    console.error('找不到圖表容器 #categoryPie');
  }
}

// 添加圖表展開/收起功能
function toggleCharts() {
  const content = document.getElementById('chartsContent');
  const button = document.getElementById('toggleChartsBtn');
  if (content.style.maxHeight) {
    content.style.maxHeight = null;
    content.style.opacity = '0';
    button.textContent = '展開 ▼';
    // 等待動畫完成後隱藏內容
    setTimeout(() => {
      content.style.display = 'none';
    }, 300);
  } else {
    content.style.display = 'block';
    // 使用 setTimeout 確保 display:block 已經生效
    setTimeout(() => {
      content.style.maxHeight = content.scrollHeight + 'px';
      content.style.opacity = '1';
      button.textContent = '收起 ▲';
    }, 0);
  }
}

// 修改商戶明細展開/收起功能
function toggleMerchantDetails() {
  const content = document.getElementById('merchantDetailsContent');
  const button = document.getElementById('toggleMerchantBtn');
  
  if (content.style.display === 'none' || !content.style.maxHeight) {
    // 展開內容
    content.style.display = 'block';
    // 使用 setTimeout 確保 display:block 已經生效
    setTimeout(() => {
      content.style.maxHeight = content.scrollHeight + 'px';
      content.style.opacity = '1';
      button.textContent = '收起 ▲';
    }, 10);
  } else {
    // 收起內容
    content.style.maxHeight = '0';
    content.style.opacity = '0';
    button.textContent = '展開 ▼';
    // 等待動畫完成後隱藏內容
    setTimeout(() => {
      content.style.display = 'none';
    }, 300);
  }
}

// 添加時段分析展開/收起功能
function toggleTimeAnalysis() {
  const content = document.getElementById('timeAnalysisContent');
  const button = document.getElementById('toggleTimeBtn');
  if (content.style.maxHeight) {
    content.style.maxHeight = null;
    content.style.opacity = '0';
    button.textContent = '展開 ▼';
    // 等待動畫完成後隱藏內容
    setTimeout(() => {
      content.style.display = 'none';
    }, 300);
  } else {
    content.style.display = 'block';
    // 使用 setTimeout 確保 display:block 已經生效
    setTimeout(() => {
      content.style.maxHeight = content.scrollHeight + 'px';
      content.style.opacity = '1';
      button.textContent = '收起 ▲';
    }, 0);
  }
}

// 初始化時段分析圖表
function initializeTimePeriodCharts(timePeriodData) {
  // 移除這些切換函數的調用，避免在頁面加載時隱藏圖表
  // toggleTimeAnalysis()
  // toggleCharts()
  
  // 準備數據
  const labels = ['上午 (06:00-12:00)', '下午 (12:00-18:00)', '晚上 (18:00-06:00)'];
  const data = [
    timePeriodData.morning.total,
    timePeriodData.afternoon.total,
    timePeriodData.evening.total
  ];
  const counts = [
    timePeriodData.morning.count,
    timePeriodData.afternoon.count,
    timePeriodData.evening.count
  ];
  
  // 計算總金額用於百分比
  const totalAmount = data.reduce((sum, value) => sum + value, 0);
  
  // 共用的圖表配置選項
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };
  
  // 1. 時段佔比餅圖
  new Chart(document.getElementById('timePeriodPie'), {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          'rgba(255, 159, 64, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderWidth: 1,
        borderColor: '#fff'
      }]
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const percentage = Math.round((value / totalAmount) * 100);
              return `$${value.toFixed(2)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
  
  // 2. 時段金額條形圖
  new Chart(document.getElementById('timePeriodBar'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '消費金額',
        data: data,
        backgroundColor: 'rgba(253, 130, 4, 0.7)',
        borderRadius: 4
      }]
    },
    options: {
      ...commonOptions,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `$${value.toFixed(0)}`
          }
        }
      }
    }
  });
  
  // 初始化分類支出佔比圖
  initializeCategoryPieChart();
}

// 添加所有支出明細展開/收起功能
function toggleExpenseDetails() {
  const content = document.getElementById('expenseDetailsContent');
  const button = document.getElementById('toggleExpenseBtn');
  
  if (content.style.display === 'none' || !content.style.display) {
    // 展开
    content.style.display = 'block';
    setTimeout(() => {
      content.style.maxHeight = content.scrollHeight + 'px';
      content.style.opacity = '1';
    }, 10);
    button.textContent = '收起 ▲';
  } else {
    // 收起
    content.style.maxHeight = '0';
    content.style.opacity = '0';
    setTimeout(() => {
      content.style.display = 'none';
    }, 300);
    button.textContent = '展開 ▼';
  }
}

// 设置返回顶部按钮功能
function setupBackToTopButton() {
  const modules = document.querySelectorAll('.bg-white.rounded-xl');
  const backButton = document.getElementById('backButton');
  
  if (!backButton) return; // 确保按钮存在
  
  // 当窗口滚动时检查是否显示返回按钮
  window.addEventListener('scroll', function() {
    // 如果滚动超过200px，显示按钮
    if (window.scrollY > 200) {
      backButton.classList.add('visible');
    } else {
      backButton.classList.remove('visible');
    }
  });
  
  // 点击返回按钮时滚动到當前模块
  backButton.addEventListener('click', function() {
    // 获取当前可见模块
    let currentModule = null;
    let prevModule = null;
    
    // 找到当前正在查看的模块和它的當前模块
    for (let i = 0; i < modules.length; i++) {
      const rect = modules[i].getBoundingClientRect();
      
      // 如果模块的顶部在视窗中或刚好在视窗上方
      if (rect.top <= 100) { 
        currentModule = modules[i];
        if (i > 0) {
          prevModule = modules[i];
        }
      }
    }
    
    // 如果找到當前模块，滚动到它
    if (prevModule) {
      prevModule.scrollIntoView({ behavior: 'smooth' });
    } else if (currentModule) {
      // 如果没有當前模块但有当前模块，滚动到页面顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  
  // 初始状态可能需要显示按钮
  if (window.scrollY > 200) {
    backButton.classList.add('visible');
  }
}

// 格式化日期範圍文本
function getDateRangeText(startDate, endDate) {
  if (startDate && endDate) {
    const start = new Date(startDate).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const end = new Date(endDate).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return `${start} 至 ${end}`;
  } else if (startDate) {
    const start = new Date(startDate).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return `${start} 起`;
  } else if (endDate) {
    const end = new Date(endDate).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return `至 ${end}`;
  } else {
    return '全部';
  }
}