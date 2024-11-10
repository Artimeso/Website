// 购物车数据持久化和同步
class CartStorage {
    constructor() {
        this.storageKey = 'shopping_cart';
        this.version = '1.0';
        this.syncInterval = 5000; // 同步间隔（毫秒）
        this.lastSync = Date.now();
        this.setupSync();
    }

    // 初始化同步
    setupSync() {
        // 监听存储变化（多标签页同步）
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.handleStorageChange(e);
            }
        });

        // 定期同步
        setInterval(() => this.syncWithServer(), this.syncInterval);
    }

    // 保存购物车数据
    save(cartData) {
        try {
            const data = {
                version: this.version,
                timestamp: Date.now(),
                data: cartData
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            this.lastSync = Date.now();
        } catch (error) {
            console.error('Failed to save cart:', error);
            this.handleStorageError(error);
        }
    }

    // 加载购物车数据
    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return null;

            const data = JSON.parse(stored);
            
            // 版本检查
            if (data.version !== this.version) {
                console.warn('Cart data version mismatch, migrating...');
                return this.migrateData(data);
            }

            return data.data;
        } catch (error) {
            console.error('Failed to load cart:', error);
            this.handleStorageError(error);
            return null;
        }
    }

    // 处理存储变化
    handleStorageChange(event) {
        if (!event.newValue) {
            // 购物车被清空
            document.dispatchEvent(new CustomEvent('cartCleared'));
            return;
        }

        try {
            const newData = JSON.parse(event.newValue);
            if (newData.timestamp > this.lastSync) {
                // 更新本地购物车
                document.dispatchEvent(new CustomEvent('cartUpdated', {
                    detail: newData.data
                }));
                this.lastSync = newData.timestamp;
            }
        } catch (error) {
            console.error('Failed to process storage change:', error);
        }
    }

    // 与服务器同步
    async syncWithServer() {
        if (!this.shouldSync()) return;

        try {
            const localCart = this.load();
            if (!localCart) return;

            // 发送到服务器
            const response = await fetch('/api/cart/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify(localCart)
            });

            if (!response.ok) {
                throw new Error('Failed to sync with server');
            }

            // 获取服务器端购物车数据
            const serverCart = await response.json();
            
            // 合并本地和服务器数据
            const mergedCart = this.mergeCartData(localCart, serverCart);
            
            // 保存合并后的数据
            this.save(mergedCart);
            
            // 触发更新事件
            document.dispatchEvent(new CustomEvent('cartSynced', {
                detail: mergedCart
            }));

        } catch (error) {
            console.error('Cart sync failed:', error);
            this.handleSyncError(error);
        }
    }

    // 检查是否需要同步
    shouldSync() {
        // 检查是否登录
        const authToken = localStorage.getItem('auth_token');
        if (!authToken) return false;

        // 检查是否有网络连接
        if (!navigator.onLine) return false;

        // 检查距离上次同步的时间
        return Date.now() - this.lastSync >= this.syncInterval;
    }

    // 合并购物车数据
    mergeCartData(localCart, serverCart) {
        const merged = { ...serverCart };
        
        // 合并商品
        localCart.items.forEach(localItem => {
            const serverItem = merged.items.find(item => 
                item.id === localItem.id && 
                JSON.stringify(item.options) === JSON.stringify(localItem.options)
            );

            if (serverItem) {
                // 使用最新的数量
                serverItem.quantity = Math.max(serverItem.quantity, localItem.quantity);
            } else {
                // 添加本地独有的商品
                merged.items.push(localItem);
            }
        });

        // 重新计算总价
        merged.total = merged.items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
        );

        return merged;
    }

    // 数据迁移
    migrateData(oldData) {
        // 处理不同版本的数据格式
        try {
            const migrated = {
                items: oldData.data.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    options: item.options || {}
                }))
            };

            // 计算总价
            migrated.total = migrated.items.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0
            );

            return migrated;
        } catch (error) {
            console.error('Data migration failed:', error);
            return { items: [], total: 0 };
        }
    }

    // 处理存储错误
    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            // 存储空间不足
            this.clearOldData();
        }
        // 触发错误事件
        document.dispatchEvent(new CustomEvent('cartError', {
            detail: { error }
        }));
    }

    // 处理同步错误
    handleSyncError(error) {
        // 触发同步错误事件
        document.dispatchEvent(new CustomEvent('cartSyncError', {
            detail: { error }
        }));
    }

    // 清理旧数据
    clearOldData() {
        try {
            // 清理超过30天的数据
            const keys = Object.keys(localStorage);
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

            keys.forEach(key => {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp && data.timestamp < thirtyDaysAgo) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // 忽略无法解析的数据
                }
            });
        } catch (error) {
            console.error('Failed to clear old data:', error);
        }
    }
}

// 创建购物车存储实例
const cartStorage = new CartStorage();

export default cartStorage; 