/**
 * VANTYX - Main Application Initialization
 * Global app setup and common functionality
 */

class VantyxApp {
    constructor() {
        this.version = APP_CONFIG.version;
        this.initialized = false;
        this.currentPage = this.getCurrentPage();
        this.toast = null;
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        console.log(`VANTYX v${this.version} initializing...`);
        
        // Set up global error handling
        this.setupErrorHandling();
        
        // Initialize toast notification system
        this.initializeToast();
        
        // Set up global event listeners
        this.setupGlobalEventListeners();
        
        // Initialize theme system
        this.initializeTheme();
        
        // Set up navigation
        this.setupNavigation();
        
        // Initialize page-specific features
        this.initializePageFeatures();
        
        // Set up periodic tasks
        this.setupPeriodicTasks();
        
        this.initialized = true;
        console.log('VANTYX initialized successfully');
        
        // Dispatch custom event
        this.dispatchEvent('vantyx:initialized');
    }
    
    /**
     * Get current page name
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename.replace('.html', '');
    }
    
    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showToast('An unexpected error occurred', 'error');
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showToast('A network error occurred', 'error');
            event.preventDefault();
        });
    }
    
    /**
     * Initialize toast notification system
     */
    initializeToast() {
        // Create toast container if it doesn't exist
        let toastContainer = Utils.dom.get('toastContainer');
        if (!toastContainer) {
            toastContainer = Utils.dom.create('div', {
                id: 'toastContainer',
                class: 'toast-container'
            });
            document.body.appendChild(toastContainer);
        }
        
        // Add toast styles
        if (!Utils.dom.get('toastStyles')) {
            const styles = Utils.dom.create('style', { id: 'toastStyles' });
            styles.textContent = `
                .toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    pointer-events: none;
                }
                
                .toast {
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    padding: var(--spacing-md);
                    margin-bottom: var(--spacing-sm);
                    min-width: 300px;
                    max-width: 400px;
                    backdrop-filter: blur(10px);
                    box-shadow: var(--shadow-lg);
                    transform: translateX(100%);
                    transition: var(--transition-standard);
                    pointer-events: auto;
                    position: relative;
                }
                
                .toast.show {
                    transform: translateX(0);
                }
                
                .toast.success {
                    border-left: 4px solid var(--accent-color);
                }
                
                .toast.error {
                    border-left: 4px solid var(--accent-red);
                }
                
                .toast.warning {
                    border-left: 4px solid #ffa500;
                }
                
                .toast.info {
                    border-left: 4px solid var(--primary-color);
                }
                
                .toast-close {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 18px;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .toast-close:hover {
                    color: var(--text-primary);
                }
                
                @media (max-width: 768px) {
                    .toast-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                    }
                    
                    .toast {
                        min-width: auto;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = Utils.dom.get('toastContainer');
        if (!toastContainer) return;
        
        // Create toast element
        const toast = Utils.dom.create('div', {
            class: `toast ${type}`
        });
        
        toast.innerHTML = `
            <div class="toast-content">${message}</div>
            <button class="toast-close">&times;</button>
        `;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Auto-hide toast
        if (duration > 0) {
            setTimeout(() => {
                this.hideToast(toast);
            }, duration);
        }
        
        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.hideToast(toast);
        });
        
        return toast;
    }
    
    /**
     * Hide toast notification
     */
    hideToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
    
    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showToast('Connection restored', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('Connection lost. Some features may be limited.', 'warning');
        });
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('App went to background');
            } else {
                console.log('App came to foreground');
                // Refresh session if user is logged in
                if (userManager.isLoggedIn()) {
                    userManager.refreshSession();
                }
            }
        });
        
        // Handle resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Handle beforeunload
        window.addEventListener('beforeunload', (e) => {
            // Save any pending data
            if (userManager.currentUser) {
                userManager.currentUser.lastActivity = new Date().toISOString();
                userManager.saveCurrentUser();
            }
        });
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Update mobile detection
        document.body.classList.toggle('mobile', Utils.isMobile());
        document.body.classList.toggle('tablet', Utils.isTablet());
        document.body.classList.toggle('desktop', Utils.isDesktop());
        
        // Dispatch resize event
        this.dispatchEvent('vantyx:resize', {
            width: window.innerWidth,
            height: window.innerHeight,
            isMobile: Utils.isMobile(),
            isTablet: Utils.isTablet(),
            isDesktop: Utils.isDesktop()
        });
    }
    
    /**
     * Initialize theme system
     */
    initializeTheme() {
        const savedTheme = Utils.storage.get(APP_CONFIG.storage.theme, APP_CONFIG.defaults.theme);
        this.applyTheme(savedTheme);
        
        // Set device classes
        this.handleResize();
    }
    
    /**
     * Apply theme
     */
    applyTheme(themeName) {
        document.body.classList.remove('dark-theme', 'light-theme');
        document.body.classList.add(`${themeName}-theme`);
        
        // Update meta theme color
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        if (!metaTheme) {
            metaTheme = Utils.dom.create('meta', { name: 'theme-color' });
            document.head.appendChild(metaTheme);
        }
        
        const themeColor = themeName === 'dark' ? '#1a1a2e' : '#ffffff';
        metaTheme.setAttribute('content', themeColor);
    }
    
    /**
     * Setup navigation
     */
    setupNavigation() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            console.log('Navigation state changed:', e.state);
        });
        
        // Setup global navigation handlers
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-navigate]');
            if (link) {
                e.preventDefault();
                const page = link.getAttribute('data-navigate');
                this.navigateTo(page);
            }
        });
    }
    
    /**
     * Navigate to page
     */
    navigateTo(page) {
        // Add transition effect
        Utils.animate.fadeOut('body', 300);
        
        setTimeout(() => {
            window.location.href = page;
        }, 300);
    }
    
    /**
     * Initialize page-specific features
     */
    initializePageFeatures() {
        switch (this.currentPage) {
            case 'index':
            case 'login':
                this.initializeLoginPage();
                break;
            case 'register':
                this.initializeRegisterPage();
                break;
            case 'dashboard':
                this.initializeDashboardPage();
                break;
            default:
                console.log(`No specific initialization for page: ${this.currentPage}`);
        }
    }
    
    /**
     * Initialize login page features
     */
    initializeLoginPage() {
        console.log('Initializing login page features');
        
        // Add demo account info
        this.addDemoAccountInfo();
    }
    
    /**
     * Initialize register page features
     */
    initializeRegisterPage() {
        console.log('Initializing register page features');
        
        // Add form progress indicator
        this.addFormProgress();
    }
    
    /**
     * Initialize dashboard page features
     */
    initializeDashboardPage() {
        console.log('Initializing dashboard page features');
        
        // Check if user is logged in
        if (!userManager.isLoggedIn()) {
            this.showToast('Please login to access the dashboard', 'warning');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }
    
    /**
     * Add demo account info
     */
    addDemoAccountInfo() {
        if (this.currentPage !== 'index' && this.currentPage !== 'login') return;
        
        const loginContainer = Utils.dom.query('.login-container');
        if (!loginContainer) return;
        
        const demoInfo = Utils.dom.create('div', {
            class: 'demo-info',
            style: `
                background: rgba(74, 144, 226, 0.1);
                border: 1px solid var(--primary-color);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
                margin-top: var(--spacing-lg);
                font-size: var(--font-size-sm);
                color: var(--text-secondary);
            `
        });
        
        demoInfo.innerHTML = `
            <h4 style="color: var(--primary-color); margin-bottom: var(--spacing-sm);">Demo Accounts</h4>
            <p><strong>User:</strong> DEMO001 / 1234</p>
            <p><strong>Admin:</strong> ADMIN / admin123</p>
        `;
        
        loginContainer.appendChild(demoInfo);
    }
    
    /**
     * Add form progress indicator
     */
    addFormProgress() {
        if (this.currentPage !== 'register') return;
        
        const form = Utils.dom.get('registerForm');
        if (!form) return;
        
        const inputs = form.querySelectorAll('input[required]');
        const progress = Utils.dom.create('div', {
            class: 'form-progress',
            style: `
                background: var(--input-bg);
                height: 4px;
                border-radius: 2px;
                margin-bottom: var(--spacing-lg);
                overflow: hidden;
            `
        });
        
        const progressBar = Utils.dom.create('div', {
            class: 'form-progress-bar',
            style: `
                height: 100%;
                background: var(--primary-color);
                width: 0%;
                transition: var(--transition-standard);
            `
        });
        
        progress.appendChild(progressBar);
        form.insertBefore(progress, form.firstChild);
        
        // Update progress on input
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                const filledInputs = Array.from(inputs).filter(inp => inp.value.trim() !== '').length;
                const progressPercent = (filledInputs / inputs.length) * 100;
                progressBar.style.width = `${progressPercent}%`;
            });
        });
    }
    
    /**
     * Setup periodic tasks
     */
    setupPeriodicTasks() {
        // Refresh data every 30 seconds if user is logged in
        setInterval(() => {
            if (userManager.isLoggedIn() && !document.hidden) {
                this.refreshData();
            }
        }, 30000);
        
        // Clean up old cache entries every 5 minutes
        setInterval(() => {
            this.cleanupCache();
        }, 5 * 60 * 1000);
    }
    
    /**
     * Refresh data
     */
    async refreshData() {
        try {
            // Refresh market data if on relevant pages
            if (['dashboard', 'portfolio', 'watchlist'].includes(this.currentPage)) {
                await apiService.getMarketIndices();
            }
        } catch (error) {
            console.warn('Failed to refresh data:', error);
        }
    }
    
    /**
     * Cleanup cache
     */
    cleanupCache() {
        if (apiService && apiService.cache) {
            const now = Date.now();
            const cacheEntries = Array.from(apiService.cache.entries());
            
            cacheEntries.forEach(([key, value]) => {
                if (now - value.timestamp > apiService.cacheDuration) {
                    apiService.cache.delete(key);
                }
            });
        }
    }
    
    /**
     * Dispatch custom event
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }
    
    /**
     * Get app info
     */
    getAppInfo() {
        return {
            name: APP_CONFIG.name,
            version: this.version,
            currentPage: this.currentPage,
            initialized: this.initialized,
            userLoggedIn: userManager.isLoggedIn(),
            demoMode: apiService.demoMode,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Debug methods
     */
    debug() {
        console.group('VANTYX Debug Info');
        console.log('App Info:', this.getAppInfo());
        console.log('Current User:', userManager.getCurrentUser());
        console.log('Storage Keys:', Object.keys(localStorage).filter(key => key.startsWith('vantyx_')));
        console.log('API Cache Size:', apiService.cache.size);
        console.groupEnd();
    }
    
    /**
     * Reset app data (for testing)
     */
    resetAppData() {
        if (confirm('This will clear all app data. Are you sure?')) {
            // Clear localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('vantyx_')) {
                    localStorage.removeItem(key);
                }
            });
            
            // Clear API cache
            apiService.clearCache();
            
            // Reload page
            window.location.reload();
        }
    }
}

// Toast utility for global use
class Toast {
    static show(message, type = 'info', duration = 5000) {
        if (window.vantyxApp) {
            return window.vantyxApp.showToast(message, type, duration);
        }
        
        // Fallback to alert if app not initialized
        alert(message);
    }
    
    static success(message, duration = 3000) {
        return Toast.show(message, 'success', duration);
    }
    
    static error(message, duration = 5000) {
        return Toast.show(message, 'error', duration);
    }
    
    static warning(message, duration = 4000) {
        return Toast.show(message, 'warning', duration);
    }
    
    static info(message, duration = 3000) {
        return Toast.show(message, 'info', duration);
    }
}

// Loading utility for global use
class Loading {
    static overlay = null;
    
    static show(message = 'Loading...') {
        if (Loading.overlay) {
            Loading.hide();
        }
        
        Loading.overlay = Utils.dom.create('div', {
            class: 'loading-overlay',
            style: `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            `
        });
        
        Loading.overlay.innerHTML = `
            <div class="loading-content" style="
                text-align: center;
                color: white;
            ">
                <div class="spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top: 3px solid #4a90e2;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(Loading.overlay);
        
        setTimeout(() => {
            Loading.overlay.style.opacity = '1';
        }, 10);
    }
    
    static hide() {
        if (Loading.overlay) {
            Loading.overlay.style.opacity = '0';
            setTimeout(() => {
                if (Loading.overlay && Loading.overlay.parentNode) {
                    Loading.overlay.parentNode.removeChild(Loading.overlay);
                }
                Loading.overlay = null;
            }, 300);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.vantyxApp = new VantyxApp();
    
    // Make utilities globally available
    window.Toast = Toast;
    window.Loading = Loading;
    
    // Add global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for search (future feature)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            console.log('Search shortcut triggered');
        }
        
        // Ctrl/Cmd + D for debug info
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            window.vantyxApp.debug();
        }
        
        // Escape to close modals/overlays
        if (e.key === 'Escape') {
            // Close any open modals
            const activeModal = Utils.dom.query('.modal.active');
            if (activeModal) {
                activeModal.classList.remove('active');
            }
            
            // Hide loading overlay
            Loading.hide();
        }
    });
    
    // Add development helpers in dev mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Development mode detected');
        
        // Add reset button for testing
        const resetBtn = Utils.dom.create('button', {
            style: `
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 9999;
                background: #ff4444;
                color: white;
                border: none;
                padding: 10px;
                border-radius: 5px;
                font-size: 12px;
                cursor: pointer;
                opacity: 0.7;
            `
        }, 'Reset Data');
        
        resetBtn.addEventListener('click', () => {
            window.vantyxApp.resetAppData();
        });
        
        document.body.appendChild(resetBtn);
        
        // Make app instance globally accessible for debugging
        window.vantyx = {
            app: window.vantyxApp,
            user: userManager,
            api: apiService,
            utils: Utils,
            config: APP_CONFIG
        };
        
        console.log('Debug tools available at window.vantyx');
    }
});

// Handle app lifecycle events
window.addEventListener('vantyx:initialized', () => {
    console.log('VANTYX app fully initialized');
});

window.addEventListener('vantyx:resize', (e) => {
    console.log('App resized:', e.detail);
});

// Progressive Web App support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Register service worker for PWA functionality
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VantyxApp, Toast, Loading };
}
