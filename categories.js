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
        if (!slider) return;

        const minHandle = slider.querySelector('[data-handle="min"]');
        const maxHandle = slider.querySelector('[data-handle="max"]');
        const rangeFill = slider.querySelector('.range-fill');
        const minInput = document.getElementById('minPrice');
        const maxInput = document.getElementById('maxPrice');

        const min = parseInt(slider.dataset.min);
        const max = parseInt(slider.dataset.max);

        let isDragging = false;
        let currentHandle = null;

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
                    this.currentFilters.priceRange.min = Math.min(
                        Math.max(value, min),
                        this.currentFilters.priceRange.max
                    );
                    updateHandlePosition(minHandle, this.currentFilters.priceRange.min);
                } else {
                    this.currentFilters.priceRange.max = Math.min(
                        Math.max(value, this.currentFilters.priceRange.min),
                        max
                    );
                    updateHandlePosition(maxHandle, this.currentFilters.priceRange.max);
                }

                this.debounceLoadProducts();
            });
        });

        // 初始化位置
        updateHandlePosition(minHandle, this.currentFilters.priceRange.min);
        updateHandlePosition(maxHandle, this.currentFilters.priceRange.max);
    }

    // 设置排序监听
    setupSortingListeners() {
        document.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.currentFilters.sort = option.dataset.sort;
                this.loadProducts();
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
            notify.error('加载商品失败，请稍后重试');
        }
    }

    // 防抖加载
    debounceLoadProducts = utils.debounce(() => {
        this.loadProducts();
    }, 300);

    // 渲染产品
    renderProducts(products) {
        const container = document.querySelector('.products-grid');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="product-card">
                <!-- 产品卡片内容 -->
            </div>
        `).join('');
    }

    // 更新分页
    updatePagination(pagination) {
        // 实现分页更新逻辑
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
}

// 创建分类管理实例
const categoryManager = new CategoryManager();

export default categoryManager; 