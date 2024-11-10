import { storage } from './utils.js';
import api from './api.js';
import config from './config.js';

class CartManager {
    constructor() {
        this.items = [];
        this.total = 0;
        this.deliveryFee = config.cart.deliveryFee;
        this.deliveryThreshold = config.cart.deliveryThreshold;
        this.init();
    }

    // 初始化购物车
    init() {
        this.loadFromStorage();
        this.setupEventListeners();
    }

    // 从本地存储加载购物车数据
    loadFromStorage() {
        const savedCart = storage.get('cart');
        if (savedCart) {
            this.items = savedCart.items || [];
            this.total = savedCart.total || 0;
            this.updateUI();
        }
    }

    // 保存到本地存储
    saveToStorage() {
        storage.set('cart', {
            items: this.items,
            total: this.total
        });
    }

    // 添加商品到购物车
    async addItem(product, quantity = 1, options = {}) {
        try {
            // 检查库存
            const stockResponse = await api.products.checkStock(product.id, quantity);
            if (!stockResponse.inStock) {
                throw new Error('商品库存不足');
            }

            const existingItem = this.items.find(item => 
                item.id === product.id && 
                JSON.stringify(item.options) === JSON.stringify(options)
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                this.items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity,
                    options
                });
            }

            this.updateTotal();
            this.saveToStorage();
            this.updateUI();
            this.showAddToCartAnimation(product);

            return true;
        } catch (error) {
            console.error('Failed to add item to cart:', error);
            throw error;
        }
    }

    // 从购物车移除商品
    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.updateTotal();
        this.saveToStorage();
        this.updateUI();
    }

    // 更新商品数量
    updateQuantity(itemId, quantity) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            item.quantity = Math.max(1, Math.min(quantity, config.cart.maxItems));
            this.updateTotal();
            this.saveToStorage();
            this.updateUI();
        }
    }

    // 清空购物车
    clear() {
        this.items = [];
        this.total = 0;
        this.saveToStorage();
        this.updateUI();
    }

    // 计算总价
    updateTotal() {
        this.total = this.items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
        );
    }

    // 计算运费
    calculateDeliveryFee() {
        return this.total >= this.deliveryThreshold ? 0 : this.deliveryFee;
    }

    // 获取商品总数
    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // 更新UI显示
    updateUI() {
        // 更新购物车图标数量
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = this.getItemCount();
        }

        // 更新购物车弹出层
        this.updateCartPopup();

        // 更新购物车页面（如果在购物车页面）
        this.updateCartPage();
    }

    // 更新购物车弹出层
    updateCartPopup() {
        const cartPopup = document.getElementById('cartPopup');
        if (!cartPopup) return;

        const itemsContainer = cartPopup.querySelector('.cart-popup-items');
        const totalAmount = cartPopup.querySelector('.total-amount');

        if (this.items.length > 0) {
            itemsContainer.innerHTML = this.items.map(item => `
                <div class="cart-popup-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p class="cart-item-price">¥${item.price} × ${item.quantity}</p>
                        ${item.options.color ? `<p class="cart-item-option">颜色：${item.options.color}</p>` : ''}
                    </div>
                    <button class="remove-item" data-id="${item.id}">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            `).join('');

            totalAmount.textContent = `¥${this.total}`;
        } else {
            itemsContainer.innerHTML = '<div class="empty-cart">购物车是空的</div>';
            totalAmount.textContent = '¥0';
        }
    }

    // 更新购物车页面
    updateCartPage() {
        const cartPage = document.querySelector('.cart-page');
        if (!cartPage) return;

        const cartItems = cartPage.querySelector('.cart-items');
        const subtotal = cartPage.querySelector('.summary-subtotal .amount');
        const deliveryFee = cartPage.querySelector('.summary-delivery .amount');
        const total = cartPage.querySelector('.summary-total .amount');

        if (this.items.length > 0) {
            cartItems.innerHTML = this.items.map(item => this.createCartItemHTML(item)).join('');
            
            const fee = this.calculateDeliveryFee();
            subtotal.textContent = `¥${this.total}`;
            deliveryFee.textContent = fee > 0 ? `¥${fee}` : '免运费';
            total.textContent = `¥${this.total + fee}`;
        } else {
            cartItems.innerHTML = '<div class="empty-cart">购物车是空的</div>';
            subtotal.textContent = '¥0';
            deliveryFee.textContent = '¥0';
            total.textContent = '¥0';
        }
    }

    // 创建购物车商品HTML
    createCartItemHTML(item) {
        return `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    ${item.options.color ? `<p class="item-color">颜色：${item.options.color}</p>` : ''}
                </div>
                <div class="quantity-controls">
                    <button class="decrease">-</button>
                    <input type="number" value="${item.quantity}" min="1" max="99">
                    <button class="increase">+</button>
                </div>
                <div class="item-price">¥${item.price}</div>
                <button class="remove-item">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        `;
    }

    // 添加到购物车动画
    showAddToCartAnimation(product) {
        const cartIcon = document.querySelector('.cart-icon');
        if (!cartIcon) return;

        // 创建动画元素
        const animatedElement = document.createElement('div');
        animatedElement.className = 'cart-animation';
        animatedElement.style.backgroundImage = `url(${product.image})`;
        document.body.appendChild(animatedElement);

        // 获取位置信息
        const cartRect = cartIcon.getBoundingClientRect();
        const startX = window.innerWidth / 2;
        const startY = window.innerHeight / 2;
        const endX = cartRect.left + cartRect.width / 2;
        const endY = cartRect.top + cartRect.height / 2;

        // 设置动画
        animatedElement.style.cssText = `
            position: fixed;
            width: 50px;
            height: 50px;
            background-size: cover;
            border-radius: 50%;
            z-index: 1000;
            left: ${startX}px;
            top: ${startY}px;
            transform: translate(-50%, -50%);
            transition: all 0.8s cubic-bezier(0.2, 1, 0.3, 1);
        `;

        // 触发动画
        setTimeout(() => {
            animatedElement.style.cssText += `
                left: ${endX}px;
                top: ${endY}px;
                transform: translate(-50%, -50%) scale(0.1);
                opacity: 0;
            `;
        }, 10);

        // 动画结束后清理
        setTimeout(() => {
            document.body.removeChild(animatedElement);
            cartIcon.classList.add('bounce');
            setTimeout(() => cartIcon.classList.remove('bounce'), 300);
        }, 800);
    }

    // 设置事件监听
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            // 添加到购物车按钮
            if (e.target.closest('.add-to-cart')) {
                const button = e.target.closest('.add-to-cart');
                const productId = button.dataset.productId;
                // 获取产品信息并添加到购物车
                // 实际项目中应该从API获取产品信息
            }

            // 移除商品按钮
            if (e.target.closest('.remove-item')) {
                const button = e.target.closest('.remove-item');
                const itemId = button.dataset.id;
                this.removeItem(itemId);
            }
        });

        // 数量控制按钮
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quantity-controls .decrease, .quantity-controls .increase')) {
                const input = e.target.parentElement.querySelector('input');
                const itemId = e.target.closest('[data-id]').dataset.id;
                const newQuantity = parseInt(input.value) + (e.target.classList.contains('decrease') ? -1 : 1);
                this.updateQuantity(itemId, newQuantity);
            }
        });

        // 数量输入框变化
        document.addEventListener('change', (e) => {
            if (e.target.matches('.quantity-controls input')) {
                const itemId = e.target.closest('[data-id]').dataset.id;
                this.updateQuantity(itemId, parseInt(e.target.value));
            }
        });
    }
}

// 创建购物车实例
const cart = new CartManager();

export default cart; 