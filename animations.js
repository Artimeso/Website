// 页面过渡动画
const pageTransitions = {
    init() {
        document.body.classList.add('js-loading');
        window.addEventListener('load', () => {
            document.body.classList.remove('js-loading');
            document.body.classList.add('js-loaded');
        });
    },

    // 页面元素进入视图动画
    initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    },

    // 产品卡片悬停效果
    initProductCardAnimations() {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.querySelector('.product-actions').style.opacity = '1';
                card.querySelector('.product-actions').style.transform = 'translateY(0)';
            });

            card.addEventListener('mouseleave', () => {
                card.querySelector('.product-actions').style.opacity = '0';
                card.querySelector('.product-actions').style.transform = 'translateY(10px)';
            });
        });
    },

    // 平滑滚动
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    },

    // 模态框动画
    initModalAnimations() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            modal.addEventListener('show', () => {
                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.classList.add('show');
                }, 10);
            });

            modal.addEventListener('hide', () => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            });
        });
    },

    // 购物车弹出层动画
    initCartPopupAnimations() {
        const cartPopup = document.querySelector('.cart-popup');
        const overlay = document.querySelector('.cart-popup-overlay');

        function showCart() {
            overlay.classList.add('active');
            cartPopup.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function hideCart() {
            overlay.classList.remove('active');
            cartPopup.classList.remove('active');
            document.body.style.overflow = '';
        }

        // 添加商品到购物车的动画
        function animateAddToCart(productElement, cartIcon) {
            const productRect = productElement.getBoundingClientRect();
            const cartRect = cartIcon.getBoundingClientRect();

            const animatedProduct = productElement.cloneNode(true);
            animatedProduct.style.position = 'fixed';
            animatedProduct.style.top = `${productRect.top}px`;
            animatedProduct.style.left = `${productRect.left}px`;
            animatedProduct.style.width = `${productRect.width}px`;
            animatedProduct.style.height = `${productRect.height}px`;
            animatedProduct.style.transition = 'all 0.8s cubic-bezier(0.2, 1, 0.3, 1)';
            animatedProduct.style.zIndex = '9999';

            document.body.appendChild(animatedProduct);

            requestAnimationFrame(() => {
                animatedProduct.style.transform = `
                    translate(
                        ${cartRect.left - productRect.left}px,
                        ${cartRect.top - productRect.top}px
                    ) scale(0.1)
                `;
                animatedProduct.style.opacity = '0';
            });

            setTimeout(() => {
                document.body.removeChild(animatedProduct);
                cartIcon.classList.add('bounce');
                setTimeout(() => cartIcon.classList.remove('bounce'), 300);
            }, 800);
        }

        return {
            showCart,
            hideCart,
            animateAddToCart
        };
    }
};

// 导出动画模块
export default pageTransitions; 