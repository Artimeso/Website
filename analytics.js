// 性能监控和分析
const analytics = {
    // 性能指标
    metrics: {
        pageLoads: 0,
        errors: 0,
        interactions: 0,
        apiCalls: 0,
        loadTimes: []
    },

    // 初始化
    init() {
        this.setupPerformanceMonitoring();
        this.setupErrorTracking();
        this.setupInteractionTracking();
        this.setupNavigationTracking();
    },

    // 性能监控
    setupPerformanceMonitoring() {
        // 页面加载性能
        window.addEventListener('load', () => {
            const performance = window.performance;
            if (performance) {
                const timing = performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                this.metrics.loadTimes.push(loadTime);
                this.metrics.pageLoads++;

                // 记录关键性能指标
                this.logPerformanceMetrics({
                    loadTime,
                    domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                    firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
                    firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime
                });
            }
        });

        // 资源加载性能
        if (window.PerformanceObserver) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'resource') {
                        this.logResourceTiming(entry);
                    }
                });
            });

            observer.observe({ entryTypes: ['resource'] });
        }
    },

    // 错误跟踪
    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.metrics.errors++;
            this.logError({
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.metrics.errors++;
            this.logError({
                message: 'Unhandled Promise Rejection',
                error: event.reason
            });
        });
    },

    // 用户交互跟踪
    setupInteractionTracking() {
        // 点击事件
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, a, .clickable');
            if (target) {
                this.logInteraction({
                    type: 'click',
                    element: target.tagName,
                    id: target.id,
                    class: target.className,
                    text: target.textContent?.trim()
                });
            }
        });

        // 表单提交
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM') {
                this.logInteraction({
                    type: 'form_submit',
                    formId: e.target.id,
                    formAction: e.target.action
                });
            }
        });

        // 页面滚动
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollDepth = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
                this.logInteraction({
                    type: 'scroll',
                    depth: scrollDepth
                });
            }, 150);
        });
    },

    // 页面导航跟踪
    setupNavigationTracking() {
        window.addEventListener('popstate', () => {
            this.logNavigation({
                type: 'popstate',
                path: location.pathname
            });
        });

        // 拦截所有链接点击
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                this.logNavigation({
                    type: 'link',
                    from: location.pathname,
                    to: link.pathname
                });
            }
        });
    },

    // API调用跟踪
    trackApiCall(endpoint, method, duration, status) {
        this.metrics.apiCalls++;
        this.logApiCall({
            endpoint,
            method,
            duration,
            status,
            timestamp: Date.now()
        });
    },

    // 记录性能指标
    logPerformanceMetrics(metrics) {
        console.log('Performance Metrics:', metrics);
        // 这里可以添加将数据发送到分析服务器的逻辑
    },

    // 记录资源加载时间
    logResourceTiming(entry) {
        const timing = {
            name: entry.name,
            type: entry.initiatorType,
            duration: entry.duration,
            size: entry.transferSize
        };
        console.log('Resource Timing:', timing);
        // 这里可以添加将数据发送到分析服务器的逻辑
    },

    // 记录错误
    logError(error) {
        console.error('Error tracked:', error);
        // 这里可以添加将错误数据发送到服务器的逻辑
    },

    // 记录用户交互
    logInteraction(interaction) {
        this.metrics.interactions++;
        console.log('User Interaction:', interaction);
        // 这里可以添加将交互数据发送到分析服务器的逻辑
    },

    // 记录页面导航
    logNavigation(navigation) {
        console.log('Navigation:', navigation);
        // 这里可以添加将导航数据发送到分析服务器的逻辑
    },

    // 记录API调用
    logApiCall(apiCall) {
        console.log('API Call:', apiCall);
        // 这里可以添加将API调用数据发送到分析服务器的逻辑
    },

    // 获取性能报告
    getPerformanceReport() {
        const avgLoadTime = this.metrics.loadTimes.reduce((a, b) => a + b, 0) / this.metrics.loadTimes.length;
        
        return {
            pageLoads: this.metrics.pageLoads,
            errors: this.metrics.errors,
            interactions: this.metrics.interactions,
            apiCalls: this.metrics.apiCalls,
            averageLoadTime: avgLoadTime,
            timestamp: new Date().toISOString()
        };
    }
};

export default analytics; 