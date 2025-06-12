/**
 * VANTYX - Utility Functions
 * Common utility functions used across the application
 */

// Utility object containing all helper functions
const Utils = {
    
    /**
     * DOM Manipulation Utilities
     */
    dom: {
        // Get element by ID
        get: (id) => document.getElementById(id),
        
        // Get elements by class name
        getByClass: (className) => document.getElementsByClassName(className),
        
        // Get elements by query selector
        query: (selector) => document.querySelector(selector),
        
        // Get multiple elements by query selector
        queryAll: (selector) => document.querySelectorAll(selector),
        
        // Create element
        create: (tag, attributes = {}, textContent = '') => {
            const element = document.createElement(tag);
            Object.keys(attributes).forEach(key => {
                element.setAttribute(key, attributes[key]);
            });
            if (textContent) element.textContent = textContent;
            return element;
        },
        
        // Add event listener
        on: (element, event, handler) => {
            if (typeof element === 'string') {
                element = Utils.dom.query(element);
            }
            if (element) {
                element.addEventListener(event, handler);
            }
        },
        
        // Remove event listener
        off: (element, event, handler) => {
            if (typeof element === 'string') {
                element = Utils.dom.query(element);
            }
            if (element) {
                element.removeEventListener(event, handler);
            }
        },
        
        // Show element
        show: (element) => {
            if (typeof element === 'string') {
                element = Utils.dom.query(element);
            }
            if (element) {
                element.style.display = '';
                element.classList.remove('d-none');
            }
        },
        
        // Hide element
        hide: (element) => {
            if (typeof element === 'string') {
                element = Utils.dom.query(element);
            }
            if (element) {
                element.style.display = 'none';
                element.classList.add('d-none');
            }
        },
        
        // Toggle element visibility
        toggle: (element) => {
            if (typeof element === 'string') {
                element = Utils.dom.query(element);
            }
            if (element) {
                if (element.style.display === 'none' || element.classList.contains('d-none')) {
                    Utils.dom.show(element);
                } else {
                    Utils.dom.hide(element);
                }
            }
        }
    },
    
    /**
     * Local Storage Utilities
     */
    storage: {
        // Set item in localStorage
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                return false;
            }
        },
        
        // Get item from localStorage
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return defaultValue;
            }
        },
        
        // Remove item from localStorage
        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error removing from localStorage:', error);
                return false;
            }
        },
        
        // Clear all localStorage
        clear: () => {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Error clearing localStorage:', error);
                return false;
            }
        }
    },
    
    /**
     * Validation Utilities
     */
    validate: {
        // Validate email
        email: (email) => {
            return APP_CONFIG.validation.email.pattern.test(email);
        },
        
        // Validate customer ID
        customerId: (id) => {
            const config = APP_CONFIG.validation.customerId;
            return id.length >= config.minLength && 
                   id.length <= config.maxLength && 
                   config.pattern.test(id);
        },
        
        // Validate PIN
        pin: (pin) => {
            const config = APP_CONFIG.validation.pin;
            return pin.length >= config.minLength && 
                   pin.length <= config.maxLength && 
                   config.pattern.test(pin);
        },
        
        // Check if value is empty
        isEmpty: (value) => {
            return value === null || value === undefined || value === '';
        },
        
        // Check if value is a valid number
        isNumber: (value) => {
            return !isNaN(parseFloat(value)) && isFinite(value);
        }
    },
    
    /**
     * Formatting Utilities
     */
    format: {
        // Format currency
        currency: (amount, currency = 'USD') => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        },
        
        // Format percentage
        percentage: (value, decimals = 2) => {
            return `${(value * 100).toFixed(decimals)}%`;
        },
        
        // Format number with commas
        number: (value, decimals = 2) => {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(value);
        },
        
        // Format date
        date: (date, options = {}) => {
            const defaultOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            };
            return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(date));
        },
        
        // Format time
        time: (date, options = {}) => {
            const defaultOptions = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(date));
        },
        
        // Format date and time
        datetime: (date) => {
            return `${Utils.format.date(date)} ${Utils.format.time(date)}`;
        }
    },
    
    /**
     * Animation Utilities
     */
    animate: {
        // Fade in element
        fadeIn: (element, duration = 300) => {
            if (typeof element === 'string') {
                element = Utils.dom.query(element);
            }
            if (element) {
                element.style.opacity = '0';
                element.style.display = '';
                element.style.transition = `opacity ${duration}ms ease`;
                
                setTimeout(() => {
                    element.style.opacity = '1';
                }, 10);
            }
        },
        
        // Fade out element
        fadeOut: (element, duration = 300) => {
            if (typeof element === 'string') {
                element = Utils.dom.query(element);
            }
            if (element) {
                element.style.transition = `opacity ${duration}ms ease`;
                element.style.opacity = '0';
                
                setTimeout(() => {
                    element.style.display = 'none';
                }, duration);
            }
        },
        
        // Slide up element
        slideUp: (element, duration = 300) => {
            if (typeof element === 'string') {
                element = Utils.dom.query(element);
            }
            if (element) {
                element.style.transform = 'translateY(20px)';
                element.style.opacity = '0';
                element.style.transition = `all ${duration}ms ease`;
                
                setTimeout(() => {
                    element.style.transform = 'translateY(0)';
                    element.style.opacity = '1';
                }, 10);
            }
        }
    },
    
    /**
     * Network Utilities
     */
    http: {
        // Generic fetch function
        fetch: async (url, options = {}) => {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: APP_CONFIG.api.timeout
            };
            
            const finalOptions = { ...defaultOptions, ...options };
            
            try {
                const response = await fetch(url, finalOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('Network error:', error);
                throw error;
            }
        },
        
        // GET request
        get: (url, options = {}) => {
            return Utils.http.fetch(url, { ...options, method: 'GET' });
        },
        
        // POST request
        post: (url, data, options = {}) => {
            return Utils.http.fetch(url, {
                ...options,
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        // PUT request
        put: (url, data, options = {}) => {
            return Utils.http.fetch(url, {
                ...options,
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        // DELETE request
        delete: (url, options = {}) => {
            return Utils.http.fetch(url, { ...options, method: 'DELETE' });
        }
    },
    
    /**
     * Utility Functions
     */
    
    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Debounce function
    debounce: (func, wait, immediate = false) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    // Throttle function
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Deep clone object
    clone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // Check if object is empty
    isEmpty: (obj) => {
        return Object.keys(obj).length === 0;
    },
    
    // Get random number between min and max
    random: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Capitalize first letter
    capitalize: (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    // Convert string to slug
    slugify: (str) => {
        return str.toLowerCase()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/[\s_-]+/g, '-')
                  .replace(/^-+|-+$/g, '');
    },
    
    // Get URL parameters
    getUrlParams: () => {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    },
    
    // Set URL parameter
    setUrlParam: (key, value) => {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    },
    
    // Copy text to clipboard
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    },
    
    // Check if device is mobile
    isMobile: () => {
        return window.innerWidth <= 768;
    },
    
    // Check if device is tablet
    isTablet: () => {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    },
    
    // Check if device is desktop
    isDesktop: () => {
        return window.innerWidth > 1024;
    }
};

// Make Utils globally available
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}

// Export for use in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
