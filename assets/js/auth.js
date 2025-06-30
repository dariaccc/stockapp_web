// Authentication and User Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is logged in
        const savedUser = localStorage.getItem('vantyx_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    // Generate random customer ID
    generateCustomerId() {
        return 'VYX' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // Register new user
    register(email, pin) {
        try {
            // Get existing users
            const users = this.getUsers();
            
            // Check if email already exists
            if (users.find(user => user.email === email)) {
                throw new Error('Email already registered');
            }

            // Create new user
            const customerId = this.generateCustomerId();
            const newUser = {
                customerId,
                email,
                pin,
                balance: 10000, // Starting balance
                portfolio: {},
                watchlist: [],
                createdAt: new Date().toISOString()
            };

            // Save user
            users.push(newUser);
            localStorage.setItem('vantyx_users', JSON.stringify(users));

            return { success: true, customerId };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Login user
    login(customerId, pin) {
        try {
            const users = this.getUsers();
            const user = users.find(u => u.customerId === customerId && u.pin === pin);

            if (!user) {
                throw new Error('Invalid Customer ID or PIN');
            }

            this.currentUser = user;
            localStorage.setItem('vantyx_current_user', JSON.stringify(user));

            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('vantyx_current_user');
        window.location.href = 'index.html';
    }

    // Get all users
    getUsers() {
        const users = localStorage.getItem('vantyx_users');
        return users ? JSON.parse(users) : [];
    }

    // Update current user data
    updateUser(updates) {
        if (!this.currentUser) return false;

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.customerId === this.currentUser.customerId);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            this.currentUser = users[userIndex];
            
            localStorage.setItem('vantyx_users', JSON.stringify(users));
            localStorage.setItem('vantyx_current_user', JSON.stringify(this.currentUser));
            return true;
        }
        return false;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Buy stock
    buyStock(symbol, quantity, price) {
        if (!this.currentUser) return { success: false, error: 'Not logged in' };

        const totalCost = quantity * price;
        if (this.currentUser.balance < totalCost) {
            return { success: false, error: 'Insufficient balance' };
        }

        // Update portfolio
        const portfolio = { ...this.currentUser.portfolio };
        if (portfolio[symbol]) {
            portfolio[symbol].shares += quantity;
            portfolio[symbol].avgPrice = 
                ((portfolio[symbol].avgPrice * portfolio[symbol].shares) + totalCost) / 
                (portfolio[symbol].shares + quantity);
        } else {
            portfolio[symbol] = {
                shares: quantity,
                avgPrice: price
            };
        }

        // Update balance
        const newBalance = this.currentUser.balance - totalCost;

        this.updateUser({ 
            balance: newBalance, 
            portfolio 
        });

        return { success: true, newBalance, portfolio };
    }

    // Sell stock
    sellStock(symbol, quantity, price) {
        if (!this.currentUser) return { success: false, error: 'Not logged in' };

        const portfolio = { ...this.currentUser.portfolio };
        if (!portfolio[symbol] || portfolio[symbol].shares < quantity) {
            return { success: false, error: 'Insufficient shares' };
        }

        const totalValue = quantity * price;
        
        // Update portfolio
        portfolio[symbol].shares -= quantity;
        if (portfolio[symbol].shares === 0) {
            delete portfolio[symbol];
        }

        // Update balance
        const newBalance = this.currentUser.balance + totalValue;

        this.updateUser({ 
            balance: newBalance, 
            portfolio 
        });

        return { success: true, newBalance, portfolio };
    }

    // Add to watchlist
    addToWatchlist(symbol) {
        if (!this.currentUser) return false;

        const watchlist = [...this.currentUser.watchlist];
        if (!watchlist.includes(symbol)) {
            watchlist.push(symbol);
            this.updateUser({ watchlist });
            return true;
        }
        return false;
    }

    // Remove from watchlist
    removeFromWatchlist(symbol) {
        if (!this.currentUser) return false;

        const watchlist = this.currentUser.watchlist.filter(s => s !== symbol);
        this.updateUser({ watchlist });
        return true;
    }
}

// Export for use in other files
window.AuthManager = AuthManager;