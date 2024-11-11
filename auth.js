import utils from './utils.js';

// 认证管理
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.user = null;
    }

    // 检查认证状态
    async checkAuthStatus() {
        if (!this.token) {
            this.updateUIForGuest();
            return;
        }

        try {
            const response = await fetch('/api/auth/status', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Auth check failed');
            }

            const data = await response.json();
            this.user = data.user;
            this.updateUIForUser();
        } catch (error) {
            console.error('Auth check failed:', error);
            this.logout();
        }
    }

    // 更新游客UI
    updateUIForGuest() {
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.innerHTML = `
                <a href="login.html">
                    <span class="material-icons">person</span>
                </a>
            `;
        }

        // 隐藏需要登录的功能
        document.querySelectorAll('.requires-auth').forEach(element => {
            element.style.display = 'none';
        });
    }

    // 更新登录用户UI
    updateUIForUser() {
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.innerHTML = `
                <div class="dropdown">
                    <button class="dropdown-toggle">
                        <img src="${this.user.avatar || 'images/default-avatar.jpg'}" 
                             alt="${this.user.username}"
                             class="user-avatar">
                    </button>
                    <div class="dropdown-menu">
                        <a href="user-center.html">
                            <span class="material-icons">person</span>
                            个人中心
                        </a>
                        <a href="orders.html">
                            <span class="material-icons">shopping_bag</span>
                            我的订单
                        </a>
                        <a href="favorites.html">
                            <span class="material-icons">favorite</span>
                            我的收藏
                        </a>
                        <a href="settings.html">
                            <span class="material-icons">settings</span>
                            账号设置
                        </a>
                        <button class="logout-btn" onclick="authManager.logout()">
                            <span class="material-icons">logout</span>
                            退出登录
                        </button>
                    </div>
                </div>
            `;
        }

        // 显示需要登录的功能
        document.querySelectorAll('.requires-auth').forEach(element => {
            element.style.display = '';
        });
    }

    // 登录
    async login(credentials) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            this.token = data.token;
            this.user = data.user;

            localStorage.setItem('auth_token', this.token);
            this.updateUIForUser();

            return true;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    // 注册
    async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            const data = await response.json();
            this.token = data.token;
            this.user = data.user;

            localStorage.setItem('auth_token', this.token);
            this.updateUIForUser();

            return true;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    // 登出
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        this.updateUIForGuest();

        // 如果在需要认证的页面，重定向到登录页
        const requiresAuth = document.body.classList.contains('requires-auth');
        if (requiresAuth) {
            const currentPath = encodeURIComponent(window.location.pathname);
            window.location.href = `/login.html?redirect=${currentPath}`;
        }
    }

    // 检查是否已登录
    isAuthenticated() {
        return !!this.token;
    }

    // 获取用户信息
    getUser() {
        return this.user;
    }

    // 获取认证令牌
    getToken() {
        return this.token;
    }

    // 刷新用户信息
    async refreshUserInfo() {
        if (!this.token) return;

        try {
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to refresh user info');
            }

            const data = await response.json();
            this.user = data.user;
            this.updateUIForUser();
        } catch (error) {
            console.error('Failed to refresh user info:', error);
        }
    }
}

// 创建认证管理实例
const authManager = new AuthManager();

export default authManager; 