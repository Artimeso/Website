// 登录页面管理
class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.init();
    }

    init() {
        this.setupFormValidation();
        this.setupPasswordToggle();
        this.setupSocialLogin();
        this.setupRememberMe();
    }

    // 设置表单验证
    setupFormValidation() {
        if (!this.form) return;

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateForm()) return;

            await this.handleLogin();
        });

        // 实时验证
        const inputs = this.form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                const errorElement = this.form.querySelector(`[data-error="${input.name}"]`);
                if (errorElement) {
                    errorElement.textContent = '';
                }
            });
        });
    }

    // 验证表单
    validateForm() {
        let isValid = true;
        const username = this.form.querySelector('#username');
        const password = this.form.querySelector('#password');

        if (!this.validateField(username)) isValid = false;
        if (!this.validateField(password)) isValid = false;

        return isValid;
    }

    // 验证单个字段
    validateField(input) {
        const errorElement = this.form.querySelector(`[data-error="${input.name}"]`);
        let isValid = true;
        let errorMessage = '';

        if (!input.value.trim()) {
            isValid = false;
            errorMessage = '此字段不能为空';
        } else if (input.name === 'username') {
            // 用户名验证
            if (input.value.length < 3) {
                isValid = false;
                errorMessage = '用户名至少需要3个字符';
            }
        } else if (input.name === 'password') {
            // 密码验证
            if (input.value.length < 6) {
                isValid = false;
                errorMessage = '密码至少需要6个字符';
            }
        }

        if (errorElement) {
            errorElement.textContent = errorMessage;
        }

        return isValid;
    }

    // 处理登录
    async handleLogin() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span>登录中...';

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '登录失败');
            }

            // 保存认证信息
            localStorage.setItem('auth_token', result.token);
            if (this.form.querySelector('#remember').checked) {
                localStorage.setItem('remember_user', data.username);
            } else {
                localStorage.removeItem('remember_user');
            }

            // 登录成功后重定向
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/';
            window.location.href = redirectUrl;

        } catch (error) {
            console.error('Login failed:', error);
            this.showNotification(error.message || '登录失败，请稍后重试', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '登录';
        }
    }

    // 设置密码显示切换
    setupPasswordToggle() {
        const toggleBtns = document.querySelectorAll('.toggle-password');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.previousElementSibling;
                const icon = btn.querySelector('.material-icons');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.textContent = 'visibility_off';
                } else {
                    input.type = 'password';
                    icon.textContent = 'visibility';
                }
            });
        });
    }

    // 设置社交账号登录
    setupSocialLogin() {
        const socialButtons = document.querySelectorAll('.social-btn');
        socialButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = btn.dataset.platform;
                this.handleSocialLogin(platform);
            });
        });
    }

    // 处理社交账号登录
    async handleSocialLogin(platform) {
        try {
            // 根据平台打开相应的登录窗口
            switch (platform) {
                case 'wechat':
                    this.openWechatLogin();
                    break;
                case 'facebook':
                    window.location.href = '/api/auth/facebook';
                    break;
                default:
                    throw new Error('不支持的登录方式');
            }
        } catch (error) {
            console.error('Social login failed:', error);
            this.showNotification(error.message || '登录失败，请稍后重试', 'error');
        }
    }

    // 打开微信登录
    openWechatLogin() {
        const width = 600;
        const height = 400;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        const loginWindow = window.open(
            '/api/auth/wechat',
            'wechatLogin',
            `width=${width},height=${height},top=${top},left=${left}`
        );

        // 监听登录结果
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'wechatLoginSuccess') {
                loginWindow.close();
                localStorage.setItem('auth_token', event.data.token);
                window.location.reload();
            }
        });
    }

    // 设置记住我功能
    setupRememberMe() {
        const rememberedUser = localStorage.getItem('remember_user');
        if (rememberedUser) {
            const usernameInput = this.form.querySelector('#username');
            const rememberCheckbox = this.form.querySelector('#remember');
            
            if (usernameInput && rememberCheckbox) {
                usernameInput.value = rememberedUser;
                rememberCheckbox.checked = true;
            }
        }
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

// 创建登录管理实例
const loginManager = new LoginManager();

export default loginManager; 