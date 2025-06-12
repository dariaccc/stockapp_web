/**
 * VANTYX - Dashboard Page Functionality
 * Handles dashboard interactions, data loading, and trading features
 */

class DashboardPage {
    constructor() {
        this.currentUser = null;
        this.portfolio = [];
        this.watchlist = [];
        this.marketData = {};
        this.refreshInterval = null;
        this.isLoading = false;
        
        // DOM elements
        this.elements = {
            userName: Utils.dom.get('userName'),
            userLocation: Utils.dom.get('userLocation'),
            investmentValue: Utils.dom.get('investmentValue'),
            investmentReturn: Utils.dom.get('investmentReturn'),
            currentValue: Utils.dom.get('currentValue'),
            currentTrend: Utils.dom.get('currentTrend'),
            shortTermGain: Utils.dom.get('shortTermGain'),
            longTermGain: Utils.dom.get('longTermGain'),
            monthlySip: Utils.dom.get('monthlySip'),
            favouritesList: Utils.dom.get('favouritesList'),
            profileProgress: Utils.dom.get('profileProgress'),
            stockModal: Utils.dom.get('stockModal'),
            tradeModal: Utils.dom.get('tradeModal'),
            loadingOverlay: Utils.dom.get('loadingOverlay'),
            themeToggle: Utils.dom.get('themeToggle'),
            languageSelect: Utils.dom.get('languageSelect')
        };
        
        this.init();
    }
    
    /**
     * Initialize dashboard
     */
    async init() {
        console.log('Dashboard page initialized');
        
        // Check authentication
        if (!this.checkAuthentication()) {
            return;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize theme
        this.initializeTheme();
        
        // Load user data
        await this.loadUserData();
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Setup real-time updates
        this.setupRealTimeUpdates();
        
        // Show dashboard with animation
        Utils.animate.slideUp('.dashboard-content');
    }
    
    /**
     * Check if user is authenticated
     */
    checkAuthentication() {
        if (!userManager.isLoggedIn()) {
            Toast.warning('Please login to access the dashboard');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return false;
        }
        
        this.currentUser = userManager.getCurrentUser();
        return true;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Quick action buttons
        const actionButtons = Utils.dom.queryAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.getAttribute('data-action');
                this.handleQuickAction(action);
            });
        });
        
        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Language selector
        if (this.elements.languageSelect) {
            this.elements.languageSelect.addEventListener('change', (e) => this.changeLanguage(e.target.value));
        }
        
        // Navigation
        this.setupNavigationLinks();
        
        // Modals
        this.setupModals();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Window events
        window.addEventListener('focus', () => this.handleWindowFocus());
        window.addEventListener('blur', () => this.handleWindowBlur());
    }
    
    /**
     * Load user data and populate UI
     */
    async loadUserData() {
        if (!this.currentUser) return;
        
        // Update user info
        if (this.elements.userName) {
            this.elements.userName.textContent = this.currentUser.name;
        }
        
        // Set default location (you can make this editable)
        if (this.elements.userLocation) {
            this.elements.userLocation.textContent = this.currentUser.location || 'Mumbai, India';
        }
        
        // Load portfolio and watchlist
        this.portfolio = userManager.getPortfolio();
        this.watchlist = userManager.getWatchlist();
        
        console.log('User data loaded:', {
            user: this.currentUser.name,
            portfolio: this.portfolio.length,
            watchlist: this.watchlist.length
        });
    }
    
    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        this.setLoadingState(true);
        
        try {
            // Load market data for portfolio stocks
            await this.loadPortfolioData();
            
            // Load watchlist data
            await this.loadWatchlistData();
            
            // Calculate and update portfolio metrics
            this.updatePortfolioMetrics();
            
            // Update favourites section
            this.updateFavouritesSection();
            
            // Update progress circle
            this.updateProgressCircle();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            Toast.error('Failed to load dashboard data');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Load portfolio data from API
     */
    async loadPortfolioData() {
        if (this.portfolio.length === 0) return;
        
        const symbols = this.portfolio.map(p => p.symbol);
        const result = await apiService.getMultipleQuotes(symbols);
        
        if (result.success) {
            // Update portfolio with current prices
            this.portfolio.forEach(position => {
                const quote = result.data[position.symbol];
                if (quote) {
                    position.currentPrice = quote.price;
                    position.change = quote.change;
                    position.changePercent = quote.changePercent;
                    position.currentValue = position.shares * quote.price;
                    position.totalGain = position.currentValue - (position.shares * position.avgPrice);
                    position.gainPercent = (position.totalGain / (position.shares * position.avgPrice)) * 100;
                }
            });
        }
    }
    
    /**
     * Load watchlist data
     */
    async loadWatchlistData() {
        if (this.watchlist.length === 0) {
            // Add default stocks to watchlist
            this.watchlist = ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'AMZN'];
            userManager.currentUser.watchlist = this.watchlist;
            userManager.saveCurrentUser();
        }
        
        const result = await apiService.getMultipleQuotes(this.watchlist);
        
        if (result.success) {
            this.marketData = result.data;
        }
    }
    
    /**
     * Update portfolio metrics
     */
    updatePortfolioMetrics() {
        const totalInvestment = this.portfolio.reduce((sum, p) => sum + (p.shares * p.avgPrice), 0);
        const totalCurrentValue = this.portfolio.reduce((sum, p) => sum + (p.currentValue || 0), 0);
        const totalGain = totalCurrentValue - totalInvestment;
        const totalGainPercent = totalInvestment > 0 ? (totalGain / totalInvestment) * 100 : 0;
        
        // Calculate short-term and long-term gains (simplified)
        const shortTermGain = totalGain * 0.2; // 20% as short-term
        const longTermGain = totalGain * 0.8; // 80% as long-term
        
        // Update investment value
        if (this.elements.investmentValue) {
            this.elements.investmentValue.textContent = Utils.format.currency(totalInvestment);
        }
        
        if (this.elements.investmentReturn) {
            this.elements.investmentReturn.textContent = `▲ ${Math.abs(totalGainPercent).toFixed(1)}%`;
            this.elements.investmentReturn.className = `percentage ${totalGainPercent >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update current value
        if (this.elements.currentValue) {
            this.elements.currentValue.textContent = Utils.format.currency(totalCurrentValue);
        }
        
        if (this.elements.currentTrend) {
            this.elements.currentTrend.textContent = `${totalGainPercent >= 0 ? '▲' : '▼'} ${Math.abs(totalGainPercent).toFixed(1)}%`;
            this.elements.currentTrend.className = `trend ${totalGainPercent >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update gains
        if (this.elements.shortTermGain) {
            this.elements.shortTermGain.textContent = Utils.format.currency(shortTermGain);
        }
        
        if (this.elements.longTermGain) {
            this.elements.longTermGain.textContent = Utils.format.currency(longTermGain);
        }
        
        // Update monthly SIP
        if (this.elements.monthlySip) {
            this.elements.monthlySip.textContent = Utils.format.currency(this.currentUser.monthlySip || 100);
        }
    }
    
    /**
     * Update favourites section
     */
    updateFavouritesSection() {
        if (!this.elements.favouritesList) return;
        
        this.elements.favouritesList.innerHTML = '';
        
        // Show top 3 watchlist stocks
        const topStocks = this.watchlist.slice(0, 3);
        
        topStocks.forEach(symbol => {
            const stockData = this.marketData[symbol];
            if (!stockData) return;
            
            const favouriteItem = Utils.dom.create('div', { class: 'favourite-item' });
            favouriteItem.innerHTML = `
                <div class="stock-info">
                    <div class="stock-symbol">${symbol}</div>
                    <div class="stock-details">
                        <span>Large Cap</span>
                    </div>
                </div>
                <div class="stock-price">${Utils.format.currency(stockData.price)}</div>
                <div class="stock-actions">
                    <button class="action-btn-small sell" data-symbol="${symbol}">SELL</button>
                </div>
            `;
            
            // Add click handlers
            favouriteItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('action-btn-small')) {
                    this.showStockDetails(symbol);
                }
            });
            
            const sellBtn = favouriteItem.querySelector('.action-btn-small');
            sellBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openTradeModal(symbol, 'sell');
            });
            
            this.elements.favouritesList.appendChild(favouriteItem);
        });
    }
    
    /**
     * Update progress circle
     */
    updateProgressCircle() {
        if (!this.elements.profileProgress) return;
        
        // Calculate progress based on portfolio performance
        const totalInvestment = this.portfolio.reduce((sum, p) => sum + (p.shares * p.avgPrice), 0);
        const totalCurrentValue = this.portfolio.reduce((sum, p) => sum + (p.currentValue || 0), 0);
        const gainPercent = totalInvestment > 0 ? ((totalCurrentValue - totalInvestment) / totalInvestment) * 100 : 0;
        
        // Convert to progress (0-100%)
        const progress = Math.min(Math.max(gainPercent + 50, 0), 100); // Offset by 50 to show progress
        
        const circle = this.elements.profileProgress.querySelector('circle:last-child');
        const progressValue = this.elements.profileProgress.querySelector('.progress-value');
        
        if (circle && progressValue) {
            const radius = 54;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (progress / 100) * circumference;
            
            circle.style.strokeDashoffset = offset;
            progressValue.textContent = `${Math.round(progress)}%`;
        }
    }
    
    /**
     * Handle quick actions
     */
    handleQuickAction(action) {
        console.log('Quick action triggered:', action);
        
        switch (action) {
            case 'mutual-funds':
                Toast.info('Mutual funds section coming soon!');
                break;
            case 'stocks':
                this.showStocksList();
                break;
            case 'fixed-deposits':
                Toast.info('Fixed deposits section coming soon!');
                break;
            case 'monthly-sip':
                this.showSipOptions();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }
    
    /**
     * Show stocks list (placeholder)
     */
    showStocksList() {
        Toast.info('Stocks page coming soon!');
        // In a real app, this would navigate to a stocks page
    }
    
    /**
     * Show SIP options (placeholder)
     */
    showSipOptions() {
        Toast.info('SIP management coming soon!');
        // In a real app, this would show SIP configuration
    }
    
    /**
     * Show stock details modal
     */
    async showStockDetails(symbol) {
        if (!this.elements.stockModal) return;
        
        Loading.show('Loading stock details...');
        
        try {
            const result = await apiService.getStockQuote(symbol);
            
            if (result.success) {
                const stock = result.data;
                
                const modalTitle = this.elements.stockModal.querySelector('#stockModalTitle');
                const modalBody = this.elements.stockModal.querySelector('#stockModalBody');
                
                if (modalTitle) {
                    modalTitle.textContent = `${stock.symbol} - ${stock.name}`;
                }
                
                if (modalBody) {
                    modalBody.innerHTML = `
                        <div class="stock-details-grid">
                            <div class="detail-item">
                                <label>Current Price</label>
                                <span class="value">${Utils.format.currency(stock.price)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Change</label>
                                <span class="value ${stock.change >= 0 ? 'positive' : 'negative'}">
                                    ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)
                                </span>
                            </div>
                            <div class="detail-item">
                                <label>Volume</label>
                                <span class="value">${Utils.format.number(stock.volume, 0)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Market Cap</label>
                                <span class="value">${Utils.format.currency(stock.marketCap)}</span>
                            </div>
                            <div class="detail-item">
                                <label>P/E Ratio</label>
                                <span class="value">${stock.pe}</span>
                            </div>
                            <div class="detail-item">
                                <label>52W High</label>
                                <span class="value">${Utils.format.currency(stock.high52w)}</span>
                            </div>
                        </div>
                    `;
                }
                
                // Setup modal buttons
                this.setupStockModalButtons(symbol);
                
                // Show modal
                this.elements.stockModal.classList.add('active');
                Utils.animate.fadeIn(this.elements.stockModal);
            }
        } catch (error) {
            console.error('Error loading stock details:', error);
            Toast.error('Failed to load stock details');
        } finally {
            Loading.hide();
        }
    }
    
    /**
     * Setup stock modal buttons
     */
    setupStockModalButtons(symbol) {
        const buyBtn = Utils.dom.get('buyStockBtn');
        const sellBtn = Utils.dom.get('sellStockBtn');
        const watchlistBtn = Utils.dom.get('addToWatchlistBtn');
        
        if (buyBtn) {
            buyBtn.onclick = () => {
                this.closeStockModal();
                this.openTradeModal(symbol, 'buy');
            };
        }
        
        if (sellBtn) {
            sellBtn.onclick = () => {
                this.closeStockModal();
                this.openTradeModal(symbol, 'sell');
            };
        }
        
        if (watchlistBtn) {
            const isInWatchlist = this.watchlist.includes(symbol);
            watchlistBtn.textContent = isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist';
            watchlistBtn.onclick = () => {
                this.toggleWatchlist(symbol);
            };
        }
    }
    
    /**
     * Open trade modal
     */
    openTradeModal(symbol, side = 'buy') {
        if (!this.elements.tradeModal) return;
        
        const symbolInput = Utils.dom.get('tradeSymbol');
        const sideSelect = Utils.dom.get('tradeSide');
        const priceInput = Utils.dom.get('tradePrice');
        const availableBalance = Utils.dom.get('availableBalance');
        
        if (symbolInput) symbolInput.value = symbol;
        if (sideSelect) sideSelect.value = side;
        if (availableBalance) {
            availableBalance.textContent = Utils.format.currency(this.currentUser.balance || 10000);
        }
        
        // Set current market price
        const stockData = this.marketData[symbol];
        if (stockData && priceInput) {
            priceInput.value = stockData.price.toFixed(2);
        }
        
        this.setupTradeModalCalculations();
        this.setupTradeModalSubmission();
        
        this.elements.tradeModal.classList.add('active');
        Utils.animate.fadeIn(this.elements.tradeModal);
    }
    
    /**
     * Setup trade modal calculations
     */
    setupTradeModalCalculations() {
        const quantityInput = Utils.dom.get('tradeQuantity');
        const priceInput = Utils.dom.get('tradePrice');
        const totalSpan = Utils.dom.get('estimatedTotal');
        
        const updateTotal = () => {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const total = quantity * price;
            
            if (totalSpan) {
                totalSpan.textContent = Utils.format.currency(total);
            }
        };
        
        if (quantityInput) quantityInput.addEventListener('input', updateTotal);
        if (priceInput) priceInput.addEventListener('input', updateTotal);
        
        updateTotal();
    }
    
    /**
     * Setup trade modal submission
     */
    setupTradeModalSubmission() {
        const submitBtn = Utils.dom.get('submitTradeBtn');
        const cancelBtn = Utils.dom.get('cancelTradeBtn');
        
        if (submitBtn) {
            submitBtn.onclick = () => this.submitTrade();
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => this.closeTradeModal();
        }
    }
    
    /**
     * Submit trade order
     */
    async submitTrade() {
        const form = Utils.dom.get('tradeForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const orderData = {
            symbol: formData.get('symbol'),
            type: formData.get('type'),
            side: formData.get('side'),
            quantity: parseInt(formData.get('quantity')),
            price: parseFloat(formData.get('price'))
        };
        
        // Validate order
        if (!this.validateTradeOrder(orderData)) {
            return;
        }
        
        Loading.show('Placing order...');
        
        try {
            const result = await apiService.placeOrder(orderData);
            
            if (result.success) {
                Toast.success('Order placed successfully!');
                this.closeTradeModal();
                
                // Refresh dashboard data
                await this.loadDashboardData();
            } else {
                Toast.error(result.error || 'Failed to place order');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            Toast.error('Failed to place order');
        } finally {
            Loading.hide();
        }
    }
    
    /**
     * Validate trade order
     */
    validateTradeOrder(orderData) {
        if (!orderData.symbol || !orderData.quantity || !orderData.price) {
            Toast.error('Please fill in all required fields');
            return false;
        }
        
        if (orderData.quantity <= 0) {
            Toast.error('Quantity must be greater than 0');
            return false;
        }
        
        if (orderData.price <= 0) {
            Toast.error('Price must be greater than 0');
            return false;
        }
        
        const total = orderData.quantity * orderData.price;
        const balance = this.currentUser.balance || 0;
        
        if (orderData.side === 'buy' && total > balance) {
            Toast.error('Insufficient balance');
            return false;
        }
        
        if (orderData.side === 'sell') {
            const position = this.portfolio.find(p => p.symbol === orderData.symbol);
            if (!position || position.shares < orderData.quantity) {
                Toast.error('Insufficient shares to sell');
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Toggle stock in watchlist
     */
    toggleWatchlist(symbol) {
        const isInWatchlist = this.watchlist.includes(symbol);
        
        if (isInWatchlist) {
            if (userManager.removeFromWatchlist(symbol)) {
                this.watchlist = this.watchlist.filter(s => s !== symbol);
                Toast.success(`${symbol} removed from watchlist`);
            }
        } else {
            if (userManager.addToWatchlist(symbol)) {
                this.watchlist.push(symbol);
                Toast.success(`${symbol} added to watchlist`);
            }
        }
        
        this.closeStockModal();
        this.updateFavouritesSection();
    }
    
    /**
     * Setup modals
     */
    setupModals() {
        // Stock modal
        const stockModalClose = Utils.dom.get('stockModalClose');
        if (stockModalClose) {
            stockModalClose.addEventListener('click', () => this.closeStockModal());
        }
        
        // Trade modal
        const tradeModalClose = Utils.dom.get('tradeModalClose');
        if (tradeModalClose) {
            tradeModalClose.addEventListener('click', () => this.closeTradeModal());
        }
        
        // Close modals on backdrop click
        if (this.elements.stockModal) {
            this.elements.stockModal.addEventListener('click', (e) => {
                if (e.target === this.elements.stockModal) {
                    this.closeStockModal();
                }
            });
        }
        
        if (this.elements.tradeModal) {
            this.elements.tradeModal.addEventListener('click', (e) => {
                if (e.target === this.elements.tradeModal) {
                    this.closeTradeModal();
                }
            });
        }
    }
    
    /**
     * Close stock modal
     */
    closeStockModal() {
        if (this.elements.stockModal) {
            this.elements.stockModal.classList.remove('active');
            Utils.animate.fadeOut(this.elements.stockModal);
        }
    }
    
    /**
     * Close trade modal
     */
    closeTradeModal() {
        if (this.elements.tradeModal) {
            this.elements.tradeModal.classList.remove('active');
            Utils.animate.fadeOut(this.elements.tradeModal);
        }
    }
    
    /**
     * Setup real-time updates
     */
    setupRealTimeUpdates() {
        // Refresh data every 30 seconds
        this.refreshInterval = setInterval(() => {
            if (!document.hidden && userManager.isLoggedIn()) {
                this.refreshMarketData();
            }
        }, 30000);
    }
    
    /**
     * Refresh market data
     */
    async refreshMarketData() {
        try {
            await this.loadWatchlistData();
            await this.loadPortfolioData();
            this.updatePortfolioMetrics();
            this.updateFavouritesSection();
        } catch (error) {
            console.warn('Failed to refresh market data:', error);
        }
    }
    
    /**
     * Handle window focus
     */
    handleWindowFocus() {
        console.log('Dashboard gained focus');
        if (userManager.isLoggedIn()) {
            userManager.refreshSession();
            this.refreshMarketData();
        }
    }
    
    /**
     * Handle window blur
     */
    handleWindowBlur() {
        console.log('Dashboard lost focus');
    }
    
    /**
     * Setup navigation links
     */
    setupNavigationLinks() {
        const navLinks = Utils.dom.queryAll('[data-page]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                
                if (page === 'logout') {
                    this.handleLogout();
                } else {
                    this.navigateTo(`${page}.html`);
                }
            });
        });
    }
    
    /**
     * Handle logout
     */
    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear refresh interval
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }
            
            userManager.logout();
        }
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape key closes modals
            if (e.key === 'Escape') {
                this.closeStockModal();
                this.closeTradeModal();
            }
            
            // R key refreshes data
            if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.refreshMarketData();
                Toast.info('Refreshing data...');
            }
        });
    }
    
    /**
     * Initialize theme
     */
    initializeTheme() {
        const savedTheme = Utils.storage.get(APP_CONFIG.storage.theme, APP_CONFIG.defaults.theme);
        
        if (savedTheme === 'light') {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            if (this.elements.themeToggle) {
                this.elements.themeToggle.classList.add('active');
            }
        }
    }
    
    /**
     * Toggle theme
     */
    toggleTheme() {
        const isDark = document.body.classList.contains('dark-theme');
        
        if (isDark) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            this.elements.themeToggle.classList.add('active');
            Utils.storage.set(APP_CONFIG.storage.theme, 'light');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            this.elements.themeToggle.classList.remove('active');
            Utils.storage.set(APP_CONFIG.storage.theme, 'dark');
        }
    }
    
    /**
     * Change language
     */
    changeLanguage(language) {
        Utils.storage.set(APP_CONFIG.storage.language, language);
        console.log('Language changed to:', language);
    }
    
    /**
     * Set loading state
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        
        if (loading) {
            if (this.elements.loadingOverlay) {
                this.elements.loadingOverlay.style.display = 'flex';
                Utils.animate.fadeIn(this.elements.loadingOverlay);
            }
        } else {
            if (this.elements.loadingOverlay) {
                Utils.animate.fadeOut(this.elements.loadingOverlay);
            }
        }
    }
    
    /**
     * Navigate to page
     */
    navigateTo(page) {
        Utils.animate.fadeOut('body', 300);
        setTimeout(() => {
            window.location.href = page;
        }, 300);
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Initialize dashboard page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboardPage = new DashboardPage();
    
    // Make globally available for debugging
    if (typeof window !== 'undefined') {
        window.dashboardPage = dashboardPage;
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        dashboardPage.destroy();
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardPage;
}
