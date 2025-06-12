/**
 * VANTYX - API Service
 * Handles all API communications and data fetching
 */

class ApiService {
    constructor() {
        this.baseUrl = APP_CONFIG.api.baseUrl;
        this.timeout = APP_CONFIG.api.timeout;
        this.retryAttempts = APP_CONFIG.api.retryAttempts;
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
        
        // Demo mode flag
        this.demoMode = true;
        
        console.log('ApiService initialized');
    }
    
    /**
     * Generic HTTP request method
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: this.timeout
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // Add authorization if user is logged in
        const currentUser = userManager.getCurrentUser();
        if (currentUser && currentUser.token) {
            finalOptions.headers['Authorization'] = `Bearer ${currentUser.token}`;
        }
        
        let lastError;
        
        // Retry logic
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await this.fetchWithTimeout(url, finalOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                return { success: true, data };
                
            } catch (error) {
                lastError = error;
                console.warn(`API request attempt ${attempt} failed:`, error.message);
                
                // Don't retry on certain errors
                if (error.name === 'AbortError' || error.status === 401 || error.status === 403) {
                    break;
                }
                
                // Wait before retry (exponential backoff)
                if (attempt < this.retryAttempts) {
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
            }
        }
        
        return { success: false, error: lastError.message };
    }
    
    /**
     * Fetch with timeout support
     */
    async fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    
    /**
     * Cache management
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }
        return null;
    }
    
    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Stock Data APIs
     */
    
    /**
     * Get stock quote
     */
    async getStockQuote(symbol) {
        const cacheKey = `quote_${symbol}`;
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return { success: true, data: cached };
        }
        
        if (this.demoMode) {
            // Return demo data
            const demoData = this.generateDemoQuote(symbol);
            this.setCachedData(cacheKey, demoData);
            return { success: true, data: demoData };
        }
        
        try {
            const result = await this.request(`/stocks/quote/${symbol}`);
            if (result.success) {
                this.setCachedData(cacheKey, result.data);
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get multiple stock quotes
     */
    async getMultipleQuotes(symbols) {
        if (this.demoMode) {
            const quotes = {};
            symbols.forEach(symbol => {
                quotes[symbol] = this.generateDemoQuote(symbol);
            });
            return { success: true, data: quotes };
        }
        
        try {
            const result = await this.request('/stocks/quotes', {
                method: 'POST',
                body: JSON.stringify({ symbols })
            });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get stock chart data
     */
    async getStockChart(symbol, interval = '1D', range = '1M') {
        const cacheKey = `chart_${symbol}_${interval}_${range}`;
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return { success: true, data: cached };
        }
        
        if (this.demoMode) {
            const demoData = this.generateDemoChart(symbol, interval, range);
            this.setCachedData(cacheKey, demoData);
            return { success: true, data: demoData };
        }
        
        try {
            const result = await this.request(`/stocks/chart/${symbol}?interval=${interval}&range=${range}`);
            if (result.success) {
                this.setCachedData(cacheKey, result.data);
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Search stocks
     */
    async searchStocks(query) {
        if (this.demoMode) {
            const demoResults = this.generateDemoSearchResults(query);
            return { success: true, data: demoResults };
        }
        
        try {
            const result = await this.request(`/stocks/search?q=${encodeURIComponent(query)}`);
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get market news
     */
    async getMarketNews(category = 'general', limit = 20) {
        const cacheKey = `news_${category}_${limit}`;
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return { success: true, data: cached };
        }
        
        if (this.demoMode) {
            const demoData = this.generateDemoNews(category, limit);
            this.setCachedData(cacheKey, demoData);
            return { success: true, data: demoData };
        }
        
        try {
            const result = await this.request(`/news?category=${category}&limit=${limit}`);
            if (result.success) {
                this.setCachedData(cacheKey, result.data);
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get market indices
     */
    async getMarketIndices() {
        const cacheKey = 'market_indices';
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return { success: true, data: cached };
        }
        
        if (this.demoMode) {
            const demoData = this.generateDemoIndices();
            this.setCachedData(cacheKey, demoData);
            return { success: true, data: demoData };
        }
        
        try {
            const result = await this.request('/market/indices');
            if (result.success) {
                this.setCachedData(cacheKey, result.data);
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Trading APIs
     */
    
    /**
     * Place order
     */
    async placeOrder(orderData) {
        if (this.demoMode) {
            // Simulate order placement
            await this.delay(1000);
            
            const order = {
                id: Utils.generateId(),
                symbol: orderData.symbol,
                type: orderData.type,
                side: orderData.side, // 'buy' or 'sell'
                quantity: orderData.quantity,
                price: orderData.price,
                status: 'filled',
                timestamp: new Date().toISOString(),
                userId: userManager.getCurrentUser()?.id
            };
            
            // Update user portfolio
            if (order.status === 'filled') {
                userManager.addTransaction({
                    symbol: order.symbol,
                    type: order.side,
                    shares: order.quantity,
                    price: order.price
                });
            }
            
            return { success: true, data: order };
        }
        
        try {
            const result = await this.request('/trading/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get user orders
     */
    async getUserOrders(status = 'all') {
        if (this.demoMode) {
            // Return demo orders
            const demoOrders = this.generateDemoOrders();
            return { success: true, data: demoOrders };
        }
        
        try {
            const result = await this.request(`/trading/orders?status=${status}`);
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Cancel order
     */
    async cancelOrder(orderId) {
        if (this.demoMode) {
            await this.delay(500);
            return { success: true, data: { orderId, status: 'cancelled' } };
        }
        
        try {
            const result = await this.request(`/trading/orders/${orderId}`, {
                method: 'DELETE'
            });
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Demo Data Generators
     */
    
    generateDemoQuote(symbol) {
        const basePrice = this.getBasePrice(symbol);
        const change = (Math.random() - 0.5) * basePrice * 0.05; // ±5% change
        const price = basePrice + change;
        const changePercent = (change / basePrice) * 100;
        
        return {
            symbol,
            name: this.getCompanyName(symbol),
            price: parseFloat(price.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            volume: Math.floor(Math.random() * 10000000) + 1000000,
            marketCap: Math.floor(Math.random() * 1000000000000) + 100000000000,
            pe: parseFloat((Math.random() * 30 + 5).toFixed(2)),
            high52w: parseFloat((price * (1 + Math.random() * 0.5)).toFixed(2)),
            low52w: parseFloat((price * (1 - Math.random() * 0.3)).toFixed(2)),
            timestamp: new Date().toISOString()
        };
    }
    
    generateDemoChart(symbol, interval, range) {
        const dataPoints = this.getDataPointsCount(interval, range);
        const basePrice = this.getBasePrice(symbol);
        const data = [];
        let currentPrice = basePrice;
        
        for (let i = 0; i < dataPoints; i++) {
            const change = (Math.random() - 0.5) * currentPrice * 0.02; // ±2% change per point
            currentPrice = Math.max(currentPrice + change, 1); // Ensure price doesn't go below $1
            
            const timestamp = new Date(Date.now() - (dataPoints - i) * this.getIntervalMs(interval));
            
            data.push({
                timestamp: timestamp.toISOString(),
                open: parseFloat((currentPrice - change).toFixed(2)),
                high: parseFloat((currentPrice + Math.random() * currentPrice * 0.01).toFixed(2)),
                low: parseFloat((currentPrice - Math.random() * currentPrice * 0.01).toFixed(2)),
                close: parseFloat(currentPrice.toFixed(2)),
                volume: Math.floor(Math.random() * 1000000) + 100000
            });
        }
        
        return {
            symbol,
            interval,
            range,
            data
        };
    }
    
    generateDemoSearchResults(query) {
        const allStocks = [
            { symbol: 'AAPL', name: 'Apple Inc.' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.' },
            { symbol: 'MSFT', name: 'Microsoft Corporation' },
            { symbol: 'AMZN', name: 'Amazon.com Inc.' },
            { symbol: 'TSLA', name: 'Tesla Inc.' },
            { symbol: 'META', name: 'Meta Platforms Inc.' },
            { symbol: 'NVDA', name: 'NVIDIA Corporation' },
            { symbol: 'NFLX', name: 'Netflix Inc.' },
            { symbol: 'AMD', name: 'Advanced Micro Devices' },
            { symbol: 'INTC', name: 'Intel Corporation' }
        ];
        
        return allStocks.filter(stock => 
            stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
            stock.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
    }
    
    generateDemoNews(category, limit) {
        const newsItems = [
            {
                id: '1',
                title: 'Tech Stocks Rally on Strong Earnings',
                summary: 'Major technology companies reported better-than-expected quarterly earnings...',
                category: 'technology',
                source: 'Financial News',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                url: '#'
            },
            {
                id: '2',
                title: 'Federal Reserve Maintains Interest Rates',
                summary: 'The Federal Reserve decided to keep interest rates unchanged...',
                category: 'monetary-policy',
                source: 'Economic Times',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                url: '#'
            },
            {
                id: '3',
                title: 'Electric Vehicle Stocks Surge',
                summary: 'Electric vehicle manufacturers see significant gains...',
                category: 'automotive',
                source: 'Auto Industry News',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                url: '#'
            }
        ];
        
        return newsItems.slice(0, limit);
    }
    
    generateDemoIndices() {
        return [
            {
                symbol: 'SPX',
                name: 'S&P 500',
                value: 4567.89,
                change: 23.45,
                changePercent: 0.52
            },
            {
                symbol: 'DJI',
                name: 'Dow Jones',
                value: 34567.12,
                change: -45.67,
                changePercent: -0.13
            },
            {
                symbol: 'IXIC',
                name: 'NASDAQ',
                value: 14567.89,
                change: 67.89,
                changePercent: 0.47
            }
        ];
    }
    
    generateDemoOrders() {
        const user = userManager.getCurrentUser();
        if (!user) return [];
        
        return [
            {
                id: 'order_1',
                symbol: 'AAPL',
                type: 'market',
                side: 'buy',
                quantity: 10,
                price: 175.43,
                status: 'filled',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'order_2',
                symbol: 'GOOGL',
                type: 'limit',
                side: 'sell',
                quantity: 5,
                price: 2850.00,
                status: 'pending',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            }
        ];
    }
    
    /**
     * Helper Methods
     */
    
    getBasePrice(symbol) {
        const prices = {
            'AAPL': 175.43,
            'GOOGL': 2834.32,
            'MSFT': 332.55,
            'AMZN': 3342.88,
            'TSLA': 742.10,
            'META': 298.45,
            'NVDA': 465.78,
            'NFLX': 398.23,
            'AMD': 89.67,
            'INTC': 45.23
        };
        
        return prices[symbol] || 100 + Math.random() * 900; // Random price between $100-1000
    }
    
    getCompanyName(symbol) {
        const names = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corporation',
            'AMZN': 'Amazon.com Inc.',
            'TSLA': 'Tesla Inc.',
            'META': 'Meta Platforms Inc.',
            'NVDA': 'NVIDIA Corporation',
            'NFLX': 'Netflix Inc.',
            'AMD': 'Advanced Micro Devices',
            'INTC': 'Intel Corporation'
        };
        
        return names[symbol] || `${symbol} Company`;
    }
    
    getDataPointsCount(interval, range) {
        const counts = {
            '1m': { '1D': 390, '1W': 1950, '1M': 8190 },
            '5m': { '1D': 78, '1W': 390, '1M': 1638 },
            '15m': { '1D': 26, '1W': 130, '1M': 546 },
            '30m': { '1D': 13, '1W': 65, '1M': 273 },
            '1h': { '1D': 7, '1W': 35, '1M': 147 },
            '1D': { '1M': 21, '3M': 63, '1Y': 252 }
        };
        
        return counts[interval]?.[range] || 100;
    }
    
    getIntervalMs(interval) {
        const intervals = {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '30m': 30 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '1D': 24 * 60 * 60 * 1000
        };
        
        return intervals[interval] || 60 * 1000;
    }
    
    /**
     * Real API Integration Methods (for when you connect to actual APIs)
     */
    
    /**
     * Switch to live API mode
     */
    enableLiveMode(apiKey) {
        this.demoMode = false;
        this.apiKey = apiKey;
        this.clearCache();
        console.log('API Service switched to live mode');
    }
    
    /**
     * Switch to demo mode
     */
    enableDemoMode() {
        this.demoMode = true;
        this.clearCache();
        console.log('API Service switched to demo mode');
    }
    
    /**
     * Get API status
     */
    async getApiStatus() {
        if (this.demoMode) {
            return { 
                success: true, 
                data: { 
                    status: 'demo',
                    message: 'Running in demo mode',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        try {
            const result = await this.request('/status');
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create global instance
const apiService = new ApiService();

// Make ApiService globally available
if (typeof window !== 'undefined') {
    window.ApiService = ApiService;
    window.apiService = apiService;
}

// Export for use in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}
