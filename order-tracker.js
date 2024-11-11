import utils from './utils.js';
import authManager from './auth.js';

// 订单状态追踪管理
class OrderTracker {
    constructor() {
        this.orderStatuses = {
            ordered: { text: '下单成功', icon: 'shopping_cart' },
            paid: { text: '支付完成', icon: 'payments' },
            processing: { text: '商品出库', icon: 'inventory_2' },
            shipping: { text: '配送中', icon: 'local_shipping' },
            completed: { text: '订单完成', icon: 'check_circle' }
        };

        this.currentStatus = 'processing'; // 当前状态
        this.orderId = this.getOrderIdFromUrl();
        this.init();
    }

    // 初始化
    init() {
        this.setupEventListeners();
        this.initOrderTracking();
        this.initServiceButtons();
        this.initReviewForm();
    }

    // 设置事件监听
    setupEventListeners() {
        // 售后服务按钮点击
        document.querySelectorAll('.service-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const serviceType = e.currentTarget.dataset.service;
                this.handleServiceRequest(serviceType);
            });
        });

        // 评价星级选择
        document.querySelectorAll('.rating-stars .material-icons').forEach((star, index) => {
            star.addEventListener('click', () => this.handleRatingSelect(index + 1));
            star.addEventListener('mouseover', () => this.handleRatingHover(index + 1));
            star.addEventListener('mouseout', () => this.handleRatingHover(0));
        });

        // 图片上传
        document.querySelector('.add-image')?.addEventListener('click', () => {
            this.handleImageUpload();
        });
    }

    // 初始化订单追踪
    async initOrderTracking() {
        try {
            const orderDetails = await this.fetchOrderDetails();
            this.updateOrderStatus(orderDetails);
            this.startStatusPolling();
        } catch (error) {
            console.error('Failed to initialize order tracking:', error);
            notify.error('无法加载订单信息');
        }
    }

    // 获取订单详情
    async fetchOrderDetails() {
        const response = await fetch(`/api/orders/${this.orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }

        return await response.json();
    }

    // 更新订单状态
    updateOrderStatus(orderDetails) {
        const { status, timeline } = orderDetails;
        this.currentStatus = status;

        // 更新时间线
        Object.entries(this.orderStatuses).forEach(([key, value]) => {
            const step = document.querySelector(`[data-step="${key}"]`);
            if (!step) return;

            // 更新状态类
            step.className = 'tracker-step';
            if (timeline[key]) {
                step.classList.add('completed');
                const timeElement = step.querySelector('time');
                if (timeElement) {
                    timeElement.textContent = this.formatTime(timeline[key]);
                    timeElement.setAttribute('datetime', timeline[key]);
                }
            }
            if (key === status) {
                step.classList.add('active');
            }
        });

        // 如果是配送中状态，显示配送信息
        if (status === 'shipping') {
            this.showDeliveryInfo(orderDetails.delivery);
        }
    }

    // 显示配送信息
    showDeliveryInfo(delivery) {
        const deliveryInfo = document.querySelector('.delivery-info');
        if (deliveryInfo && delivery) {
            deliveryInfo.style.display = 'block';
            deliveryInfo.innerHTML = `
                <p>快递单号：${delivery.trackingNumber}</p>
                <p>配送员：${delivery.courierName} (${delivery.courierPhone})</p>
            `;
            this.initDeliveryMap(delivery.location);
        }
    }

    // 初始化配送地图
    initDeliveryMap(location) {
        const mapContainer = document.getElementById('deliveryMap');
        if (!mapContainer || !location) return;

        mapContainer.style.display = 'block';
        // 这里添加地图初始化代码
    }

    // 处理售后服务请求
    async handleServiceRequest(serviceType) {
        try {
            const response = await fetch(`/api/orders/${this.orderId}/service`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ serviceType })
            });

            if (!response.ok) throw new Error('Service request failed');

            notify.success('售后申请已提交');
        } catch (error) {
            console.error('Service request failed:', error);
            notify.error('申请失败，请稍后重试');
        }
    }

    // 处理评价星级选择
    handleRatingSelect(rating) {
        const stars = document.querySelectorAll('.rating-stars .material-icons');
        stars.forEach((star, index) => {
            star.textContent = index < rating ? 'star' : 'star_border';
        });
    }

    // 处理评价星级悬停
    handleRatingHover(rating) {
        const stars = document.querySelectorAll('.rating-stars .material-icons');
        stars.forEach((star, index) => {
            if (rating === 0) {
                star.textContent = star.textContent === 'star' ? 'star' : 'star_border';
            } else {
                star.textContent = index < rating ? 'star' : 'star_border';
            }
        });
    }

    // 处理图片上传
    handleImageUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = (e) => this.processImages(e.target.files);
        input.click();
    }

    // 处理图片处理
    async processImages(files) {
        const maxFiles = 5;
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (files.length > maxFiles) {
            this.showNotification(`最多只能上传${maxFiles}张图片`, 'error');
            return;
        }

        for (const file of files) {
            if (file.size > maxSize) {
                this.showNotification('图片大小不能超过5MB', 'error');
                continue;
            }

            try {
                const compressedImage = await this.compressImage(file);
                this.addImagePreview(compressedImage);
            } catch (error) {
                console.error('Image processing failed:', error);
                this.showNotification('图片处理失败', 'error');
            }
        }
    }

    // 压缩图片
    compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width;
                    let height = img.height;

                    // 设置最大尺寸
                    const maxDim = 1200;
                    if (width > height && width > maxDim) {
                        height = (height * maxDim) / width;
                        width = maxDim;
                    } else if (height > maxDim) {
                        width = (width * maxDim) / height;
                        height = maxDim;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(resolve, 'image/jpeg', 0.8);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 添加图片预览
    addImagePreview(blob) {
        const container = document.querySelector('.review-images');
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image';
        removeBtn.innerHTML = '<span class="material-icons">close</span>';
        removeBtn.onclick = () => preview.remove();

        preview.appendChild(img);
        preview.appendChild(removeBtn);
        container.insertBefore(preview, container.lastElementChild);
    }

    // 从URL获取订单ID
    getOrderIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('orderId');
    }

    // 格式化时间
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

// 创建订单追踪实例
const orderTracker = new OrderTracker();

export default orderTracker; 