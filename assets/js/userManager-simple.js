/**
 * VANTYX - Simplified User Management System
 * Lightweight version with essential functionality only
 */

// Simple User Manager - No classes to avoid compatibility issues
window.userManager = (function() {
    
    // Storage keys
    const STORAGE_KEYS = {
        users: 'vantyx_users',
        currentUser: 'vantyx_current_user',
        theme: 'vantyx_theme',
        language: 'vantyx_language'
    };
    
    // Demo users
    const DEMO_USERS = [
        {
            id: 'demo_001',
            customerId: 'DEMO001',
            pin: '1234',
            name: 'Demo User',
            email: 'demo@vantyx.com',
            role: 'user',
            portfolio: [
                { symbol: 'AAPL', shares: 10, avgPrice: 150.00 },
                { symbol: 'GOOGL', shares: 5, avgPrice: 2800.00 }
            ],
            watchlist: ['AAPL', 'GOOGL', 'TSLA', 'MSFT'],
            balance: 10000.00,
            isActive: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'admin_001',
            customerId: 'ADMIN',
            pin: 'admin123',
            name: 'Administrator',
            email: 'admin@vantyx.com',
            role: 'admin',
            isAdmin: true,
            portfolio: [],
            watchlist: ['AAPL', 'GOOGL', 'TSLA'],
            balance: 50000.00,
            isActive: true,
            createdAt: new Date().toISOString()
        }
    ];
    
    // Helper functions
    function getFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }
    
    function setToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }
    
    function initializeUsers() {
        let users = getFromStorage(STORAGE_KEYS.users, []);
        
        if (users.length === 0) {
            users = DEMO_USERS;
            setToStorage(STORAGE_KEYS.users, users);
            console.log('Demo users initialized');
        }
        
        return users;
    }
    
    function sanitizeUser(user) {
        if (!user) return null;
        
        // Remove sensitive data
        const { pin, ...sanitizedUser } = user;
        return sanitizedUser;
    }
    
    // Initialize users on load
    const users = initializeUsers();
    
    // Public API
    return {
        
        // Login function
        login: function(customerId, pin) {
            return new Promise((resolve) => {
                // Simulate async operation
                setTimeout(() => {
                    try {
                        const users = getFromStorage(STORAGE_KEYS.users, DEMO_USERS);
                        const user = users.find(u => 
                            u.customerId === customerId && 
                            u.pin === pin && 
                            u.isActive !== false
                        );
                        
                        if (user) {
                            // Update last login
                            user.lastLogin = new Date().toISOString();
                            
                            // Save updated users
                            setToStorage(STORAGE_KEYS.users, users);
                            
                            // Save current user
                            setToStorage(STORAGE_KEYS.currentUser, user);
                            
                            resolve({
                                success: true,
                                user: sanitizeUser(user),
                                message: 'Login successful'
                            });
                        } else {
                            resolve({
                                success: false,
                                message: 'Invalid Customer ID or PIN'
                            });
                        }
                    } catch (error) {
                        console.error('Login error:', error);
                        resolve({
                            success: false,
                            message: 'Login failed. Please try again.'
                        });
                    }
                }, 500); // Simulate network delay
            });
        },
        
        // Register function
        register: function(userData) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    try {
                        const users = getFromStorage(STORAGE_KEYS.users, []);
                        
                        // Check if customer ID already exists
                        if (users.find(u => u.customerId === userData.customerId)) {
                            resolve({
                                success: false,
                                message: 'Customer ID already exists'
                            });
                            return;
                        }
                        
                        // Create new user
                        const newUser = {
                            id: 'user_' + Date.now(),
                            customerId: userData.customerId.toUpperCase(),
                            pin: userData.pin,
                            name: userData.name || userData.fullName,
                            email: userData.email || userData.emailId,
                            role: 'user',
                            portfolio: [],
                            watchlist: [],
                            balance: 10000.00,
                            isActive: true,
                            createdAt: new Date().toISOString()
                        };
                        
                        users.push(newUser);
                        setToStorage(STORAGE_KEYS.users, users);
                        
                        resolve({
                            success: true,
                            user: sanitizeUser(newUser),
                            message: 'Registration successful'
                        });
                        
                    } catch (error) {
                        console.error('Registration error:', error);
                        resolve({
                            success: false,
                            message: 'Registration failed. Please try again.'
                        });
                    }
                }, 500);
            });
        },
        
        // Logout function
        logout: function() {
            localStorage.removeItem(STORAGE_KEYS.currentUser);
            window.location.href = 'index.html';
        },
        
        // Get current user
        getCurrentUser: function() {
            const user = getFromStorage(STORAGE_KEYS.currentUser);
            return sanitizeUser(user);
        },
        
        // Check if logged in
        isLoggedIn: function() {
            const user = getFromStorage(STORAGE_KEYS.currentUser);
            return user !== null;
        },
        
        // Check if admin
        isAdmin: function() {
            const user = getFromStorage(STORAGE_KEYS.currentUser);
            return user && (user.role === 'admin' || user.isAdmin === true);
        },
        
        // Get portfolio
        getPortfolio: function() {
            const user = getFromStorage(STORAGE_KEYS.currentUser);
            return user ? (user.portfolio || []) : [];
        },
        
        // Get watchlist
        getWatchlist: function() {
            const user = getFromStorage(STORAGE_KEYS.currentUser);
            return user ? (user.watchlist || []) : [];
        },
        
        // Add to watchlist
        addToWatchlist: function(symbol) {
            const user = getFromStorage(STORAGE_KEYS.currentUser);
            if (!user) return false;
            
            if (!user.watchlist) user.watchlist = [];
            
            if (!user.watchlist.includes(symbol)) {
                user.watchlist.push(symbol);
                setToStorage(STORAGE_KEYS.currentUser, user);
                
                // Also update in users array
                const users = getFromStorage(STORAGE_KEYS.users, []);
                const userIndex = users.findIndex(u => u.id === user.id);
                if (userIndex !== -1) {
                    users[userIndex] = user;
                    setToStorage(STORAGE_KEYS.users, users);
                }
                
                return true;
            }
            return false;
        },
        
        // Remove from watchlist
        removeFromWatchlist: function(symbol) {
            const user = getFromStorage(STORAGE_KEYS.currentUser);
            if (!user || !user.watchlist) return false;
            
            const index = user.watchlist.indexOf(symbol);
            if (index > -1) {
                user.watchlist.splice(index, 1);
                setToStorage(STORAGE_KEYS.currentUser, user);
                
                // Also update in users array
                const users = getFromStorage(STORAGE_KEYS.users, []);
                const userIndex = users.findIndex(u => u.id === user.id);
                if (userIndex !== -1) {
                    users[userIndex] = user;
                    setToStorage(STORAGE_KEYS.users, users);
                }
                
                return true;
            }
            return false;
        },
        
        // Add transaction
        addTransaction: function(transaction) {
            const user = getFromStorage(STORAGE_KEYS.currentUser);
            if (!user) return false;
            
            if (!user.portfolio) user.portfolio = [];
            
            // Find existing position
            const existingPosition = user.portfolio.find(p => p.symbol === transaction.symbol);
            
            if (existingPosition) {
                // Update existing position
                if (transaction.type === 'buy') {
                    const totalValue = (existingPosition.shares * existingPosition.avgPrice) + 
                                     (transaction.shares * transaction.price);
                    const totalShares = existingPosition.shares + transaction.shares;
                    existingPosition.avgPrice = totalValue / totalShares;
                    existingPosition.shares = totalShares;
                } else if (transaction.type === 'sell') {
                    existingPosition.shares -= transaction.shares;
                    if (existingPosition.shares <= 0) {
                        // Remove position if all shares sold
                        const index = user.portfolio.indexOf(existingPosition);
                        user.portfolio.splice(index, 1);
                    }
                }
            } else if (transaction.type === 'buy') {
                // Add new position
                user.portfolio.push({
                    symbol: transaction.symbol,
                    shares: transaction.shares,
                    avgPrice: transaction.price,
                    purchaseDate: new Date().toISOString()
                });
            }
            
            // Update balance
            const amount = transaction.type === 'buy' ? 
                          -(transaction.shares * transaction.price) : 
                          (transaction.shares * transaction.price);
            user.balance = (user.balance || 0) + amount;
            
            // Save changes
            setToStorage(STORAGE_KEYS.currentUser, user);
            
            // Also update in users array
            const users = getFromStorage(STORAGE_KEYS.users, []);
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex] = user;
                setToStorage(STORAGE_KEYS.users, users);
            }
            
            return true;
        },
        
        // Update balance
        updateBalance: function(amount) {
            const user = getFromStorage(STORAGE_KEYS.currentUser);
            if (!user) return false;
            
            user.balance = (user.balance || 0) + amount;
            setToStorage(STORAGE_KEYS.currentUser, user);
            
            return true;
        },
        
        // Refresh session
        refreshSession: function() {
            const user = getFromStorage(STORAGE_KEYS.currentUser);
            if (user) {
                user.lastActivity = new Date().toISOString();
                setToStorage(STORAGE_KEYS.currentUser, user);
            }
        },
        
        // Save current user
        saveCurrentUser: function() {
            // This function exists for compatibility
            return true;
        },
        
        // Save users
        saveUsers: function() {
            // This function exists for compatibility
            return true;
        },
        
        // Get user by ID (for admin functions)
        getUserById: function(id) {
            const users = getFromStorage(STORAGE_KEYS.users, []);
            return users.find(u => u.id === id);
        },
        
        // Get all users (admin only)
        getAllUsers: function() {
            if (!this.isAdmin()) return [];
            
            const users = getFromStorage(STORAGE_KEYS.users, []);
            return users.map(user => sanitizeUser(user));
        }
    };
    
})();

// Make it available globally
window.UserManager = function() {
    return window.userManager;
};

// Log successful load
console.log('✓ userManager.js loaded successfully');
console.log('Demo accounts available: DEMO001/1234, ADMIN/admin123');
