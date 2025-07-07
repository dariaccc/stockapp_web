// Stock Page Logic
function initializeStockPage() {
    // Check if user is logged in
    if (!auth.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Get symbol from URL
    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get('symbol');
    
    if (!symbol) {
        alert('No stock symbol provided');
        window.location.href = 'radar.html';
        return;
    }
    
    loadStockData(symbol);
    initializeStockPageHandlers(symbol);
}

// Load stock data
async function loadStockData(symbol) {
    showLoading();
    
    try {
        // Load quote and historical data in parallel
        const [quote, historicalData] = await Promise.all([
            api.getQuote(symbol),
            api.getHistoricalData(symbol, '1mo', '1d')
        ]);
        
        updateStockHeader(quote);
        initializeChart(symbol, historicalData);
        updatePerformanceMetrics(quote);
        loadCompanyInfo(symbol);
        loadStockNews(symbol);
        loadRelatedStocks(symbol);
        
    } catch (error) {
        console.error('Error loading stock data:', error);
        alert('Error loading stock data. Please try again.');
        window.location.href = 'radar.html';
    } finally {
        hideLoading();
    }
}

// Update stock header
function updateStockHeader(quote) {
    // Update title and basic info
    document.getElementById('stockSymbol').textContent = quote.symbol;
    document.getElementById('stockName').textContent = getCompanyName(quote.symbol);
    
    // ADD THIS LINE - Update chart price display
    document.getElementById('chartPrice').textContent = api.formatCurrency(quote.price);
    
    // Update trading buttons
    const buyBtn = document.getElementById('buyBtn');
    const sellBtn = document.getElementById('sellBtn');
    const buyPrice = document.getElementById('buyPrice');
    const sellPrice = document.getElementById('sellPrice');
    
    if (buyPrice) buyPrice.textContent = api.formatCurrency(quote.price);
    if (sellPrice) sellPrice.textContent = api.formatCurrency(quote.price);
    
    // Set button colors based on change
    const changeClass = quote.changePercent >= 0 ? 'positive' : 'negative';
    if (buyBtn) buyBtn.className = `trade-btn buy-btn ${changeClass}`;
    if (sellBtn) sellBtn.className = `trade-btn sell-btn ${changeClass}`;
}
// Initialize chart
function initializeChart(symbol, initialData) {
    const chart = new ChartUtils('stockChart');
    chart.drawChart(initialData, '1D');
    
    // Store chart instance globally
    window.stockChart = chart;
    window.currentSymbol = symbol;
    
    // Initialize period selector
    initializePeriodSelector(symbol, chart);
    
    // Update chart info
    updateChartInfo(initialData[initialData.length - 1]);
}

// Initialize period selector
function initializePeriodSelector(symbol, chart) {
    const periodButtons = document.querySelectorAll('.period-btn');
    
    periodButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const period = btn.dataset.period;
            
            // Update active state
            periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            try {
                // Show loading
                showChartLoading();
                
                // Get period mapping
                const periodConfig = ChartUtils.getPeriodMapping(period);
                
                // Fetch new data
                const historicalData = await api.getHistoricalData(
                    symbol, 
                    periodConfig.range, 
                    periodConfig.interval
                );
                
                // Update chart
                chart.drawChart(historicalData, period);
                
                // Update chart info
                if (historicalData.length > 0) {
                    updateChartInfo(historicalData[historicalData.length - 1]);
                }
                
            } catch (error) {
                console.error('Error loading period data:', error);
                alert('Error loading chart data');
            } finally {
                hideChartLoading();
            }
        });
    });
}

// Update chart info display
function updateChartInfo(dataPoint) {
    const chartPrice = document.getElementById('chartPrice');
    const chartDate = document.getElementById('chartDate');
    
    if (chartPrice && dataPoint) {
        chartPrice.textContent = api.formatCurrency(dataPoint.close);
    }
    
    if (chartDate && dataPoint) {
        chartDate.textContent = dataPoint.date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Update performance metrics
async function updatePerformanceMetrics(quote) {
    try {
        // Get historical data for different periods
        const [oneMonth, threeMonth, oneYear] = await Promise.all([
            api.getHistoricalData(quote.symbol, '1mo', '1d'),
            api.getHistoricalData(quote.symbol, '3mo', '1d'),
            api.getHistoricalData(quote.symbol, '1y', '1wk')
        ]);
        
        // Calculate returns
        const oneMonthReturn = calculateReturn(oneMonth, quote.price);
        const threeMonthReturn = calculateReturn(threeMonth, quote.price);
        const oneYearReturn = calculateReturn(oneYear, quote.price);
        
        // Update display
        updateMetricElement('oneMonthReturn', oneMonthReturn);
        updateMetricElement('threeMonthReturn', threeMonthReturn);
        updateMetricElement('oneYearReturn', oneYearReturn);
        updateMetricElement('previousClose', quote.previousClose, true);
        updateMetricElement('weekHigh', quote.fiftyTwoWeekHigh, true);
        updateMetricElement('weekLow', quote.fiftyTwoWeekLow, true);
        
    } catch (error) {
        console.error('Error calculating performance metrics:', error);
    }
}

// Calculate return percentage
function calculateReturn(historicalData, currentPrice) {
    if (!historicalData || historicalData.length === 0) return 0;
    
    const oldPrice = historicalData[0].close;
    return ((currentPrice - oldPrice) / oldPrice) * 100;
}

// Update metric element
function updateMetricElement(elementId, value, isCurrency = false) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (isCurrency) {
        element.textContent = api.formatCurrency(value);
    } else {
        element.textContent = api.formatPercentage(value);
        element.className = `metric-value ${value >= 0 ? 'positive' : 'negative'}`;
    }
}

// Load company info
function loadCompanyInfo(symbol) {
    const aboutBtn = document.getElementById('aboutBtn');
    const aboutContent = document.getElementById('aboutContent');
    
    if (aboutBtn && aboutContent) {
        aboutBtn.addEventListener('click', () => {
            const isVisible = aboutContent.style.display === 'block';
            
            if (isVisible) {
                aboutContent.style.display = 'none';
                aboutBtn.textContent = 'MORE ABOUT';
            } else {
                aboutContent.innerHTML = `<p>${api.getCompanyInfo(symbol)}</p>`;
                aboutContent.style.display = 'block';
                aboutBtn.textContent = 'LESS ABOUT';
            }
        });
    }
}

// Load stock news
function loadStockNews(symbol) {
    const newsList = document.getElementById('newsList');
    if (!newsList) return;
    
    const news = api.generateMockNews(symbol);
    
    newsList.innerHTML = news.map(item => `
        <div class="news-item">
            <h4 class="news-title">${item.title}</h4>
            <p class="news-summary">${item.summary}</p>
            <div class="news-meta">
                <span class="news-source">${item.source}</span>
                <span class="news-time">${item.time}</span>
            </div>
        </div>
    `).join('');
}

// Load related stocks
async function loadRelatedStocks(symbol) {
    const relatedContainer = document.getElementById('relatedStocks');
    if (!relatedContainer) return;
    
    try {
        // Get related stocks (same sector)
        const relatedSymbols = getRelatedStocks(symbol);
        const relatedQuotes = await api.getMultipleQuotes(relatedSymbols);
        
        relatedContainer.innerHTML = relatedQuotes.map(quote => {
            const changeClass = quote.changePercent >= 0 ? 'positive' : 'negative';
            
            return `
                <div class="related-stock-item" data-symbol="${quote.symbol}">
                    <div class="related-stock-info">
                        <div class="related-stock-symbol">${quote.symbol}</div>
                        <div class="related-stock-price">${api.formatCurrency(quote.price)}</div>
                        <div class="related-stock-change ${changeClass}">${api.formatPercentage(quote.changePercent)}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        relatedContainer.querySelectorAll('.related-stock-item').forEach(item => {
            item.addEventListener('click', () => {
                const newSymbol = item.dataset.symbol;
                window.location.href = `stock.html?symbol=${newSymbol}`;
            });
        });
        
    } catch (error) {
        console.error('Error loading related stocks:', error);
        relatedContainer.innerHTML = '<div class="loading-placeholder">Error loading related stocks</div>';
    }
}

// Get related stocks based on symbol
function getRelatedStocks(symbol) {
    const stockGroups = {
        'AAPL': ['MSFT', 'GOOGL', 'META'],
        'MSFT': ['AAPL', 'GOOGL', 'CRM'],
        'GOOGL': ['AAPL', 'MSFT', 'META'],
        'AMZN': ['NFLX', 'GOOGL', 'META'],
        'TSLA': ['NVDA', 'AMD', 'AAPL'],
        'META': ['GOOGL', 'NFLX', 'AAPL'],
        'NFLX': ['META', 'GOOGL', 'AMZN'],
        'NVDA': ['AMD', 'INTC', 'TSLA'],
        'AMD': ['NVDA', 'INTC', 'MSFT'],
        'INTC': ['NVDA', 'AMD', 'MSFT']
    };
    
    return stockGroups[symbol] || ['AAPL', 'MSFT', 'GOOGL'];
}

// Get company name
function getCompanyName(symbol) {
    const companyNames = {
        'AAPL': 'Apple Inc.',
        'MSFT': 'Microsoft Corporation',
        'GOOGL': 'Alphabet Inc.',
        'AMZN': 'Amazon.com Inc.',
        'TSLA': 'Tesla Inc.',
        'META': 'Meta Platforms Inc.',
        'NFLX': 'Netflix Inc.',
        'NVDA': 'NVIDIA Corporation',
        'AMD': 'Advanced Micro Devices',
        'INTC': 'Intel Corporation',
        'CRM': 'Salesforce Inc.',
        'ADBE': 'Adobe Inc.'
    };
    
    return companyNames[symbol] || `${symbol} Corporation`;
}

// Initialize stock page handlers
function initializeStockPageHandlers(symbol) {
    initializeTradingButtons(symbol);
    initializeTradeModal(symbol);
}

// Initialize trading buttons
function initializeTradingButtons(symbol) {
    const buyBtn = document.getElementById('buyBtn');
    const sellBtn = document.getElementById('sellBtn');
    
    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            openTradeModal(symbol, 'buy');
        });
    }
    
    if (sellBtn) {
        sellBtn.addEventListener('click', () => {
            openTradeModal(symbol, 'sell');
        });
    }
}

// Initialize trade modal
function initializeTradeModal(symbol) {
    const modal = document.getElementById('tradeModal');
    const closeBtn = document.getElementById('tradeModalClose');
    const cancelBtn = document.getElementById('cancelTradeBtn');
    const submitBtn = document.getElementById('submitTradeBtn');
    const orderTypeSelect = document.getElementById('orderType');
    const quantityInput = document.getElementById('tradeQuantity');
    const priceInput = document.getElementById('tradePrice');
    
    // Close modal handlers
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeTradeModal();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeTradeModal();
        });
    }
    
    // Order type change handler
    if (orderTypeSelect) {
        orderTypeSelect.addEventListener('change', (e) => {
            const priceGroup = document.getElementById('priceGroup');
            if (priceGroup) {
                priceGroup.style.display = e.target.value === 'limit' ? 'block' : 'none';
            }
        });
    }
    
    // Quantity and price change handlers
    if (quantityInput) {
        quantityInput.addEventListener('input', () => {
            updateTradeEstimate();
        });
    }
    
    if (priceInput) {
        priceInput.addEventListener('input', () => {
            updateTradeEstimate();
        });
    }
    
    // Submit trade handler
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            submitTrade();
        });
    }
    
    // Close on outside click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeTradeModal();
            }
        });
    }
}

// Open trade modal
async function openTradeModal(symbol, side) {
    const modal = document.getElementById('tradeModal');
    const modalTitle = document.getElementById('tradeModalTitle');
    const symbolInput = document.getElementById('tradeSymbol');
    const sideSelect = document.getElementById('tradeSide');
    const priceInput = document.getElementById('tradePrice');
    const availableBalance = document.getElementById('availableBalance');
    
    if (!modal) return;
    
    try {
        // Get current quote
        const quote = await api.getQuote(symbol);
        const user = auth.getCurrentUser();
        
        // Set modal values
        if (modalTitle) modalTitle.textContent = `${side.toUpperCase()} ${symbol}`;
        if (symbolInput) symbolInput.value = symbol;
        if (sideSelect) sideSelect.value = side;
        if (priceInput) priceInput.value = quote.price.toFixed(2);
        if (availableBalance) availableBalance.textContent = api.formatCurrency(user.balance);
        
        // Store current quote price globally
        window.currentQuotePrice = quote.price;
        
        // Reset form
        const quantityInput = document.getElementById('tradeQuantity');
        const orderTypeSelect = document.getElementById('orderType');
        if (quantityInput) quantityInput.value = '1';
        if (orderTypeSelect) orderTypeSelect.value = 'market';
        
        // Hide price group initially
        const priceGroup = document.getElementById('priceGroup');
        if (priceGroup) priceGroup.style.display = 'none';
        
        // Update estimate
        updateTradeEstimate();
        
        // Show modal
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error opening trade modal:', error);
        alert('Error loading trade data');
    }
}

// Close trade modal
function closeTradeModal() {
    const modal = document.getElementById('tradeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Update trade estimate
function updateTradeEstimate() {
    const quantityInput = document.getElementById('tradeQuantity');
    const priceInput = document.getElementById('tradePrice');
    const orderTypeSelect = document.getElementById('orderType');
    const estimatedTotal = document.getElementById('estimatedTotal');
    
    if (!quantityInput || !estimatedTotal) return;
    
    const quantity = parseInt(quantityInput.value) || 0;
    let price;
    
    if (orderTypeSelect && orderTypeSelect.value === 'limit' && priceInput) {
        price = parseFloat(priceInput.value) || 0;
    } else {
        price = window.currentQuotePrice || 0;
    }
    
    const total = quantity * price;
    estimatedTotal.textContent = api.formatCurrency(total);
}

// Submit trade
async function submitTrade() {
    const symbolInput = document.getElementById('tradeSymbol');
    const sideSelect = document.getElementById('tradeSide');
    const quantityInput = document.getElementById('tradeQuantity');
    const orderTypeSelect = document.getElementById('orderType');
    const priceInput = document.getElementById('tradePrice');
    
    if (!symbolInput || !sideSelect || !quantityInput) return;
    
    const symbol = symbolInput.value;
    const side = sideSelect.value;
    const quantity = parseInt(quantityInput.value);
    
    let price;
    if (orderTypeSelect.value === 'limit' && priceInput) {
        price = parseFloat(priceInput.value);
    } else {
        price = window.currentQuotePrice;
    }
    
    // Validate inputs
    if (!quantity || quantity < 1) {
        alert('Please enter a valid quantity');
        return;
    }
    
    if (!price || price <= 0) {
        alert('Please enter a valid price');
        return;
    }
    
    try {
        let result;
        
        if (side === 'buy') {
            result = auth.buyStock(symbol, quantity, price);
        } else {
            result = auth.sellStock(symbol, quantity, price);
        }
        
        if (result.success) {
            const action = side === 'buy' ? 'bought' : 'sold';
            alert(`Successfully ${action} ${quantity} shares of ${symbol} for ${api.formatCurrency(quantity * price)}`);
            closeTradeModal();
            
            // Refresh data
            loadStockData(symbol);
        } else {
            alert(`Trade failed: ${result.error}`);
        }
        
    } catch (error) {
        console.error('Error submitting trade:', error);
        alert('Error processing trade');
    }
}

// Loading states
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function showChartLoading() {
    const canvas = document.getElementById('stockChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
            'Loading chart data...', 
            canvas.width / (2 * window.devicePixelRatio), 
            canvas.height / (2 * window.devicePixelRatio)
        );
    }
}

function hideChartLoading() {
    // Chart will be redrawn with new data
}

// Handle window resize
window.addEventListener('resize', () => {
    if (window.stockChart) {
        window.stockChart.resize();
    }
});

// Export functions for global use
window.openTradeModal = openTradeModal;
window.closeTradeModal = closeTradeModal;