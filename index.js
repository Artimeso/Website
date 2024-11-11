import utils from './utils.js';
import cartManager from './cart.js';
import imageViewer from './image-viewer.js';

// 首页功能管理
class IndexManager {
    constructor() {
        this.init();
    }

    init() {
        this.initSlider();
        this.initProductCards();
        this.initNewArrivals();
        this.initNewsletterForm();
    }

    // 初始化轮播图
    initSlider() {
        const slider = document.querySelector('.hero-slider');
        if (!slider) return;

        const slides = slider.querySelectorAll('.slide');
        const dots = slider.querySelectorAll('.dot');
        const prevBtn = slider.querySelector('.prev');
        const nextBtn = slider.querySelector('.next');

        // 自动播放
        this.startAutoSlide();

        // 点击切换
        prevBtn?.addEventListener('click', () => this.prevSlide());
        nextBtn?.addEventListener('click', () => this.nextSlide());

        // 指示点切换
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });

        // 触摸滑动
        slider.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.pauseAutoSlide();
        }, { passive: true });

        slider.addEventListener('touchmove', (e) => {
            if (this.isSliding) return;
            const touchEndX = e.touches[0].clientX;
            const diff = this.touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
                this.touchStartX = 0;
            }
        }, { passive: true });

        slider.addEventListener('touchend', () => {
            this.startAutoSlide();
        });

        // 鼠标悬停暂停
        slider.addEventListener('mouseenter', () => this.pauseAutoSlide());
        slider.addEventListener('mouseleave', () => this.startAutoSlide());
    }

    // 切换到下一张幻灯片
    nextSlide() {
        if (this.isSliding) return;
        const slider = document.querySelector('.hero-slider');
        const slides = slider.querySelectorAll('.slide');
        const nextIndex = (this.currentSlide + 1) % slides.length;
        this.goToSlide(nextIndex);
    }

    // 切换到上一张幻灯片
    prevSlide() {
        if (this.isSliding) return;
        const slider = document.querySelector('.hero-slider');
        const slides = slider.querySelectorAll('.slide');
        const prevIndex = (this.currentSlide - 1 + slides.length) % slides.length;
        this.goToSlide(prevIndex);
    }

    // 切换到指定幻灯片
    goToSlide(index) {
        const slider = document.querySelector('.hero-slider');
        const slides = slider.querySelectorAll('.slide');
        const dots = slider.querySelectorAll('.dot');

        if (this.isSliding || index === this.currentSlide) return;

        this.isSliding = true;
        
        // 更新活动状态
        slides[this.currentSlide].classList.remove('active');
        slides[index].classList.add('active');
        dots[this.currentSlide].classList.remove('active');
        dots[index].classList.add('active');

        // 设置过渡动画
        this.currentSlide = index;
        setTimeout(() => {
            this.isSliding = false;
        }, 500);
    }

    // 开始自动播放
    startAutoSlide() {
        this.pauseAutoSlide();
        this.sliderInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }

    // 暂停自动播放
    pauseAutoSlide() {
        if (this.sliderInterval) {
            clearInterval(this.sliderInterval);
            this.sliderInterval = null;
        }
    }

    // 初始化产品卡片
    initProductCards() {
        document.querySelectorAll('.product-card').forEach(card => {
            // 快速预览
            card.querySelector('.quick-view')?.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = card.dataset.productId;
                this.showQuickView(productId);
            });

            // 添加收藏
            card.querySelector('.add-to-favorite')?.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = card.dataset.productId;
                this.toggleFavorite(productId, e.currentTarget);
            });

            // 加入购物车
            card.querySelector('.add-to-cart')?.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = card.dataset.productId;
                this.addToCart(productId, e.currentTarget);
            });
        });
    }

    // 显示快速预览
    async showQuickView(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) throw new Error('Failed to fetch product details');
            const product = await response.json();
            
            // 调用图片查看器显示产品详情
            imageViewer.show([
                { src: product.image, caption: product.name }
            ]);
        } catch (error) {
            console.error('Quick view failed:', error);
            this.showNotification('无法加载产品详情', 'error');
        }
    }

    // 切换收藏状态
    async toggleFavorite(productId, button) {
        try {
            const response = await fetch(`/api/favorites/${productId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to toggle favorite');

            const { isFavorite } = await response.json();
            button.querySelector('.material-icons').textContent = 
                isFavorite ? 'favorite' : 'favorite_border';
            
            this.showNotification(
                isFavorite ? '已添加到收藏' : '已取消收藏',
                'success'
            );
        } catch (error) {
            console.error('Toggle favorite failed:', error);
            this.showNotification('操作失败，请稍后重试', 'error');
        }
    }

    // 添加到购物车
    async addToCart(productId, button) {
        try {
            button.disabled = true;
            const loadingSpinner = button.querySelector('.loading-spinner');
            if (loadingSpinner) loadingSpinner.style.display = 'block';

            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ productId, quantity: 1 })
            });

            if (!response.ok) throw new Error('Failed to add to cart');

            this.showAddToCartAnimation(button);
            this.showNotification('已添加到购物车', 'success');
            
            // 更新购物车计数
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                const count = parseInt(cartCount.textContent) + 1;
                cartCount.textContent = count;
            }
        } catch (error) {
            console.error('Add to cart failed:', error);
            this.showNotification('添加失败，请稍后重试', 'error');
        } finally {
            button.disabled = false;
            const loadingSpinner = button.querySelector('.loading-spinner');
            if (loadingSpinner) loadingSpinner.style.display = 'none';
        }
    }

    // 显示加入购物车动画
    showAddToCartAnimation(button) {
        const card = button.closest('.product-card');
        const img = card.querySelector('.product-image img');
        const cartIcon = document.querySelector('.cart-icon');

        if (!img || !cartIcon) return;

        const flyingImg = img.cloneNode();
        flyingImg.className = 'flying-image';
        const imgRect = img.getBoundingClientRect();
        const cartRect = cartIcon.getBoundingClientRect();

        flyingImg.style.cssText = `
            position: fixed;
            z-index: 1000;
            width: ${imgRect.width}px;
            height: ${imgRect.height}px;
            top: ${imgRect.top}px;
            left: ${imgRect.left}px;
            opacity: 0.8;
            pointer-events: none;
        `;

        document.body.appendChild(flyingImg);

        requestAnimationFrame(() => {
            flyingImg.style.cssText += `
                transition: all 0.8s cubic-bezier(0.2, 1, 0.3, 1);
                transform: translate(
                    ${cartRect.left - imgRect.left}px,
                    ${cartRect.top - imgRect.top}px
                ) scale(0.1);
                opacity: 0;
            `;
        });

        setTimeout(() => {
            flyingImg.remove();
            cartIcon.classList.add('bounce');
            setTimeout(() => cartIcon.classList.remove('bounce'), 300);
        }, 800);
    }

    // 初始化新品上市
    initNewArrivals() {
        const container = document.querySelector('.new-arrivals');
        if (!container) return;

        // 加载新品数据
        this.loadNewArrivals();
    }

    // 加载新品数据
    async loadNewArrivals() {
        try {
            const response = await fetch('/api/products/new');
            if (!response.ok) throw new Error('Failed to load new arrivals');
            
            const products = await response.json();
            this.renderNewArrivals(products);
        } catch (error) {
            console.error('Failed to load new arrivals:', error);
            this.showNotification('无法加载新品信息', 'error');
        }
    }

    // 渲染新品
    renderNewArrivals(products) {
        const container = document.querySelector('.new-products-grid');
        if (!container) return;

        // 渲染新品列表
        // ...
    }

    // 初始化订阅表单
    initNewsletterForm() {
        const form = document.querySelector('.newsletter-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;
            const checkbox = form.querySelector('input[type="checkbox"]');

            if (!checkbox.checked) {
                this.showNotification('请同意接收邮件', 'error');
                return;
            }

            try {
                const response = await fetch('/api/newsletter/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                if (!response.ok) throw new Error('Subscription failed');

                this.showNotification('订阅成功！', 'success');
                form.reset();
            } catch (error) {
                console.error('Newsletter subscription failed:', error);
                this.showNotification('订阅失败，请稍后重试', 'error');
            }
        });
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// 创建首页管理实例
const indexManager = new IndexManager();

export default indexManager; 