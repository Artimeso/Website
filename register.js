import utils from './utils.js';
import authManager from './auth.js';

// 注册页面管理
class RegisterManager {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.init();
    }

    init() {
        this.setupFormValidation();
        this.setupPasswordToggle();
        this.setupPasswordStrength();
        this.setupSocialRegister();
    }

    // 设置表单验证
    setupFormValidation() {
        if (!this.form) return;

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateForm()) return;

            await this.handleRegister();
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
                
                // 密码强度检查
                if (input.name === 'password') {
                    this.updatePasswordStrength(input.value);
                }
                
                // 确认密码验证
                if (input.name === 'confirmPassword') {
                    this.validatePasswordMatch();
                }
            });
        });
    }

    // 验证表单
    validateForm() {
        let isValid = true;
        const requiredFields = ['username', 'phone', 'email', 'password', 'confirmPassword'];
        
        requiredFields.forEach(field => {
            const input = this.form.querySelector(`#${field}`);
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // 验证密码匹配
        if (!this.validatePasswordMatch()) {
            isValid = false;
        }

        // 验证服务条款
        const agreeTerms = this.form.querySelector('#agreeTerms');
        if (!agreeTerms.checked) {
            const errorElement = this.form.querySelector('[data-error="agreeTerms"]');
            errorElement.textContent = '请同意服务条款和隐私政策';
            isValid = false;
        }

        return isValid;
    }

    // 验证单个字段
    validateField(input) {
        if (!input) return true;

        const errorElement = this.form.querySelector(`[data-error="${input.name}"]`);
        let isValid = true;
        let errorMessage = '';

        const value = input.value.trim();

        if (!value) {
            isValid = false;
            errorMessage = '此字段不能为空';
        } else {
            switch (input.name) {
                case 'username':
                    if (value.length < 3) {
                        isValid = false;
                        errorMessage = '用户名至少需要3个字符';
                    } else if (!/^[a-zA-Z0-9_-]{3,16}$/.test(value)) {
                        isValid = false;
                        errorMessage = '用户名只能包含字母、数字、下划线和连字符';
                    }
                    break;

                case 'phone':
                    if (!/^1[3-9]\d{9}$/.test(value)) {
                        isValid = false;
                        errorMessage = '请输入有效的手机号码';
                    }
                    break;

                case 'email':
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        isValid = false;
                        errorMessage = '请输入有效的邮箱地址';
                    }
                    break;

                case 'password':
                    if (value.length < 8) {
                        isValid = false;
                        errorMessage = '密码至少需要8个字符';
                    } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value)) {
                        isValid = false;
                        errorMessage = '密码必须包含字母和数字';
                    }
                    break;
            }
        }

        if (errorElement) {
            errorElement.textContent = errorMessage;
        }

        return isValid;
    }

    // 验证密码匹配
    validatePasswordMatch() {
        const password = this.form.querySelector('#password');
        const confirmPassword = this.form.querySelector('#confirmPassword');
        const errorElement = this.form.querySelector('[data-error="confirmPassword"]');

        if (password.value !== confirmPassword.value) {
            errorElement.textContent = '两次输入的密码不一致';
            return false;
        }

        errorElement.textContent = '';
        return true;
    }

    // 设置密码强度检测
    setupPasswordStrength() {
        const passwordInput = this.form.querySelector('#password');
        const strengthBar = this.form.querySelector('.strength-bar');
        const strengthText = this.form.querySelector('.strength-text');

        if (!passwordInput || !strengthBar || !strengthText) return;

        passwordInput.addEventListener('input', () => {
            this.updatePasswordStrength(passwordInput.value);
        });
    }

    // 更新密码强度
    updatePasswordStrength(password) {
        const strengthBar = this.form.querySelector('.strength-fill');
        const strengthText = this.form.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;

        let strength = 0;
        
        // 检查长度
        if (password.length >= 8) strength++;
        // 检查复杂性
        if (/(?=.*[A-Za-z])(?=.*\d)/.test(password)) strength++;

        const strengthInfo = this.passwordStrength[strength];
        strengthBar.className = `strength-fill ${strengthInfo.class}`;
        strengthBar.style.width = `${(strength + 1) * 33.33}%`;
        strengthText.textContent = `密码强度：${strengthInfo.text}`;
    }

    // 处理注册
    async handleRegister() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span>注册中...';

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '注册失败');
            }

            notify.success('注册成功！正在跳转...');
            
            // 注册成功后自动登录
            localStorage.setItem('auth_token', result.token);
            
            // 延迟跳转
            setTimeout(() => {
                const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/';
                window.location.href = redirectUrl;
            }, 1500);

        } catch (error) {
            console.error('Registration failed:', error);
            notify.error(error.message || '注册失败，请稍后重试');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '注册';
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

    // 设置社交账号注册
    setupSocialRegister() {
        const socialButtons = document.querySelectorAll('.social-btn');
        socialButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = btn.dataset.platform;
                this.handleSocialRegister(platform);
            });
        });
    }

    // 处理社交账号注册
    async handleSocialRegister(platform) {
        try {
            switch (platform) {
                case 'wechat':
                    this.openWechatRegister();
                    break;
                case 'facebook':
                    window.location.href = '/api/auth/facebook/register';
                    break;
                default:
                    throw new Error('不支持的注册方式');
            }
        } catch (error) {
            console.error('Social registration failed:', error);
            this.showNotification(error.message || '注册失败，请稍后重试', 'error');
        }
    }

    // 打开微信注册
    openWechatRegister() {
        const width = 600;
        const height = 400;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        const registerWindow = window.open(
            '/api/auth/wechat/register',
            'wechatRegister',
            `width=${width},height=${height},top=${top},left=${left}`
        );

        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'wechatRegisterSuccess') {
                registerWindow.close();
                localStorage.setItem('auth_token', event.data.token);
                window.location.reload();
            }
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

// 创建注册管理实例
const registerManager = new RegisterManager();

export default registerManager; 