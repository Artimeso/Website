// 全局配置
const config = {
    // API配置
    api: {
        baseUrl: 'https://api.futurefurniture.com/v1',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json'
        }
    },

    // 产品配置
    products: {
        imagesPath: '/images/products/',
        defaultImage: '/images/placeholder.jpg',
        itemsPerPage: 12,
        categories: [
            { id: 'living', name: '客厅家具' },
            { id: 'bedroom', name: '卧室家具' },
            { id: 'office', name: '办公家具' },
            { id: 'dining', name: '餐厅家具' }
        ]
    },

    // 用户配置
    user: {
        tokenKey: 'auth_token',
        sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
        defaultAvatar: '/images/default-avatar.jpg'
    },

    // 购物车配置
    cart: {
        maxItems: 99,
        storageKey: 'shopping_cart',
        deliveryThreshold: 2000, // 免运费门槛
        deliveryFee: 200 // 运费
    },

    // UI配置
    ui: {
        theme: {
            primary: '#121212',
            secondary: '#1F1F1F',
            accent: '#2979FF',
            warning: '#FF8F00',
            error: '#f44336',
            success: '#4CAF50'
        },
        animations: {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        },
        breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1280
        }
    },

    // 验证规则
    validation: {
        password: {
            minLength: 8,
            requireNumbers: true,
            requireLetters: true,
            requireSpecialChars: false
        },
        phone: {
            pattern: /^1[3-9]\d{9}$/,
            message: '请输入有效的手机号码'
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: '请输入有效的邮箱地址'
        }
    },

    // 本地存储配置
    storage: {
        prefix: 'ff_',
        version: '1.0.0'
    },

    // 错误消息
    errorMessages: {
        network: '网络连接失败，请检查网络设置',
        server: '服务器错误，请稍后重试',
        auth: '登录已过期，请重新登录',
        validation: '输入信息有误，请检查后重试',
        notFound: '请求的资源不存在'
    },

    // 功能开关
    features: {
        enableCache: true,
        enableAnalytics: true,
        enableNotifications: true,
        maintenance: false
    }
};

// 环境特定配置
const env = process.env.NODE_ENV || 'development';
const envConfig = {
    development: {
        api: {
            baseUrl: 'http://localhost:3000/api'
        },
        features: {
            enableAnalytics: false
        }
    },
    production: {
        api: {
            baseUrl: 'https://api.futurefurniture.com/v1'
        }
    }
};

// 合并环境配置
Object.assign(config, envConfig[env]);

// 工具函数
const configUtils = {
    // 获取配置值
    get(path) {
        return path.split('.').reduce((obj, key) => obj && obj[key], config);
    },

    // 检查功能是否启用
    isFeatureEnabled(feature) {
        return config.features[feature] === true;
    },

    // 获取完整的图片URL
    getImageUrl(path) {
        return path.startsWith('http') ? path : config.products.imagesPath + path;
    },

    // 获取错误消息
    getErrorMessage(key) {
        return config.errorMessages[key] || config.errorMessages.server;
    },

    // 检查是否是移动设备
    isMobile() {
        return window.innerWidth <= config.ui.breakpoints.mobile;
    },

    // 获取设备类型
    getDeviceType() {
        const width = window.innerWidth;
        if (width <= config.ui.breakpoints.mobile) return 'mobile';
        if (width <= config.ui.breakpoints.tablet) return 'tablet';
        return 'desktop';
    },

    // 格式化价格
    formatPrice(price) {
        return `¥${price.toFixed(2)}`;
    },

    // 检查是否需要支付运费
    needsDeliveryFee(total) {
        return total < config.cart.deliveryThreshold;
    }
};

export { config as default, configUtils }; 