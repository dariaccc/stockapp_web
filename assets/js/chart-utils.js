// Complete Chart & Tooltip Solution
// Add this to your chart-utils.js or replace the existing ChartUtils class

class ChartUtils {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.data = [];
        this.chartPoints = [];
        this.currentPeriod = '1D';
        this.tooltip = null;
        
        if (!this.canvas || !this.ctx) {
            console.error(`Canvas with id '${canvasId}' not found`);
            return;
        }
        
        this.setupCanvas();
        this.setupInteractions();
        this.createTooltip();
        
        console.log('✅ ChartUtils initialized with tooltip support');
    }
    
    setupCanvas() {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        // Set actual size in memory (scaled up for high DPI)
        this.canvas.width = rect.width * devicePixelRatio;
        this.canvas.height = rect.height * devicePixelRatio;
        
        // Scale the drawing context so everything draws at the correct size
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        
        // Set the size in CSS to ensure it displays at the right size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.canvas.style.cursor = 'crosshair';
    }
    
    setupInteractions() {
        // Throttled mouse move for performance
        let moveTimeout;
        this.canvas.addEventListener('mousemove', (e) => {
            clearTimeout(moveTimeout);
            moveTimeout = setTimeout(() => this.handleMouseMove(e), 16); // ~60fps
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        console.log('✅ Chart interactions setup complete');
    }
    
    createTooltip() {
        // Remove existing tooltip if any
        const existingTooltip = document.getElementById('chartTooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        // Create new tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'chartTooltip';
        this.tooltip.className = 'chart-tooltip';
        
        // Apply styles that work with your existing CSS
        this.tooltip.style.cssText = `
            position: fixed;
            z-index: 9999;
            pointer-events: none;
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid rgba(74, 144, 226, 0.6);
            border-radius: 12px;
            padding: 12px;
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(74, 144, 226, 0.2);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            min-width: 140px;
            text-align: center;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            display: none;
            transform: translateY(-10px);
        `;
        
        document.body.appendChild(this.tooltip);
        console.log('✅ Tooltip created and added to DOM');
    }
    
    handleMouseMove(e) {
        const dataPoint = this.getDataPointFromEvent(e);
        if (dataPoint) {
            this.showTooltip(e, dataPoint, false);
        } else {
            this.hideTooltip();
        }
    }
    
    handleClick(e) {
        const dataPoint = this.getDataPointFromEvent(e);
        if (dataPoint) {
            // Update main chart info display
            this.updateMainChartInfo(dataPoint);
            
            // Show persistent tooltip
            this.showTooltip(e, dataPoint, true);
            
            console.log('📊 Chart clicked:', {
                price: dataPoint.price,
                date: dataPoint.originalData?.date,
                index: dataPoint.index
            });
        }
    }
    
    getDataPointFromEvent(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        return this.getDataPointAtPosition(x, y);
    }
    
    getDataPointAtPosition(x, y) {
        if (!this.chartPoints || this.chartPoints.length === 0) {
            return null;
        }
        
        // Find closest point horizontally
        let closestPoint = null;
        let closestDistance = Infinity;
        
        this.chartPoints.forEach((point, index) => {
            const distance = Math.abs(point.x - x);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = {
                    ...point,
                    index: index,
                    originalData: this.data[index]
                };
            }
        });
        
        // Return point if within reasonable distance
        return closestDistance < 50 ? closestPoint : null;
    }
    
    showTooltip(event, dataPoint, persistent = false) {
        if (!this.tooltip) {
            this.createTooltip();
        }
        
        // Calculate change from previous point
        const prevIndex = Math.max(0, dataPoint.index - 1);
        const currentData = this.data[dataPoint.index];
        const prevData = this.data[prevIndex];
        
        const currentPrice = currentData.close || currentData.price;
        const prevPrice = prevData.close || prevData.price;
        const change = currentPrice - prevPrice;
        const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
        
        // Update tooltip content with proper styling
        const changeColor = change >= 0 ? '#00ff41' : '#ff4444';
        const changeSign = change >= 0 ? '+' : '';
        
        this.tooltip.innerHTML = `
            <div class="tooltip-content">
                <div style="color: #00ff41; font-weight: 700; font-size: 16px; margin-bottom: 6px; text-shadow: 0 0 10px rgba(0, 255, 65, 0.4);">
                    ${this.formatCurrency(currentPrice)}
                </div>
                <div style="color: #999; font-size: 12px; margin-bottom: 4px;">
                    ${this.formatDate(currentData.date)}
                </div>
                <div style="color: ${changeColor}; font-size: 13px; font-weight: 600; text-shadow: 0 0 8px ${changeColor}40;">
                    ${changeSign}${this.formatCurrency(Math.abs(change))} (${changeSign}${Math.abs(changePercent).toFixed(2)}%)
                </div>
            </div>
        `;
        
        // Position tooltip
        this.positionTooltip(event.clientX, event.clientY);
        
        // Show tooltip with animation
        this.tooltip.style.display = 'block';
        
        // Use requestAnimationFrame for smooth animation
        requestAnimationFrame(() => {
            this.tooltip.style.opacity = '1';
            this.tooltip.style.transform = 'translateY(0)';
        });
        
        if (persistent) {
            this.tooltip.classList.add('persistent');
            this.tooltip.style.borderColor = 'rgba(0, 255, 65, 0.8)';
            this.tooltip.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 255, 65, 0.3)';
            
            // Auto-hide persistent tooltip after 5 seconds
            setTimeout(() => {
                if (this.tooltip.classList.contains('persistent')) {
                    this.hideTooltip();
                }
            }, 5000);
        } else {
            this.tooltip.classList.remove('persistent');
            this.tooltip.style.borderColor = 'rgba(74, 144, 226, 0.6)';
            this.tooltip.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(74, 144, 226, 0.2)';
        }
    }
    
    positionTooltip(mouseX, mouseY) {
        if (!this.tooltip) return;
        
        // Temporarily show to measure
        this.tooltip.style.visibility = 'hidden';
        this.tooltip.style.display = 'block';
        
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Smart positioning
        let left = mouseX + 15;
        let top = mouseY - 15;
        
        // Prevent overflow
        if (left + tooltipRect.width > viewportWidth - 20) {
            left = mouseX - tooltipRect.width - 15;
        }
        
        if (top < 20) {
            top = mouseY + 25;
        } else if (top + tooltipRect.height > viewportHeight - 20) {
            top = mouseY - tooltipRect.height - 25;
        }
        
        // Ensure within bounds
        left = Math.max(10, Math.min(left, viewportWidth - tooltipRect.width - 10));
        top = Math.max(10, Math.min(top, viewportHeight - tooltipRect.height - 10));
        
        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
        this.tooltip.style.visibility = 'visible';
    }
    
    hideTooltip() {
        if (!this.tooltip) return;
        
        this.tooltip.style.opacity = '0';
        this.tooltip.style.transform = 'translateY(-10px)';
        this.tooltip.classList.remove('persistent');
        
        setTimeout(() => {
            if (this.tooltip.style.opacity === '0') {
                this.tooltip.style.display = 'none';
            }
        }, 200);
    }
    
    updateMainChartInfo(dataPoint) {
        // Update chart price display
        const chartPrice = document.getElementById('chartPrice');
        if (chartPrice) {
            chartPrice.textContent = this.formatCurrency(dataPoint.price);
            chartPrice.style.color = '#00ff41';
            chartPrice.style.textShadow = '0 0 10px rgba(0, 255, 65, 0.3)';
            
            // Add flash animation
            chartPrice.style.transition = 'all 0.3s ease';
            chartPrice.style.transform = 'scale(1.05)';
            setTimeout(() => {
                chartPrice.style.transform = 'scale(1)';
            }, 300);
        }
        
        // Update chart date display  
        const chartDate = document.getElementById('chartDate');
        if (chartDate) {
            chartDate.textContent = this.formatDate(dataPoint.originalData.date);
            chartDate.style.color = '#4a90e2';
            chartDate.style.transition = 'all 0.3s ease';
        }
    }
    
    drawChart(data, period = '1D') {
        if (!this.canvas || !this.ctx || !data || data.length === 0) {
            console.error('Cannot draw chart: missing canvas, context, or data');
            return;
        }
        
        this.data = data;
        this.currentPeriod = period;
        
        // Store data globally for access by other components
        window.currentChartData = data;
        
        // Clear canvas
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Chart dimensions
        const padding = 40;
        const chartWidth = rect.width - (padding * 2);
        const chartHeight = rect.height - (padding * 2);
        const chartStartX = padding;
        const chartStartY = padding;
        
        // Calculate price range
        const prices = data.map(d => d.close || d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        const pricePadding = priceRange * 0.1;
        const adjustedMin = minPrice - pricePadding;
        const adjustedMax = maxPrice + pricePadding;
        const adjustedRange = adjustedMax - adjustedMin;
        
        // Calculate chart points
        this.chartPoints = data.map((item, index) => {
            const x = chartStartX + (index / (data.length - 1)) * chartWidth;
            const price = item.close || item.price;
            const y = chartStartY + chartHeight - ((price - adjustedMin) / adjustedRange) * chartHeight;
            return { x, y, price };
        });
        
        // Draw components
        this.drawGrid(chartStartX, chartStartY, chartWidth, chartHeight);
        this.drawPriceArea(this.chartPoints, chartStartX, chartStartY, chartHeight);
        this.drawPriceLine(this.chartPoints);
        this.drawDataPoints(this.chartPoints);
        this.drawPriceLabels(chartStartX, chartStartY, chartWidth, chartHeight, adjustedMin, adjustedMax);
        
        // Update current price
        if (data.length > 0) {
            window.currentQuotePrice = data[data.length - 1].close || data[data.length - 1].price;
        }
        
        console.log('✅ Chart drawn with', data.length, 'data points');
    }
    
    drawGrid(startX, startY, width, height) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = startY + (i / 5) * height;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(startX + width, y);
            this.ctx.stroke();
        }
        
        // Vertical grid lines
        for (let i = 0; i <= 6; i++) {
            const x = startX + (i / 6) * width;
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, startY + height);
            this.ctx.stroke();
        }
    }
    
    drawPriceLine(points) {
        if (points.length === 0) return;
        
        const isPositive = points[points.length - 1].price >= points[0].price;
        this.ctx.strokeStyle = isPositive ? '#00ff41' : '#ff4444';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Add glow effect
        this.ctx.shadowColor = isPositive ? '#00ff41' : '#ff4444';
        this.ctx.shadowBlur = 8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        
        this.ctx.stroke();
        this.ctx.shadowBlur = 0; // Reset shadow
    }
    
    drawPriceArea(points, startX, startY, height) {
        if (points.length === 0) return;
        
        const isPositive = points[points.length - 1].price >= points[0].price;
        const gradient = this.ctx.createLinearGradient(0, startY, 0, startY + height);
        
        if (isPositive) {
            gradient.addColorStop(0, 'rgba(0, 255, 65, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 255, 65, 0.05)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 68, 68, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 68, 68, 0.05)');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, startY + height);
        this.ctx.lineTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        
        this.ctx.lineTo(points[points.length - 1].x, startY + height);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawDataPoints(points) {
        // Only show points for small datasets to avoid clutter
        if (points.length > 30) return;
        
        const isPositive = points[points.length - 1].price >= points[0].price;
        this.ctx.fillStyle = isPositive ? '#00ff41' : '#ff4444';
        
        points.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }
    
    drawPriceLabels(startX, startY, width, height, minPrice, maxPrice) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        this.ctx.textAlign = 'right';
        
        const priceRange = maxPrice - minPrice;
        
        for (let i = 0; i <= 5; i++) {
            const price = maxPrice - (i / 5) * priceRange;
            const y = startY + (i / 5) * height;
            
            this.ctx.fillText(
                this.formatCurrency(price),
                startX + width + 35,
                y + 4
            );
        }
    }
    
    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }
    
    formatDate(date) {
        if (!date) return '';
        const dateObj = date instanceof Date ? date : new Date(date);
        
        return dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    resize() {
        this.setupCanvas();
        if (this.data && this.data.length > 0) {
            this.drawChart(this.data, this.currentPeriod);
        }
    }
    
    static getPeriodMapping(period) {
        const mappings = {
            '1D': { range: '1d', interval: '5m' },
            '1W': { range: '5d', interval: '15m' },
            '1M': { range: '1mo', interval: '1d' },
            '3M': { range: '3mo', interval: '1d' },
            '1Y': { range: '1y', interval: '1wk' },
            '5Y': { range: '5y', interval: '1mo' }
        };
        return mappings[period] || mappings['1D'];
    }
}

// Make ChartUtils available globally
window.ChartUtils = ChartUtils;

// Initialize tooltip functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add some helper functions for debugging
    window.testTooltip = function() {
        const canvas = document.getElementById('stockChart');
        if (canvas && window.stockChart) {
            const rect = canvas.getBoundingClientRect();
            const testEvent = {
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                target: canvas
            };
            
            if (typeof window.stockChart.handleClick === 'function') {
                window.stockChart.handleClick(testEvent);
                console.log('✅ Test tooltip triggered');
            } else {
                console.warn('⚠️ Chart handleClick method not found');
            }
        } else {
            console.warn('⚠️ Canvas or chart not found for testing');
        }
    };
    
    console.log('🎯 ChartUtils with tooltips ready!');
    console.log('💡 Use window.testTooltip() to test tooltip functionality');
});

console.log('✅ Enhanced ChartUtils with complete tooltip support loaded');