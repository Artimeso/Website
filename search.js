import utils from './utils.js';
import authManager from './auth.js';

// 搜索功能管理
class SearchManager {
    constructor() {
        this.searchInput = document.querySelector('.search-box input');
        this.searchBtn = document.querySelector('.search-btn');
        this.suggestionsBox = null;
        this.searchHistory = [];
        this.hotSearches = [];
        
        // 从本地存储加载搜索历史
        this.loadSearchHistory();
        this.init();
    }

    init() {
        this.setupSearchInput();
        this.setupSearchButton();
        this.loadHotSearches();
        this.createSuggestionsBox();
    }

    // 设置搜索输入框
    setupSearchInput() {
        if (!this.searchInput) return;

        // 输入时显示建议
        this.searchInput.addEventListener('input', utils.debounce(() => {
            const query = this.searchInput.value.trim();
            if (query) {
                this.fetchSuggestions(query);
            } else {
                this.showSearchHistory();
            }
        }, 300));

        // 焦点事件
        this.searchInput.addEventListener('focus', () => {
            const query = this.searchInput.value.trim();
            if (query) {
                this.fetchSuggestions(query);
            } else {
                this.showSearchHistory();
            }
        });

        // 键盘事件
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSearch();
            }
        });
    }

    // 设置搜索按钮
    setupSearchButton() {
        this.searchBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSearch();
        });
    }

    // 创建建议框
    createSuggestionsBox() {
        this.suggestionsBox = document.createElement('div');
        this.suggestionsBox.className = 'search-suggestions';
        this.searchInput?.parentNode.appendChild(this.suggestionsBox);

        // 点击外部关闭建议框
        document.addEventListener('click', (e) => {
            if (!this.searchInput?.contains(e.target) && 
                !this.suggestionsBox.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    // 获取搜索建议
    async fetchSuggestions(query) {
        try {
            const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Failed to fetch suggestions');

            const suggestions = await response.json();
            this.showSuggestions(suggestions, query);
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
        }
    }

    // 显示搜索建议
    showSuggestions(suggestions, query) {
        if (!this.suggestionsBox) return;

        const content = suggestions.length > 0 ? `
            <div class="suggestions-list">
                ${suggestions.map(item => `
                    <div class="suggestion-item" data-keyword="${item.keyword}">
                        <span class="material-icons">search</span>
                        <span class="keyword">${this.highlightQuery(item.keyword, query)}</span>
                        <span class="count">${item.count}个商品</span>
                    </div>
                `).join('')}
            </div>
        ` : `
            <div class="no-suggestions">
                <p>未找到相关商品</p>
            </div>
        `;

        this.suggestionsBox.innerHTML = content;
        this.suggestionsBox.style.display = 'block';

        // 添加点击事件
        this.suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const keyword = item.dataset.keyword;
                this.searchInput.value = keyword;
                this.handleSearch();
            });
        });
    }

    // 显示搜索历史
    showSearchHistory() {
        if (!this.suggestionsBox) return;

        const content = `
            <div class="search-history">
                <div class="history-header">
                    <h3>搜索历史</h3>
                    ${this.searchHistory.length > 0 ? `
                        <button class="clear-history">
                            <span class="material-icons">delete</span>
                        </button>
                    ` : ''}
                </div>
                ${this.searchHistory.length > 0 ? `
                    <div class="history-list">
                        ${this.searchHistory.map(keyword => `
                            <div class="history-item" data-keyword="${keyword}">
                                <span class="material-icons">history</span>
                                <span class="keyword">${keyword}</span>
                                <button class="remove-history" data-keyword="${keyword}">
                                    <span class="material-icons">close</span>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-history">
                        <p>暂无搜索历史</p>
                    </div>
                `}
            </div>
            <div class="hot-searches">
                <h3>热门搜索</h3>
                <div class="hot-list">
                    ${this.hotSearches.map((item, index) => `
                        <div class="hot-item" data-keyword="${item.keyword}">
                            <span class="hot-rank ${index < 3 ? 'top' : ''}">${index + 1}</span>
                            <span class="keyword">${item.keyword}</span>
                            <span class="trend ${item.trend}">${this.getTrendIcon(item.trend)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.suggestionsBox.innerHTML = content;
        this.suggestionsBox.style.display = 'block';

        // 添加事件监听
        this.setupHistoryEvents();
    }

    // 设置历史记录事件
    setupHistoryEvents() {
        // 清空历史
        this.suggestionsBox?.querySelector('.clear-history')?.addEventListener('click', () => {
            this.clearSearchHistory();
        });

        // 删除单个历史记录
        this.suggestionsBox?.querySelectorAll('.remove-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const keyword = btn.dataset.keyword;
                this.removeFromHistory(keyword);
            });
        });

        // 点击历史记录
        this.suggestionsBox?.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const keyword = item.dataset.keyword;
                this.searchInput.value = keyword;
                this.handleSearch();
            });
        });

        // 点击热门搜索
        this.suggestionsBox?.querySelectorAll('.hot-item').forEach(item => {
            item.addEventListener('click', () => {
                const keyword = item.dataset.keyword;
                this.searchInput.value = keyword;
                this.handleSearch();
            });
        });
    }

    // 处理搜索
    handleSearch() {
        const query = this.searchInput?.value.trim();
        if (!query) return;

        // 添加到搜索历史
        this.addToHistory(query);

        // 跳转到搜索结果页
        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
    }

    // 加载搜索
    async loadHotSearches() {
        try {
            const response = await fetch('/api/search/hot');
            if (!response.ok) throw new Error('Failed to load hot searches');

            this.hotSearches = await response.json();
        } catch (error) {
            console.error('Failed to load hot searches:', error);
            this.hotSearches = [];
        }
    }

    // 加载搜索历史
    loadSearchHistory() {
        const history = localStorage.getItem('searchHistory');
        this.searchHistory = history ? JSON.parse(history) : [];
    }

    // 添加到搜索历史
    addToHistory(keyword) {
        // 移除重复项
        this.searchHistory = this.searchHistory.filter(item => item !== keyword);
        // 添加到开头
        this.searchHistory.unshift(keyword);
        // 限制数量
        if (this.searchHistory.length > 10) {
            this.searchHistory.pop();
        }
        // 保存到本地存储
        this.saveSearchHistory();
    }

    // 从历史记录中移除
    removeFromHistory(keyword) {
        this.searchHistory = this.searchHistory.filter(item => item !== keyword);
        this.saveSearchHistory();
        this.showSearchHistory();
    }

    // 清空搜索历史
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
        this.showSearchHistory();
    }

    // 保存搜索历史
    saveSearchHistory() {
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }

    // 隐藏建议框
    hideSuggestions() {
        if (this.suggestionsBox) {
            this.suggestionsBox.style.display = 'none';
        }
    }

    // 高亮搜索关键词
    highlightQuery(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // 获取趋势图标
    getTrendIcon(trend) {
        switch (trend) {
            case 'up':
                return '<span class="material-icons">trending_up</span>';
            case 'down':
                return '<span class="material-icons">trending_down</span>';
            default:
                return '<span class="material-icons">trending_flat</span>';
        }
    }
}

// 创建搜索管理实例
const searchManager = new SearchManager();

export default searchManager; 