// API 基础配置
const API_BASE_URL = 'https://api.futurefurniture.com/v1';

// API 请求工具
const api = {
    // 通用请求方法
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('auth_token');
        const defaultHeaders = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        const config = {
            headers: { ...defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            // 处理 401 未授权错误
            if (response.status === 401) {
                localStorage.removeItem('auth_token');
                window.location.href = '/login.html';
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '请求失败');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // 用户相关 API
    auth: {
        async login(credentials) {
            const data = await api.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            localStorage.setItem('auth_token', data.token);
            return data;
        },

        async register(userData) {
            return await api.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        async logout() {
            localStorage.removeItem('auth_token');
            return await api.request('/auth/logout', {
                method: 'POST'
            });
        },

        async getProfile() {
            return await api.request('/auth/profile');
        },

        async updateProfile(profileData) {
            return await api.request('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
        }
    },

    // 产品相关 API
    products: {
        async getList(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return await api.request(`/products?${queryString}`);
        },

        async getById(id) {
            return await api.request(`/products/${id}`);
        },

        async getCategories() {
            return await api.request('/products/categories');
        }
    },

    // 购物车相关 API
    cart: {
        async getItems() {
            return await api.request('/cart');
        },

        async addItem(productId, quantity = 1, options = {}) {
            return await api.request('/cart/items', {
                method: 'POST',
                body: JSON.stringify({ productId, quantity, ...options })
            });
        },

        async updateItem(itemId, quantity) {
            return await api.request(`/cart/items/${itemId}`, {
                method: 'PUT',
                body: JSON.stringify({ quantity })
            });
        },

        async removeItem(itemId) {
            return await api.request(`/cart/items/${itemId}`, {
                method: 'DELETE'
            });
        },

        async clear() {
            return await api.request('/cart/clear', {
                method: 'POST'
            });
        }
    },

    // 订单相关 API
    orders: {
        async create(orderData) {
            return await api.request('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
        },

        async getList(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return await api.request(`/orders?${queryString}`);
        },

        async getById(id) {
            return await api.request(`/orders/${id}`);
        },

        async cancel(id) {
            return await api.request(`/orders/${id}/cancel`, {
                method: 'POST'
            });
        }
    },

    // 地址相关 API
    addresses: {
        async getList() {
            return await api.request('/addresses');
        },

        async create(addressData) {
            return await api.request('/addresses', {
                method: 'POST',
                body: JSON.stringify(addressData)
            });
        },

        async update(id, addressData) {
            return await api.request(`/addresses/${id}`, {
                method: 'PUT',
                body: JSON.stringify(addressData)
            });
        },

        async delete(id) {
            return await api.request(`/addresses/${id}`, {
                method: 'DELETE'
            });
        },

        async setDefault(id) {
            return await api.request(`/addresses/${id}/default`, {
                method: 'POST'
            });
        }
    },

    // 评价相关 API
    reviews: {
        async getList(productId, params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return await api.request(`/products/${productId}/reviews?${queryString}`);
        },

        async create(productId, reviewData) {
            return await api.request(`/products/${productId}/reviews`, {
                method: 'POST',
                body: JSON.stringify(reviewData)
            });
        }
    },

    // 收藏相关 API
    favorites: {
        async getList() {
            return await api.request('/favorites');
        },

        async add(productId) {
            return await api.request('/favorites', {
                method: 'POST',
                body: JSON.stringify({ productId })
            });
        },

        async remove(productId) {
            return await api.request(`/favorites/${productId}`, {
                method: 'DELETE'
            });
        }
    },

    // 订阅相关 API
    newsletter: {
        async subscribe(email) {
            return await api.request('/newsletter/subscribe', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
        },

        async unsubscribe(email) {
            return await api.request('/newsletter/unsubscribe', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
        }
    }
};

export default api; 