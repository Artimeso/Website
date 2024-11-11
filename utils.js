const utils = {
    // ... 现有的工具函数

    form: {
        // 显示表单错误
        showError(input, message) {
            const formGroup = input.closest('.form-group');
            if (!formGroup) return;

            const errorDiv = formGroup.querySelector('.form-feedback') || 
                           this.createErrorElement(formGroup);
            
            input.classList.add('is-invalid');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        },

        // 清除表单错误
        clearError(input) {
            const formGroup = input.closest('.form-group');
            if (!formGroup) return;

            const errorDiv = formGroup.querySelector('.form-feedback');
            if (errorDiv) {
                errorDiv.textContent = '';
                errorDiv.style.display = 'none';
            }
            input.classList.remove('is-invalid');
        },

        // 创建错误提示元素
        createErrorElement(formGroup) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-feedback';
            formGroup.appendChild(errorDiv);
            return errorDiv;
        },

        // 验证必填字段
        validateRequired(input) {
            return input.value.trim() !== '';
        },

        // 验证邮箱
        validateEmail(input) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(input.value.trim());
        },

        // 验证手机号
        validatePhone(input) {
            const re = /^1[3-9]\d{9}$/;
            return re.test(input.value.trim());
        },

        // 验证密码强度
        validatePassword(input) {
            const value = input.value;
            const hasLength = value.length >= 8;
            const hasLetter = /[a-zA-Z]/.test(value);
            const hasNumber = /\d/.test(value);
            const hasSpecial = /[!@#$%^&*]/.test(value);

            return {
                isValid: hasLength && hasLetter && hasNumber,
                strength: hasSpecial ? 'strong' : (hasLength && hasLetter && hasNumber ? 'medium' : 'weak')
            };
        }
    }
};

export default utils; 