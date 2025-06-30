// Universal Navbar Manager - Updated for VANTYX CSS
class NavbarManager {
    constructor() {
        this.auth = window.auth || new AuthManager();
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    init() {
        this.updateNavbarContent();
        this.bindEvents();
        console.log('Navbar initialized for page:', this.currentPage);
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.substring(path.lastIndexOf('/') + 1);
        
        if (page === '' || page === 'index.html') return 'login';
        if (page === 'home.html') return 'home';
        if (page === 'register.html') return 'register';
        if (page === 'dashboard.html') return 'dashboard';
        if (page === 'radar.html') return 'radar';
        if (page === 'stock.html') return 'stock';
        if (page === 'pro.html') return 'pro';
        
        return 'unknown';
    }

    updateNavbarContent() {
        // Find existing header or create one
        let header = document.querySelector('.header');
        
        if (!header) {
            // Create header if it doesn't exist
            header = document.createElement('header');
            header.className = 'header';
            document.body.insertBefore(header, document.body.firstChild);
        }

        // Update the nav-container content
        const navContainer = header.querySelector('.nav-container') || this.createNavContainer(header);
        this.updateNavContainer(navContainer);
        
        // Update active states
        this.updateActiveStates();
    }

    createNavContainer(header) {
        const navContainer = document.createElement('nav');
        navContainer.className = 'nav-container';
        header.appendChild(navContainer);
        return navContainer;
    }

    updateNavContainer(navContainer) {
        const isLoggedIn = this.auth.isLoggedIn();
        const user = isLoggedIn ? this.auth.getCurrentUser() : null;

        navContainer.innerHTML = `
            <div class="logo" onclick="window.navbarManager.handleLogoClick()">VANTYX</div>
            
            <div class="nav-links">
                ${this.generateNavLinks(isLoggedIn)}
            </div>
            
            <div class="nav-buttons">
                ${isLoggedIn ? this.generateLoggedInButtons(user) : this.generateGuestButtons()}
            </div>
        `;
    }

    generateNavLinks(isLoggedIn) {
        // Always show Home, Radar, and Pro for everyone
        return `
            <a href="home.html" class="${this.currentPage === 'home' ? 'active' : ''}">Home</a>
            <a href="radar.html" class="${this.currentPage === 'radar' ? 'active' : ''}">Radar</a>
            <a href="pro.html" class="${this.currentPage === 'pro' ? 'active' : ''}">Pro</a>
        `;
    }

    generateLoggedInButtons(user) {
        const userInitial = user.email ? user.email.charAt(0).toUpperCase() : 'U';
        const userName = user.email ? user.email.split('@')[0] : 'User';

        return `
            <div class="user-info" style="display: flex; align-items: center; gap: 12px; margin-right: 15px; padding: 8px 12px; border-radius: 8px; background: rgba(74, 144, 226, 0.1); border: 1px solid rgba(74, 144, 226, 0.2);">
                <div class="user-avatar" style="width: 35px; height: 35px; border-radius: 50%; background: linear-gradient(45deg, #4a90e2, #00ff41); display: flex; align-items: center; justify-content: center; font-weight: bold; color: #000; font-size: 16px;">${userInitial}</div>
                <div style="display: flex; flex-direction: column;">
                    <span class="user-name" style="font-weight: 600; color: #fff; font-size: 14px;">${userName}</span>
                    <span class="user-balance" style="font-weight: 700; color: #00ff41; font-size: 12px;">${this.formatCurrency(user.balance)}</span>
                </div>
            </div>
            <a href="dashboard.html" class="btn btn-primary" style="background: linear-gradient(45deg, #4a90e2, #357abd); color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s; margin-right: 10px;">Dashboard</a>
            <button class="btn btn-secondary" onclick="window.navbarManager.handleLogout()" style="background: transparent; color: #fff; border: 1px solid rgba(255, 255, 255, 0.3); padding: 10px 16px; border-radius: 6px; cursor: pointer; transition: all 0.3s ease;">Logout</button>
        `;
    }

    generateGuestButtons() {
        return `
            <div class="guest-buttons" style="display: flex; gap: 15px;">
                <a href="register.html" class="btn btn-secondary" style="background: transparent; color: #fff; border: 1px solid rgba(255, 255, 255, 0.3); padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s;">Register</a>
                <a href="index.html" class="btn btn-primary" style="background: linear-gradient(45deg, #4a90e2, #357abd); color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s;">Login</a>
            </div>
        `;
    }

    updateActiveStates() {
        // Remove all active states first
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Add active state to current page
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const isActive = 
                (href === 'home.html' && this.currentPage === 'home') ||
                (href === 'radar.html' && this.currentPage === 'radar') ||
                (href === 'pro.html' && this.currentPage === 'pro');
            
            if (isActive) {
                link.classList.add('active');
            }
        });
    }

    bindEvents() {
        // Handle logout button hover
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches('.btn-secondary')) {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            }
            if (e.target.matches('.btn-primary')) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(74, 144, 226, 0.3)';
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.matches('.btn-secondary')) {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }
            if (e.target.matches('.btn-primary')) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
            }
        });

        // Handle user info hover
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('.user-info')) {
                const userInfo = e.target.closest('.user-info');
                userInfo.style.background = 'rgba(74, 144, 226, 0.15)';
                userInfo.style.borderColor = 'rgba(74, 144, 226, 0.3)';
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('.user-info')) {
                const userInfo = e.target.closest('.user-info');
                userInfo.style.background = 'rgba(74, 144, 226, 0.1)';
                userInfo.style.borderColor = 'rgba(74, 144, 226, 0.2)';
            }
        });

        // Handle authentication state changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'vantyx_current_user') {
                this.updateNavbarContent();
            }
        });

        // Handle navigation clicks with preventDefault for hash links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('.nav-links a');
            if (link && link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
            }
        });
    }

    handleLogoClick() {
        // Always go to home.html when clicking logo
        window.location.href = 'home.html';
    }

    handleLogout() {
        const confirmLogout = confirm('Are you sure you want to logout?');
        if (confirmLogout) {
            this.auth.logout();
            // Redirect happens in auth.logout()
        }
    }

    showComingSoon(feature) {
        alert(`${feature} section is coming soon! This is a demo version of VANTYX.`);
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Public methods for updating navbar
    refresh() {
        this.currentPage = this.getCurrentPage();
        this.updateNavbarContent();
    }

    updateUserInfo() {
        if (this.auth.isLoggedIn()) {
            const user = this.auth.getCurrentUser();
            const userAvatar = document.querySelector('.user-avatar');
            const userName = document.querySelector('.user-name');
            const userBalance = document.querySelector('.user-balance');

            if (userAvatar) {
                userAvatar.textContent = user.email.charAt(0).toUpperCase();
            }
            if (userName) {
                userName.textContent = user.email.split('@')[0];
            }
            if (userBalance) {
                userBalance.textContent = this.formatCurrency(user.balance);
            }
        }
    }

    // Method to check authentication and redirect if needed
    requireAuth() {
        if (!this.auth.isLoggedIn()) {
            alert('Please login to access this page.');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Method to redirect logged in users away from login/register
    redirectIfLoggedIn() {
        if (this.auth.isLoggedIn() && (this.currentPage === 'login' || this.currentPage === 'register')) {
            window.location.href = 'dashboard.html';
            return true;
        }
        return false;
    }
}

// Initialize navbar when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth to be available
    const initNavbar = () => {
        if (typeof AuthManager !== 'undefined') {
            window.navbarManager = new NavbarManager();
        } else {
            console.warn('AuthManager not available, retrying...');
            setTimeout(initNavbar, 100);
        }
    };
    
    // Small delay to ensure other scripts have loaded
    setTimeout(initNavbar, 50);
});

// Export for use in other files
window.NavbarManager = NavbarManager;