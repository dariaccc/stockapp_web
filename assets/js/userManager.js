/**
 * VANTYX - User Management System
 * Handles user authentication, registration, and session management
 */

class UserManager {
    constructor() {
        this.storageKeys = APP_CONFIG.storage;
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
        this.sessionTimeout = null;
        
        // Initialize demo users if no users exist
        this.initializeDefaultUsers();
        
        // Set up session management
        this.setupSessionManagement();
        
        console.log('UserManager initialized');
    }
    
    /**
     * Initialize default demo users
     */
    initializeDefaultUsers() {
        if (this.users.length === 0) {
            this.users = APP_CONFIG.demo.users.map(user => ({
                ...user,
                id: Utils.generateId(),
                createdAt: new Date().toISOString(),
                lastLogin: null,
                isActive: true
            }));
            this.saveUsers();
            console.log('Demo users initialized');
        }
    }
    
    /**
     * Load users from localStorage
     */
    loadUsers() {
        return Utils.storage.get(this.storageKeys.users, []);
    }
    
    /**
     * Save users to localStorage
     */
    saveUsers() {
        return Utils.storage.set(this.storageKeys.users, this.users);
    }
    
    /**
     * Load current user from localStorage
     */
    loadCurrentUser() {
        return Utils.storage.get(this.storageKeys.currentUser, null);
    }
    
    /**
     * Save current user to localStorage
     */
    saveCurrentUser() {
        return Utils.storage.set(this.storageKeys.currentUser, this.currentUser);
    }
    
    /**
     * Authenticate user with credentials
     * @param {string} customerId - User's customer ID
     * @param {string} pin - User's PIN
     * @returns {Object} Login result
     */
    async login(customerId, pin) {
        try {
            // Simulate API delay
            await this.delay(1000);
            
            // Validate input
            if (!Utils.validate.customerId(customerId)) {
                return {
                    success: false,
                    message: 'Invalid Customer ID format'
                };
            }
            
            if (!Utils.validate.pin(pin)) {
                return {
                    success: false,
                    message: 'Invalid PIN format'
                };
            }
            
            // Find user
            const user = this.users.find(u => 
                u.customerId === customerId && 
                u.pin === pin && 
                u.isActive
            );
            
            if (!user) {
                return {
                    success: false,
                    message: APP_CONFIG.messages.errors.invalidCredentials
                };
            }
            
            // Update user login info
            user.lastLogin = new Date().toISOString();
            this.currentUser = user;
            
            // Save changes
            this.saveUsers();
            this.saveCurrentUser();
            
            // Start session timer
            this.startSessionTimer();
            
            console.log('User logged in successfully:', user.name);
            
            return {
                success: true,
                user: this.sanitizeUser(user),
                message: APP_CONFIG.messages.success.loginSuccess
            };
            
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: APP_CONFIG.messages.errors.serverError
            };
        }
    }
    
    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Object} Registration result
     */
    async register(userData) {
        try {
            // Validate required fields
            const requiredFields = ['customerId', 'pin', 'name', 'email'];
            for (const field of requiredFields) {
                if (!userData[field]) {
                    return {
                        success: false,
                        message: `${Utils.capitalize(field)} is required`
                    };
                }
            }
            
            // Check if customer ID already exists
            if (this.users.find(u => u.customerId === userData.customerId)) {
                return {
                    success: false,
                    message: 'Customer ID already exists'
                };
            }
            
            // Check if email already exists
            if (this.users.find(u => u.email === userData.email)) {
                return {
                    success: false,
                    message: 'Email already registered'
                };
            }
            
            // Validate email format
            if (!Utils.validate.email(userData.email)) {
                return {
                    success: false,
                    message: 'Invalid email format'
                };
            }
            
            // Create new user
            const newUser = {
                id: Utils.generateId(),
                customerId: userData.customerId.toUpperCase(),
                pin: userData.pin,
                name: userData.name,
                email: userData.email.toLowerCase(),
                role: userData.role || APP_CONFIG.roles.USER,
                portfolio: [],
                watchlist: [],
                balance: userData.initialBalance || 10000.00,
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: null
            };
            
            // Add user to array
            this.users.push(newUser);
            this.saveUsers();
            
            console.log('User registered successfully:', newUser.name);
            
            return {
                success: true,
                user: this.sanitizeUser(newUser),
                message: 'Registration successful'
            };
            
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: APP_CONFIG.messages.errors.serverError
            };
        }
    }
    
    /**
     * Logout current user
     */
    logout() {
        if (this.currentUser) {
            console.log('User logged out:', this.currentUser.name);
            this.currentUser = null;
            Utils.storage.remove(this.storageKeys.currentUser);
            this.clearSessionTimer();
            
            // Redirect to login page
            window.location.href = APP_CONFIG.routes.login;
        }
    }
    
    /**
     * Get current user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        return this.currentUser ? this.sanitizeUser(this.currentUser) : null;
    }
    
    /**
     * Check if user is logged in
     * @returns {boolean} Login status
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }
    
    /**
     * Check if current user is admin
     * @returns {boolean} Admin status
     */
    isAdmin() {
        return this.currentUser && 
               (this.currentUser.role === APP_CONFIG.roles.ADMIN || this.currentUser.isAdmin);
    }
    
    /**
     * Update user profile
     * @param {Object} updates - Profile updates
     * @returns {Object} Update result
     */
    async updateProfile(updates) {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    message: 'User not logged in'
                };
            }
            
            // Find user in array
            const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex === -1) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }
            
            // Update user data
            const updatedUser = { ...this.users[userIndex], ...updates };
            this.users[userIndex] = updatedUser;
            this.currentUser = updatedUser;
            
            // Save changes
            this.saveUsers();
            this.saveCurrentUser();
            
            return {
                success: true,
                user: this.sanitizeUser(updatedUser),
                message: 'Profile updated successfully'
            };
            
        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                message: APP_CONFIG.messages.errors.serverError
            };
        }
    }
    
    /**
     * Change user PIN
     * @param {string} currentPin - Current PIN
     * @param {string} newPin - New PIN
     * @returns {Object} Change result
     */
    async changePin(currentPin, newPin) {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    message: 'User not logged in'
                };
            }
            
            // Verify current PIN
            if (this.currentUser.pin !== currentPin) {
                return {
                    success: false,
                    message: 'Current PIN is incorrect'
                };
            }
            
            // Validate new PIN
            if (!Utils.validate.pin(newPin)) {
                return {
                    success: false,
                    message: 'Invalid PIN format'
                };
            }
            
            // Update PIN
            const result = await this.updateProfile({ pin: newPin });
            
            if (result.success) {
                result.message = 'PIN changed successfully';
            }
            
            return result;
            
        } catch (error) {
            console.error('PIN change error:', error);
            return {
                success: false,
                message: APP_CONFIG.messages.errors.serverError
            };
        }
    }
    
    /**
     * Get user portfolio
     * @returns {Array} User's portfolio
     */
    getPortfolio() {
        return this.currentUser ? this.currentUser.portfolio || [] : [];
    }
    
    /**
     * Get user watchlist
     * @returns {Array} User's watchlist
     */
    getWatchlist() {
        return this.currentUser ? this.currentUser.watchlist || [] : [];
    }
    
    /**
     * Add stock to watchlist
     * @param {string} symbol - Stock symbol
     * @returns {boolean} Success status
     */
    addToWatchlist(symbol) {
        if (!this.currentUser) return false;
        
        if (!this.currentUser.watchlist) {
            this.currentUser.watchlist = [];
        }
        
        if (!this.currentUser.watchlist.includes(symbol)) {
            this.currentUser.watchlist.push(symbol);
            this.saveCurrentUser();
            return true;
        }
        
        return false;
    }
    
    /**
     * Remove stock from watchlist
     * @param {string} symbol - Stock symbol
     * @returns {boolean} Success status
     */
    removeFromWatchlist(symbol) {
        if (!this.currentUser || !this.currentUser.watchlist) return false;
        
        const index = this.currentUser.watchlist.indexOf(symbol);
        if (index > -1) {
            this.currentUser.watchlist.splice(index, 1);
            this.saveCurrentUser();
            return true;
        }
        
        return false;
    }
    
    /**
     * Setup session management
     */
    setupSessionManagement() {
        // Clear any existing timer
        this.clearSessionTimer();
        
        // Listen for user activity
        ['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => this.resetSessionTimer(), true);
        });
    }
    
    /**
     * Start session timer
     */
    startSessionTimer() {
        this.clearSessionTimer();
        this.sessionTimeout = setTimeout(() => {
            console.log('Session expired');
            this.logout();
            alert('Your session has expired. Please log in again.');
        }, APP_CONFIG.sessionTimeout || 30 * 60 * 1000); // 30 minutes default
    }
    
    /**
     * Reset session timer
     */
    resetSessionTimer() {
        if (this.isLoggedIn()) {
            this.startSessionTimer();
        }
    }
    
    /**
     * Clear session timer
     */
    clearSessionTimer() {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }
    }
    
    /**
     * Sanitize user data for client
     * @param {Object} user - User object
     * @returns {Object} Sanitized user
     */
    sanitizeUser(user) {
        const { pin, ...sanitized } = user;
        return sanitized;
    }
    
    /**
     * Simulate API delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get all users (admin only)
     * @returns {Array} All users or empty array
     */
    getAllUsers() {
        if (!this.isAdmin()) {
            console.warn('Unauthorized access to getAllUsers');
            return [];
        }
        return this.users.map(user => this.sanitizeUser(user));
    }
    
    /**
     * Update user status (admin only)
     * @param {string} userId - User ID
     * @param {boolean} isActive - Active status
     * @returns {Object} Update result
     */
    updateUserStatus(userId, isActive) {
        if (!this.isAdmin()) {
            return {
                success: false,
                message: 'Unauthorized'
            };
        }
        
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        
        this.users[userIndex].isActive = isActive;
        this.saveUsers();
        
        return {
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
        };
    }
}

// Create and export userManager instance
// Use var instead of const to avoid temporal dead zone issues
var userManager;

// Initialize immediately if dependencies are ready
if (typeof APP_CONFIG !== 'undefined' && typeof Utils !== 'undefined') {
    userManager = new UserManager();
    window.userManager = userManager; // Make globally available
} else {
    // If dependencies aren't ready, wait for them
    console.warn('Waiting for dependencies before initializing UserManager...');
    
    // Check periodically until dependencies are ready
    const checkDependencies = setInterval(() => {
        if (typeof APP_CONFIG !== 'undefined' && typeof Utils !== 'undefined') {
            clearInterval(checkDependencies);
            userManager = new UserManager();
            window.userManager = userManager;
            console.log('UserManager initialized after dependencies loaded');
        }
    }, 10);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = userManager;
}
