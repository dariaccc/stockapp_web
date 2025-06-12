/**
 * VANTYX - Dynamic Stock Page Functionality
 * Handles real-time stock data from multiple APIs
 */

class StockPage {
    constructor() {
        this.currentStock = null;
        this.stockSymbol = null;
        this.chartData = [];
        this.newsData = [];
        this.relatedStocks = [];
        this.refreshInterval = null;
        this.chartUpdateInterval = null;
        this.isLoading = false;
        this.lastUpdateTime = null;
        
        // API Configuration
        this.apiConfig = {
            // Multiple API options for redundancy
            primary: {
                name: 'Alpha Vantage',
                baseUrl: 'https://www.alphavantage.co/query',
                key: 'YOUR_ALPHA_VANTAGE_KEY', // Replace with your API key
                endpoints: {
                    quote: '?function=GLOBAL_QUOTE&symbol={symbol}&apikey={key}',
                    intraday: '?function=TIME_SERIES_INTRADAY&symbol={symbol}&interval=5min&apikey={key}',
                    daily: '?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={key}',
                    news: '?function=NEWS_SENTIMENT&tickers={symbol}&apikey={key}'
                }
            },
            secondary: {
                name: 'Finnhub',
                baseUrl: 'https://finnhub.io/api/v1',
                key: 'YOUR_FINNHUB_KEY', // Replace with your API key
                endpoints: {
                    quote: '/quote?symbol={symbol}&token={key}',
                    candles: '/stock/candle?symbol={symbol}&resolution=5&from={from}&to={to}&token={key}',
                    profile: '/stock/profile2?symbol={symbol}&token={key}',
                    news: '/company-news?symbol={symbol}&from={from}&to={to}&token={key}'
                }
            },
            fallback: {
                name: 'Yahoo Finance (via RapidAPI)',
                baseUrl: 'https://yahoo-finance15.p.rapidapi.com/api/yahoo',
                key: 'YOUR_RAPIDAPI_KEY', // Replace with your RapidAPI key
                endpoints: {
                    quote: '/qu/quote/{symbol}',
                    chart: '/ch/chart/{symbol}',
                    news: '/ne/news/{symbol}'
                }
            }
        };
        
        // DOM elements
        this.elements = {
            stockLogo: Utils.dom.get('stockLogo'),
            stockSymbol: Utils.dom.get('stockSymbol'),
            stockName: Utils.dom.get('stockName'),
            stockChart: Utils.dom.get('stockChart'),
            buyBtn: Utils.dom.get('buyBtn'),
            sellBtn: Utils.dom.get('sellBtn'),
            buyPrice: Utils.dom.get('buyPrice'),
            sellPrice: Utils.dom.get('sellPrice'),
            oneMonthReturn: Utils.dom.get('oneMonthReturn'),
            threeMonthReturn: Utils.dom.get('threeMonthReturn'),
            oneYearReturn: Utils.dom.get('oneYearReturn'),
            previousClose: Utils.dom.get('previousClose'),
            weekHigh: Utils.dom.get('weekHigh'),
            weekLow: Utils.dom.get('weekLow'),
            aboutBtn: Utils.dom.get('aboutBtn'),
            aboutContent: Utils.dom.get('aboutContent'),
            newsList: Utils.dom.get('newsList'),
            relatedStocks: Utils.dom.get('relatedStocks'),
            tradeModal: Utils.dom.get('tradeModal'),
            loadingOverlay: Utils.dom.get('loadingOverlay'),
            themeToggle: Utils.dom.get('themeToggle'),
            languageSelect: Utils.dom.get('languageSelect')
        };
        
        // Stock logos and company info
        this.stockInfo = {
            'AAPL': { logo: '🍎', sector: 'Technology', exchange: 'NASDAQ' },
            'GOOGL': { logo: '🔍', sector: 'Technology', exchange: 'NASDAQ' },
            'MSFT': { logo: '🪟', sector: 'Technology', exchange: 'NASDAQ' },
            'AMZN': { logo: '📦', sector: 'Consumer Discretionary', exchange: 'NASDAQ' },
            'TSLA': { logo: '🚗', sector: 'Consumer Discretionary', exchange: 'NASDAQ' },
            'META': { logo: '👥', sector: 'Technology', exchange: 'NASDAQ' },
            'NVDA': { logo: '🎮', sector: 'Technology', exchange: 'NASDAQ' },
            'NFLX': { logo: '🎬', sector: 'Communication Services', exchange: 'NASDAQ' },
            'AMD': { logo: '💻', sector: 'Technology', exchange: 'NASDAQ' },
            'INTC': { logo: '🔧', sector: 'Technology', exchange: 'NASDAQ' },
            'JPM': { logo: '🏦', sector: 'Financial Services', exchange: 'NYSE' },
            'JNJ': { logo: '💊', sector: 'Healthcare', exchange: 'NYSE' },
            'PG': { logo: '🧴', sector: 'Consumer Staples', exchange: 'NYSE' },
            'V': { logo: '💳', sector: 'Financial Services', exchange: 'NYSE' },
            'HD': { logo: '🔨', sector: 'Consumer Discretionary', exchange: 'NYSE' }
        };
        
        this.init();
    }
    
    /**
     * Initialize stock page
     */
    async init() {
        console.log('Dynamic Stock page initialized');
        
        // Check authentication
        if (!this.checkAuthentication()) {
            return;
        }
        
        // Get stock symbol from URL
        this.stockSymbol = this.getStockSymbolFromUrl() || 'AAPL';
        console.log('Loading stock:', this.stockSymbol);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize theme
        this.initializeTheme();
        
        // Load stock data
        await this.loadStockData();
        
        // Setup real-time updates
        this.setupRealTimeUpdates();
        
        // Show page with animation
        Utils.animate.slideUp('.stock-main-info');
    }
    
    /**
     * Check authentication
     */
    checkAuthentication() {
        if (!userManager.isLoggedIn()) {
            Toast.warning('Please login to view stock details');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return false;
        }
        return true;
    }
    
    /**
     * Get stock symbol from URL
     */
    getStockSymbolFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return (urlParams.get('symbol') || urlParams.get('s') || '').toUpperCase();
    }
    
    /**
     * Load complete stock data
     */
    async loadStockData() {
        this.setLoadingState(true);
        
        try {
            // Load data in parallel for better performance
            await Promise.allSettled([
                this.loadStockQuote(),
                this.loadStockProfile(),
                this.loadChartData(),
                this.loadStockNews(),
                this.loadRelatedStocks(),
                this.loadHistoricalReturns()
            ]);
            
            this.lastUpdateTime = new Date();
            console.log('Stock data loaded successfully');
            
        } catch (error) {
            console.error('Error loading stock data:', error);
            Toast.error('Failed to load stock data. Using demo data.');
            await this.loadDemoData();
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Load real-time stock quote
     */
    async loadStockQuote() {
        try {
            // Try Alpha Vantage first
            let stockData = await this.fetchFromAlphaVantage('quote', this.stockSymbol);
            
            if (!stockData) {
                // Fallback to Finnhub
                stockData = await this.fetchFromFinnhub('quote', this.stockSymbol);
            }
            
            if (!stockData) {
                // Last resort: Yahoo Finance
                stockData = await this.fetchFromYahooFinance('quote', this.stockSymbol);
            }
            
            if (stockData) {
                this.currentStock = this.normalizeStockData(stockData);
                this.updateStockDisplay();
                this.updateTradingButtons();
            } else {
                throw new Error('No stock data available from any API');
            }
            
        } catch (error) {
            console.error('Error loading stock quote:', error);
            // Use demo data as fallback
            this.currentStock = this.generateDemoStockData();
            this.updateStockDisplay();
        }
    }
    
    /**
     * Load stock profile/company info
     */
    async loadStockProfile() {
        try {
            const profile = await this.fetchFromFinnhub('profile', this.stockSymbol);
            
            if (profile) {
                if (this.currentStock) {
                    this.currentStock.companyName = profile.name;
                    this.currentStock.description = profile.description;
                    this.currentStock.website = profile.weburl;
                    this.currentStock.industry = profile.finnhubIndustry;
                }
                this.updateAboutSection(profile);
            }
        } catch (error) {
            console.error('Error loading stock profile:', error);
        }
    }
    
    /**
     * Load historical chart data
     */
    async loadChartData() {
        try {
            // Get data for the last 30 days
            const toDate = Math.floor(Date.now() / 1000);
            const fromDate = toDate - (30 * 24 * 60 * 60); // 30 days ago
            
            let chartData = await this.fetchFromFinnhub('candles', this.stockSymbol, { from: fromDate, to: toDate });
            
            if (!chartData) {
                // Fallback to Alpha Vantage daily data
                chartData = await this.fetchFromAlphaVantage('daily', this.stockSymbol);
            }
            
            if (chartData) {
                this.chartData = this.normalizeChartData(chartData);
                this.drawChart();
            }
        } catch (error) {
            console.error('Error loading chart data:', error);
            this.generateDemoChartData();
            this.drawChart();
        }
    }
    
    /**
     * Load stock news
     */
    async loadStockNews() {
        try {
            const toDate = new Date().toISOString().split('T')[0];
            const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            let news = await this.fetchFromFinnhub('news', this.stockSymbol, { from: fromDate, to: toDate });
            
            if (!news || news.length === 0) {
                // Fallback to Alpha Vantage news
                news = await this.fetchFromAlphaVantage('news', this.stockSymbol);
            }
            
            if (news && news.length > 0) {
                this.newsData = news.slice(0, 5); // Top 5 news items
                this.displayNews();
            }
        } catch (error) {
            console.error('Error loading news:', error);
            this.generateDemoNews();
            this.displayNews();
        }
    }
    
    /**
     * Load related stocks
     */
    async loadRelatedStocks() {
        try {
            // Get stocks from the same sector
            const sectorStocks = this.getStocksBySector(this.stockSymbol);
            const relatedPromises = sectorStocks.map(symbol => 
                this.fetchQuickQuote(symbol)
            );
            
            const results = await Promise.allSettled(relatedPromises);
            this.relatedStocks = results
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value)
                .slice(0, 3);
            
            this.displayRelatedStocks();
        } catch (error) {
            console.error('Error loading related stocks:', error);
            this.generateDemoRelatedStocks();
            this.displayRelatedStocks();
        }
    }
    
    /**
     * Load historical returns
     */
    async loadHistoricalReturns() {
        try {
            // This would typically require historical price data
            // For now, we'll calculate based on available data or use estimates
            const returns = await this.calculateHistoricalReturns();
            this.updatePerformanceTable(returns);
        } catch (error) {
            console.error('Error loading historical returns:', error);
            this.updatePerformanceTable();
        }
    }
    
    /**
     * Fetch data from Alpha Vantage API
     */
    async fetchFromAlphaVantage(endpoint, symbol, params = {}) {
        try {
            const config = this.apiConfig.primary;
            let url = config.baseUrl + config.endpoints[endpoint];
            
            // Replace placeholders
            url = url.replace('{symbol}', symbol)
                    .replace('{key}', config.key);
            
            // Add additional parameters
            Object.keys(params).forEach(key => {
                url = url.replace(`{${key}}`, params[key]);
            });
            
            console.log('Fetching from Alpha Vantage:', url);
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            // Check for API errors
            if (data['Error Message'] || data['Note']) {
                console.warn('Alpha Vantage API limit or error:', data);
                return null;
            }
            
            return this.parseAlphaVantageResponse(data, endpoint);
            
        } catch (error) {
            console.error('Alpha Vantage API error:', error);
            return null;
        }
    }
    
    /**
     * Fetch data from Finnhub API
     */
    async fetchFromFinnhub(endpoint, symbol, params = {}) {
        try {
            const config = this.apiConfig.secondary;
            let url = config.baseUrl + config.endpoints[endpoint];
            
            // Replace placeholders
            url = url.replace('{symbol}', symbol)
                    .replace('{key}', config.key);
            
            // Add additional parameters
            Object.keys(params).forEach(key => {
                url = url.replace(`{${key}}`, params[key]);
            });
            
            console.log('Fetching from Finnhub:', url);
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            // Check for empty response
            if (Object.keys(data).length === 0) {
                console.warn('Empty response from Finnhub');
                return null;
            }
            
            return data;
            
        } catch (error) {
            console.error('Finnhub API error:', error);
            return null;
        }
    }
    
    /**
     * Fetch data from Yahoo Finance (via RapidAPI)
     */
    async fetchFromYahooFinance(endpoint, symbol) {
        try {
            const config = this.apiConfig.fallback;
            const url = config.baseUrl + config.endpoints[endpoint].replace('{symbol}', symbol);
            
            console.log('Fetching from Yahoo Finance:', url);
            
            const response = await fetch(url, {
                headers: {
                    'X-RapidAPI-Key': config.key,
                    'X-RapidAPI-Host': 'yahoo-finance15.p.rapidapi.com'
                }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Yahoo Finance API error:', error);
            return null;
        }
    }
    
    /**
     * Parse Alpha Vantage API response
     */
    parseAlphaVantageResponse(data, endpoint) {
        switch (endpoint) {
            case 'quote':
                const quote = data['Global Quote'];
                if (!quote) return null;
                
                return {
                    symbol: quote['01. symbol'],
                    price: parseFloat(quote['05. price']),
                    change: parseFloat(quote['09. change']),
                    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                    volume: parseInt(quote['06. volume']),
                    previousClose: parseFloat(quote['08. previous close']),
                    open: parseFloat(quote['02. open']),
                    high: parseFloat(quote['03. high']),
                    low: parseFloat(quote['04. low'])
                };
                
            case 'daily':
                const timeSeries = data['Time Series (Daily)'];
                if (!timeSeries) return null;
                
                return Object.entries(timeSeries).map(([date, values]) => ({
                    date,
                    open: parseFloat(values['1. open']),
                    high: parseFloat(values['2. high']),
                    low: parseFloat(values['3. low']),
                    close: parseFloat(values['4. close']),
                    volume: parseInt(values['5. volume'])
                })).slice(0, 30); // Last 30 days
                
            case 'news':
                const feed = data.feed;
                if (!feed) return null;
                
                return feed.map(item => ({
                    title: item.title,
                    summary: item.summary,
                    url: item.url,
                    source: item.source,
                    timestamp: item.time_published
                }));
                
            default:
                return data;
        }
    }
    
    /**
     * Normalize stock data from different APIs
     */
    normalizeStockData(rawData) {
        // Handle different API response formats
        if (rawData.c !== undefined) {
            // Finnhub format
            return {
                symbol: this.stockSymbol,
                price: rawData.c,
                change: rawData.d,
                changePercent: rawData.dp,
                high: rawData.h,
                low: rawData.l,
                open: rawData.o,
                previousClose: rawData.pc
            };
        } else {
            // Alpha Vantage or normalized format
            return rawData;
        }
    }
    
    /**
     * Normalize chart data
     */
    normalizeChartData(rawData) {
        if (Array.isArray(rawData)) {
            // Already normalized (Alpha Vantage daily)
            return rawData.map(item => ({
                timestamp: item.date || Date.now(),
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume
            }));
        } else if (rawData.c && Array.isArray(rawData.c)) {
            // Finnhub candles format
            return rawData.c.map((close, index) => ({
                timestamp: rawData.t[index] * 1000, // Convert to milliseconds
                open: rawData.o[index],
                high: rawData.h[index],
                low: rawData.l[index],
                close: close,
                volume: rawData.v[index]
            }));
        }
        
        return [];
    }
    
    /**
     * Get quick quote for related stocks
     */
    async fetchQuickQuote(symbol) {
        try {
            const data = await this.fetchFromFinnhub('quote', symbol);
            if (data && data.c) {
                return {
                    symbol,
                    price: data.c,
                    change: data.d,
                    changePercent: data.dp
                };
            }
        } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error);
        }
        return null;
    }
    
    /**
     * Get stocks by sector
     */
    getStocksBySector(symbol) {
        const sectorMaps = {
            'Technology': ['AAPL', 'GOOGL', 'MSFT', 'META', 'NVDA', 'AMD', 'INTC'],
            'Consumer Discretionary': ['AMZN', 'TSLA', 'HD'],
            'Communication Services': ['NFLX', 'META'],
            'Financial Services': ['JPM', 'V'],
            'Healthcare': ['JNJ'],
            'Consumer Staples': ['PG']
        };
        
        const stockInfo = this.stockInfo[symbol];
        if (stockInfo && sectorMaps[stockInfo.sector]) {
            return sectorMaps[stockInfo.sector].filter(s => s !== symbol);
        }
        
        // Default fallback
        return ['AAPL', 'GOOGL', 'MSFT'].filter(s => s !== symbol);
    }
    
    /**
     * Calculate historical returns
     */
    async calculateHistoricalReturns() {
        try {
            if (this.chartData.length > 0) {
                const currentPrice = this.currentStock.price;
                const sortedData = this.chartData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                
                // Calculate returns
                const oneMonthAgo = sortedData[Math.max(0, sortedData.length - 22)]; // ~22 trading days
                const threeMonthsAgo = sortedData[Math.max(0, sortedData.length - 66)]; // ~66 trading days
                const oneYearAgo = sortedData[0]; // Oldest data point
                
                return {
                    oneMonth: oneMonthAgo ? ((currentPrice - oneMonthAgo.close) / oneMonthAgo.close) * 100 : 0,
                    threeMonth: threeMonthsAgo ? ((currentPrice - threeMonthsAgo.close) / threeMonthsAgo.close) * 100 : 0,
                    oneYear: oneYearAgo ? ((currentPrice - oneYearAgo.close) / oneYearAgo.close) * 100 : 0
                };
            }
        } catch (error) {
            console.error('Error calculating returns:', error);
        }
        
        // Return demo data if calculation fails
        return {
            oneMonth: 3.54,
            threeMonth: -0.3,
            oneYear: 15.2
        };
    }
    
    /**
     * Update stock display with real data
     */
    updateStockDisplay() {
        if (!this.currentStock) return;
        
        // Update logo
        if (this.elements.stockLogo) {
            const logoText = this.elements.stockLogo.querySelector('.logo-text');
            if (logoText) {
                const stockInfo = this.stockInfo[this.stockSymbol];
                logoText.textContent = stockInfo ? stockInfo.logo : '📈';
            }
        }
        
        // Update symbol and name
        if (this.elements.stockSymbol) {
            this.elements.stockSymbol.textContent = this.currentStock.symbol || this.stockSymbol;
        }
        
        if (this.elements.stockName) {
            this.elements.stockName.textContent = this.currentStock.companyName || this.currentStock.name || `${this.stockSymbol} Inc.`;
        }
        
        // Update page title
        document.title = `VANTYX - ${this.stockSymbol} Stock - $${this.currentStock.price.toFixed(2)}`;
        
        console.log('Stock display updated with real data:', this.currentStock);
    }
    
    /**
     * Update trading buttons with real prices
     */
    updateTradingButtons() {
        if (!this.currentStock) return;
        
        const currentPrice = this.currentStock.price;
        const formattedPrice = Utils.format.currency(currentPrice);
        
        if (this.elements.buyPrice) {
            this.elements.buyPrice.textContent = formattedPrice;
        }
        
        if (this.elements.sellPrice) {
            this.elements.sellPrice.textContent = formattedPrice;
        }
    }
    
    /**
     * Update performance table with real data
     */
    updatePerformanceTable(returns = null) {
        if (!returns) {
            returns = {
                oneMonth: 3.54,
                threeMonth: -0.3,
                oneYear: 15.2
            };
        }
        
        // Update returns
        if (this.elements.oneMonthReturn) {
            this.elements.oneMonthReturn.textContent = `${returns.oneMonth.toFixed(2)}%`;
            this.elements.oneMonthReturn.className = `metric-value ${returns.oneMonth >= 0 ? 'positive' : 'negative'}`;
        }
        
        if (this.elements.threeMonthReturn) {
            this.elements.threeMonthReturn.textContent = `${returns.threeMonth.toFixed(2)}%`;
            this.elements.threeMonthReturn.className = `metric-value ${returns.threeMonth >= 0 ? 'positive' : 'negative'}`;
        }
        
        if (this.elements.oneYearReturn) {
            this.elements.oneYearReturn.textContent = `${returns.oneYear.toFixed(2)}%`;
            this.elements.oneYearReturn.className = `metric-value ${returns.oneYear >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update other metrics with real data
        if (this.currentStock) {
            if (this.elements.previousClose) {
                this.elements.previousClose.textContent = Utils.format.currency(this.currentStock.previousClose || this.currentStock.price);
            }
            
            if (this.elements.weekHigh) {
                this.elements.weekHigh.textContent = Utils.format.currency(this.currentStock.weekHigh || this.currentStock.high || this.currentStock.price * 1.2);
            }
            
            if (this.elements.weekLow) {
                this.elements.weekLow.textContent = Utils.format.currency(this.currentStock.weekLow || this.currentStock.low || this.currentStock.price * 0.8);
            }
        }
    }
    
    /**
     * Update about section with company data
     */
    updateAboutSection(profile) {
        if (!this.elements.aboutContent) return;
        
        const description = profile.description || 
                          this.getDefaultDescription(this.stockSymbol) ||
                          `${this.stockSymbol} is a leading company in its sector, known for innovation and market leadership.`;
        
        this.elements.aboutContent.querySelector('p').textContent = description;
        
        if (this.elements.aboutBtn) {
            this.elements.aboutBtn.textContent = `MORE ABOUT ${this.stockSymbol}`;
        }
    }
    
    /**
     * Display real news data
     */
    displayNews() {
        if (!this.elements.newsList || !this.newsData.length) return;
        
        const newsHtml = this.newsData.map(news => `
            <div class="news-item" data-url="${news.url || '#'}">
                <div class="news-title">${news.title}</div>
                <div class="news-date">${this.formatNewsDate(news.timestamp)}</div>
            </div>
        `).join('');
        
        this.elements.newsList.innerHTML = newsHtml;
        
        // Add click handlers
        this.elements.newsList.querySelectorAll('.news-item').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.getAttribute('data-url');
                if (url && url !== '#') {
                    window.open(url, '_blank');
                } else {
                    Toast.info('Full article coming soon!');
                }
            });
        });
    }
    
    /**
     * Display related stocks with real data
     */
    displayRelatedStocks() {
        if (!this.elements.relatedStocks || !this.relatedStocks.length) return;
        
        const stocksHtml = this.relatedStocks.map(stock => `
            <div class="related-stock-item" data-symbol="${stock.symbol}">
                <div class="related-stock-info">
                    <div class="related-stock-symbol">${stock.symbol}</div>
                    <div class="related-stock-price">${Utils.format.currency(stock.price)}</div>
                </div>
                <button class="related-stock-action" data-symbol="${stock.symbol}">BUY</button>
            </div>
        `).join('');
        
        this.elements.relatedStocks.innerHTML = stocksHtml;
        
        // Add click handlers
        this.elements.relatedStocks.querySelectorAll('.related-stock-item').forEach(item => {
            const symbol = item.getAttribute('data-symbol');
            
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('related-stock-action')) {
                    this.navigateToStock(symbol);
                }
            });
        });
        
        this.elements.relatedStocks.querySelectorAll('.related-stock-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const symbol = btn.getAttribute('data-symbol');
                this.openTradeModalForStock(symbol, 'buy');
            });
        });
    }
    
    /**
     * Draw chart with real data
     */
    drawChart() {
        const canvas = this.elements.stockChart;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        
        canvas.width = width;
        canvas.height = height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Use real chart data if available
        let data;
        if (this.chartData.length > 0) {
            data = this.chartData.map(d => d.close);
        } else {
            // Generate realistic data based on current stock price
            data = [];
            const basePrice = this.currentStock?.price || 100;
            let price = basePrice * 0.95; // Start slightly lower
            
            for (let i = 0; i < 50; i++) {
                price += (Math.random() - 0.5) * price * 0.02;
                data.push(price);
            }
            // Ensure last point is close to current price
            data[data.length - 1] = basePrice;
        }
        
        // Draw components
        this.drawChartGrid(ctx, width, height);
        this.drawChartLine(ctx, data, width, height);
        this.drawChartGlow(ctx, data, width, height);
        
        // Add volume bars if available
        if (this.chartData.length > 0) {
            this.drawVolumeIndicator(ctx, width, height);
        }
    }
    
    /**
     * Draw chart grid
     */
    drawChartGrid(ctx, width, height) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Horizontal lines
        for (let i = 0; i <= 10; i++) {
            const y = (height / 10) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Vertical lines
        for (let i = 0; i <= 10; i++) {
            const x = (width / 10) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }
    
    /**
     * Draw chart line with real data
     */
    drawChartLine(ctx, data, width, height) {
        if (data.length === 0) return;
        
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        
        // Determine color based on trend
        const isPositive = data[data.length - 1] >= data[0];
        const lineColor = isPositive ? '#00ff41' : '#ff4444';
        
        // Main line
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = (width / (data.length - 1)) * index;
            const y = height - ((point - min) / range) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Add data points
        ctx.fillStyle = lineColor;
        data.forEach((point, index) => {
            if (index % 5 === 0) { // Show every 5th point
                const x = (width / (data.length - 1)) * index;
                const y = height - ((point - min) / range) * height;
                
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }
    
    /**
     * Draw chart glow effect
     */
    drawChartGlow(ctx, data, width, height) {
        if (data.length === 0) return;
        
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const isPositive = data[data.length - 1] >= data[0];
        const glowColor = isPositive ? '#00ff41' : '#ff4444';
        
        // Glow effect
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = (width / (data.length - 1)) * index;
            const y = height - ((point - min) / range) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
    
    /**
     * Draw volume indicator
     */
    drawVolumeIndicator(ctx, width, height) {
        const volumeHeight = 30;
        const volumeY = height - volumeHeight;
        
        if (this.chartData.length === 0) return;
        
        const volumes = this.chartData.map(d => d.volume || 0);
        const maxVolume = Math.max(...volumes);
        
        if (maxVolume === 0) return;
        
        ctx.fillStyle = 'rgba(74, 144, 226, 0.3)';
        
        volumes.forEach((volume, index) => {
            const x = (width / (volumes.length - 1)) * index;
            const barHeight = (volume / maxVolume) * volumeHeight;
            
            ctx.fillRect(x - 1, volumeY + (volumeHeight - barHeight), 2, barHeight);
        });
    }
    
    /**
     * Setup real-time updates with API calls
     */
    setupRealTimeUpdates() {
        // Update stock quote every 30 seconds
        this.refreshInterval = setInterval(() => {
            if (!document.hidden && userManager.isLoggedIn()) {
                this.updateStockQuote();
            }
        }, 30000);
        
        // Update chart with new data every 5 minutes
        this.chartUpdateInterval = setInterval(() => {
            if (!document.hidden && userManager.isLoggedIn()) {
                this.updateChartData();
            }
        }, 5 * 60 * 1000);
        
        // Add market hours check
        this.checkMarketHours();
        
        console.log('Real-time updates enabled');
    }
    
    /**
     * Update stock quote in real-time
     */
    async updateStockQuote() {
        try {
            const data = await this.fetchFromFinnhub('quote', this.stockSymbol);
            
            if (data && data.c) {
                const newStock = this.normalizeStockData(data);
                
                // Check if price changed
                const priceChanged = !this.currentStock || this.currentStock.price !== newStock.price;
                
                this.currentStock = { ...this.currentStock, ...newStock };
                
                if (priceChanged) {
                    this.updateStockDisplay();
                    this.updateTradingButtons();
                    this.showPriceUpdateIndicator();
                }
                
                console.log('Stock quote updated:', this.currentStock.price);
            }
        } catch (error) {
            console.warn('Failed to update stock quote:', error);
        }
    }
    
    /**
     * Update chart data with latest points
     */
    async updateChartData() {
        try {
            // Get latest intraday data
            const data = await this.fetchFromAlphaVantage('intraday', this.stockSymbol);
            
            if (data && data.length > 0) {
                // Add latest points to chart
                const latestPoints = data.slice(0, 5); // Last 5 points
                this.chartData = [...this.chartData.slice(5), ...latestPoints];
                this.drawChart();
                
                console.log('Chart data updated with latest points');
            }
        } catch (error) {
            console.warn('Failed to update chart data:', error);
        }
    }
    
    /**
     * Check market hours and adjust update frequency
     */
    checkMarketHours() {
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = now.getHours();
        
        // Market hours: Monday-Friday, 9:30 AM - 4:00 PM EST
        const isMarketOpen = day >= 1 && day <= 5 && hour >= 9 && hour < 16;
        
        if (isMarketOpen) {
            // Increase update frequency during market hours
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = setInterval(() => {
                    if (!document.hidden && userManager.isLoggedIn()) {
                        this.updateStockQuote();
                    }
                }, 15000); // Every 15 seconds during market hours
            }
            
            this.showMarketStatus('Market Open', 'positive');
        } else {
            this.showMarketStatus('Market Closed', 'neutral');
        }
    }
    
    /**
     * Show market status indicator
     */
    showMarketStatus(status, type) {
        // Create or update market status indicator
        let statusEl = document.querySelector('.market-status');
        
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = 'market-status';
            statusEl.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: var(--glass-bg);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-md);
                padding: var(--spacing-sm) var(--spacing-md);
                font-size: var(--font-size-xs);
                font-weight: 600;
                z-index: 1000;
                backdrop-filter: blur(10px);
            `;
            document.body.appendChild(statusEl);
        }
        
        statusEl.textContent = status;
        statusEl.className = `market-status ${type}`;
    }
    
    /**
     * Show price update indicator
     */
    showPriceUpdateIndicator() {
        const priceEl = this.elements.buyPrice || this.elements.sellPrice;
        if (!priceEl) return;
        
        // Flash animation to indicate price update
        priceEl.style.transition = 'background-color 0.3s ease';
        priceEl.style.backgroundColor = 'rgba(74, 144, 226, 0.3)';
        
        setTimeout(() => {
            priceEl.style.backgroundColor = 'transparent';
        }, 300);
    }
    
    /**
     * Format news date
     */
    formatNewsDate(timestamp) {
        if (!timestamp) return 'Recent';
        
        try {
            // Handle different timestamp formats
            let date;
            if (typeof timestamp === 'string' && timestamp.length === 8) {
                // YYYYMMDD format from Alpha Vantage
                date = new Date(
                    parseInt(timestamp.substr(0, 4)),
                    parseInt(timestamp.substr(4, 2)) - 1,
                    parseInt(timestamp.substr(6, 2))
                );
            } else {
                date = new Date(timestamp * 1000); // Unix timestamp
            }
            
            return Utils.format.date(date);
        } catch (error) {
            return 'Recent';
        }
    }
    
    /**
     * Get default company description
     */
    getDefaultDescription(symbol) {
        const descriptions = {
            'AAPL': 'Apple Inc. is a global technology leader, driving innovation with iPhones, Macs, and services. Known for premium design, brand loyalty, and steady growth, Apple remains a top pick for long-term investors and market watchers.',
            'GOOGL': 'Alphabet Inc. is the parent company of Google, leading in search, advertising, cloud computing, and emerging technologies like AI and autonomous vehicles.',
            'MSFT': 'Microsoft Corporation is a leading technology company, known for Windows, Office, Azure cloud services, and enterprise solutions.',
            'AMZN': 'Amazon.com Inc. is a multinational technology company focusing on e-commerce, cloud computing, digital streaming, and artificial intelligence.',
            'TSLA': 'Tesla Inc. is an electric vehicle and clean energy company, leading the transition to sustainable transportation and energy solutions.',
            'META': 'Meta Platforms Inc. focuses on building technologies that help people connect, find communities, and grow businesses through social media and virtual reality.',
            'NVDA': 'NVIDIA Corporation is a leading designer of graphics processing units and AI computing platforms, powering gaming, data centers, and autonomous vehicles.',
            'NFLX': 'Netflix Inc. is a streaming entertainment service with over 200 million paid memberships in more than 190 countries.',
            'AMD': 'Advanced Micro Devices Inc. designs and produces computer processors and related technologies for business and consumer markets.',
            'INTC': 'Intel Corporation is a leading manufacturer of semiconductor chips and computing infrastructure technologies.'
        };
        
        return descriptions[symbol] || null;
    }
    
    /**
     * Generate demo data as fallback
     */
    generateDemoStockData() {
        const basePrice = 100 + Math.random() * 200;
        const change = (Math.random() - 0.5) * 10;
        
        return {
            symbol: this.stockSymbol,
            name: `${this.stockSymbol} Inc.`,
            price: basePrice,
            change: change,
            changePercent: (change / basePrice) * 100,
            volume: Math.floor(Math.random() * 10000000) + 1000000,
            open: basePrice - change,
            high: basePrice + Math.random() * 5,
            low: basePrice - Math.random() * 5,
            previousClose: basePrice - change
        };
    }
    
    /**
     * Generate demo chart data
     */
    generateDemoChartData() {
        const basePrice = this.currentStock?.price || 100;
        let price = basePrice * 0.95;
        
        this.chartData = [];
        for (let i = 0; i < 30; i++) {
            price += (Math.random() - 0.5) * price * 0.02;
            this.chartData.push({
                timestamp: Date.now() - (30 - i) * 24 * 60 * 60 * 1000,
                open: price,
                high: price * (1 + Math.random() * 0.02),
                low: price * (1 - Math.random() * 0.02),
                close: price,
                volume: Math.floor(Math.random() * 1000000) + 100000
            });
        }
        
        // Ensure last point matches current price
        this.chartData[this.chartData.length - 1].close = basePrice;
    }
    
    /**
     * Generate demo news
     */
    generateDemoNews() {
        this.newsData = [
            {
                title: `${this.stockSymbol} Reports Strong Quarterly Earnings`,
                url: '#',
                timestamp: Date.now() - 2 * 60 * 60 * 1000
            },
            {
                title: `Analysts Upgrade ${this.stockSymbol} Price Target`,
                url: '#',
                timestamp: Date.now() - 6 * 60 * 60 * 1000
            },
            {
                title: `${this.stockSymbol} Announces Strategic Partnership`,
                url: '#',
                timestamp: Date.now() - 12 * 60 * 60 * 1000
            }
        ];
    }
    
    /**
     * Generate demo related stocks
     */
    generateDemoRelatedStocks() {
        const relatedSymbols = this.getStocksBySector(this.stockSymbol);
        
        this.relatedStocks = relatedSymbols.slice(0, 3).map(symbol => ({
            symbol,
            price: 100 + Math.random() * 200,
            change: (Math.random() - 0.5) * 10,
            changePercent: (Math.random() - 0.5) * 5
        }));
    }
    
    /**
     * Load demo data as complete fallback
     */
    async loadDemoData() {
        this.currentStock = this.generateDemoStockData();
        this.generateDemoChartData();
        this.generateDemoNews();
        this.generateDemoRelatedStocks();
        
        this.updateStockDisplay();
        this.updateTradingButtons();
        this.updatePerformanceTable();
        this.displayNews();
        this.displayRelatedStocks();
        this.drawChart();
        
        console.log('Demo data loaded as fallback');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Trading buttons
        if (this.elements.buyBtn) {
            this.elements.buyBtn.addEventListener('click', () => this.openTradeModal('buy'));
        }
        
        if (this.elements.sellBtn) {
            this.elements.sellBtn.addEventListener('click', () => this.openTradeModal('sell'));
        }
        
        // About button
        if (this.elements.aboutBtn) {
            this.elements.aboutBtn.addEventListener('click', () => this.toggleAboutSection());
        }
        
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
        this.setupTradeModal();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Window events
        window.addEventListener('focus', () => this.handleWindowFocus());
        window.addEventListener('blur', () => this.handleWindowBlur());
        
        // Page refresh on hash change (for real-time symbol switching)
        window.addEventListener('hashchange', () => this.handleSymbolChange());
    }
    
    /**
     * Handle window focus for real-time updates
     */
    handleWindowFocus() {
        console.log('Window focused - refreshing data');
        if (userManager.isLoggedIn()) {
            userManager.refreshSession();
            this.updateStockQuote();
        }
    }
    
    /**
     * Handle window blur
     */
    handleWindowBlur() {
        console.log('Window blurred');
    }
    
    /**
     * Handle symbol change for real-time switching
     */
    handleSymbolChange() {
        const newSymbol = this.getStockSymbolFromUrl();
        if (newSymbol && newSymbol !== this.stockSymbol) {
            this.stockSymbol = newSymbol;
            this.loadStockData();
        }
    }
    
    /**
     * Toggle about section
     */
    toggleAboutSection() {
        if (!this.elements.aboutContent) return;
        
        const isVisible = this.elements.aboutContent.classList.contains('show');
        
        if (isVisible) {
            this.elements.aboutContent.classList.remove('show');
            this.elements.aboutBtn.textContent = `MORE ABOUT ${this.stockSymbol}`;
        } else {
            this.elements.aboutContent.classList.add('show');
            this.elements.aboutBtn.textContent = `LESS ABOUT ${this.stockSymbol}`;
        }
    }
    
    /**
     * Open trade modal
     */
    openTradeModal(side = 'buy') {
        this.openTradeModalForStock(this.stockSymbol, side);
    }
    
    /**
     * Open trade modal for specific stock
     */
    openTradeModalForStock(symbol, side = 'buy') {
        if (!this.elements.tradeModal) return;
        
        const symbolInput = Utils.dom.get('tradeSymbol');
        const sideSelect = Utils.dom.get('tradeSide');
        const priceInput = Utils.dom.get('tradePrice');
        const availableBalance = Utils.dom.get('availableBalance');
        const modalTitle = Utils.dom.get('tradeModalTitle');
        
        if (symbolInput) symbolInput.value = symbol;
        if (sideSelect) sideSelect.value = side;
        if (modalTitle) modalTitle.textContent = `${side.toUpperCase()} ${symbol}`;
        
        // Set current price
        const stockPrice = symbol === this.stockSymbol ? 
                          this.currentStock?.price || 100 : 
                          100 + Math.random() * 200;
        
        if (priceInput) {
            priceInput.value = stockPrice.toFixed(2);
        }
        
        // Set available balance
        if (availableBalance) {
            const currentUser = userManager.getCurrentUser();
            availableBalance.textContent = Utils.format.currency(currentUser?.balance || 10000);
        }
        
        this.setupTradeModalCalculations();
        this.setupTradeModalSubmission();
        
        this.elements.tradeModal.classList.add('active');
        Utils.animate.fadeIn(this.elements.tradeModal);
    }
    
    /**
     * Setup trade modal
     */
    setupTradeModal() {
        const modalClose = Utils.dom.get('tradeModalClose');
        const cancelBtn = Utils.dom.get('cancelTradeBtn');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeTradeModal());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeTradeModal());
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
     * Setup trade modal calculations
     */
    setupTradeModalCalculations() {
        const quantityInput = Utils.dom.get('tradeQuantity');
        const priceInput = Utils.dom.get('tradePrice');
        const totalSpan = Utils.dom.get('estimatedTotal');
        
        const updateTotal = () => {
            const quantity = parseFloat(quantityInput?.value) || 0;
            const price = parseFloat(priceInput?.value) || 0;
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
        
        if (submitBtn) {
            submitBtn.onclick = () => this.submitTrade();
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
        
        Loading.show('Placing order...');
        
        try {
            // In a real app, this would place an actual order
            const result = await apiService.placeOrder(orderData);
            
            if (result.success) {
                Toast.success(`${orderData.side.toUpperCase()} order for ${orderData.symbol} placed successfully!`);
                this.closeTradeModal();
                
                // Update user portfolio in demo mode
                if (apiService.demoMode) {
                    userManager.addTransaction({
                        symbol: orderData.symbol,
                        type: orderData.side,
                        shares: orderData.quantity,
                        price: orderData.price
                    });
                }
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
     * Close trade modal
     */
    closeTradeModal() {
        if (this.elements.tradeModal) {
            this.elements.tradeModal.classList.remove('active');
            Utils.animate.fadeOut(this.elements.tradeModal);
        }
    }
    
    /**
     * Navigate to another stock
     */
    navigateToStock(symbol) {
        window.location.href = `stock.html?symbol=${symbol}`;
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
            this.cleanup();
            userManager.logout();
        }
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape key closes modal
            if (e.key === 'Escape') {
                this.closeTradeModal();
            }
            
            // B key opens buy modal
            if (e.key === 'b' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.openTradeModal('buy');
            }
            
            // S key opens sell modal
            if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.openTradeModal('sell');
            }
            
            // R key refreshes data
            if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.updateStockQuote();
                Toast.info('Refreshing stock data...');
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
     * Cleanup intervals and listeners
     */
    cleanup() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.chartUpdateInterval) {
            clearInterval(this.chartUpdateInterval);
        }
        
        // Remove market status indicator
        const statusEl = document.querySelector('.market-status');
        if (statusEl) {
            statusEl.remove();
        }
    }
    
    /**
     * Destroy and cleanup
     */
    destroy() {
        this.cleanup();
        console.log('Stock page destroyed');
    }
}

// Initialize stock page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const stockPage = new StockPage();
    
    // Make globally available for debugging
    if (typeof window !== 'undefined') {
        window.stockPage = stockPage;
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        stockPage.destroy();
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StockPage;
}
