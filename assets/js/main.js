// Main Application Logic - Complete Fixed Version
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Wait for all dependencies to load
    if (typeof AuthManager === 'undefined' || typeof YahooFinanceAPI === 'undefined') {
        console.error('Dependencies not loaded. Make sure scripts are included in correct order.');
        return;
    }
    
    // Initialize managers
    window.auth = new AuthManager();
    window.api = new YahooFinanceAPI();
    
    console.log('Auth and API initialized');
    
    // Page routing and initialization
    const currentPage = getCurrentPage();
    console.log('Current page:', currentPage);
    initializePage(currentPage);
});

// Get current page name
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    
    if (page === '' || page === 'index.html') return 'login';
    if (page === 'home.html') return 'home';
    if (page === 'register.html') return 'register';
    if (page === 'dashboard.html') return 'dashboard';
    if (page === 'radar.html') return 'radar';
    if (page === 'stock.html') return 'stock';
    if (page === 'pro.html') return 'pro';
    
    return 'unknown';
}

// Initialize page based on current page
function initializePage(page) {
    console.log('Initializing page:', page);
    
    switch(page) {
        case 'login':
            initializeLoginPage();
            break;
        case 'home':
            initializeHomePage();
            break;
        case 'register':
            initializeRegisterPage();
            break;
        case 'dashboard':
            initializeDashboardPage();
            break;
        case 'radar':
            initializeRadarPage();
            break;
        case 'stock':
            initializeStockPage();
            break;
        case 'pro':
            initializeProPage();
            break;
        default:
            console.log('Unknown page:', page);
    }
}

// Initialize login page
function initializeLoginPage() {
    console.log('Initializing login page');
    
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const loginBtn = document.getElementById('loginBtn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const customerId = document.getElementById('customerId').value;
            const pin = document.getElementById('pin').value;
            
            if (!customerId || !pin) {
                showMessage(errorMessage, 'Please enter both Customer ID and PIN');
                return;
            }
            
            // Show loading
            showButtonLoading(loginBtn);
            hideMessage(errorMessage);
            hideMessage(successMessage);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const result = auth.login(customerId, pin);
            
            hideButtonLoading(loginBtn);
            
            if (result.success) {
                showMessage(successMessage, 'Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showMessage(errorMessage, result.error);
            }
        });
    }
    
    // Redirect if already logged in
    if (auth.isLoggedIn()) {
        window.location.href = 'dashboard.html';
    }
}

// Initialize home page
function initializeHomePage() {
    console.log('Initializing home page');
    
    // Home page is accessible to everyone (guests and logged-in users)
    // Load market data, trending stocks, etc.
    loadHomePageData();
}

// Load home page data
async function loadHomePageData() {
    console.log('Loading home page data');
    
    try {
        // Load trending stocks for home page
        const trendingStocks = await api.getTrendingStocks();
        
        // You can add more home page specific functionality here
        // For example: market overview, top gainers, etc.
        
        console.log('Home page data loaded successfully');
    } catch (error) {
        console.error('Error loading home page data:', error);
    }
}

// Initialize register page
function initializeRegisterPage() {
    console.log('Initializing register page');
    
    const signupForm = document.getElementById('signup-form');
    
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const pin = document.getElementById('pin').value;
            const pinConfirm = document.getElementById('pin-confirm').value;
            
            // Validate PIN match
            if (pin !== pinConfirm) {
                alert('PINs do not match!');
                return;
            }
            
            // Validate PIN format
            if (!/^\d{6}$/.test(pin)) {
                alert('PIN must be exactly 6 digits!');
                return;
            }
            
            const result = auth.register(email, pin);
            
            if (result.success) {
                alert(`Registration successful! Your Customer ID is: ${result.customerId}\nPlease save this ID for login.`);
                window.location.href = 'index.html';
            } else {
                alert('Registration failed: ' + result.error);
            }
        });
    }
}

// Initialize dashboard page
function initializeDashboardPage() {
    console.log('Initializing dashboard page');
    
    // Check if user is logged in
    if (!auth.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    loadDashboardData();
}

// Load dashboard data
async function loadDashboardData() {
    console.log('Loading dashboard data');
    
    const user = auth.getCurrentUser();
    
    // Update portfolio value
    await updatePortfolioValue();
    
    // Load user's stocks
    loadUserStocks();
}

// Update portfolio value
async function updatePortfolioValue() {
    const user = auth.getCurrentUser();
    const portfolioValueEl = document.querySelector('.card .amount');
    const portfolioChangeEl = document.querySelector('.card .amount-subtitle');
    
    if (!portfolioValueEl) return;
    
    let totalValue = user.balance;
    let totalChange = 0;
    
    // Calculate portfolio value
    for (const [symbol, holding] of Object.entries(user.portfolio)) {
        try {
            const quote = await api.getQuote(symbol);
            const currentValue = holding.shares * quote.price;
            const costBasis = holding.shares * holding.avgPrice;
            
            totalValue += currentValue;
            totalChange += (currentValue - costBasis);
        } catch (error) {
            console.error(`Error getting quote for ${symbol}:`, error);
        }
    }
    
    const changePercent = totalValue > 0 ? (totalChange / (totalValue - totalChange)) * 100 : 0;
    
    portfolioValueEl.textContent = api.formatCurrency(totalValue);
    portfolioChangeEl.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}% Today`;
    portfolioChangeEl.className = `amount-subtitle ${changePercent >= 0 ? 'positive' : 'negative'}`;
}

// Load user's stocks
async function loadUserStocks() {
    const user = auth.getCurrentUser();
    const stocksContainer = document.querySelector('.stocks-section');
    
    if (!stocksContainer || Object.keys(user.portfolio).length === 0) {
        if (stocksContainer) {
            stocksContainer.innerHTML = `
                <div class="card-title">Your Stocks</div>
                <div class="stock-item">
                    <span>No stocks in portfolio</span>
                    <span><a href="radar.html">Browse stocks</a></span>
                </div>
            `;
        }
        return;
    }
    
    let stocksHtml = '<div class="card-title">Your Stocks</div>';
    
    for (const [symbol] of Object.entries(user.portfolio)) {
        try {
            const quote = await api.getQuote(symbol);
            const changeClass = quote.changePercent >= 0 ? 'positive' : 'negative';
            
            stocksHtml += `
                <a href="stock.html?symbol=${symbol}" class="stock-item">
                    <span>${quote.symbol}</span>
                    <span class="${changeClass}">${api.formatPercentage(quote.changePercent)}</span>
                </a>
            `;
        } catch (error) {
            console.error(`Error loading ${symbol}:`, error);
        }
    }
    
    stocksContainer.innerHTML = stocksHtml;
}

// Initialize radar page
function initializeRadarPage() {
    console.log('Initializing radar page');
    
    // Radar page is accessible to everyone, but some features require login
    initializeStockSearch();
    loadRadarData();
    
    // If user is not logged in, show login prompt for trading features
    if (!auth.isLoggedIn()) {
        // Add login prompts to buy buttons, etc.
        addLoginPromptsToTradingFeatures();
    }
}

// Add login prompts to trading features for guests
function addLoginPromptsToTradingFeatures() {
    // This function can add event listeners that show login prompts
    // when guests try to use trading features
    setTimeout(() => {
        const buyButtons = document.querySelectorAll('.buy-btn');
        buyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                alert('Please login to start trading stocks!');
                window.location.href = 'index.html';
            });
        });
    }, 1000);
}

// Initialize stock search
function initializeStockSearch() {
    const searchInput = document.getElementById('stockSearch');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchResults) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            try {
                const results = await api.searchStocks(query);
                displaySearchResults(results, searchResults);
            } catch (error) {
                console.error('Search error:', error);
                searchResults.style.display = 'none';
            }
        }, 300);
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

// Display search results
function displaySearchResults(results, container) {
    if (results.length === 0) {
        container.innerHTML = '<div class="search-result-item">No results found</div>';
        container.style.display = 'block';
        return;
    }
    
    container.innerHTML = results.slice(0, 8).map(result => `
        <div class="search-result-item" data-symbol="${result.symbol}">
            <div>
                <div class="search-result-symbol">${result.symbol}</div>
                <div class="search-result-name">${result.shortname || result.longname}</div>
            </div>
            <div class="search-result-price">View</div>
        </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const symbol = item.dataset.symbol;
            window.location.href = `stock.html?symbol=${symbol}`;
        });
    });
    
    container.style.display = 'block';
}

// Load radar data
async function loadRadarData() {
    await Promise.all([
        loadTopRecommended(),
        loadWorstPerformers()
    ]);
}

// Load top recommended stocks
async function loadTopRecommended() {
    const container = document.getElementById('topRecommendedGrid');
    if (!container) return;
    
    try {
        const stocks = await api.getTopGainers();
        displayStockGrid(stocks, container);
    } catch (error) {
        console.error('Error loading top recommended:', error);
        container.innerHTML = '<div class="loading-placeholder">Error loading data</div>';
    }
}

// Load worst performers
async function loadWorstPerformers() {
    const container = document.getElementById('worstPerformersGrid');
    if (!container) return;
    
    try {
        const stocks = await api.getTopLosers();
        displayStockGrid(stocks, container);
    } catch (error) {
        console.error('Error loading worst performers:', error);
        container.innerHTML = '<div class="loading-placeholder">Error loading data</div>';
    }
}

// Display stock grid
function displayStockGrid(stocks, container) {
    if (stocks.length === 0) {
        container.innerHTML = '<div class="loading-placeholder">No data available</div>';
        return;
    }
    
    container.innerHTML = stocks.map(stock => {
        const changeClass = stock.changePercent >= 0 ? 'positive' : 'negative';
        const category = getStockCategory(stock.symbol);
        
        return `
            <div class="stock-card" data-symbol="${stock.symbol}">
                <div class="stock-info">
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-details">
                        <div class="stock-category">${category}</div>
                    </div>
                </div>
                <div class="stock-price">${api.formatCurrency(stock.price)}</div>
                <div class="stock-change ${changeClass}">${api.formatPercentage(stock.changePercent)}</div>
                <div class="stock-actions">
                    <button class="buy-btn" onclick="openStockModal('${stock.symbol}')">BUY</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click handlers for stock cards
    container.querySelectorAll('.stock-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('buy-btn')) {
                const symbol = card.dataset.symbol;
                window.location.href = `stock.html?symbol=${symbol}`;
            }
        });
    });
}

// Get stock category (simplified)
function getStockCategory(symbol) {
    const categories = {
        'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology',
        'AMZN': 'E-commerce', 'TSLA': 'Automotive', 'META': 'Social Media',
        'NFLX': 'Entertainment', 'NVDA': 'Semiconductors', 'AMD': 'Semiconductors',
        'INTC': 'Semiconductors', 'CRM': 'Software', 'ADBE': 'Software'
    };
    
    return categories[symbol] || 'Equity';
}

// Open stock modal (for quick buy)
async function openStockModal(symbol) {
    try {
        const quote = await api.getQuote(symbol);
        
        // Create modal HTML
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${symbol} - Quick Buy</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="stock-modal-details">
                        <div class="detail-row">
                            <span class="detail-label">Current Price</span>
                            <span class="detail-value">${api.formatCurrency(quote.price)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Change</span>
                            <span class="detail-value ${quote.changePercent >= 0 ? 'positive' : 'negative'}">
                                ${api.formatPercentage(quote.changePercent)}
                            </span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Quantity</label>
                        <input type="number" id="quickBuyQuantity" min="1" max="1000" value="1" class="form-input">
                    </div>
                    <div class="trade-summary">
                        <div class="summary-row">
                            <span>Total Cost:</span>
                            <span id="quickBuyTotal">${api.formatCurrency(quote.price)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Available Balance:</span>
                            <span>${api.formatCurrency(auth.getCurrentUser().balance)}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="executeBuy('${symbol}', ${quote.price})">Buy Now</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add quantity change handler
        const quantityInput = document.getElementById('quickBuyQuantity');
        const totalSpan = document.getElementById('quickBuyTotal');
        
        quantityInput.addEventListener('input', () => {
            const quantity = parseInt(quantityInput.value) || 0;
            const total = quantity * quote.price;
            totalSpan.textContent = api.formatCurrency(total);
        });
        
        // Add close handler
        modal.querySelector('.modal-close').addEventListener('click', () => {
            closeModal();
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
    } catch (error) {
        console.error('Error opening stock modal:', error);
        alert('Error loading stock data');
    }
}

function closeModal() {
    const modal = document.querySelector('.modal.active');
    if (modal) {
        modal.remove();
    }
}

async function executeBuy(symbol, price) {
    const quantity = parseInt(document.getElementById('quickBuyQuantity').value);
    
    if (!quantity || quantity < 1) {
        alert('Please enter a valid quantity');
        return;
    }
    
    const result = auth.buyStock(symbol, quantity, price);
    
    if (result.success) {
        alert(`Successfully bought ${quantity} shares of ${symbol} for ${api.formatCurrency(quantity * price)}`);
        closeModal();
        
        // Update navbar to reflect new balance
        if (window.navbarManager) {
            window.navbarManager.updateUserInfo();
        }
        
        // Refresh dashboard if on dashboard page
        if (getCurrentPage() === 'dashboard') {
            loadDashboardData();
        }
    } else {
        alert('Purchase failed: ' + result.error);
    }
}

// Initialize stock page - FIXED TO PREVENT INFINITE RECURSION
function initializeStockPage() {
    console.log('Initializing stock page from main.js');
    
    // Check if user is logged in
    if (!auth.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    // CRITICAL FIX: Use different function names to prevent recursion
    // Try multiple approaches to initialize the stock page
    
    // Method 1: Try stockPageInitializer (renamed function from stock-page.js)
    if (typeof window.stockPageInitializer === 'function') {
        console.log('✅ Using stockPageInitializer');
        window.stockPageInitializer();
        return;
    }
    
    // Method 2: Try calling loadStockData directly
    if (typeof window.loadStockData === 'function') {
        console.log('✅ Using loadStockData directly');
        const urlParams = new URLSearchParams(window.location.search);
        const symbol = urlParams.get('symbol');
        
        if (symbol) {
            window.loadStockData(symbol);
            
            // Also try to initialize handlers if available
            if (typeof window.initializeStockPageHandlers === 'function') {
                window.initializeStockPageHandlers(symbol);
            }
        } else {
            alert('No stock symbol provided');
            window.location.href = 'radar.html';
        }
        return;
    }
    
    // Method 3: Fallback - wait for functions to load
    console.log('⏳ Stock page functions not ready, waiting...');
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    const waitForStockFunctions = () => {
        attempts++;
        
        if (typeof window.loadStockData === 'function' || typeof window.stockPageInitializer === 'function') {
            console.log('✅ Stock functions loaded after waiting');
            initializeStockPage(); // Try again now that functions are loaded
            return;
        }
        
        if (attempts >= maxAttempts) {
            console.error('❌ Stock page functions never loaded');
            showStockPageError();
            return;
        }
        
        setTimeout(waitForStockFunctions, 100);
    };
    
    setTimeout(waitForStockFunctions, 100);
}

// Show error when stock page fails to load
function showStockPageError() {
    const stockSymbol = document.getElementById('stockSymbol');
    const stockName = document.getElementById('stockName');
    
    if (stockSymbol) {
        stockSymbol.textContent = 'Error Loading Stock';
        stockSymbol.style.color = '#ff4444';
    }
    
    if (stockName) {
        stockName.innerHTML = `
            Stock page failed to load properly. 
            <br>
            <button onclick="window.location.reload()" style="
                background: #4a90e2; 
                color: white; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 5px; 
                cursor: pointer;
                margin-top: 10px;
            ">
                Reload Page
            </button>
        `;
    }
    
    // Also show error in chart area
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div style="
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100%; 
                color: #ff4444;
                text-align: center;
            ">
                <h3>⚠️ Chart Loading Error</h3>
                <p>The stock page scripts failed to load properly.</p>
                <button onclick="window.location.reload()" style="
                    background: #4a90e2; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    cursor: pointer;
                    margin-top: 10px;
                ">
                    Reload Page
                </button>
            </div>
        `;
    }
}

// Initialize pro page
function initializeProPage() {
    console.log('Initializing pro page');
    
    // Pro page is accessible to everyone
    const upgradeBtn = document.getElementById('upgradeBtn');
    
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (auth.isLoggedIn()) {
                // Show upgrade modal for logged-in users
                showProUpgradeModal();
            } else {
                // Prompt guest users to login first
                alert('Please login to upgrade to VANTYX Pro!');
                window.location.href = 'index.html';
            }
        });
    }
    
    // Update page content based on login status
    updateProPageForUserStatus();
}

// Show pro upgrade modal for logged-in users
function showProUpgradeModal() {
    // Create modal for pro upgrade
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Upgrade to VANTYX Pro</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="upgrade-info">
                    <h4>🚀 VANTYX Pro Features</h4>
                    <ul>
                        <li>✅ Real-time market data</li>
                        <li>✅ Advanced charting tools</li>
                        <li>✅ Portfolio analytics</li>
                        <li>✅ Priority customer support</li>
                        <li>✅ API access for algorithmic trading</li>
                    </ul>
                    <div class="price-display">
                        <span class="currency">$</span>
                        <span class="price">29.99</span>
                        <span class="period">/month</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="processProUpgrade()">Upgrade Now</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close handler
    modal.querySelector('.modal-close').addEventListener('click', () => {
        closeModal();
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Process pro upgrade (demo)
function processProUpgrade() {
    // Simulate upgrade process
    alert('Pro upgrade feature coming soon! This is a demo version.\n\nIn the real version, this would integrate with payment processing.');
    closeModal();
}

// Update pro page content based on user status
function updateProPageForUserStatus() {
    const user = auth.getCurrentUser();
    
    // Update any user-specific content on the pro page
    if (user) {
        // Show personalized content for logged-in users
        const userElements = document.querySelectorAll('.user-specific');
        userElements.forEach(el => {
            el.style.display = 'block';
        });
    } else {
        // Show generic content for guests
        const guestElements = document.querySelectorAll('.guest-specific');
        guestElements.forEach(el => {
            el.style.display = 'block';
        });
    }
}

// Utility functions
function showMessage(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function hideMessage(element) {
    if (element) {
        element.style.display = 'none';
    }
}

function showButtonLoading(button) {
    if (button) {
        const text = button.querySelector('.btn-text');
        const loader = button.querySelector('.btn-loader');
        
        if (text) text.style.display = 'none';
        if (loader) loader.style.display = 'inline-block';
        
        button.disabled = true;
    }
}

function hideButtonLoading(button) {
    if (button) {
        const text = button.querySelector('.btn-text');
        const loader = button.querySelector('.btn-loader');
        
        if (text) text.style.display = 'inline';
        if (loader) loader.style.display = 'none';
        
        button.disabled = false;
    }
}

// Export functions for global use
window.openStockModal = openStockModal;
window.closeModal = closeModal;
window.executeBuy = executeBuy;
window.processProUpgrade = processProUpgrade;
window.showStockPageError = showStockPageError;