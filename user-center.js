// 用户中心管理
class UserCenterManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupNavigation();
        this.loadUserInfo();
        this.setupEventListeners();
    }

    // 检查认证状态
    checkAuth() {
        if (!authManager.isAuthenticated()) {
            window.location.href = '/login.html?redirect=/user-center.html';
            return;
        }
    }

    // 设置导航
    setupNavigation() {
        const navItems = document.querySelectorAll('.user-nav .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = item.getAttribute('href').substring(1);
                this.switchTab(tabId);
            });
        });

        // 从 URL 获取当前标签
        const hash = window.location.hash.substring(1);
        if (hash) {
            this.switchTab(hash);
        }
    }

    // 切换标签
    switchTab(tabId) {
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${tabId}`) {
                item.classList.add('active');
            }
        });

        // 更新内容显示
        document.querySelectorAll('.user-content > section').forEach(section => {
            section.style.display = 'none';
        });
        const currentSection = document.getElementById(tabId);
        if (currentSection) {
            currentSection.style.display = 'block';
            this.loadTabContent(tabId);
        }

        // 更新 URL
        window.location.hash = tabId;
        this.currentTab = tabId;
    }

    // 加载标签内容
    async loadTabContent(tabId) {
        switch (tabId) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'orders':
                await this.loadOrders();
                break;
            case 'favorites':
                await this.loadFavorites();
                break;
            case 'coupons':
                await this.loadCoupons();
                break;
            case 'address':
                await this.loadAddresses();
                break;
            case 'settings':
                await this.loadSettings();
                break;
        }
    }

    // 加载用户信息
    async loadUserInfo() {
        try {
            const user = await authManager.getUser();
            this.updateUserProfile(user);
        } catch (error) {
            console.error('Failed to load user info:', error);
            this.showNotification('无法加载用户信息', 'error');
        }
    }

    // 更新用户资料显示
    updateUserProfile(user) {
        const avatar = document.querySelector('.user-avatar');
        const username = document.querySelector('.user-name');
        const levelBadge = document.querySelector('.level-badge');
        const points = document.querySelector('.points');

        if (avatar) avatar.src = user.avatar || 'images/default-avatar.jpg';
        if (username) username.textContent = user.username;
        if (levelBadge) levelBadge.textContent = user.level;
        if (points) points.textContent = `积分: ${user.points}`;
    }

    // 加载控制面板
    async loadDashboard() {
        try {
            const response = await fetch('/api/user/dashboard', {
                headers: {
                    'Authorization': `Bearer ${authManager.getToken()}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load dashboard');
            
            const data = await response.json();
            this.updateDashboard(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.showNotification('无法加载控制面板信息', 'error');
        }
    }

    // 更新控制面板
    updateDashboard(data) {
        // 更新统计数据
        document.querySelectorAll('.stat-card').forEach(card => {
            const type = card.dataset.type;
            const count = card.querySelector('p');
            if (count) count.textContent = data.stats[type] || 0;
        });

        // 更新最近动态
        const timeline = document.querySelector('.activity-timeline');
        if (timeline) {
            timeline.innerHTML = data.activities.map(activity => `
                <div class="activity-item">
                    <span class="activity-icon material-icons">${activity.icon}</span>
                    <div class="activity-content">
                        <h4>${activity.title}</h4>
                        <p>${activity.description}</p>
                        <time>${utils.formatDateTime(activity.time)}</time>
                    </div>
                </div>
            `).join('');
        }

        // 更新推荐商品
        const recommendations = document.querySelector('.recommendations .product-grid');
        if (recommendations) {
            recommendations.innerHTML = data.recommendations.map(product => `
                <div class="product-card">
                    <!-- 产品卡片内容 -->
                </div>
            `).join('');
        }
    }

    // 加载订单列表
    async loadOrders() {
        try {
            const response = await fetch('/api/user/orders', {
                headers: {
                    'Authorization': `Bearer ${authManager.getToken()}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load orders');
            
            const orders = await response.json();
            this.renderOrders(orders);
        } catch (error) {
            console.error('Failed to load orders:', error);
            this.showNotification('无法加载订单信息', 'error');
        }
    }

    // 渲染订单列表
    renderOrders(orders) {
        const orderList = document.querySelector('.order-list');
        if (!orderList) return;

        if (orders.length === 0) {
            orderList.innerHTML = `
                <div class="empty-state">
                    <img src="images/empty-orders.svg" alt="暂无订单">
                    <h3>暂无订单</h3>
                    <p>去挑选心仪的商品吧</p>
                    <a href="categories.html" class="btn btn-primary">去购物</a>
                </div>
            `;
            return;
        }

        orderList.innerHTML = orders.map(order => `
            <div class="order-item">
                <!-- 订单内容 -->
            </div>
        `).join('');
    }

    // 加载收藏夹
    async loadFavorites() {
        // 实现收藏夹加载逻辑
    }

    // 加载优惠券
    async loadCoupons() {
        // 实现优惠券加载逻辑
    }

    // 加载地址管理
    async loadAddresses() {
        // 实现地址管理加载逻辑
    }

    // 加载账号设置
    async loadSettings() {
        // 实现账号设置加载逻辑
    }

    // 设置事件监听
    setupEventListeners() {
        // 头像上传
        const editAvatar = document.querySelector('.edit-avatar');
        editAvatar?.addEventListener('click', () => {
            this.handleAvatarUpload();
        });

        // 会员升级
        const upgradeBtn = document.querySelector('.upgrade-btn');
        upgradeBtn?.addEventListener('click', () => {
            this.handleUpgrade();
        });
    }

    // 处理头像上传
    handleAvatarUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const compressedImage = await utils.image.compress(file);
                await this.uploadAvatar(compressedImage);
            } catch (error) {
                console.error('Avatar upload failed:', error);
                this.showNotification('头像上传失败', 'error');
            }
        };
        input.click();
    }

    // 上传头像
    async uploadAvatar(file) {
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch('/api/user/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authManager.getToken()}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Avatar upload failed');

            const data = await response.json();
            this.updateUserProfile({ ...authManager.getUser(), avatar: data.avatar });
            this.showNotification('头像上传成功', 'success');
        } catch (error) {
            throw error;
        }
    }

    // 处理会员升级
    handleUpgrade() {
        // 实现会员升级逻辑
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

// 创建用户中心管理实例
const userCenterManager = new UserCenterManager();

export default userCenterManager; 