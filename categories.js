// 分类页面功能管理
class CategoryManager {
    constructor() {
        this.currentFilters = {
            category: 'all',
            priceRange: { min: 0, max: 10000 },
            brands: [],
            sort: 'default',
            page: 1,
            view: 'grid'
        };

        this.init();
    }

    init() {
        this.setupFilterListeners();
        this.setupSortingListeners();
        this.setupViewToggle();
        this.setupPagination();
        this.initPriceRange();
        this.loadProducts();
    }

    // 设置筛选器监听
    setupFilterListeners() {
        // 分类标签点击
        document.querySelectorAll('.filter-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
                this.currentFilters.category = tag.dataset.category;
                this.loadProducts();
            });
        });

        // 品牌筛选
        document.querySelectorAll('input[name="brand"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.currentFilters.brands = Array.from(document.querySelectorAll('input[name="brand"]:checked'))
                    .map(input => input.value);
                this.loadProducts();
            });
        });
    }

    // 初始化价格范围滑块
    initPriceRange() {
        const slider = document.querySelector('.range-slider');
        const minHandle = slider.querySelector('[data-handle="min"]');
        const maxHandle = slider.querySelector('[data-handle="max"]');
        const rangeFill = slider.querySelector('.range-fill');
        const minInput = document.getElementById('minPrice');
        const maxInput = document.getElementById('maxPrice');

        let isDragging = false;
        let currentHandle = null;
        const sliderRect = slider.getBoundingClientRect();
        const min = parseInt(slider.dataset.min);
        const max = parseInt(slider.dataset.max);

        // 更新滑块位置
        const updateHandlePosition = (handle, value) => {
            const percentage = ((value - min) / (max - min)) * 100;
            handle.style.left = `${percentage}%`;
            this.updateRangeFill();
        };

        // 更新填充条
        this.updateRangeFill = () => {
            const minPercentage = ((this.currentFilters.priceRange.min - min) / (max - min)) * 100;
            const maxPercentage = ((this.currentFilters.priceRange.max - min) / (max - min)) * 100;
            rangeFill.style.left = `${minPercentage}%`;
            rangeFill.style.width = `${maxPercentage - minPercentage}%`;
        };

        // 处理滑块拖动
        const handleDrag = (e) => {
            if (!isDragging) return;

            const rect = slider.getBoundingClientRect();
            let percentage = ((e.clientX - rect.left) / rect.width) * 100;
            percentage = Math.min(Math.max(percentage, 0), 100);

            const value = Math.round((percentage / 100) * (max - min) + min);

            if (currentHandle === minHandle) {
                this.currentFilters.priceRange.min = Math.min(value, this.currentFilters.priceRange.max);
                minInput.value = this.currentFilters.priceRange.min;
            } else {
                this.currentFilters.priceRange.max = Math.max(value, this.currentFilters.priceRange.min);
                maxInput.value = this.currentFilters.priceRange.max;
            }

            updateHandlePosition(currentHandle, value);
            this.debounceLoadProducts();
        };

        // 监听滑块拖动
        [minHandle, maxHandle].forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                isDragging = true;
                currentHandle = handle;
                document.addEventListener('mousemove', handleDrag);
                document.addEventListener('mouseup', () => {
                    isDragging = false;
                    document.removeEventListener('mousemove', handleDrag);
                });
            });
        });

        // 监听输入框变化
        [minInput, maxInput].forEach(input => {
            input.addEventListener('change', () => {
                const value = parseInt(input.value);
                if (isNaN(value)) return;

                if (input === minInput) {
                    this.currentFilters.priceRange.min = Math.min(Math.max(value, min), this.currentFilters.priceRange.max);
                    updateHandlePosition(minHandle, this.currentFilters.priceRange.min);
                } else {
                    this.currentFilters.priceRange.max = Math.min(Math.max(value, this.currentFilters.priceRange.min), max);
                    updateHandlePosition(maxHandle, this.currentFilters.priceRange.max);
                }

                this.debounceLoadProducts();
            });
        });
    }

    // 设置排序监听
    setupSortingListeners() {
        const sortSelect = document.getElementById('sortSelect');
        sortSelect?.addEventListener('change', () => {
            this.currentFilters.sort = sortSelect.value;
            this.loadProducts();
        });
    }

    // 设置视图切换
    setupViewToggle() {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilters.view = btn.dataset.view;
                document.querySelector('.products-grid').className = 
                    `products-grid view-${this.currentFilters.view}`;
            });
        });
    }

    // 设置分页
    setupPagination() {
        document.querySelectorAll('.page-btn').forEach(btn => {
            if (btn.classList.contains('prev')) {
                btn.addEventListener('click', () => this.prevPage());
            } else if (btn.classList.contains('next')) {
                btn.addEventListener('click', () => this.nextPage());
            } else {
                btn.addEventListener('click', () => {
                    const page = parseInt(btn.textContent);
                    if (!isNaN(page)) this.goToPage(page);
                });
            }
        });
    }

    // 加载产品
    async loadProducts() {
        try {
            this.showLoading(true);
            const queryParams = new URLSearchParams({
                category: this.currentFilters.category,
                minPrice: this.currentFilters.priceRange.min,
                maxPrice: this.currentFilters.priceRange.max,
                brands: this.currentFilters.brands.join(','),
                sort: this.currentFilters.sort,
                page: this.currentFilters.page
            });

            const response = await fetch(`/api/products?${queryParams}`);
            if (!response.ok) throw new Error('Failed to load products');

            const data = await response.json();
            this.renderProducts(data.products);
            this.updatePagination(data.pagination);
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showError('加载商品失败，请稍后重试');
        } finally {
            this.showLoading(false);
        }
    }

    // 防抖加载
    debounceLoadProducts = debounce(() => {
        this.loadProducts();
    }, 300);

    // 渲染产品
    renderProducts(products) {
        const container = document.querySelector('.products-grid');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-badges">
                    ${product.isNew ? '<span class="badge new">新品</span>' : ''}
                    ${product.discount ? `<span class="badge discount">-${product.discount}%</span>` : ''}
                </div>
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <div class="product-actions">
                        <button class="action-btn quick-view" title="快速预览">
                            <span class="material-icons">visibility</span>
                        </button>
                        <button class="action-btn add-to-favorite" title="添加收藏">
                            <span class="material-icons">favorite_border</span>
                        </button>
                        <button class="action-btn add-to-cart" title="加入购物车">
                            <span class="material-icons">shopping_cart</span>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-rating">
                        <div class="stars">${'★'.repeat(product.rating)}${'☆'.repeat(5-product.rating)}</div>
                        <span class="rating-count">(${product.ratingCount})</span>
                    </div>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">
                        <span class="current-price">¥${product.price}</span>
                        ${product.originalPrice ? `<span class="original-price">¥${product.originalPrice}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 更新分页
    updatePagination(pagination) {
        const { currentPage, totalPages } = pagination;
        const container = document.querySelector('.pagination');
        if (!container) return;

        const pages = this.generatePageNumbers(currentPage, totalPages);
        
        container.querySelector('.prev').disabled = currentPage === 1;
        container.querySelector('.next').disabled = currentPage === totalPages;

        const pageNumbers = container.querySelector('.page-numbers');
        pageNumbers.innerHTML = pages.map(page => {
            if (page === '...') {
                return '<span class="page-dots">...</span>';
            }
            return `
                <button class="page-btn ${page === currentPage ? 'active' : ''}">${page}</button>
            `;
        }).join('');
    }

    // 生成页码
    generatePageNumbers(current, total) {
        const pages = [];
        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
            return pages;
        }

        pages.push(1);
        if (current > 3) pages.push('...');
        for (let i = Math.max(2, current - 1); i <= Math.min(current + 1, total - 1); i++) {
            pages.push(i);
        }
        if (current < total - 2) pages.push('...');
        pages.push(total);
        return pages;
    }

    // 页面导航
    prevPage() {
        if (this.currentFilters.page > 1) {
            this.currentFilters.page--;
            this.loadProducts();
        }
    }

    nextPage() {
        this.currentFilters.page++;
        this.loadProducts();
    }

    goToPage(page) {
        this.currentFilters.page = page;
        this.loadProducts();
    }

    // 显示加载状态
    showLoading(show) {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    // 显示错误信息
    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 创建分类管理实例
const categoryManager = new CategoryManager();

export default categoryManager; 