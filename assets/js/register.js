/**
 * VANTYX - Registration Page Functionality
 * Handles registration form interactions and validation
 */

class RegisterPage {
    constructor() {
        this.form = Utils.dom.get('registerForm');
        this.inputs = {
            fullName: Utils.dom.get('fullName'),
            customerId: Utils.dom.get('customerId'),
            dateOfBirth: Utils.dom.get('dateOfBirth'),
            nationalCardNumber: Utils.dom.get('nationalCardNumber'),
            phoneNumber: Utils.dom.get('phoneNumber'),
            emailId: Utils.dom.get('emailId'),
            cardDetails: Utils.dom.get('cardDetails'),
            expiry: Utils.dom.get('expiry'),
            cvv: Utils.dom.get('cvv'),
            pin: Utils.dom.get('pin'),
            agreeTerms: Utils.dom.get('agreeTerms')
        };
        this.registerBtn = Utils.dom.get('registerBtn');
        this.errorMessage = Utils.dom.get('errorMessage');
        this.loadingOverlay = Utils.dom.get('loadingOverlay');
        this.successModal = Utils.dom.get('successModal');
        this.themeToggle = Utils.dom.get('themeToggle');
        this.languageSelect = Utils.dom.get('languageSelect');
        
        this.isLoading = false;
        this.validationRules = this.initializeValidationRules();
        
        this.init();
    }
    
    /**
     * Initialize registration page
     */
    init() {
        console.log('Registration page initialized');
        
        // Check if user is already logged in
        this.checkExistingSession();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize theme
        this.initializeTheme();
        
        // Initialize language
        this.initializeLanguage();
        
        // Setup input formatting
        this.setupInputFormatting();
        
        // Show form with animation
        Utils.animate.slideUp('.register-container');
    }
    
    /**
     * Check if user is already logged in
     */
    checkExistingSession() {
        if (userManager.isLoggedIn()) {
            const user = userManager.getCurrentUser();
            console.log('User already logged in:', user.name);
            this.redirectTo('dashboard.html');
        }
    }
    
    /**
     * Initialize validation rules
     */
    initializeValidationRules() {
        return {
            fullName: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-Z\s'-]+$/,
                message: 'Full name must contain only letters, spaces, hyphens, and apostrophes'
            },
            customerId: {
                required: true,
                minLength: 4,
                maxLength: 20,
                pattern: /^[A-Z0-9]+$/,
                message: 'Customer ID must be 4-20 characters (letters and numbers only)'
            },
            dateOfBirth: {
                required: true,
                minAge: 18,
                maxAge: 100,
                message: 'You must be at least 18 years old'
            },
            nationalCardNumber: {
                required: true,
                minLength: 8,
                maxLength: 20,
                pattern: /^[A-Z0-9]+$/,
                message: 'National card number must be 8-20 alphanumeric characters'
            },
            phoneNumber: {
                required: true,
                pattern: /^[\+]?[1-9][\d]{0,15}$/,
                message: 'Please enter a valid phone number'
            },
            emailId: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            cardDetails: {
                required: true,
                pattern: /^[0-9]{13,19}$/,
                message: 'Card number must be 13-19 digits'
            },
            expiry: {
                required: true,
                pattern: /^(0[1-9]|1[0-2])\/[0-9]{2}$/,
                message: 'Expiry must be in MM/YY format'
            },
            cvv: {
                required: true,
                pattern: /^[0-9]{3,4}$/,
                message: 'CVV must be 3-4 digits'
            },
            pin: {
                required: true,
                minLength: 4,
                maxLength: 8,
                pattern: /^[0-9]+$/,
                message: 'PIN must be 4-8 digits only'
            },
            agreeTerms: {
                required: true,
                message: 'You must agree to the terms and conditions'
            }
        };
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Registration form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleRegistration(e));
        }
        
        // Real-time validation for all inputs
        Object.keys(this.inputs).forEach(key => {
            const input = this.inputs[key];
            if (input && input.type !== 'checkbox') {
                input.addEventListener('input', () => this.validateField(key));
                input.addEventListener('blur', () => this.validateField(key));
            } else if (input && input.type === 'checkbox') {
                input.addEventListener('change', () => this.validateField(key));
            }
        });
        
        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Language selector
        if (this.languageSelect) {
            this.languageSelect.addEventListener('change', (e) => this.changeLanguage(e.target.value));
        }
        
        // Success modal
        this.setupSuccessModal();
        
        // Navigation links
        this.setupNavigationLinks();
        
        // Customer ID availability check
        if (this.inputs.customerId) {
            this.inputs.customerId.addEventListener('input', 
                Utils.debounce(() => this.checkCustomerIdAvailability(), 500)
            );
        }
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    /**
     * Handle registration form submission
     */
    async handleRegistration(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        // Validate entire form
        if (!this.validateForm()) {
            this.showErrorMessage('Please correct the errors above and try again');
            return;
        }
        
        // Start loading state
        this.setLoadingState(true);
        
        try {
            // Collect form data
            const formData = this.collectFormData();
            
            // Simulate card verification (in real app, this would be API call)
            await this.verifyCardDetails(formData);
            
            // Register user
            const result = await userManager.register(formData);
            
            if (result.success) {
                // Show success modal
                this.showSuccessModal(result.user);
            } else {
                this.showErrorMessage(result.message);
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showErrorMessage(error.message || APP_CONFIG.messages.errors.serverError);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Collect form data
     */
    collectFormData() {
        return {
            name: this.inputs.fullName.value.trim(),
            customerId: this.inputs.customerId.value.trim().toUpperCase(),
            dateOfBirth: this.inputs.dateOfBirth.value,
            nationalCardNumber: this.inputs.nationalCardNumber.value.trim().toUpperCase(),
            phoneNumber: this.inputs.phoneNumber.value.trim(),
            email: this.inputs.emailId.value.trim().toLowerCase(),
            cardNumber: this.inputs.cardDetails.value.replace(/\s/g, ''),
            cardExpiry: this.inputs.expiry.value,
            cardCvv: this.inputs.cvv.value,
            pin: this.inputs.pin.value,
            role: APP_CONFIG.roles.USER,
            initialBalance: 10000.00 // Starting balance
        };
    }
    
    /**
     * Verify card details (simulation)
     */
    async verifyCardDetails(formData) {
        // Simulate API delay
        await this.delay(1000);
        
        // Simple card validation
        const cardNumber = formData.cardNumber;
        const expiry = formData.cardExpiry;
        const cvv = formData.cardCvv;
        
        // Check if card is expired
        const [month, year] = expiry.split('/');
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const now = new Date();
        
        if (expiryDate < now) {
            throw new Error('Card has expired');
        }
        
        // Simulate card validation failure (for demo)
        if (cardNumber.startsWith('0000')) {
            throw new Error('Invalid card number');
        }
        
        return true;
    }
    
    /**
     * Validate entire form
     */
    validateForm() {
        let isValid = true;
        
        Object.keys(this.inputs).forEach(key => {
            if (!this.validateField(key)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    /**
     * Validate individual field
     */
    validateField(fieldName) {
        const input = this.inputs[fieldName];
        const rules = this.validationRules[fieldName];
        const formGroup = input.closest('.form-group');
        
        if (!input || !rules) return true;
        
        // Get value
        const value = input.type === 'checkbox' ? input.checked : input.value.trim();
        
        // Required validation
        if (rules.required) {
            if (input.type === 'checkbox' && !value) {
                this.setFieldError(formGroup, rules.message);
                return false;
            } else if (input.type !== 'checkbox' && !value) {
                this.setFieldError(formGroup, `${this.getFieldLabel(fieldName)} is required`);
                return false;
            }
        }
        
        // Skip other validations if field is empty and not required
        if (!value && !rules.required) {
            this.setFieldSuccess(formGroup);
            return true;
        }
        
        // Length validation
        if (rules.minLength && value.length < rules.minLength) {
            this.setFieldError(formGroup, `Minimum ${rules.minLength} characters required`);
            return false;
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
            this.setFieldError(formGroup, `Maximum ${rules.maxLength} characters allowed`);
            return false;
        }
        
        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
            this.setFieldError(formGroup, rules.message);
            return false;
        }
        
        // Special validations
        switch (fieldName) {
            case 'dateOfBirth':
                if (!this.validateAge(value)) {
                    this.setFieldError(formGroup, rules.message);
                    return false;
                }
                break;
                
            case 'emailId':
                if (!Utils.validate.email(value)) {
                    this.setFieldError(formGroup, rules.message);
                    return false;
                }
                break;
                
            case 'expiry':
                if (!this.validateCardExpiry(value)) {
                    this.setFieldError(formGroup, 'Card has expired or invalid date');
                    return false;
                }
                break;
        }
        
        this.setFieldSuccess(formGroup);
        return true;
    }
    
    /**
     * Validate age
     */
    validateAge(dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        
        return age >= 18 && age <= 100;
    }
    
    /**
     * Validate card expiry
     */
    validateCardExpiry(expiry) {
        const [month, year] = expiry.split('/');
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const now = new Date();
        
        return expiryDate > now;
    }
    
    /**
     * Check customer ID availability
     */
    async checkCustomerIdAvailability() {
        const customerId = this.inputs.customerId.value.trim().toUpperCase();
        const formGroup = this.inputs.customerId.closest('.form-group');
        
        if (!customerId || !Utils.validate.customerId(customerId)) {
            return;
        }
        
        // Check if ID already exists
        const users = Utils.storage.get(APP_CONFIG.storage.users, []);
        const exists = users.find(user => user.customerId === customerId);
        
        if (exists) {
            this.setFieldError(formGroup, 'Customer ID already exists');
            return false;
        } else {
            this.setFieldSuccess(formGroup, 'Customer ID available');
            return true;
        }
    }
    
    /**
     * Get field label
     */
    getFieldLabel(fieldName) {
        const labels = {
            fullName: 'Full Name',
            customerId: 'Customer ID',
            dateOfBirth: 'Date of Birth',
            nationalCardNumber: 'National Card Number',
            phoneNumber: 'Phone Number',
            emailId: 'Email ID',
            cardDetails: 'Card Details',
            expiry: 'Expiry Date',
            cvv: 'CVV',
            pin: 'PIN',
            agreeTerms: 'Terms Agreement'
        };
        
        return labels[fieldName] || fieldName;
    }
    
    /**
     * Set field error state
     */
    setFieldError(formGroup, message) {
        formGroup.classList.remove('success');
        formGroup.classList.add('error');
        
        // Remove existing messages
        const existingMessage = formGroup.querySelector('.field-error, .field-success');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Add error message
        const errorElement = Utils.dom.create('div', { class: 'field-error' }, message);
        formGroup.appendChild(errorElement);
    }
    
    /**
     * Set field success state
     */
    setFieldSuccess(formGroup, message = '') {
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
        
        // Remove existing messages
        const existingMessage = formGroup.querySelector('.field-error, .field-success');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Add success message if provided
        if (message) {
            const successElement = Utils.dom.create('div', { class: 'field-success' }, message);
            formGroup.appendChild(successElement);
        }
    }
    
    /**
     * Setup input formatting
     */
    setupInputFormatting() {
        // Card number formatting
        if (this.inputs.cardDetails) {
            this.inputs.cardDetails.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                e.target.value = value;
            });
        }
        
        // Expiry formatting
        if (this.inputs.expiry) {
            this.inputs.expiry.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }
        
        // CVV formatting
        if (this.inputs.cvv) {
            this.inputs.cvv.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
            });
        }
        
        // PIN formatting
        if (this.inputs.pin) {
            this.inputs.pin.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 8);
            });
        }
        
        // Phone number formatting
        if (this.inputs.phoneNumber) {
            this.inputs.phoneNumber.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^\d\+\-\(\)\s]/g, '');
            });
        }
        
        // Customer ID formatting
        if (this.inputs.customerId) {
            this.inputs.customerId.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            });
        }
        
        // National card number formatting
        if (this.inputs.nationalCardNumber) {
            this.inputs.nationalCardNumber.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            });
        }
    }
    
    /**
     * Show error message
     */
    showErrorMessage(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
            Utils.animate.slideUp(this.errorMessage);
            
            // Auto-hide after 8 seconds
            setTimeout(() => {
                Utils.animate.fadeOut(this.errorMessage);
            }, 8000);
        }
    }
    
    /**
     * Set loading state
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
            const btnText = this.registerBtn.querySelector('.btn-text');
            const btnLoader = this.registerBtn.querySelector('.btn-loader');
            
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'flex';
            
            this.registerBtn.disabled = true;
            
        } else {
            // Hide loading overlay
            if (this.loadingOverlay) {
                Utils.animate.fadeOut(this.loadingOverlay);
            }
            
            // Reset button state
            const btnText = this.registerBtn.querySelector('.btn-text');
            const btnLoader = this.registerBtn.querySelector('.btn-loader');
            
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
            
            this.registerBtn.disabled = false;
        }
    }
    
    /**
     * Show success modal
     */
    showSuccessModal(user) {
        if (this.successModal) {
            const generatedId = Utils.dom.get('generatedCustomerId');
            if (generatedId) {
                generatedId.textContent = user.customerId;
            }
            
            this.successModal.classList.add('active');
            Utils.animate.fadeIn(this.successModal);
        }
    }
    
    /**
     * Setup success modal
     */
    setupSuccessModal() {
        const modalClose = Utils.dom.get('modalClose');
        const goToLogin = Utils.dom.get('goToLogin');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeSuccessModal());
        }
        
        if (goToLogin) {
            goToLogin.addEventListener('click', () => this.redirectTo('index.html'));
        }
        
        // Close modal on backdrop click
        if (this.successModal) {
            this.successModal.addEventListener('click', (e) => {
                if (e.target === this.successModal) {
                    this.closeSuccessModal();
                }
            });
        }
    }
    
    /**
     * Close success modal
     */
    closeSuccessModal() {
        if (this.successModal) {
            this.successModal.classList.remove('active');
            Utils.animate.fadeOut(this.successModal);
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
     */
    changeLanguage(language) {
        Utils.storage.set(APP_CONFIG.storage.language, language);
        console.log('Language changed to:', language);
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
            // Escape key closes modal or clears errors
            if (e.key === 'Escape') {
                if (this.successModal && this.successModal.classList.contains('active')) {
                    this.closeSuccessModal();
                } else if (this.errorMessage) {
                    Utils.animate.fadeOut(this.errorMessage);
                }
            }
        });
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Redirect to another page
     */
    redirectTo(page) {
        Utils.animate.fadeOut('body', 500);
        setTimeout(() => {
            window.location.href = page;
        }, 500);
    }
}

function waitForUserManager(callback, attempts = 100, delay = 10) {
    let tries = 0;

    const check = () => {
        if (typeof userManager !== "undefined") {
            callback();
        } else if (tries < attempts) {
            tries++;
            setTimeout(check, delay);
        } else {
            console.error("❌ userManager was never defined.");
        }
    };

    check();
}

// Initialize registration page when DOM is loaded and userManager is ready
document.addEventListener('DOMContentLoaded', () => {
    waitForUserManager(() => {
        const registerPage = new RegisterPage();

        // Make globally available for debugging
        if (typeof window !== 'undefined') {
            window.registerPage = registerPage;
        }
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegisterPage;
}

