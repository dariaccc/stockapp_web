/**
 * VANTYX - Radar Page Functionality
 * Handles market radar, stock search, and trending stocks
 */

class RadarPage {
    constructor() {
        this.searchTimeout = null;
        this.marketData = {};
        this.newsData = [];
        this.refreshInterval = null;
        this.isLoading = false;
        
        // DOM elements
        this.elements = {
            stockSearch: Utils.dom.get('stockSearch'),
            searchResults: Utils.dom.get('searchResults'),
            newsTitle: Utils.dom.get('newsTitle'),
            newsSubtitle: Utils.dom.get('newsSubtitle'),
            newsChart: Utils.dom.get('newsChart'),
            topRecommendedGrid: Utils.dom.get('topRecommendedGrid'),
            worstPerformersGrid: Utils.dom.get('worstPerformersGrid'),
            stockModal: Utils.dom.get('stockModal'),
            loadingOverlay: Utils.dom.get('loadingOverlay'),
            themeToggle: Utils.dom.get('themeToggle'),
            languageSelect: Utils.dom.get('languageSelect')
        };
        
        // Sample stock data for recommendations and worst performers
        this.recommendedStocks = ['AAPL', 'GOOGL', 'MSFT', 'NVDA'];
        this.worstPerformers = ['NFLX', 'META', 'AMD', 'INTC'];
        
        this.init();
    }
    
    /**
     * Initialize radar page
     */
    async init() {
        console.log('Radar page initialized');
        
        // Check authentication
        if (!this.checkAuthentication()) {
            return;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize theme
        this.initializeTheme();
        
        // Load market data
        await this.loadMarketData();
        
        // Setup real-time updates
        this.setupRealTimeUpdates();
        
        // Initialize news chart
        this.initializeNewsChart();
        
        // Show page with animation
        Utils.animate.slideUp('.market-sections');
    }
    
    /**
     * Check if user is authenticated
     */
    checkAuthentication() {
        if (!userManager.isLoggedIn()) {
            Toast.warning('Please login to access the radar');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return false;
        }
        return true;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Stock search
        if (this.elements.stockSearch) {
            this.elements.stockSearch.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
            
            this.elements.stockSearch.addEventListener('focus', () => {
                if (this.elements.stockSearch.value) {
                    this.showSearchResults();
                }
            });
        }
        
        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchResults();
            }
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
        
        // Modal
        this.setupModal();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    /**
     * Handle search input with debouncing
     */
    handleSearchInput(query) {
        clearTimeout(this.searchTimeout);
        
        if (query.length < 2) {
            this.hideSearchResults();
            return;
        }
        
        this.searchTimeout = setTimeout(async () => {
            await this.performSearch(query);
        }, 300);
    }
    
    /**
     * Perform stock search
     */
    async performSearch(query) {
        try {
            const result = await apiService.searchStocks(query);
            
            if (result.success && result.data.length > 0) {
                this.displaySearchResults(result.data);
            } else {
                this.displayNoResults(query);
            }
        } catch (error) {
            console.error('Search error:', error);
            this.displaySearchError();
        }
    }
    
    /**
     * Display search results
     */
    displaySearchResults(stocks) {
        const resultsHtml = stocks.map(stock => `
            <div class="search-result-item" data-symbol="${stock.symbol}">
                <div>
                    <div class="search-result-symbol">${stock.symbol}</div>
                    <div class="search-result-name">${stock.name}</div>
                </div>
                <div class="search-result-price">Loading...</div>
            </div>
        `).join('');
        
        this.elements.searchResults.innerHTML = resultsHtml;
        this.showSearchResults();
        
        // Add click handlers
        this.elements.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const symbol = item.getAttribute('data-symbol');
                this.selectStock(symbol);
            });
        });
        
        // Load prices for search results
        this.loadSearchResultPrices(stocks.map(s => s.symbol));
    }
    
    /**
     * Load prices for search results
     */
    async loadSearchResultPrices(symbols) {
        try {
            const result = await apiService.getMultipleQuotes(symbols);
            
            if (result.success) {
                symbols.forEach(symbol => {
                    const quote = result.data[symbol];
                    const priceElement = this.elements.searchResults.querySelector(
                        `[data-symbol="${symbol}"] .search-result-price`
                    );
                    
                    if (quote && priceElement) {
                        priceElement.textContent = Utils.format.currency(quote.price);
                        priceElement.style.color = quote.change >= 0 ? 'var(--accent-color)' : 'var(--accent-red)';
                    }
                });
            }
        } catch (error) {
            console.error('Error loading search result prices:', error);
        }
    }
    
    /**
     * Display no results message
     */
    displayNoResults(query) {
        this.elements.searchResults.innerHTML = `
            <div class="search-result-item">
                <div style="color: var(--text-muted); text-align: center; width: 100%;">
                    No results found for "${query}"
                </div>
            </div>
        `;
        this.showSearchResults();
    }
    
    /**
     * Display search error
     */
    displaySearchError() {
        this.elements.searchResults.innerHTML = `
            <div class="search-result-item">
                <div style="color: var(--accent-red); text-align: center; width: 100%;">
                    Search error. Please try again.
                </div>
            </div>
        `;
        this.showSearchResults();
    }
    
    /**
     * Show search results
     */
    showSearchResults() {
        if (this.elements.searchResults) {
            this.elements.searchResults.style.display = 'block';
            Utils.animate.fadeIn(this.elements.searchResults, 200);
        }
    }
    
    /**
     * Hide search results
     */
    hideSearchResults() {
        if (this.elements.searchResults) {
            Utils.animate.fadeOut(this.elements.searchResults, 200);
        }
    }
    
    /**
     * Select stock from search results
     */
    selectStock(symbol) {
        this.hideSearchResults();
        this.elements.stockSearch.value = symbol;
        this.showStockDetails(symbol);
    }
    
    /**
     * Load market data
     */
    async loadMarketData() {
        this.setLoadingState(true);
        
        try {
            // Load news data
            await this.loadNewsData();
            
            // Load recommended stocks
            await this.loadRecommendedStocks();
            
            // Load worst performers
            await this.loadWorstPerformers();
            
        } catch (error) {
            console.error('Error loading market data:', error);
            Toast.error('Failed to load market data');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Load news data
     */
    async loadNewsData() {
        try {
            const result = await apiService.getMarketNews('general', 5);
            
            if (result.success && result.data.length > 0) {
                this.newsData = result.data;
                this.updateNewsDisplay();
            }
        } catch (error) {
            console.error('Error loading news:', error);
        }
    }
    
    /**
     * Update news display
     */
    updateNewsDisplay() {
        if (this.newsData.length === 0) return;
        
        const mainNews = this.newsData[0];
        
        if (this.elements.newsTitle) {
            this.elements.newsTitle.textContent = mainNews.title;
        }
        
        if (this.elements.newsSubtitle) {
            this.elements.newsSubtitle.textContent = mainNews.summary;
        }
    }
    
    /**
     * Load recommended stocks
     */
    async loadRecommendedStocks() {
        try {
            const result = await apiService.getMultipleQuotes(this.recommendedStocks);
            
            if (result.success) {
                this.displayStockGrid(result.data, this.elements.topRecommendedGrid, true);
            }
        } catch (error) {
            console.error('Error loading recommended stocks:', error);
        }
    }
    
    /**
     * Load worst performers
     */
    async loadWorstPerformers() {
        try {
            const result = await apiService.getMultipleQuotes(this.worstPerformers);
            
            if (result.success) {
                // Simulate negative performance for worst performers
                Object.keys(result.data).forEach(symbol => {
                    const stock = result.data[symbol];
                    stock.change = -Math.abs(stock.change);
                    stock.changePercent = -Math.abs(stock.changePercent);
                });
                
                this.displayStockGrid(result.data, this.elements.worstPerformersGrid, false);
            }
        } catch (error) {
            console.error('Error loading worst performers:', error);
        }
    }
    
    /**
     * Display stock grid
     */
    displayStockGrid(stockData, container, isRecommended = true) {
        if (!container) return;
        
        const stocksHtml = Object.entries(stockData).map(([symbol, stock]) => {
            const changeClass = stock.change >= 0 ? 'positive' : 'negative';
            const changeIcon = stock.change >= 0 ? '▲' : '▼';
            
            return `
                <div class="stock-card" data-symbol="${symbol}">
                    <div class="stock-info">
                        <div class="stock-symbol">${symbol}</div>
                        <div class="stock-details">
                            <span class="stock-category">Large Cap</span>
                        </div>
                        <div class="stock-price">${Utils.format.currency(stock.price)}</div>
                        <div class="stock-change ${changeClass}">
                            ${changeIcon} ${Math.abs(stock.changePercent).toFixed(1)}%
                        </div>
                    </div>
                    <div class="stock-actions">
                        <button class="buy-btn" data-symbol="${symbol}">BUY</button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = stocksHtml;
        
        // Add event listeners
        container.querySelectorAll('.stock-card').forEach(card => {
            const symbol = card.getAttribute('data-symbol');
            
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('buy-btn')) {
                    this.showStockDetails(symbol);
                }
            });
        });
        
        container.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const symbol = btn.getAttribute('data-symbol');
                this.handleBuyStock(symbol);
            });
        });
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
                
                // Update modal content
                const modalTitle = this.elements.stockModal.querySelector('#modalStockTitle');
                const modalBody = this.elements.stockModal.querySelector('#modalStockBody');
                
                if (modalTitle) {
                    modalTitle.textContent = `${stock.symbol} - ${stock.name}`;
                }
                
                if (modalBody) {
                    modalBody.innerHTML = this.generateStockDetailsHTML(stock);
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
     * Generate stock details HTML
     */
    generateStockDetailsHTML(stock) {
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const changeIcon = stock.change >= 0 ? '▲' : '▼';
        
        return `
            <div class="stock-modal-details">
                <div class="detail-row">
                    <span class="detail-label">Current Price</span>
                    <span class="detail-value">${Utils.format.currency(stock.price)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Change</span>
                    <span class="detail-value ${changeClass}">
                        ${changeIcon} ${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Volume</span>
                    <span class="detail-value">${Utils.format.number(stock.volume, 0)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Market Cap</span>
                    <span class="detail-value">${Utils.format.currency(stock.marketCap)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">P/E Ratio</span>
                    <span class="detail-value">${stock.pe}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">52W High</span>
                    <span class="detail-value">${Utils.format.currency(stock.high52w)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">52W Low</span>
                    <span class="detail-value">${Utils.format.currency(stock.low52w)}</span>
                </div>
            </div>
            <div class="modal-chart">
                <p>Chart visualization coming soon...</p>
            </div>
        `;
    }
    
    /**
     * Setup stock modal buttons
     */
    setupStockModalButtons(symbol) {
        const buyBtn = Utils.dom.get('modalBuyBtn');
        const watchlistBtn = Utils.dom.get('modalWatchlistBtn');
        
        if (buyBtn) {
            buyBtn.onclick = () => {
                this.closeModal();
                this.handleBuyStock(symbol);
            };
        }
        
        if (watchlistBtn) {
            const watchlist = userManager.getWatchlist();
            const isInWatchlist = watchlist.includes(symbol);
            
            watchlistBtn.textContent = isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist';
            watchlistBtn.onclick = () => {
                this.toggleWatchlist(symbol);
            };
        }
    }
    
    /**
     * Handle buy stock action
     */
    handleBuyStock(symbol) {
        // In a real app, this would open a trade modal
        Toast.info(`Buy order for ${symbol} - Trade modal coming soon!`);
        
        // For now, we'll simulate adding to portfolio
        const currentUser = userManager.getCurrentUser();
        if (currentUser) {
            Toast.success(`${symbol} added to your portfolio!`);
        }
    }
    
    /**
     * Toggle watchlist
     */
    toggleWatchlist(symbol) {
        const watchlist = userManager.getWatchlist();
        const isInWatchlist = watchlist.includes(symbol);
        
        if (isInWatchlist) {
            if (userManager.removeFromWatchlist(symbol)) {
                Toast.success(`${symbol} removed from watchlist`);
            }
        } else {
            if (userManager.addToWatchlist(symbol)) {
                Toast.success(`${symbol} added to watchlist`);
            }
        }
        
        this.closeModal();
    }
    
    /**
     * Initialize news chart
     */
    initializeNewsChart() {
        const canvas = this.elements.newsChart;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        
        canvas.width = width;
        canvas.height = height;
        
        this.drawNewsChart(ctx, width, height);
        
        // Animate chart
        setInterval(() => {
            this.drawNewsChart(ctx, width, height);
        }, 3000);
    }
    
    /**
     * Draw news chart
     */
    drawNewsChart(ctx, width, height) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background bars
        const barCount = 20;
        const barWidth = width / barCount;
        
        for (let i = 0; i < barCount; i++) {
            const barHeight = Math.random() * height * 0.8 + height * 0.1;
            const x = i * barWidth;
            const y = height - barHeight;
            
            // Gradient for bars
            const gradient = ctx.createLinearGradient(0, y, 0, height);
            gradient.addColorStop(0, 'rgba(74, 144, 226, 0.8)');
            gradient.addColorStop(1, 'rgba(74, 144, 226, 0.3)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
        
        // Draw trend line
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for (let i = 0; i <= width; i += 20) {
            const y = height * 0.3 + Math.sin(i * 0.02 + Date.now() * 0.001) * height * 0.2;
            if (i === 0) {
                ctx.moveTo(i, y);
            } else {
                ctx.lineTo(i, y);
            }
        }
        
        ctx.stroke();
    }
    
    /**
     * Setup modal
     */
    setupModal() {
        const modalClose = Utils.dom.get('modalClose');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }
        
        if (this.elements.stockModal) {
            this.elements.stockModal.addEventListener('click', (e) => {
                if (e.target === this.elements.stockModal) {
                    this.closeModal();
                }
            });
        }
    }
    
    /**
     * Close modal
     */
    closeModal() {
        if (this.elements.stockModal) {
            this.elements.stockModal.classList.remove('active');
            Utils.animate.fadeOut(this.elements.stockModal);
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
            await this.loadRecommendedStocks();
            await this.loadWorstPerformers();
            console.log('Market data refreshed');
        } catch (error) {
            console.warn('Failed to refresh market data:', error);
        }
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
            // Escape key closes modal and search results
            if (e.key === 'Escape') {
                this.closeModal();
                this.hideSearchResults();
            }
            
            // Slash key focuses search
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (this.elements.stockSearch) {
                    this.elements.stockSearch.focus();
                }
            }
            
            // R key refreshes data
            if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.refreshMarketData();
                Toast.info('Refreshing market data...');
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
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
}

// Initialize radar page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const radarPage = new RadarPage();
    
    // Make globally available for debugging
    if (typeof window !== 'undefined') {
        window.radarPage = radarPage;
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        radarPage.destroy();
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RadarPage;
}
