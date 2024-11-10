// 状态管理
class Store {
    constructor() {
        this.state = {
            user: null,
            cart: {
                items: [],
                total: 0
            },
            products: {
                list: [],
                categories: [],
                loading: false,
                error: null
            },
            ui: {
                searchOpen: false,
                cartOpen: false,
                mobileMenuOpen: false,
                notifications: []
            }
        };
        
        this.listeners = new Set();
        this.init();
    }

    // 初始化
    init() {
        // 从本地存储加载状态
        const savedState = localStorage.getItem('store');
        if (savedState) {
            this.state = JSON.parse(savedState);
        }

        // 监听存储变化（多标签页同步）
        window.addEventListener('storage', (e) => {
            if (e.key === 'store') {
                this.state = JSON.parse(e.newValue);
                this.notify();
            }
        });
    }

    // 订阅状态变化
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // 通知所有监听器
    notify() {
        this.listeners.forEach(listener => listener(this.state));
        localStorage.setItem('store', JSON.stringify(this.state));
    }

    // 更新状态
    setState(updater) {
        const newState = typeof updater === 'function' 
            ? updater(this.state)
            : { ...this.state, ...updater };
            
        this.state = newState;
        this.notify();
    }

    // 购物车操作
    addToCart(product, quantity = 1, options = {}) {
        this.setState(state => {
            const existingItem = state.cart.items.find(item => 
                item.id === product.id && 
                JSON.stringify(item.options) === JSON.stringify(options)
            );

            let newItems;
            if (existingItem) {
                newItems = state.cart.items.map(item =>
                    item.id === product.id && 
                    JSON.stringify(item.options) === JSON.stringify(options)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                newItems = [...state.cart.items, {
                    ...product,
                    quantity,
                    options
                }];
            }

            const total = newItems.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0
            );

            return {
                ...state,
                cart: {
                    items: newItems,
                    total
                }
            };
        });
    }

    removeFromCart(itemId) {
        this.setState(state => ({
            ...state,
            cart: {
                items: state.cart.items.filter(item => item.id !== itemId),
                total: state.cart.items
                    .filter(item => item.id !== itemId)
                    .reduce((sum, item) => sum + (item.price * item.quantity), 0)
            }
        }));
    }

    updateCartQuantity(itemId, quantity) {
        this.setState(state => ({
            ...state,
            cart: {
                items: state.cart.items.map(item =>
                    item.id === itemId
                        ? { ...item, quantity: Math.max(1, Math.min(quantity, 99)) }
                        : item
                ),
                total: state.cart.items
                    .map(item => item.id === itemId 
                        ? { ...item, quantity: Math.max(1, Math.min(quantity, 99)) }
                        : item
                    )
                    .reduce((sum, item) => sum + (item.price * item.quantity), 0)
            }
        }));
    }

    clearCart() {
        this.setState(state => ({
            ...state,
            cart: {
                items: [],
                total: 0
            }
        }));
    }

    // 产品操作
    async fetchProducts(filters = {}) {
        this.setState(state => ({
            ...state,
            products: {
                ...state.products,
                loading: true,
                error: null
            }
        }));

        try {
            const products = await api.products.getList(filters);
            this.setState(state => ({
                ...state,
                products: {
                    ...state.products,
                    list: products,
                    loading: false
                }
            }));
        } catch (error) {
            this.setState(state => ({
                ...state,
                products: {
                    ...state.products,
                    error: error.message,
                    loading: false
                }
            }));
        }
    }

    // UI 操作
    toggleSearch(open) {
        this.setState(state => ({
            ...state,
            ui: {
                ...state.ui,
                searchOpen: typeof open === 'boolean' ? open : !state.ui.searchOpen
            }
        }));
    }

    toggleCart(open) {
        this.setState(state => ({
            ...state,
            ui: {
                ...state.ui,
                cartOpen: typeof open === 'boolean' ? open : !state.ui.cartOpen
            }
        }));
    }

    toggleMobileMenu(open) {
        this.setState(state => ({
            ...state,
            ui: {
                ...state.ui,
                mobileMenuOpen: typeof open === 'boolean' ? open : !state.ui.mobileMenuOpen
            }
        }));
    }

    addNotification(message, type = 'info', duration = 3000) {
        const id = Date.now();
        this.setState(state => ({
            ...state,
            ui: {
                ...state.ui,
                notifications: [
                    ...state.ui.notifications,
                    { id, message, type }
                ]
            }
        }));

        setTimeout(() => {
            this.setState(state => ({
                ...state,
                ui: {
                    ...state.ui,
                    notifications: state.ui.notifications.filter(n => n.id !== id)
                }
            }));
        }, duration);
    }

    // 用户操作
    setUser(user) {
        this.setState(state => ({
            ...state,
            user
        }));
    }

    clearUser() {
        this.setState(state => ({
            ...state,
            user: null
        }));
    }
}

// 创建全局状态实例
const store = new Store();

export default store; 