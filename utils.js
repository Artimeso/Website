// 全局加载状态管理
const loadingState = {
    isLoading: false,
    loadingElement: null,

    show() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        if (!this.loadingElement) {
            this.loadingElement = document.createElement('div');
            this.loadingElement.className = 'global-loading';
            this.loadingElement.innerHTML = `
                <div class="loading-spinner">
                    <span class="material-icons loading">sync</span>
                </div>
            `;
            document.body.appendChild(this.loadingElement);
        }
        this.loadingElement.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    hide() {
        if (!this.isLoading) return;
        
        this.isLoading = false;
        if (this.loadingElement) {
            this.loadingElement.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
};

// 全局错误处理
const errorHandler = {
    show(message, type = 'error') {
        const errorElement = document.createElement('div');
        errorElement.className = `global-error ${type}`;
        errorElement.innerHTML = `
            <div class="error-content">
                <span class="material-icons">${type === 'error' ? 'error' : 'warning'}</span>
                <p>${message}</p>
                <button class="close-error">
                    <span class="material-icons">close</span>
                </button>
            </div>
        `;

        document.body.appendChild(errorElement);

        // 自动关闭
        setTimeout(() => {
            errorElement.remove();
        }, 5000);

        // 点击关闭
        errorElement.querySelector('.close-error').addEventListener('click', () => {
            errorElement.remove();
        });
    },

    handleApiError(error) {
        console.error('API Error:', error);
        this.show(error.message || '服务器错误，请稍后重试');
    }
};

// 表单验证工具
const formValidator = {
    rules: {
        required: {
            validate: value => value.trim().length > 0,
            message: '此字段为必填项'
        },
        email: {
            validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: '请输入有效的邮箱地址'
        },
        phone: {
            validate: value => /^1[3-9]\d{9}$/.test(value),
            message: '请输入有效的手机号码'
        },
        password: {
            validate: value => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value),
            message: '密码必须包含字母和数字，长度至少8位'
        }
    },

    validateField(input) {
        const rules = input.dataset.validate?.split(',') || [];
        for (const rule of rules) {
            const validator = this.rules[rule];
            if (validator && !validator.validate(input.value)) {
                return validator.message;
            }
        }
        return '';
    },

    validateForm(form) {
        let isValid = true;
        const errors = {};

        form.querySelectorAll('[data-validate]').forEach(input => {
            const error = this.validateField(input);
            if (error) {
                isValid = false;
                errors[input.name] = error;
                this.showError(input, error);
            } else {
                this.clearError(input);
            }
        });

        return { isValid, errors };
    },

    showError(input, message) {
        const errorElement = input.parentElement.querySelector('.error-message')
            || this.createErrorElement(input);
        errorElement.textContent = message;
        input.classList.add('error');
    },

    clearError(input) {
        const errorElement = input.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = '';
        }
        input.classList.remove('error');
    },

    createErrorElement(input) {
        const errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        input.parentElement.appendChild(errorElement);
        return errorElement;
    }
};

// 本地存储工具
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage Error:', e);
        }
    },

    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage Error:', e);
            return null;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Storage Error:', e);
        }
    }
};

// 工具函数导出
export {
    loadingState,
    errorHandler,
    formValidator,
    storage
}; 