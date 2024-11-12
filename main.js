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

// 轮播图控制
class Slider {
    constructor(element) {
        this.slider = element;
        this.slides = element.querySelectorAll('.slide');
        this.dots = element.querySelectorAll('.dot');
        this.prevBtn = element.querySelector('.prev');
        this.nextBtn = element.querySelector('.next');
        this.currentSlide = 0;
        this.slideCount = this.slides.length;
        this.interval = null;
        this.isAutoPlay = this.slider.dataset.autoPlay === 'true';
        this.autoPlayInterval = parseInt(this.slider.dataset.interval) || 5000;
        
        this.init();
    }

    init() {
        // 绑定按钮事件
        this.prevBtn?.addEventListener('click', () => this.prevSlide());
        this.nextBtn?.addEventListener('click', () => this.nextSlide());

        // 绑定指示点事件
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });

        // 触摸事件
        if (this.slider.querySelector('[data-touch="true"]')) {
            this.setupTouchEvents();
        }

        // 自动播放
        if (this.isAutoPlay) {
            this.startAutoPlay();
            
            // 鼠标悬停时暂停
            this.slider.addEventListener('mouseenter', () => this.stopAutoPlay());
            this.slider.addEventListener('mouseleave', () => this.startAutoPlay());
        }
    }

    // 切换到下一张
    nextSlide() {
        this.goToSlide((this.currentSlide + 1) % this.slideCount);
    }

    // 切换到上一张
    prevSlide() {
        this.goToSlide((this.currentSlide - 1 + this.slideCount) % this.slideCount);
    }

    // 切换到指定幻灯片
    goToSlide(index) {
        // 移除当前活动状态
        this.slides[this.currentSlide].classList.remove('active');
        this.dots[this.currentSlide].classList.remove('active');
        this.dots[this.currentSlide].setAttribute('aria-selected', 'false');

        // 设置新的活动状态
        this.currentSlide = index;
        this.slides[this.currentSlide].classList.add('active');
        this.dots[this.currentSlide].classList.add('active');
        this.dots[this.currentSlide].setAttribute('aria-selected', 'true');
    }

    // 设置触摸事件
    setupTouchEvents() {
        let touchStartX = 0;
        let touchEndX = 0;

        this.slider.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            this.stopAutoPlay();
        }, { passive: true });

        this.slider.addEventListener('touchmove', (e) => {
            touchEndX = e.touches[0].clientX;
        }, { passive: true });

        this.slider.addEventListener('touchend', () => {
            const difference = touchStartX - touchEndX;
            if (Math.abs(difference) > 50) { // 最小滑动距离
                if (difference > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
            if (this.isAutoPlay) {
                this.startAutoPlay();
            }
        });
    }

    // 开始自动播放
    startAutoPlay() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.interval = setInterval(() => this.nextSlide(), this.autoPlayInterval);
    }

    // 停止自动播放
    stopAutoPlay() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

class MainApp {
    constructor() {
        window.notify = notificationManager;
        window.utils = utils;
        this.init();
        this.setupGlobalErrorHandler();
    }

    init() {
        this.setupCommonFeatures();
        this.initPageSpecific();
        this.setupEventListeners();

        // 初始化所有轮播图
        document.querySelectorAll('.hero-slider').forEach(slider => {
            new Slider(slider);
        });
    }

    // 设置公共功能
    setupCommonFeatures() {
        // 初始化页面加载器
        this.setupPageLoader();
        // 初始化导航菜单
        this.setupNavigation();
        // 初始化购物车
        this.initCart();
        // 初始化认证状态
        this.initAuth();
    }

    // 设置页面加载器
    setupPageLoader() {
        const loader = document.querySelector('.page-loader');
        if (!loader) return;

        window.addEventListener('load', () => {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        });
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