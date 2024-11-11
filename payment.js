// 支付流程管理
class PaymentManager {
    constructor() {
        this.paymentMethods = [
            { id: 'alipay', name: '支付宝', icon: 'images/alipay.png' },
            { id: 'wechat', name: '微信支付', icon: 'images/wechat-pay.png' },
            { id: 'unionpay', name: '银联支付', icon: 'images/unionpay.png' }
        ];
        
        this.init();
    }

    init() {
        this.renderPaymentMethods();
        this.setupEventListeners();
    }

    // 渲染支付方式
    renderPaymentMethods() {
        const container = document.querySelector('.payment-methods');
        if (!container) return;

        container.innerHTML = this.paymentMethods.map(method => `
            <label class="payment-method">
                <input type="radio" name="payment" value="${method.id}">
                <div class="method-content">
                    <img src="${method.icon}" alt="${method.name}">
                    <span>${method.name}</span>
                </div>
            </label>
        `).join('');
    }

    // 设置事件监听
    setupEventListeners() {
        // 提交订单按钮
        document.querySelector('.submit-order')?.addEventListener('click', () => {
            this.handleOrderSubmit();
        });

        // 支付方式选择
        document.querySelectorAll('input[name="payment"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.updatePaymentMethod(e.target.value);
            });
        });
    }

    // 处理订单提交
    async handleOrderSubmit() {
        try {
            // 验证表单
            if (!this.validateOrder()) {
                return;
            }

            // 显示加载状态
            this.setLoading(true);

            // 创建订单
            const orderData = this.collectOrderData();
            const order = await this.createOrder(orderData);

            // 发起支付
            await this.initiatePayment(order);

        } catch (error) {
            console.error('Order submission failed:', error);
            showNotification('订单提交失败，请重试', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    // 验证订单信息
    validateOrder() {
        // 验证收货地址
        const selectedAddress = document.querySelector('.address-item.selected');
        if (!selectedAddress) {
            showNotification('请选择收货地址', 'error');
            return false;
        }

        // 验证支付方式
        const selectedPayment = document.querySelector('input[name="payment"]:checked');
        if (!selectedPayment) {
            showNotification('请选择支付方式', 'error');
            return false;
        }

        return true;
    }

    // 收集订单数据
    collectOrderData() {
        const addressId = document.querySelector('.address-item.selected').dataset.id;
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const deliveryMethod = document.querySelector('input[name="delivery"]:checked').value;
        const couponId = document.querySelector('#couponSelect').value;
        const note = document.querySelector('textarea[name="note"]').value;

        return {
            addressId,
            paymentMethod,
            deliveryMethod,
            couponId,
            note,
            items: store.state.cart.items
        };
    }

    // 创建订单
    async createOrder(orderData) {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error('Failed to create order');
        }

        return await response.json();
    }

    // 发起支付
    async initiatePayment(order) {
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        
        // 根据支付方式调用不同的支付接口
        switch (paymentMethod) {
            case 'alipay':
                await this.handleAlipayPayment(order);
                break;
            case 'wechat':
                await this.handleWechatPayment(order);
                break;
            case 'unionpay':
                await this.handleUnionPayment(order);
                break;
        }
    }

    // 处理支付宝支付
    async handleAlipayPayment(order) {
        const response = await fetch('/api/payments/alipay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({ orderId: order.id })
        });

        if (!response.ok) {
            throw new Error('Failed to initiate Alipay payment');
        }

        const { paymentUrl } = await response.json();
        window.location.href = paymentUrl;
    }

    // 处理微信支付
    async handleWechatPayment(order) {
        const response = await fetch('/api/payments/wechat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({ orderId: order.id })
        });

        if (!response.ok) {
            throw new Error('Failed to initiate WeChat payment');
        }

        const { qrcode } = await response.json();
        this.showWechatPaymentQR(qrcode);
    }

    // 显示微信支付二维码
    showWechatPaymentQR(qrcode) {
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="payment-qr">
                <h3>微信扫码支付</h3>
                <img src="${qrcode}" alt="微信支付二维码">
                <p>请使用微信扫描二维码完成支付</p>
                <div class="payment-status">
                    <div class="loading-spinner"></div>
                    <span>等待支付...</span>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.startPaymentStatusCheck();
    }

    // 检查支付状态
    async startPaymentStatusCheck() {
        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/payments/${orderId}/status`);
                const { status } = await response.json();

                if (status === 'paid') {
                    window.location.href = '/order-success.html';
                } else if (status === 'failed') {
                    showNotification('支付失败，请重试', 'error');
                    this.closePaymentModal();
                } else {
                    setTimeout(checkStatus, 2000);
                }
            } catch (error) {
                console.error('Payment status check failed:', error);
            }
        };

        checkStatus();
    }

    // 设置加载状态
    setLoading(isLoading) {
        const submitBtn = document.querySelector('.submit-order');
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.innerHTML = isLoading ? 
                '<span class="loading-spinner"></span>处理中...' : 
                '提交订单';
        }
    }

    // 更新支付方式
    updatePaymentMethod(methodId) {
        document.querySelectorAll('.payment-method').forEach(method => {
            method.classList.toggle('selected', 
                method.querySelector('input').value === methodId);
        });
    }
}

// 创建支付管理实例
const paymentManager = new PaymentManager();

export default paymentManager; 