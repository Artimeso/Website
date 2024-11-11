import utils from './utils.js';
import cartManager from './cart.js';
import imageViewer from './image-viewer.js';
import authManager from './auth.js';

// 产品详情管理
class ProductDetailManager {
    constructor() {
        this.productId = this.getProductIdFromUrl();
        this.currentImage = 0;
        this.selectedOptions = {};
        this.quantity = 1;
        
        this.init();
    }

    init() {
        this.loadProductDetails();
        this.setupImageGallery();
        this.setupQuantityControls();
        this.setupOptionSelectors();
        this.setupAddToCart();
        this.setupTabs();
    }

    // 获取产品ID
    getProductIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // 加载产品详情
    async loadProductDetails() {
        try {
            const response = await fetch(`/api/products/${this.productId}`);
            if (!response.ok) throw new Error('Failed to load product details');

            const product = await response.json();
            this.renderProductDetails(product);
            this.loadRelatedProducts(product.category);
        } catch (error) {
            console.error('Failed to load product details:', error);
            notify.error('无法加载产品信息');
        }
    }

    // 渲染产品详情
    renderProductDetails(product) {
        // 更新标题和描述
        document.title = `${product.name} - Future Furniture`;
        document.querySelector('meta[name="description"]')
            ?.setAttribute('content', product.description);

        // 更新图片画廊
        const gallery = document.querySelector('.product-gallery');
        if (gallery) {
            gallery.querySelector('.main-image img').src = product.images[0];
            gallery.querySelector('.thumbnail-list').innerHTML = product.images.map((img, index) => `
                <button class="thumb-btn ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <img src="${img}" alt="${product.name} - 图片 ${index + 1}">
                </button>
            `).join('');
        }

        // 更新产品信息
        const info = document.querySelector('.product-info');
        if (info) {
            info.querySelector('h1').textContent = product.name;
            info.querySelector('.product-meta .rating-count').textContent = 
                `${product.rating} (${product.ratingCount}条评价)`;
            info.querySelector('.current-price').textContent = `¥${product.price}`;
            if (product.originalPrice) {
                info.querySelector('.original-price').textContent = `¥${product.originalPrice}`;
            }
        }

        // 更新SKU选项
        this.renderProductOptions(product.options);
    }

    // 渲染产品选项
    renderProductOptions(options) {
        const optionsContainer = document.querySelector('.product-options');
        if (!optionsContainer || !options) return;

        optionsContainer.innerHTML = Object.entries(options).map(([name, values]) => `
            <div class="option-group">
                <h3>${name}</h3>
                <div class="option-values">
                    ${values.map(value => `
                        <label class="option-value">
                            <input type="radio" name="${name}" value="${value}">
                            <span class="value-label">${value}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // 设置图片画廊
    setupImageGallery() {
        const gallery = document.querySelector('.product-gallery');
        if (!gallery) return;

        // 缩略图点击
        gallery.querySelectorAll('.thumb-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.switchImage(index);
            });
        });

        // 图片放大
        const mainImage = gallery.querySelector('.main-image img');
        const zoomBtn = gallery.querySelector('.zoom-btn');

        mainImage?.addEventListener('click', () => {
            this.showZoomedImage(mainImage.src);
        });

        zoomBtn?.addEventListener('click', () => {
            this.showZoomedImage(mainImage.src);
        });
    }

    // 切换图片
    switchImage(index) {
        const gallery = document.querySelector('.product-gallery');
        if (!gallery) return;

        const mainImage = gallery.querySelector('.main-image img');
        const thumbnails = gallery.querySelectorAll('.thumb-btn');
        const newSrc = thumbnails[index].querySelector('img').src;

        // 更新主图
        mainImage.style.opacity = '0';
        setTimeout(() => {
            mainImage.src = newSrc;
            mainImage.style.opacity = '1';
        }, 300);

        // 更新缩略图状态
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnails[index].classList.add('active');

        this.currentImage = index;
    }

    // 显示放大图片
    showZoomedImage(src) {
        imageViewer.show([{ src }]);
    }

    // 设置数量控制
    setupQuantityControls() {
        const controls = document.querySelector('.quantity-selector');
        if (!controls) return;

        const decreaseBtn = controls.querySelector('.decrease');
        const increaseBtn = controls.querySelector('.increase');
        const input = controls.querySelector('input');

        decreaseBtn?.addEventListener('click', () => {
            if (this.quantity > 1) {
                this.quantity--;
                input.value = this.quantity;
            }
        });

        increaseBtn?.addEventListener('click', () => {
            if (this.quantity < 99) {
                this.quantity++;
                input.value = this.quantity;
            }
        });

        input?.addEventListener('change', () => {
            let value = parseInt(input.value);
            if (isNaN(value) || value < 1) value = 1;
            if (value > 99) value = 99;
            this.quantity = value;
            input.value = value;
        });
    }

    // 设置选项选择器
    setupOptionSelectors() {
        const options = document.querySelector('.product-options');
        if (!options) return;

        options.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                this.selectedOptions[e.target.name] = e.target.value;
                this.updateAddToCartButton();
            }
        });
    }

    // 更新添加到购物车按钮状态
    updateAddToCartButton() {
        const addToCartBtn = document.querySelector('.add-to-cart');
        if (!addToCartBtn) return;

        const allOptionsSelected = document.querySelectorAll('.option-group').length === 
            Object.keys(this.selectedOptions).length;

        addToCartBtn.disabled = !allOptionsSelected;
    }

    // 设置添加到购物车
    setupAddToCart() {
        const addToCartBtn = document.querySelector('.add-to-cart');
        const buyNowBtn = document.querySelector('.buy-now');

        addToCartBtn?.addEventListener('click', () => {
            this.addToCart();
        });

        buyNowBtn?.addEventListener('click', () => {
            this.buyNow();
        });
    }

    // 添加到购物车
    async addToCart() {
        if (!this.validateSelection()) return;

        try {
            await cartManager.addToCart(this.productId, this.quantity, this.selectedOptions);
        } catch (error) {
            console.error('Failed to add to cart:', error);
            notify.error('添加失败，请稍后重试');
        }
    }

    // 立即购买
    async buyNow() {
        if (!this.validateSelection()) return;

        try {
            await cartManager.addToCart(this.productId, this.quantity, this.selectedOptions);
            window.location.href = '/checkout.html';
        } catch (error) {
            console.error('Failed to process buy now:', error);
            notify.error('处理失败，请稍后重试');
        }
    }

    // 验证选项选择
    validateSelection() {
        const optionGroups = document.querySelectorAll('.option-group');
        let isValid = true;

        optionGroups.forEach(group => {
            const name = group.querySelector('h3').textContent;
            if (!this.selectedOptions[name]) {
                notify.error(`请选择${name}`);
                isValid = false;
            }
        });

        return isValid;
    }

    // 设置标签页
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // 更新按钮状态
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // 更新内容显示
                tabPanes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === tabId) {
                        pane.classList.add('active');
                    }
                });
            });
        });
    }

    // 加载相关产品
    async loadRelatedProducts(category) {
        try {
            const response = await fetch(`/api/products/related?category=${category}&exclude=${this.productId}`);
            if (!response.ok) throw new Error('Failed to load related products');

            const products = await response.json();
            this.renderRelatedProducts(products);
        } catch (error) {
            console.error('Failed to load related products:', error);
        }
    }

    // 渲染相关产品
    renderRelatedProducts(products) {
        const container = document.querySelector('.related-products');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <div class="product-actions">
                        <button class="action-btn quick-view" title="快速预览">
                            <span class="material-icons">visibility</span>
                        </button>
                        <button class="action-btn add-to-favorite" title="添加收藏">
                            <span class="material-icons">favorite_border</span>
                        </button>
                        <button class="action-btn add-to-cart" title="加入购物车">
                            <span class="material-icons">shopping_cart</span>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">¥${product.price}</span>
                        ${product.originalPrice ? `
                            <span class="original-price">¥${product.originalPrice}</span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
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

// 创建产品详情管理实例
const productDetailManager = new ProductDetailManager();

export default productDetailManager; 