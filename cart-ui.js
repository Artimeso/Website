// 购物车界面交互管理
class CartUI {
    constructor() {
        this.cartPopup = document.querySelector('.cart-popup');
        this.cartIcon = document.querySelector('.cart-icon');
        this.cartCount = document.querySelector('.cart-count');
        this.cartOverlay = document.querySelector('.cart-popup-overlay');
        this.cartItemsContainer = document.querySelector('.cart-popup-items');
        this.cartTotal = document.querySelector('.cart-total .total-amount');
        
        this.init();
    }

    // 初始化
    init() {
        this.setupEventListeners();
        this.updateCartIcon();
    }

    // 设置事件监听
    setupEventListeners() {
        // 购物车图标点击
        this.cartIcon?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleCart();
        });

        // 关闭购物车
        document.querySelector('.close-cart')?.addEventListener('click', () => {
            this.hideCart();
        });

        // 点击遮罩层关闭
        this.cartOverlay?.addEventListener('click', () => {
            this.hideCart();
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isCartVisible()) {
                this.hideCart();
            }
        });

        // 添加到购物车按钮
        document.addEventListener('click', (e) => {
            const addToCartBtn = e.target.closest('.add-to-cart');
            if (addToCartBtn) {
                this.handleAddToCart(addToCartBtn);
            }
        });

        // 购物车数量控制
        this.cartItemsContainer?.addEventListener('click', (e) => {
            const target = e.target;
            if (target.matches('.quantity-decrease')) {
                this.handleQuantityChange(target, 'decrease');
            } else if (target.matches('.quantity-increase')) {
                this.handleQuantityChange(target, 'increase');
            } else if (target.matches('.remove-item')) {
                this.handleRemoveItem(target);
            }
        });

        // 监听购物车更新事件
        document.addEventListener('cartUpdated', (e) => {
            this.updateCartUI(e.detail.cart);
        });
    }

    // 处理添加到购物车
    async handleAddToCart(button) {
        const productId = button.dataset.productId;
        const productCard = button.closest('.product-card');
        
        try {
            button.disabled = true;
            button.innerHTML = '<span class="material-icons loading">sync</span>';

            // 获取商品信息
            const product = await this.getProductInfo(productId);
            
            // 添加到购物车
            await cartManager.addItem(product);
            
            // 显示成功动画
            this.showAddToCartAnimation(productCard);
            
            // 更新界面
            this.updateCartIcon();
            this.showCart();

        } catch (error) {
            console.error('Failed to add item to cart:', error);
            this.showNotification('添加失败，请稍后重试', 'error');
        } finally {
            button.disabled = false;
            button.innerHTML = '<span class="material-icons">shopping_cart</span>';
        }
    }

    // 处理数量变化
    handleQuantityChange(button, action) {
        const itemContainer = button.closest('.cart-item');
        const itemId = itemContainer.dataset.id;
        const quantityInput = itemContainer.querySelector('.quantity-input');
        let newQuantity = parseInt(quantityInput.value);

        if (action === 'decrease') {
            newQuantity = Math.max(1, newQuantity - 1);
        } else {
            newQuantity = Math.min(99, newQuantity + 1);
        }

        cartManager.updateQuantity(itemId, newQuantity);
    }

    // 处理移除商品
    async handleRemoveItem(button) {
        const itemId = button.closest('.cart-item').dataset.id;
        
        try {
            await cartManager.removeItem(itemId);
            this.showNotification('商品已移除', 'success');
        } catch (error) {
            console.error('Failed to remove item:', error);
            this.showNotification('移除失败，请稍后重试', 'error');
        }
    }

    // 显示购物车
    showCart() {
        this.cartPopup?.classList.add('active');
        this.cartOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // 隐藏购物车
    hideCart() {
        this.cartPopup?.classList.remove('active');
        this.cartOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    // 切换购物车显示状态
    toggleCart() {
        if (this.isCartVisible()) {
            this.hideCart();
        } else {
            this.showCart();
        }
    }

    // 检查购物车是否可见
    isCartVisible() {
        return this.cartPopup?.classList.contains('active');
    }

    // 更新购物车图标
    updateCartIcon() {
        const count = cartManager.getItemCount();
        if (this.cartCount) {
            this.cartCount.textContent = count;
            this.cartCount.classList.toggle('hidden', count === 0);
        }
    }

    // 更新购物车界面
    updateCartUI(cart) {
        if (!this.cartItemsContainer) return;

        if (cart.items.length === 0) {
            this.cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <span class="material-icons">shopping_cart</span>
                    <p>购物车是空的</p>
                    <button class="continue-shopping" onclick="window.location.href='categories.html'">
                        继续购物
                    </button>
                </div>
            `;
        } else {
            this.cartItemsContainer.innerHTML = cart.items.map(item => this.generateCartItemHTML(item)).join('');
        }

        // 更新总价
        if (this.cartTotal) {
            this.cartTotal.textContent = `¥${cart.total.toFixed(2)}`;
        }

        this.updateCartIcon();
    }

    // 生成购物车商品HTML
    generateCartItemHTML(item) {
        return `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p class="item-price">¥${item.price}</p>
                    ${item.options.color ? `<p class="item-option">颜色：${item.options.color}</p>` : ''}
                    <div class="quantity-controls">
                        <button class="quantity-decrease">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" readonly>
                        <button class="quantity-increase">+</button>
                    </div>
                </div>
                <button class="remove-item">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `;
    }

    // 显示添加到购物车动画
    showAddToCartAnimation(productCard) {
        if (!productCard || !this.cartIcon) return;

        const productImage = productCard.querySelector('img');
        const cartRect = this.cartIcon.getBoundingClientRect();
        const productRect = productImage.getBoundingClientRect();

        const animatedImage = document.createElement('img');
        animatedImage.src = productImage.src;
        animatedImage.className = 'flying-image';
        animatedImage.style.cssText = `
            position: fixed;
            top: ${productRect.top}px;
            left: ${productRect.left}px;
            width: ${productRect.width}px;
            height: ${productRect.height}px;
            z-index: 1000;
        `;

        document.body.appendChild(animatedImage);

        requestAnimationFrame(() => {
            animatedImage.style.cssText += `
                transform: translate(
                    ${cartRect.left - productRect.left}px,
                    ${cartRect.top - productRect.top}px
                ) scale(0.1);
                opacity: 0;
                transition: all 0.8s cubic-bezier(0.2, 1, 0.3, 1);
            `;
        });

        setTimeout(() => {
            animatedImage.remove();
            this.cartIcon.classList.add('bounce');
            setTimeout(() => this.cartIcon.classList.remove('bounce'), 300);
        }, 800);
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="material-icons">${type === 'success' ? 'check_circle' : 'error'}</span>
            <p>${message}</p>
        `;

        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 获取商品信息
    async getProductInfo(productId) {
        // 实际项目中应该从API获取
        return {
            id: productId,
            name: '智能人体工学椅',
            price: 2999,
            image: 'images/chair.jpg'
        };
    }
}

// 创建购物车UI实例
const cartUI = new CartUI();

export default cartUI; 