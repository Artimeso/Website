// 用户认证管理
import api from './api.js';
import { storage } from './utils.js';

const auth = {
    // 用户状态
    user: null,
    isAuthenticated: false,
    token: null,

    // 初始化认证状态
    init() {
        this.token = storage.get('auth_token');
        if (this.token) {
            this.loadUserProfile();
        }
        this.setupAuthListeners();
    },

    // 登录
    async login(credentials) {
        try {
            const response = await api.auth.login(credentials);
            this.token = response.token;
            storage.set('auth_token', this.token);
            await this.loadUserProfile();
            this.updateAuthUI();
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },

    // 注册
    async register(userData) {
        try {
            const response = await api.auth.register(userData);
            this.token = response.token;
            storage.set('auth_token', this.token);
            await this.loadUserProfile();
            this.updateAuthUI();
            return true;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    },

    // 登出
    async logout() {
        try {
            await api.auth.logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            this.token = null;
            this.user = null;
            this.isAuthenticated = false;
            storage.remove('auth_token');
            this.updateAuthUI();
            window.location.href = '/login.html';
        }
    },

    // 加载用户信息
    async loadUserProfile() {
        try {
            const profile = await api.auth.getProfile();
            this.user = profile;
            this.isAuthenticated = true;
            this.updateAuthUI();
        } catch (error) {
            console.error('Failed to load user profile:', error);
            this.handleAuthError(error);
        }
    },

    // 更新用户信息
    async updateProfile(profileData) {
        try {
            const updatedProfile = await api.auth.updateProfile(profileData);
            this.user = updatedProfile;
            this.updateAuthUI();
            return true;
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        }
    },

    // 检查认证状态
    checkAuth() {
        if (!this.isAuthenticated) {
            const currentPath = window.location.pathname;
            const publicPaths = ['/login.html', '/register.html', '/index.html', '/'];
            
            if (!publicPaths.includes(currentPath)) {
                window.location.href = '/login.html?redirect=' + encodeURIComponent(currentPath);
            }
        }
    },

    // 设置认证监听器
    setupAuthListeners() {
        // 监听存储变化（多标签页同步）
        window.addEventListener('storage', (e) => {
            if (e.key === 'auth_token') {
                if (!e.newValue) {
                    this.handleLogout();
                } else if (e.newValue !== this.token) {
                    this.token = e.newValue;
                    this.loadUserProfile();
                }
            }
        });

        // 监听 API 请求错误
        document.addEventListener('unauthorized', () => {
            this.handleAuthError();
        });
    },

    // 处理认证错误
    handleAuthError(error) {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        storage.remove('auth_token');
        this.updateAuthUI();

        if (error?.response?.status === 401) {
            const currentPath = window.location.pathname;
            window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
        }
    },

    // 更新 UI 显示
    updateAuthUI() {
        const userMenu = document.querySelector('.user-menu');
        if (!userMenu) return;

        if (this.isAuthenticated) {
            userMenu.innerHTML = `
                <div class="user-dropdown">
                    <button class="user-dropdown-btn">
                        <img src="${this.user.avatar || 'images/default-avatar.jpg'}" alt="用户头像">
                        <span>${this.user.name}</span>
                    </button>
                    <div class="user-dropdown-content">
                        <a href="/user-center.html">个人中心</a>
                        <a href="/orders.html">我的订单</a>
                        <a href="#" class="logout-btn">退出登录</a>
                    </div>
                </div>
            `;

            // 添加退出登录事件
            userMenu.querySelector('.logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        } else {
            userMenu.innerHTML = `
                <a href="/login.html">
                    <span class="material-icons">person</span>
                </a>
            `;
        }
    },

    // 获取重定向 URL
    getRedirectUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('redirect') || '/';
    },

    // 处理登出
    handleLogout() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        storage.remove('auth_token');
        this.updateAuthUI();
    }
};

// 导出认证模块
export default auth; 