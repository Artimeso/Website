// 通知管理
class NotificationManager {
    constructor() {
        this.container = this.createContainer();
        this.queue = [];
        this.isProcessing = false;
    }

    // 创建通知容器
    createContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    // 显示通知
    show(message, type = 'info', duration = 3000) {
        this.queue.push({ message, type, duration });
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    // 处理通知队列
    async processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const { message, type, duration } = this.queue.shift();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // 添加图标
        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.textContent = this.getIconForType(type);
        notification.appendChild(icon);

        // 添加消息
        const messageText = document.createElement('span');
        messageText.className = 'notification-message';
        messageText.textContent = message;
        notification.appendChild(messageText);

        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '<span class="material-icons">close</span>';
        closeBtn.onclick = () => this.hide(notification);
        notification.appendChild(closeBtn);

        this.container.appendChild(notification);

        // 添加动画类
        await this.nextFrame();
        notification.classList.add('show');

        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                this.hide(notification);
            }, duration);
        }

        // 处理下一个通知
        setTimeout(() => {
            this.processQueue();
        }, 300);
    }

    // 隐藏通知
    hide(notification) {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => {
            notification.remove();
        });
    }

    // 获取下一帧
    nextFrame() {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });
    }

    // 获取图标
    getIconForType(type) {
        switch (type) {
            case 'success':
                return 'check_circle';
            case 'error':
                return 'error';
            case 'warning':
                return 'warning';
            default:
                return 'info';
        }
    }

    // 成功通知
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    // 错误通知
    error(message, duration = 3000) {
        this.show(message, 'error', duration);
    }

    // 警告通知
    warning(message, duration = 3000) {
        this.show(message, 'warning', duration);
    }

    // 信息通知
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
}

// 创建通知管理实例
const notificationManager = new NotificationManager();

export default notificationManager; 