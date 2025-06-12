/**
 * Country Detection and API Configuration
 */
class CountryAPIManager {
    constructor() {
        this.userCountry = null;
        this.countryConfig = {
            'US': {
                baseUrl: 'https://finnhub.io/api/v1',
                apiKey: 'YOUR_FINNHUB_API_KEY',
                currency: 'USD',
                popularStocks: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'],
                marketIndices: ['^GSPC', '^DJI', '^IXIC']
            },
            'DE': {
                baseUrl: 'https://api.marketstack.com/v1',
                apiKey: 'YOUR_MARKETSTACK_API_KEY',
                currency: 'EUR',
                popularStocks: ['SAP.DE', 'SIE.DE', 'ALV.DE', 'BAS.DE', 'VOW3.DE'],
                marketIndices: ['^GDAXI', '^MDAXI', '^TECDAX']
            },
            'GB': {
                baseUrl: 'https://api.twelvedata.com/v1',
                apiKey: 'YOUR_TWELVEDATA_API_KEY',
                currency: 'GBP',
                popularStocks: ['LLOY.LON', 'BP.LON', 'SHEL.LON', 'AZN.LON', 'ULVR.LON'],
                marketIndices: ['^FTSE', '^FTMC', '^FTAI']
            },
            'CA': {
                baseUrl: 'https://api.polygon.io/v2',
                apiKey: 'YOUR_POLYGON_API_KEY',
                currency: 'CAD',
                popularStocks: ['SHOP.TO', 'CNR.TO', 'RY.TO', 'TD.TO', 'BNS.TO'],
                marketIndices: ['^GSPTSE', '^GSPTSC', '^GSPTSX']
            }
        };
    }

    async detectUserCountry() {
        try {
            // Try to get country from IP geolocation
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            this.userCountry = data.country_code || 'US';
        } catch (error) {
            console.warn('Could not detect country, defaulting to US:', error);
            this.userCountry = 'US';
        }
        
        // Store in localStorage for future use
        localStorage.setItem('vantyx_user_country', this.userCountry);
        return this.userCountry;
    }

    getUserCountry() {
        if (this.userCountry) return this.userCountry;
        
        // Try to get from localStorage first
        const stored = localStorage.getItem('vantyx_user_country');
        if (stored) {
            this.userCountry = stored;
            return stored;
        }
        
        return 'US'; // Default fallback
    }

    getCountryConfig(country = null) {
        const targetCountry = country || this.getUserCountry();
        return this.countryConfig[targetCountry] || this.countryConfig['US'];
    }

    getPopularStocks(country = null) {
        const config = this.getCountryConfig(country);
        return config.popularStocks;
    }

    getCurrency(country = null) {
        const config = this.getCountryConfig(country);
        return config.currency;
    }
}

// Initialize country manager
const countryManager = new CountryAPIManager();

/**
 * Enhanced API Functions using ApiService
 */
async function initializeApp() {
    try {
        // Detect user country
        await countryManager.detectUserCountry();
        const userCountry = countryManager.getUserCountry();
        const currency = countryManager.getCurrency();
        
        console.log('User country detected:', userCountry);
        
        // Update country info in UI
        const countryInfo = document.getElementById('country-info');
        if (countryInfo) {
            const marketData = APP_CONFIG.markets[userCountry] || APP_CONFIG.markets['US'];
            countryInfo.innerHTML = `
                📍 Trading in ${userCountry} • Currency: ${currency} • 
                Popular: ${marketData.popular.slice(0, 3).join(', ')}...
            `;
        }
        
        // Configure API service for user's country
        const countryConfig = countryManager.getCountryConfig();
        console.log('Using API configuration for:', userCountry);
        
        return true;
    } catch (error) {
        console.error('App initialization failed:', error);
        return false;
    }
}

async function fetchLastViewed() {
    try {
        const popularStocks = countryManager.getPopularStocks();
        const randomStock = popularStocks[Math.floor(Math.random() * popularStocks.length)];
        
        const result = await apiService.getStockQuote(randomStock);
        
        if (result.success) {
            return {
                symbol: result.data.symbol,
                name: result.data.name,
                price: result.data.price,
                type: 'Large Cap',
                change: result.data.change,
                changePercent: result.data.changePercent
            };
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error fetching last viewed:', error);
        // Fallback to demo data
        return apiService.generateDemoQuote('AAPL');
    }
}

async function fetchSectors() {
    try {
        const result = await apiService.getMarketIndices();
        
        if (result.success) {
            // Transform market indices to sectors format
            const sectors = [
                { name: 'Tech', icon: '💻', change: '+1.5%' },
                { name: 'Healthcare', icon: '🏥', change: '+2.3%' },
                { name: 'Financial', icon: '💰', change: '+0.8%' },
                { name: 'Energy', icon: '⚡', change: '+3.2%' },
                { name: 'Industrials', icon: '🏭', change: '+4.0%' },
                { name: 'Consumer', icon: '🛍️', change: '+1.3%' },
                { name: 'Materials', icon: '🔧', change: '+2.5%' },
                { name: 'Utilities', icon: '🔌', change: '+1.1%' }
            ];
            
            return sectors;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error fetching sectors:', error);
        // Fallback to demo data
        return [
            { name: 'Tech', icon: '💻', change: '+1.5%' },
            { name: 'Healthcare', icon: '🏥', change: '+2.3%' },
            { name: 'Financial', icon: '💰', change: '+0.8%' },
            { name: 'Energy', icon: '⚡', change: '+3.2%' },
            { name: 'Industrials', icon: '🏭', change: '+4.0%' },
            { name: 'Consumer', icon: '🛍️', change: '+1.3%' },
            { name: 'Materials', icon: '🔧', change: '+2.5%' },
            { name: 'Utilities', icon: '🔌', change: '+1.1%' }
        ];
    }
}

async function fetchMarketNews() {
    try {
        const result = await apiService.getMarketNews('general', 5);
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        return [];
    }
}

// Render Functions
function renderLastViewed(stock) {
    const currency = countryManager.getCurrency();
    const changeColor = stock.change >= 0 ? '#4CAF50' : '#f44336';
    const changeSymbol = stock.change >= 0 ? '+' : '';
    
    return `
        <div class="stock-card">
            <div class="stock-header">
                <div>
                    <div class="stock-name">${stock.name} (${stock.symbol})</div>
                    <div style="opacity: 0.7;">${stock.type}</div>
                </div>
                <div style="text-align: right;">
                    <div class="stock-price">${currency} ${stock.price}</div>
                    <div style="color: ${changeColor}; font-size: 14px;">
                        ${changeSymbol}${stock.change} (${changeSymbol}${stock.changePercent}%)
                    </div>
                </div>
            </div>
            <div class="buttons">
                <button class="btn btn-buy" onclick="trade('${stock.symbol}', 'buy')">BUY</button>
                <button class="btn btn-sell" onclick="trade('${stock.symbol}', 'sell')">SELL</button>
            </div>
        </div>
    `;
}

function renderSectors(sectors) {
    return sectors.map(sector => `
        <div class="sector" onclick="selectSector('${sector.name}')">
            <div class="sector-icon">${sector.icon}</div>
            <div class="sector-name">${sector.name}</div>
            <div class="sector-change">${sector.change}</div>
        </div>
    `).join('');
}

// Event Handlers
async function trade(symbol, action) {
    try {
        // Show loading state
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Processing...';
        btn.disabled = true;
        
        // Get current quote for the stock
        const quoteResult = await apiService.getStockQuote(symbol);
        
        if (!quoteResult.success) {
            throw new Error('Failed to get current price');
        }
        
        const orderData = {
            symbol: symbol,
            type: 'market',
            side: action, // 'buy' or 'sell'
            quantity: 1, // Default quantity
            price: quoteResult.data.price
        };
        
        // Place the order using ApiService
        const result = await apiService.placeOrder(orderData);
        
        if (result.success) {
            alert(`${action.toUpperCase()} order placed successfully for ${symbol} at ${countryManager.getCurrency()} ${result.data.price}`);
            
            // Refresh the display to show updated data
            await loadPageData();
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Trade error:', error);
        alert(`Error placing ${action} order: ${error.message}`);
    } finally {
        // Reset button state
        const btn = event.target;
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function selectSector(name) {
    try {
        // You can implement sector-specific stock search here
        alert(`Loading ${name} sector stocks...`);
        
        // Example: Search for stocks in the selected sector
        const searchResult = await apiService.searchStocks(name);
        
        if (searchResult.success && searchResult.data.length > 0) {
            console.log(`Found ${searchResult.data.length} stocks in ${name} sector:`, searchResult.data);
            // You can redirect to a sector page or show a modal with sector stocks
        }
        
    } catch (error) {
        console.error('Sector selection error:', error);
        alert(`Error loading ${name} sector: ${error.message}`);
    }
}

function showHome() {
    location.reload();
}

function showMarkets() {
    alert('Redirecting to Markets page...');
    // window.location.href = '/markets';
}

function showNews() {
    alert('Redirecting to News page...');
    // window.location.href = '/news';
}

// Enhanced data loading function
async function loadPageData() {
    try {
        // Show loading states
        document.getElementById('lastViewed').innerHTML = '<div class="loading">Loading...</div>';
        document.getElementById('sectors').innerHTML = '<div class="loading">Loading...</div>';
        
        // Load data concurrently
        const [lastViewedData, sectorsData] = await Promise.all([
            fetchLastViewed(),
            fetchSectors()
        ]);
        
        // Update UI
        document.getElementById('lastViewed').innerHTML = renderLastViewed(lastViewedData);
        document.getElementById('sectors').innerHTML = renderSectors(sectorsData);
        
        console.log('Page data loaded successfully');
        
    } catch (error) {
        console.error('Error loading page data:', error);
        
        // Show error states
        document.getElementById('lastViewed').innerHTML = '<div class="error">Error loading data</div>';
        document.getElementById('sectors').innerHTML = '<div class="error">Error loading sectors</div>';
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Initializing VANTYX application...');
        
        // Initialize the app and detect country
        const initialized = await initializeApp();
        
        if (initialized) {
            console.log(`App initialized for country: ${countryManager.getUserCountry()}`);
            console.log(`Using currency: ${countryManager.getCurrency()}`);
            console.log(`Popular stocks: ${countryManager.getPopularStocks().join(', ')}`);
            
            // Load page data
            await loadPageData();
            
            // Set up periodic data refresh (every 30 seconds)
            setInterval(async () => {
                try {
                    await loadPageData();
                    console.log('Data refreshed automatically');
                } catch (error) {
                    console.error('Auto-refresh failed:', error);
                }
            }, 30000);
            
        } else {
            throw new Error('App initialization failed');
        }
        
    } catch (error) {
        console.error('Critical error during app startup:', error);
        
        // Show fallback UI
        document.getElementById('lastViewed').innerHTML = `
            <div class="error">
                <p>Error loading application</p>
                <button onclick="location.reload()" class="btn btn-buy">Retry</button>
            </div>
        `;
        document.getElementById('sectors').innerHTML = '<div class="error">Unable to load sectors</div>';
    }
});

// Add some utility functions for debugging and development
window.VANTYX_DEBUG = {
    // Get current country configuration
    getCountryConfig: () => countryManager.getCountryConfig(),
    
    // Change country manually (for testing)
    setCountry: (countryCode) => {
        countryManager.userCountry = countryCode;
        localStorage.setItem('vantyx_user_country', countryCode);
        console.log(`Country changed to: ${countryCode}`);
        loadPageData();
    },
    
    // Get API service status
    getApiStatus: () => apiService.getApiStatus(),
    
    // Clear cache
    clearCache: () => {
        apiService.clearCache();
        console.log('API cache cleared');
    },
    
    // Toggle demo mode
    toggleDemoMode: () => {
        if (apiService.demoMode) {
            apiService.enableLiveMode();
            console.log('Switched to live API mode');
        } else {
            apiService.enableDemoMode();
            console.log('Switched to demo mode');
        }
    }
};
