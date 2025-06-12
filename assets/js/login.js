/**
 * VANTYX - Login Page Functionality
 * Handles login form interactions and page-specific features
 */

class LoginPage {
    constructor() {
        this.form = Utils.dom.get('loginForm');
        this.customerIdInput = Utils.dom.get('customerId');
        this.pinInput = Utils.dom.get('pin');
        this.loginBtn = Utils.dom.get('loginBtn');
        this.errorMessage = Utils.dom.get('errorMessage');
        this.loadingOverlay = Utils.dom.get('loadingOverlay');
        this.themeToggle = Utils.dom.get('themeToggle');
        this.languageSelect = Utils.dom.get('languageSelect');
        
        this.isLoading = false;
        
        this.init();
    }
    
    /**
     * Initialize login page
     */
    init() {
        console.log('Login page initialized');
        
        // Check if user is already logged in
        this.checkExistingSession();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize theme
        this.initializeTheme();
        
        // Initialize language
        this.initializeLanguage();
        
        // Start background animations
        this.startBackgroundAnimations();
        
        // Setup chart animation
        this.initializeChart();
        
        // Show login form with animation
        Utils.animate.slideUp('.login-container');
    }
    
    /**
     * Check if user is already logged in
     */
    checkExistingSession() {
        if (userManager.isLoggedIn()) {
            const user = userManager.getCurrentUser();
            console.log('User already logged in:', user.name);
            
            // Redirect based on user role
            if (user.role === APP_CONFIG.roles.ADMIN || user.isAdmin) {
                this.redirectTo('admin.html');
            } else {
                this.redirectTo('dashboard.html');
            }
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Login form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Real-time input validation
        if (this.customerIdInput) {
            this.customerIdInput.addEventListener('input', () => this.validateCustomerId());
            this.customerIdInput.addEventListener('blur', () => this.validateCustomerId());
        }
        
        if (this.pinInput) {
            this.pinInput.addEventListener('input', () => this.validatePin());
            this.pinInput.addEventListener('blur', () => this.validatePin());
        }
        
        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Language selector
        if (this.languageSelect) {
            this.languageSelect.addEventListener('change', (e) => this.changeLanguage(e.target.value));
        }
        
        // Navigation links
        this.setupNavigationLinks();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Input animations
        this.setupInputAnimations();
    }
    
    /**
     * Handle login form submission
     * @param {Event} e - Form submit event
     */
    async handleLogin(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const customerId = this.customerIdInput?.value?.trim() || '';
        const pin = this.pinInput?.value?.trim() || '';
        
        console.log('Login attempt:', { customerId, pin }); // Debug log
        
        // Basic validation first
        if (!customerId || !pin) {
            this.showErrorMessage('Please enter both Customer ID and PIN');
            return;
        }
        
        // Validate inputs
        if (!this.validateForm()) {
            return;
        }
        
        // Start loading state
        this.setLoadingState(true);
        
        try {
            // Check if userManager exists
            if (typeof userManager === 'undefined') {
                console.error('userManager not available, using fallback login');
                // Fallback login logic
                if ((customerId === 'DEMO001' && pin === '1234') || 
                    (customerId === 'ADMIN' && pin === 'admin123')) {
                    
                    // Create user object
                    const user = {
                        customerId: customerId,
                        name: customerId === 'ADMIN' ? 'Administrator' : 'Demo User',
                        email: customerId.toLowerCase() + '@vantyx.com',
                        role: customerId === 'ADMIN' ? 'admin' : 'user',
                        isAdmin: customerId === 'ADMIN'
                    };
                    
                    // Store in localStorage
                    localStorage.setItem('vantyx_current_user', JSON.stringify(user));
                    
                    this.showSuccessMessage('Login successful!');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                    
                    return;
                } else {
                    this.showErrorMessage('Invalid credentials. Try DEMO001/1234 or ADMIN/admin123');
                    return;
                }
            }
            
            // Normal login with userManager
            const result = await userManager.login(customerId, pin);
            
            if (result.success) {
                // Show success message
                this.showSuccessMessage(result.message || 'Login successful!');
                
                // Redirect based on user role
                setTimeout(() => {
                    if (result.user.role === 'admin' || result.user.isAdmin) {
                        window.location.href = 'dashboard.html'; // or admin.html if you have one
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 1500);
                
            } else {
                // Show error message
                this.showErrorMessage(result.message || 'Login failed');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showErrorMessage('Login failed. Please try again.');
        } finally {
            // End loading state
            this.setLoadingState(false);
        }
    }
    
    /**
     * Validate entire form
     * @returns {boolean} Validation result
     */
    validateForm() {
        const customerIdValid = this.validateCustomerId();
        const pinValid = this.validatePin();
        
        return customerIdValid && pinValid;
    }
    
    /**
     * Validate customer ID input
     * @returns {boolean} Validation result
     */
    validateCustomerId() {
        const value = this.customerIdInput.value.trim();
        const formGroup = this.customerIdInput.closest('.form-group');
        
        if (!value) {
            this.setFieldError(formGroup, 'Customer ID is required');
            return false;
        }
        
        if (!Utils.validate.customerId(value)) {
            this.setFieldError(formGroup, 'Invalid Customer ID format (4-20 alphanumeric characters)');
            return false;
        }
        
        this.setFieldSuccess(formGroup);
        return true;
    }
    
    /**
     * Validate PIN input
     * @returns {boolean} Validation result
     */
    validatePin() {
        const value = this.pinInput.value.trim();
        const formGroup = this.pinInput.closest('.form-group');
        
        if (!value) {
            this.setFieldError(formGroup, 'PIN is required');
            return false;
        }
        
        if (!Utils.validate.pin(value)) {
            this.setFieldError(formGroup, 'Invalid PIN format (4-8 digits only)');
            return false;
        }
        
        this.setFieldSuccess(formGroup);
        return true;
    }
    
    /**
     * Set field error state
     * @param {HTMLElement} formGroup - Form group element
     * @param {string} message - Error message
     */
    setFieldError(formGroup, message) {
        formGroup.classList.remove('success');
        formGroup.classList.add('error');
        
        // Remove existing error message
        const existingError = formGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorElement = Utils.dom.create('div', { class: 'field-error' }, message);
        errorElement.style.cssText = `
            color: var(--accent-red);
            font-size: var(--font-size-xs);
            margin-top: var(--spacing-xs);
        `;
        formGroup.appendChild(errorElement);
    }
    
    /**
     * Set field success state
     * @param {HTMLElement} formGroup - Form group element
     */
    setFieldSuccess(formGroup) {
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
        
        // Remove error message
        const errorElement = formGroup.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showErrorMessage(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
            Utils.animate.slideUp(this.errorMessage);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                Utils.animate.fadeOut(this.errorMessage);
            }, 5000);
        }
    }
    
    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        // Create success message element
        const successElement = Utils.dom.create('div', { 
            class: 'success-message',
            style: 'display: block;'
        }, message);
        
        // Insert after form
        this.form.parentNode.insertBefore(successElement, this.form.nextSibling);
        
        // Animate in
        Utils.animate.slideUp(successElement);
    }
    
    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        
        if (loading) {
            // Show loading overlay
            if (this.loadingOverlay) {
                this.loadingOverlay.style.display = 'flex';
                Utils.animate.fadeIn(this.loadingOverlay);
            }
            
            // Update button state
            const btnText = this.loginBtn.querySelector('.btn-text');
            const btnLoader = this.loginBtn.querySelector('.btn-loader');
            
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'flex';
            
            this.loginBtn.disabled = true;
            this.loginBtn.style.cursor = 'not-allowed';
            
        } else {
            // Hide loading overlay
            if (this.loadingOverlay) {
                Utils.animate.fadeOut(this.loadingOverlay);
            }
            
            // Reset button state
            const btnText = this.loginBtn.querySelector('.btn-text');
            const btnLoader = this.loginBtn.querySelector('.btn-loader');
            
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
            
            this.loginBtn.disabled = false;
            this.loginBtn.style.cursor = 'pointer';
        }
    }
    
    /**
     * Initialize theme
     */
    initializeTheme() {
        const savedTheme = Utils.storage.get(APP_CONFIG.storage.theme, APP_CONFIG.defaults.theme);
        
        if (savedTheme === 'light') {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            if (this.themeToggle) {
                this.themeToggle.classList.add('active');
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
            this.themeToggle.classList.add('active');
            Utils.storage.set(APP_CONFIG.storage.theme, 'light');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            this.themeToggle.classList.remove('active');
            Utils.storage.set(APP_CONFIG.storage.theme, 'dark');
        }
    }
    
    /**
     * Initialize language
     */
    initializeLanguage() {
        const savedLanguage = Utils.storage.get(APP_CONFIG.storage.language, APP_CONFIG.defaults.language);
        
        if (this.languageSelect) {
            this.languageSelect.value = savedLanguage;
        }
    }
    
    /**
     * Change language
     * @param {string} language - Language code
     */
    changeLanguage(language) {
        Utils.storage.set(APP_CONFIG.storage.language, language);
        console.log('Language changed to:', language);
        
        // Here you would typically load language files
        // For now, just log the change
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
                    userManager.logout();
                } else {
                    this.redirectTo(`${page}.html`);
                }
            });
        });
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Enter key submits form
            if (e.key === 'Enter' && !this.isLoading) {
                const activeElement = document.activeElement;
                if (activeElement === this.customerIdInput || activeElement === this.pinInput) {
                    this.handleLogin(e);
                }
            }
            
            // Escape key clears error messages
            if (e.key === 'Escape') {
                if (this.errorMessage) {
                    Utils.animate.fadeOut(this.errorMessage);
                }
            }
        });
    }
    
    /**
     * Setup input animations
     */
    setupInputAnimations() {
        const inputs = [this.customerIdInput, this.pinInput];
        
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('focus', () => {
                    const formGroup = input.closest('.form-group');
                    formGroup.style.transform = 'scale(1.02)';
                    formGroup.style.transition = 'transform 0.2s ease';
                });
                
                input.addEventListener('blur', () => {
                    const formGroup = input.closest('.form-group');
                    formGroup.style.transform = 'scale(1)';
                });
            }
        });
    }
    
    /**
     * Start background animations
     */
    startBackgroundAnimations() {
        // Animate background elements
        const rightSection = Utils.dom.query('.right-section');
        if (rightSection) {
            let animationFrame;
            
            const animate = () => {
                const time = Date.now() * 0.001;
                const x = Math.sin(time * 0.5) * 10;
                const y = Math.cos(time * 0.3) * 5;
                
                rightSection.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
                
                animationFrame = requestAnimationFrame(animate);
            };
            
            animate();
        }
    }
    
    /**
     * Initialize chart
     */
    initializeChart() {
        const canvas = Utils.dom.get('chartCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        
        canvas.width = width;
        canvas.height = height;
        
        // Generate sample data
        const dataPoints = 50;
        const data = [];
        let price = 100;
        
        for (let i = 0; i < dataPoints; i++) {
            price += (Math.random() - 0.5) * 5;
            data.push(price);
        }
        
        // Draw chart
        this.drawChart(ctx, data, width, height);
        
        // Animate chart
        setInterval(() => {
            // Add new data point
            data.shift();
            price += (Math.random() - 0.5) * 3;
            data.push(price);
            
            // Redraw chart
            this.drawChart(ctx, data, width, height);
        }, 2000);
    }
    
    /**
     * Draw chart on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} data - Chart data
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    drawChart(ctx, data, width, height) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        
        for (let i = 0; i <= 10; i++) {
            const y = (height / 10) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw chart line
        ctx.globalAlpha = 1;
        ctx.strokeStyle = APP_CONFIG.chart.colors.success;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        
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
        
        // Draw glow effect
        ctx.shadowColor = APP_CONFIG.chart.colors.success;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    /**
     * Redirect to another page
     * @param {string} page - Page to redirect to
     */
    redirectTo(page) {
        // Add fade out animation before redirect
        Utils.animate.fadeOut('body', 500);
        
        setTimeout(() => {
            window.location.href = page;
        }, 500);
    }
}

// Initialize login page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginPage = new LoginPage();
    
    // Make globally available for debugging
    if (typeof window !== 'undefined') {
        window.loginPage = loginPage;
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginPage;
}
