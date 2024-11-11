// 主入口文件
import utils from './utils.js';
import authManager from './auth.js';
import notificationManager from './notifications.js';

// 然后导入依赖这些基础模块的功能模块
import cartManager from './cart.js';
import imageViewer from './image-viewer.js';

// 设置全局可用的实例
window.utils = utils;
window.notify = notificationManager;
window.auth = authManager;
window.cart = cartManager;
window.imageViewer = imageViewer;

class MainApp {
    constructor() {
        window.notify = notificationManager;
        window.utils = utils;
        this.init();
    }

    init() {
        // 简单地监听页面加载完成
        window.addEventListener('load', () => {
            const loader = document.querySelector('.page-loader');
            if (loader) {
                loader.remove();
            }
        });

        this.setupCommonFeatures();
        this.initPageSpecific();
        this.setupEventListeners();
    }

    // 设置公共功能
    setupCommonFeatures() {
        // 初始化导航菜单
        this.setupNavigation();
        // 初始化购物车
        this.initCart();
        // 初始化认证状态
        this.initAuth();
    }

    // 设置导航菜单
    setupNavigation() {
        // 移动端菜单切换
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const mobileMenu = document.querySelector('.mobile-menu');
        
        menuBtn?.addEventListener('click', () => {
            mobileMenu?.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        // 关闭移动端菜单
        const closeBtn = mobileMenu?.querySelector('.close-menu');
        closeBtn?.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });

        // 下拉菜单
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            toggle?.addEventListener('click', (e) => {
                e.preventDefault();
                dropdown.classList.toggle('active');
            });
        });
    }

    // 初始化购物车
    initCart() {
        cartManager.init();
    }

    // 初始化认证状态
    initAuth() {
        authManager.checkAuthStatus();
    }

    // 初始化页面特定功能
    initPageSpecific() {
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'index':
                import('./index.js').then(module => {
                    const indexManager = module.default;
                });
                break;
            case 'categories':
                import('./categories.js').then(module => {
                    const categoryManager = module.default;
                });
                break;
            case 'product-detail':
                import('./product-detail.js').then(module => {
                    const productManager = module.default;
                });
                break;
            case 'order-detail':
                import('./order-tracker.js').then(module => {
                    const orderTracker = module.default;
                });
                break;
            // ... 其他页面
        }
    }

    // 获取当前页面
    getCurrentPage() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop().replace('.html', '');
        return pageName || 'index';
    }

    // 设置事件监听
    setupEventListeners() {
        // 返回顶部按钮
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    backToTop.classList.add('show');
                } else {
                    backToTop.classList.remove('show');
                }
            });

            backToTop.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        // 搜索功能
        const searchForm = document.querySelector('.search-box');
        searchForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchForm.querySelector('input').value.trim();
            if (query) {
                window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
            }
        });
    }

    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            notify.error('发生错误，请刷新页面重试');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            notify.error('网络请求失败，请检查网络连接');
        });
    }
}

// 创建主应用实例
const app = new MainApp();

export default app;