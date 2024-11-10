// 主题管理
const theme = {
    // 主题配置
    themes: {
        dark: {
            '--bg-primary': '#121212',
            '--bg-secondary': '#1F1F1F',
            '--text-primary': '#E0E0E0',
            '--text-secondary': '#B0B0B0',
            '--border-color': '#333333',
            '--accent-blue': '#2979FF',
            '--accent-orange': '#FF8F00'
        },
        light: {
            '--bg-primary': '#FFFFFF',
            '--bg-secondary': '#F5F5F5',
            '--text-primary': '#333333',
            '--text-secondary': '#666666',
            '--border-color': '#E0E0E0',
            '--accent-blue': '#1565C0',
            '--accent-orange': '#F57C00'
        }
    },

    // 当前主题
    currentTheme: 'dark',

    // 初始化主题
    init() {
        // 从本地存储加载主题设置
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            // 根据系统主题设置默认主题
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light');
        }

        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });

        // 添加主题切换按钮
        this.addThemeToggle();
    },

    // 设置主题
    setTheme(themeName) {
        if (!this.themes[themeName]) return;

        this.currentTheme = themeName;
        localStorage.setItem('theme', themeName);
        document.documentElement.setAttribute('data-theme', themeName);

        // 应用主题颜色
        Object.entries(this.themes[themeName]).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });

        // 更新切换按钮状态
        this.updateToggleButton();

        // 触发主题变化事件
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: themeName } }));
    },

    // 切换主题
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    // 添加主题切换按钮
    addThemeToggle() {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'theme-toggle';
        toggleBtn.innerHTML = `
            <span class="material-icons light-icon">light_mode</span>
            <span class="material-icons dark-icon">dark_mode</span>
        `;
        
        toggleBtn.addEventListener('click', () => this.toggleTheme());
        
        // 添加到导航栏
        const navbar = document.querySelector('.nav-links');
        if (navbar) {
            const li = document.createElement('li');
            li.appendChild(toggleBtn);
            navbar.appendChild(li);
        }

        this.updateToggleButton();
    },

    // 更新切换按钮状态
    updateToggleButton() {
        const toggleBtn = document.querySelector('.theme-toggle');
        if (!toggleBtn) return;

        toggleBtn.classList.remove('dark', 'light');
        toggleBtn.classList.add(this.currentTheme);
    },

    // 获取当前主题
    getCurrentTheme() {
        return this.currentTheme;
    },

    // 检查是否是深色主题
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }
};

export default theme; 