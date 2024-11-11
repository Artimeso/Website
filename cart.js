import authManager from './auth.js';

// 购物车管理
class CartManager {
    constructor() {
        this.cart = {
            items: [],
            total: 0
        };
        this.init();
    }

    init() {
        this.loadCart();
        this.setupCartPopup();
        this.setupEventListeners();
    }

    // 加载购物车数据
    loadCart() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
            this.updateCartUI();
        }
    }

    // 设置购物车弹出层
    setupCartPopup() {
        const cartIcon = document.querySelector('.cart-icon');
        const cartPopup = document.querySelector('.cart-popup');
        const closeBtn = cartPopup?.querySelector('.close-cart');

        cartIcon?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showCart();
        });

        closeBtn?.addEventListener('click', () => {
            this.hideCart();
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (cartPopup && !cartPopup.contains(e.target) && 
                !cartIcon.contains(e.target)) {
                this.hideCart();
            }
        });
    }

    // 设置事件监听
    setupEventListeners() {
        // 添加到购物车按钮
        document.addEventListener('click', (e) => {
            const addToCartBtn = e.target.closest('.add-to-cart');
            if (addToCartBtn) {
                const productId = addToCartBtn.closest('[data-product-id]').dataset.productId;
                this.addToCart(productId);
            }
        });

        // 购物车数量修改
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.matches('.quantity-decrease')) {
                const itemId = target.closest('.cart-item').dataset.id;
                this.decreaseQuantity(itemId);
            } else if (target.matches('.quantity-increase')) {
                const itemId = target.closest('.cart-item').dataset.id;
                this.increaseQuantity(itemId);
            }
        });

        // 删除购物车商品
        document.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-item');
            if (removeBtn) {
                const itemId = removeBtn.closest('.cart-item').dataset.id;
                this.removeItem(itemId);
            }
        });
    }

    // 添加商品到购物车
    async addToCart(productId, quantity = 1) {
        try {
            // 获取商品信息
            const product = await this.fetchProductInfo(productId);
            
            // 查找是否已存在
            const existingItem = this.cart.items.find(item => item.id === productId);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                this.cart.items.push({
                    id: productId,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: quantity
                });
            }

            this.updateCart();
            this.showAddToCartAnimation(productId);
            notify.success('已添加到购物车');
        } catch (error) {
            console.error('Failed to add to cart:', error);
            notify.error('添加失败，请稍后重试');
        }
    }

    // 获取商品信息
    async fetchProductInfo(productId) {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch product info');
        }
        return await response.json();
    }

    // 增加商品数量
    increaseQuantity(itemId) {
        const item = this.cart.items.find(item => item.id === itemId);
        if (item && item.quantity < 99) {
            item.quantity++;
            this.updateCart();
        }
    }

    // 减少商品数量
    decreaseQuantity(itemId) {
        const item = this.cart.items.find(item => item.id === itemId);
        if (item && item.quantity > 1) {
            item.quantity--;
            this.updateCart();
        }
    }

    // 移除商品
    removeItem(itemId) {
        this.cart.items = this.cart.items.filter(item => item.id !== itemId);
        this.updateCart();
        notify.success('商品已移除');
    }

    // 更新购物车
    updateCart() {
        // 计算总价
        this.cart.total = this.cart.items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
        );

        // 保存到本地存储
        localStorage.setItem('cart', JSON.stringify(this.cart));

        // 更新UI
        this.updateCartUI();

        // 触发购物车更新事件
        document.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { cart: this.cart }
        }));
    }

    // 更新购物车UI
    updateCartUI() {
        // 更新购物车计数
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.cart.items.reduce((sum, item) => 
                sum + item.quantity, 0
            );
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'block' : 'none';
        }

        // 更新购物车弹出层
        const cartItems = document.querySelector('.cart-items');
        if (cartItems) {
            if (this.cart.items.length === 0) {
                cartItems.innerHTML = `
                    <div class="empty-cart">
                        <span class="material-icons">shopping_cart</span>
                        <p>购物车是空的</p>
                        <button class="btn-primary" onclick="window.location.href='categories.html'">
                            去购物
                        </button>
                    </div>
                `;
            } else {
                cartItems.innerHTML = this.cart.items.map(item => `
                    <div class="cart-item" data-id="${item.id}">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            <div class="item-price">¥${item.price}</div>
                            <div class="quantity-controls">
                                <button class="quantity-decrease">-</button>
                                <span class="quantity">${item.quantity}</span>
                                <button class="quantity-increase">+</button>
                            </div>
                        </div>
                        <button class="remove-item">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                `).join('');
            }
        }

        // 更新总价
        const totalAmount = document.querySelector('.total-amount');
        if (totalAmount) {
            totalAmount.textContent = `¥${this.cart.total.toFixed(2)}`;
        }
    }

    // 显示购物车
    showCart() {
        const cartPopup = document.querySelector('.cart-popup');
        if (cartPopup) {
            cartPopup.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // 隐藏购物车
    hideCart() {
        const cartPopup = document.querySelector('.cart-popup');
        if (cartPopup) {
            cartPopup.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // 显示添加到购物车动画
    showAddToCartAnimation(productId) {
        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        const cartIcon = document.querySelector('.cart-icon');
        
        if (!productCard || !cartIcon) return;

        const productImage = productCard.querySelector('img');
        const cartRect = cartIcon.getBoundingClientRect();
        const productRect = productImage.getBoundingClientRect();

        const flyingImage = productImage.cloneNode();
        flyingImage.className = 'flying-image';
        flyingImage.style.cssText = `
            position: fixed;
            z-index: 1000;
            width: ${productRect.width}px;
            height: ${productRect.height}px;
            top: ${productRect.top}px;
            left: ${productRect.left}px;
            opacity: 0.8;
            pointer-events: none;
        `;

        document.body.appendChild(flyingImage);

        requestAnimationFrame(() => {
            flyingImage.style.cssText += `
                transition: all 0.8s cubic-bezier(0.2, 1, 0.3, 1);
                transform: translate(
                    ${cartRect.left - productRect.left}px,
                    ${cartRect.top - productRect.top}px
                ) scale(0.1);
                opacity: 0;
            `;
        });

        setTimeout(() => {
            flyingImage.remove();
            cartIcon.classList.add('bounce');
            setTimeout(() => cartIcon.classList.remove('bounce'), 300);
        }, 800);
    }
}

// 创建购物车管理实例
const cartManager = new CartManager();

export default cartManager; 