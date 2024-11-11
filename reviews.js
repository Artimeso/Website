// 评论和评分系统
class ReviewSystem {
    constructor() {
        this.reviews = [];
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.sortBy = 'newest';
        this.filterRating = 0;
    }

    // 初始化评论系统
    async init(productId) {
        this.productId = productId;
        await this.loadReviews();
        this.setupEventListeners();
        this.renderReviews();
        this.updateStats();
    }

    // 加载评论数据
    async loadReviews() {
        try {
            const response = await api.reviews.getList(this.productId);
            this.reviews = response.reviews;
        } catch (error) {
            console.error('Failed to load reviews:', error);
            showNotification('加载评论失败，请稍后重试', 'error');
        }
    }

    // 添加新评论
    async addReview(reviewData) {
        try {
            const response = await api.reviews.create(this.productId, reviewData);
            this.reviews.unshift(response);
            this.renderReviews();
            this.updateStats();
            showNotification('评论发布成功', 'success');
        } catch (error) {
            console.error('Failed to add review:', error);
            showNotification('评论发布失败，请稍后重试', 'error');
        }
    }

    // 渲染评论列表
    renderReviews() {
        const container = document.querySelector('.reviews-container');
        if (!container) return;

        const filteredReviews = this.getFilteredReviews();
        const paginatedReviews = this.getPaginatedReviews(filteredReviews);

        container.innerHTML = `
            <div class="reviews-header">
                <div class="reviews-stats">
                    <div class="average-rating">
                        <span class="rating-number">${this.getAverageRating()}</span>
                        <div class="rating-stars">
                            ${this.generateStars(this.getAverageRating())}
                        </div>
                        <span class="total-reviews">${this.reviews.length} 条评价</span>
                    </div>
                    <div class="rating-distribution">
                        ${this.generateRatingDistribution()}
                    </div>
                </div>
                <div class="reviews-filters">
                    <select class="sort-select">
                        <option value="newest">最新</option>
                        <option value="rating-high">评分从高到低</option>
                        <option value="rating-low">评分从低到高</option>
                    </select>
                    <div class="rating-filter">
                        ${[5, 4, 3, 2, 1].map(rating => `
                            <button class="rating-btn ${this.filterRating === rating ? 'active' : ''}"
                                    data-rating="${rating}">
                                ${rating}星
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="reviews-list">
                ${paginatedReviews.map(review => this.generateReviewHTML(review)).join('')}
            </div>
            ${this.generatePagination(filteredReviews.length)}
        `;
    }

    // 生成单个评论的HTML
    generateReviewHTML(review) {
        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <img src="${review.user.avatar}" alt="用户头像" class="reviewer-avatar">
                        <div class="reviewer-details">
                            <h4>${review.user.name}</h4>
                            <div class="rating-stars">
                                ${this.generateStars(review.rating)}
                            </div>
                        </div>
                    </div>
                    <div class="review-date">${this.formatDate(review.date)}</div>
                </div>
                <div class="review-content">
                    <p>${review.content}</p>
                    ${review.images ? `
                        <div class="review-images">
                            ${review.images.map(img => `
                                <img src="${img}" alt="评论图片" onclick="showImagePreview('${img}')">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                ${review.reply ? `
                    <div class="review-reply">
                        <strong>商家回复：</strong>
                        <p>${review.reply}</p>
                    </div>
                ` : ''}
                <div class="review-footer">
                    <button class="like-btn ${review.liked ? 'active' : ''}" data-review-id="${review.id}">
                        <span class="material-icons">thumb_up</span>
                        <span class="like-count">${review.likes}</span>
                    </button>
                </div>
            </div>
        `;
    }

    // 生成星级评分HTML
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return `
            ${Array(fullStars).fill('<span class="material-icons star-filled">star</span>').join('')}
            ${hasHalfStar ? '<span class="material-icons star-half">star_half</span>' : ''}
            ${Array(emptyStars).fill('<span class="material-icons star-empty">star_border</span>').join('')}
        `;
    }

    // 生成评分分布
    generateRatingDistribution() {
        const distribution = this.getRatingDistribution();
        const maxCount = Math.max(...Object.values(distribution));

        return Object.entries(distribution).reverse().map(([rating, count]) => `
            <div class="rating-bar">
                <span class="rating-label">${rating}星</span>
                <div class="rating-progress">
                    <div class="progress-bar" style="width: ${(count / maxCount) * 100}%"></div>
                </div>
                <span class="rating-count">${count}</span>
            </div>
        `).join('');
    }

    // 生成分页控件
    generatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        if (totalPages <= 1) return '';

        return `
            <div class="pagination">
                <button class="prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <span class="material-icons">chevron_left</span>
                </button>
                ${this.generatePageNumbers(totalPages)}
                <button class="next-page" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    <span class="material-icons">chevron_right</span>
                </button>
            </div>
        `;
    }

    // 生成页码
    generatePageNumbers(totalPages) {
        const pages = [];
        const showEllipsis = totalPages > 7;
        
        if (showEllipsis) {
            if (this.currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...', totalPages);
            } else if (this.currentPage >= totalPages - 3) {
                pages.push(1, '...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1, '...');
                for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) pages.push(i);
                pages.push('...', totalPages);
            }
        } else {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        }

        return pages.map(page => {
            if (page === '...') {
                return '<span class="ellipsis">...</span>';
            }
            return `
                <button class="page-number ${page === this.currentPage ? 'active' : ''}" 
                        data-page="${page}">
                    ${page}
                </button>
            `;
        }).join('');
    }

    // 获取筛选后的评论
    getFilteredReviews() {
        let filtered = [...this.reviews];

        if (this.filterRating > 0) {
            filtered = filtered.filter(review => review.rating === this.filterRating);
        }

        switch (this.sortBy) {
            case 'rating-high':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'rating-low':
                filtered.sort((a, b) => a.rating - b.rating);
                break;
            case 'newest':
            default:
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return filtered;
    }

    // 获取分页后的评论
    getPaginatedReviews(reviews) {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return reviews.slice(start, start + this.itemsPerPage);
    }

    // 获取平均评分
    getAverageRating() {
        if (this.reviews.length === 0) return 0;
        const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / this.reviews.length).toFixed(1);
    }

    // 获取评分分布
    getRatingDistribution() {
        const distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
        this.reviews.forEach(review => {
            distribution[review.rating]++;
        });
        return distribution;
    }

    // 更新统计信息
    updateStats() {
        // 更新产品页面的评分信息
        const productRating = document.querySelector('.product-rating');
        if (productRating) {
            productRating.innerHTML = `
                <div class="rating-stars">
                    ${this.generateStars(this.getAverageRating())}
                </div>
                <span class="rating-number">${this.getAverageRating()}</span>
                <span class="review-count">(${this.reviews.length}条评价)</span>
            `;
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        document.addEventListener('click', e => {
            // 排序选择
            if (e.target.matches('.sort-select')) {
                this.sortBy = e.target.value;
                this.renderReviews();
            }

            // 评分筛选
            if (e.target.matches('.rating-btn')) {
                const rating = parseInt(e.target.dataset.rating);
                this.filterRating = this.filterRating === rating ? 0 : rating;
                this.currentPage = 1;
                this.renderReviews();
            }

            // 分页
            if (e.target.matches('.page-number')) {
                this.currentPage = parseInt(e.target.dataset.page);
                this.renderReviews();
                this.scrollToReviews();
            }

            // 点赞
            if (e.target.closest('.like-btn')) {
                this.handleLike(e.target.closest('.like-btn'));
            }
        });
    }

    // 处理点赞
    async handleLike(button) {
        const reviewId = button.dataset.reviewId;
        const review = this.reviews.find(r => r.id === reviewId);
        if (!review) return;

        try {
            if (review.liked) {
                await api.reviews.unlike(reviewId);
                review.likes--;
            } else {
                await api.reviews.like(reviewId);
                review.likes++;
            }
            review.liked = !review.liked;
            this.renderReviews();
        } catch (error) {
            console.error('Failed to handle like:', error);
            showNotification('操作失败，请稍后重试', 'error');
        }
    }

    // 滚动到评论区域
    scrollToReviews() {
        document.querySelector('.reviews-container').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // 格式化日期
    formatDate(date) {
        return new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

export default ReviewSystem; 