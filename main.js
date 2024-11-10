import pageTransitions from './animations.js';
import auth from './auth.js';
import theme from './theme.js';
import analytics from './analytics.js';

document.addEventListener('DOMContentLoaded', function() {
    // 初始化认证
    auth.init();
    auth.checkAuth();

    // 移动端菜单切换
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    mobileMenuBtn?.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // 价格滑块
    const priceSlider = document.querySelector('.price-slider');
    const minPriceInput = document.querySelector('.min-price');
    const maxPriceInput = document.querySelector('.max-price');

    if(priceSlider && minPriceInput && maxPriceInput) {
        priceSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            minPriceInput.value = value;
        });
    }

    // 产品筛选
    const filterCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateProducts);
    });

    // 排序
    const sortSelect = document.querySelector('.sort-options select');
    sortSelect?.addEventListener('change', updateProducts);

    // 联系表单处理
    const contactForm = document.getElementById('contactForm');
    if(contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取表单数据
            const formData = new FormData(this);
            const formObject = {};
            formData.forEach((value, key) => {
                formObject[key] = value;
            });

            // 这里可以添加表单验证逻辑
            
            // 发送表单数据到服务器
            console.log('Form submitted:', formObject);
            
            // 显示成功消息
            alert('消息已发送，我们会尽快回复您！');
            this.reset();
        });
    }

    // 初始化地图
    function initMap() {
        // 这里添加地图初始化代码
        // 使用选择的地图API（如百度地图、高德地图等）
    }
});

function updateProducts() {
    // 这里添加产品筛选和排序逻辑
    console.log('Updating products...');
}

// 添加到购物车
function addToCart(productId) {
    const cartCount = document.querySelector('.cart-count');
    let count = parseInt(cartCount.textContent);
    cartCount.textContent = count + 1;
    
    // 这里可以添加购物车数据存储逻辑
}

// 品图片切换
document.querySelectorAll('.thumbnail-list img').forEach(thumb => {
    thumb.addEventListener('click', function() {
        // 移除其他缩图的active类
        document.querySelectorAll('.thumbnail-list img').forEach(t => t.classList.remove('active'));
        // 给当前点击的缩略图添加active类
        this.classList.add('active');
        // 更新主图片
        document.querySelector('.main-image img').src = this.src.replace('-small', '-large');
    });
});

// 数量控制
const quantityInput = document.querySelector('.quantity-controls input');
const decreaseBtn = document.querySelector('.decrease');
const increaseBtn = document.querySelector('.increase');

if(quantityInput && decreaseBtn && increaseBtn) {
    decreaseBtn.addEventListener('click', () => {
        let value = parseInt(quantityInput.value);
        if(value > 1) {
            quantityInput.value = value - 1;
        }
    });

    increaseBtn.addEventListener('click', () => {
        let value = parseInt(quantityInput.value);
        if(value < 99) {
            quantityInput.value = value + 1;
        }
    });

    quantityInput.addEventListener('change', () => {
        let value = parseInt(quantityInput.value);
        if(value < 1) quantityInput.value = 1;
        if(value > 99) quantityInput.value = 99;
    });
}

// 标签页切换
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // 移除所有标签和内容的active类
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // 添加active类到当前标签和对应内容
        this.classList.add('active');
        document.getElementById(this.dataset.tab).classList.add('active');
    });
}); 

// 购物车数据管理
const cart = {
    items: [],
    total: 0,

    addItem(product) {
        const existingItem = this.items.find(item => 
            item.id === product.id && item.color === product.color
        );

        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.items.push({
                ...product,
                quantity: 1
            });
        }

        this.updateTotal();
        this.saveCart();
        this.updateCartUI();
    },

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.updateTotal();
        this.saveCart();
        this.updateCartUI();
    },

    updateQuantity(itemId, quantity) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            item.quantity = quantity;
            this.updateTotal();
            this.saveCart();
            this.updateCartUI();
        }
    },

    updateTotal() {
        this.total = this.items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
        );
    },

    saveCart() {
        localStorage.setItem('cart', JSON.stringify({
            items: this.items,
            total: this.total
        }));
    },

    loadCart() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            const { items, total } = JSON.parse(savedCart);
            this.items = items;
            this.total = total;
            this.updateCartUI();
        }
    },

    updateCartUI() {
        // 更新购物车图标数量
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = this.items.reduce((sum, item) => 
                sum + item.quantity, 0
            );
        }

        // 更新购物车页面
        this.updateCartPage();
    },

    updateCartPage() {
        const cartItems = document.querySelector('.cart-items');
        const summaryTotal = document.querySelector('.summary-total span:last-child');
        
        if (cartItems && summaryTotal) {
            cartItems.innerHTML = this.items.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-details">
                        <h3>${item.name}</h3>
                        <p class="item-color">颜色：${item.color}</p>
                    </div>
                    <div class="quantity-controls">
                        <button class="decrease">-</button>
                        <input type="number" value="${item.quantity}" min="1" max="99">
                        <button class="increase">+</button>
                    </div>
                    <div class="item-price">¥${item.price}</div>
                    <button class="remove-item">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            `).join('');

            summaryTotal.textContent = `¥${this.total}`;
        }
    }
};

// 页面加载时初始化购物车
document.addEventListener('DOMContentLoaded', () => {
    cart.loadCart();
});

// 轮播图功能
function initSlider() {
    const slider = document.querySelector('.hero-slider');
    if (!slider) return;

    const slides = slider.querySelectorAll('.slide');
    const dotsContainer = slider.querySelector('.slide-dots');
    const prevBtn = slider.querySelector('.prev-slide');
    const nextBtn = slider.querySelector('.next-slide');
    let currentSlide = 0;
    let slideInterval;

    // 创建轮播点
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    // 更新轮播点状态
    function updateDots() {
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    // 切换到指定幻灯片
    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        currentSlide = index;
        if (currentSlide >= slides.length) currentSlide = 0;
        if (currentSlide < 0) currentSlide = slides.length - 1;
        slides[currentSlide].classList.add('active');
        updateDots();
    }

    // 下一张幻灯片
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    // 上一张幻灯片
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // 自动播放
    function startSlideShow() {
        if (slideInterval) clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    }

    // 停止自动播放
    function stopSlideShow() {
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    }

    // 事件监听
    prevBtn?.addEventListener('click', () => {
        prevSlide();
        stopSlideShow();
        startSlideShow();
    });

    nextBtn?.addEventListener('click', () => {
        nextSlide();
        stopSlideShow();
        startSlideShow();
    });

    // 鼠标悬停时停止自动播放
    slider.addEventListener('mouseenter', stopSlideShow);
    slider.addEventListener('mouseleave', startSlideShow);

    // 开始自动播放
    startSlideShow();
}

// 页面加载时初始化轮播图
document.addEventListener('DOMContentLoaded', () => {
    initSlider();
});

// 添加返回顶部按钮
function addScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.classList.add('scroll-to-top');
    scrollBtn.innerHTML = '<span class="material-icons">arrow_upward</span>';
    document.body.appendChild(scrollBtn);

    // 显示/隐藏按钮
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });

    // 点击返回顶部
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 添加相应的样式

// 快速预览功能
function initQuickView() {
    const modal = document.getElementById('quickViewModal');
    const quickViewButtons = document.querySelectorAll('.quick-view');
    const closeModal = modal.querySelector('.close-modal');

    // 产品数据（实际项目中应从后端获取）
    const products = {
        1: {
            name: '智能人体工学椅',
            description: '自适应脊椎支撑，智能温度调节，多角度调节扶手，静音滚轮设计',
            price: 2999,
            image: 'images/chair.jpg',
            colors: ['black', 'white', 'gray']
        }
        // 可以添加更多产品
    };

    quickViewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = button.dataset.productId;
            const product = products[productId];

            // 填充模框内容
            modal.querySelector('#modalProductImage').src = product.image;
            modal.querySelector('#modalProductName').textContent = product.name;
            modal.querySelector('#modalProductDescription').textContent = product.description;

            // 显示模态框
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        });
    });

    // 关闭模态框
    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// 页面加载时初始化快速预览功能
document.addEventListener('DOMContentLoaded', () => {
    initQuickView();
});

// 页面加载动画
function initPageLoadAnimation() {
    document.body.classList.add('page-loaded');
    
    // 添加元素进入视图时的动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 观察需要动画的元素
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// 平滑滚动
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
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
}

// 用户评价轮播
function initTestimonialsSlider() {
    const slider = document.querySelector('.testimonials-slider');
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
    });

    // 自动滚动
    let autoScrollInterval;
    
    function startAutoScroll() {
        autoScrollInterval = setInterval(() => {
            slider.scrollLeft += 1;
            if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth) {
                slider.scrollLeft = 0;
            }
        }, 30);
    }

    function stopAutoScroll() {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
        }
    }

    slider.addEventListener('mouseenter', stopAutoScroll);
    slider.addEventListener('mouseleave', startAutoScroll);

    startAutoScroll();
}

// 订阅表处理
function initNewsletterForm() {
    const form = document.querySelector('.newsletter-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');

        if (!emailInput.value) return;

        // 显示加载状态
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-icons loading">sync</span>';

        try {
            // 这里添加实际的订阅处理逻辑
            await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API请求

            // 显示成功消息
            showNotification('订阅成功！感谢您的关注。', 'success');
            form.reset();
        } catch (error) {
            showNotification('订阅失败，请稍后重试。', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '订阅';
        }
    });
}

// 通知提示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="material-icons">${type === 'success' ? 'check_circle' : 'error'}</span>
        <p>${message}</p>
    `;

    document.body.appendChild(notification);

    // 动画显示
    setTimeout(() => notification.classList.add('show'), 100);

    // 自动关闭
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 页面加载时初始化所有功能
document.addEventListener('DOMContentLoaded', () => {
    initPageLoadAnimation();
    initSmoothScroll();
    initTestimonialsSlider();
    initNewsletterForm();
    addScrollToTop();
});

// 添加相应的CSS样式

// 图片懒加载
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

// 性能优化：防抖函数
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

// 性能优化：节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 优化滚动事件处理
const optimizedScroll = throttle(() => {
    // 处理滚动相关的逻辑
    const scrollTop = window.pageYOffset;
    
    // 显示/隐藏返回顶部按钮
    const scrollBtn = document.querySelector('.scroll-to-top');
    if (scrollBtn) {
        scrollBtn.classList.toggle('show', scrollTop > 300);
    }

    // 处理导航栏样式
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.classList.toggle('scrolled', scrollTop > 50);
    }
}, 100);

window.addEventListener('scroll', optimizedScroll);

// 优化窗口调整事件处理
const optimizedResize = debounce(() => {
    // 处理窗口调整相关的逻辑
    updateLayout();
}, 250);

window.addEventListener('resize', optimizedResize);

// 更新布局函数
function updateLayout() {
    // 更新网格布局
    const productGrid = document.querySelector('.product-grid');
    if (productGrid) {
        const cards = productGrid.querySelectorAll('.product-card');
        const containerWidth = productGrid.offsetWidth;
        const cardWidth = 280; // 最小卡片宽度
        const gap = 20; // 间距
        const columns = Math.floor((containerWidth + gap) / (cardWidth + gap));
        productGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }
}

// 添加页面过渡效果
function initPageTransitions() {
    document.body.classList.add('page-loaded');
    
    // 为所有需要动画的元素添加类
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('animate-on-scroll');
    });
}

// 初始化所有功能
document.addEventListener('DOMContentLoaded', () => {
    initPageTransitions();
    initLazyLoading();
    updateLayout();
});

// 错误处理和用户反馈
function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    showNotification(
        error.message || '发生错误，请稍后重试。',
        'error'
    );
}

// 添加加载状态指示器
function setLoading(element, isLoading) {
    if (isLoading) {
        element.disabled = true;
        element.dataset.originalText = element.textContent;
        element.innerHTML = '<span class="material-icons loading">sync</span>';
    } else {
        element.disabled = false;
        element.textContent = element.dataset.originalText;
        delete element.dataset.originalText;
    }
}

// 表单验证工具
const validators = {
    email: (value) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value) ? '' : '请输入有效的邮箱地址';
    },
    phone: (value) => {
        const regex = /^1[3-9]\d{9}$/;
        return regex.test(value) ? '' : '请输入有效的手机号码';
    },
    required: (value) => {
        return value.trim() ? '' : '此字段为必填项';
    }
};

function validateForm(form) {
    let isValid = true;
    const errors = {};

    form.querySelectorAll('[data-validate]').forEach(input => {
        const validations = input.dataset.validate.split(',');
        for (const validation of validations) {
            const error = validators[validation]?.(input.value);
            if (error) {
                isValid = false;
                errors[input.name] = error;
                showInputError(input, error);
                break;
            } else {
                clearInputError(input);
            }
        }
    });

    return { isValid, errors };
}

function showInputError(input, error) {
    const errorElement = input.parentElement.querySelector('.error-message')
        || createErrorElement(input);
    errorElement.textContent = error;
    input.classList.add('error');
}

function clearInputError(input) {
    const errorElement = input.parentElement.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = '';
    }
    input.classList.remove('error');
}

function createErrorElement(input) {
    const errorElement = document.createElement('span');
    errorElement.className = 'error-message';
    input.parentElement.appendChild(errorElement);
    return errorElement;
}

// 搜索功能
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchBtn = document.querySelector('.search-btn');

    // 模拟产品数据
    const products = [
        { id: 1, name: '智能人体工学椅', price: 2999, image: 'images/chair.jpg' },
        { id: 2, name: '电动升降办公桌', price: 3499, image: 'images/desk.jpg' },
        { id: 3, name: '智能模块沙发', price: 5999, image: 'images/sofa.jpg' }
    ];

    // 搜索防抖
    const debouncedSearch = debounce((query) => {
        if (!query.trim()) {
            searchResults.classList.remove('active');
            return;
        }

        // 过滤产品
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase())
        );

        // 显示结果
        if (filteredProducts.length > 0) {
            searchResults.innerHTML = filteredProducts.map(product => `
                <div class="search-result-item" data-product-id="${product.id}">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="result-info">
                        <h4>${product.name}</h4>
                        <p>¥${product.price}</p>
                    </div>
                </div>
            `).join('');
            searchResults.classList.add('active');
        } else {
            searchResults.innerHTML = '<div class="no-results">未找到相关产品</div>';
            searchResults.classList.add('active');
        }
    }, 300);

    // 输入事件监听
    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    // 点击搜索按钮
    searchBtn.addEventListener('click', () => {
        debouncedSearch(searchInput.value);
    });

    // 点击搜索结果项
    searchResults.addEventListener('click', (e) => {
        const resultItem = e.target.closest('.search-result-item');
        if (resultItem) {
            const productId = resultItem.dataset.productId;
            window.location.href = `product-detail.html?id=${productId}`;
        }
    });

    // 点击外部关闭搜索结果
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            searchResults.classList.remove('active');
        }
    });
}

// 购物车弹出层功能
function initCartPopup() {
    const cartIcon = document.querySelector('.cart-icon');
    const cartPopup = document.getElementById('cartPopup');
    const cartOverlay = document.querySelector('.cart-popup-overlay');
    const closeCart = document.querySelector('.close-cart');
    const viewCartBtn = document.querySelector('.view-cart-btn');
    const checkoutBtn = document.querySelector('.checkout-btn');

    // 打开购物车
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        cartPopup.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateCartPopup();
    });

    // 关闭购物车
    function closeCartPopup() {
        cartPopup.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeCart.addEventListener('click', closeCartPopup);
    cartOverlay.addEventListener('click', closeCartPopup);

    // 更新购物车内容
    function updateCartPopup() {
        const cartItems = cartPopup.querySelector('.cart-popup-items');
        const totalAmount = cartPopup.querySelector('.total-amount');
        
        if (cart.items.length > 0) {
            cartItems.innerHTML = cart.items.map(item => `
                <div class="cart-popup-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>¥${item.price} × ${item.quantity}</p>
                    </div>
                    <button class="remove-item" data-id="${item.id}">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            `).join('');
            totalAmount.textContent = `¥${cart.total}`;
        } else {
            cartItems.innerHTML = '<div class="empty-cart">购物车是空的</div>';
            totalAmount.textContent = '¥0';
        }
    }

    // 移除商品
    cartPopup.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-item');
        if (removeBtn) {
            const itemId = removeBtn.dataset.id;
            cart.removeItem(itemId);
            updateCartPopup();
        }
    });

    // 查看购物车按钮
    viewCartBtn.addEventListener('click', () => {
        window.location.href = 'cart.html';
    });

    // 去结算按钮
    checkoutBtn.addEventListener('click', () => {
        if (cart.items.length > 0) {
            window.location.href = 'checkout.html';
        } else {
            showNotification('购物车是空的', 'error');
        }
    });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initCartPopup();
});

// 初始化所有动画
document.addEventListener('DOMContentLoaded', () => {
    pageTransitions.init();
    pageTransitions.initScrollAnimations();
    pageTransitions.initProductCardAnimations();
    pageTransitions.initSmoothScroll();
    pageTransitions.initModalAnimations();
    const cartAnimations = pageTransitions.initCartPopupAnimations();

    // 添加到购物车按钮点击事件
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            const cartIcon = document.querySelector('.cart-icon');
            cartAnimations.animateAddToCart(productCard, cartIcon);
            
            // 实际的添加到购物车逻辑...
            cart.addItem({
                id: button.dataset.productId,
                // 其他商品信息...
            });
        });
    });

    // 购物车图标点击事件
    document.querySelector('.cart-icon').addEventListener('click', (e) => {
        e.preventDefault();
        cartAnimations.showCart();
    });

    // 关闭购物车
    document.querySelector('.close-cart').addEventListener('click', () => {
        cartAnimations.hideCart();
    });

    document.querySelector('.cart-popup-overlay').addEventListener('click', () => {
        cartAnimations.hideCart();
    });
});

// 在页面加载时初始化主题
document.addEventListener('DOMContentLoaded', () => {
    theme.init();
});

// 在页面加载时初始化分析
document.addEventListener('DOMContentLoaded', () => {
    analytics.init();
});

// 初始化图片预览功能
function initImageViewer() {
    const imageViewer = document.getElementById('imageViewer');
    if (!imageViewer) return;

    // 获取所有可预览的图片
    const previewableImages = document.querySelectorAll('.product-image img, .review-images img');
    
    previewableImages.forEach(img => {
        img.addEventListener('click', () => {
            const productCard = img.closest('.product-card');
            if (productCard) {
                const images = Array.from(productCard.querySelectorAll('img')).map(img => ({
                    src: img.src,
                    caption: img.alt
                }));
                showImageViewer(images, images.findIndex(image => image.src === img.src));
            } else {
                showImageViewer([{ src: img.src, caption: img.alt }], 0);
            }
        });
    });

    // 显示图片预览
    function showImageViewer(images, startIndex = 0) {
        imageViewer.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const viewerImage = imageViewer.querySelector('.viewer-content img');
        const thumbnails = imageViewer.querySelector('.viewer-thumbnails');
        const caption = imageViewer.querySelector('.viewer-caption');
        const prevBtn = imageViewer.querySelector('.viewer-prev');
        const nextBtn = imageViewer.querySelector('.viewer-next');
        
        let currentIndex = startIndex;

        // 更新图片显示
        function updateImage() {
            const image = images[currentIndex];
            viewerImage.src = image.src;
            caption.textContent = image.caption;
            
            // 更新缩略图选中状态
            const thumbs = thumbnails.querySelectorAll('.thumbnail');
            thumbs.forEach((thumb, index) => {
                thumb.classList.toggle('active', index === currentIndex);
            });

            // 更新导航按钮状态
            prevBtn.style.display = currentIndex > 0 ? '' : 'none';
            nextBtn.style.display = currentIndex < images.length - 1 ? '' : 'none';
        }

        // 生成缩略图
        if (images.length > 1) {
            thumbnails.innerHTML = images.map((image, index) => `
                <div class="thumbnail ${index === currentIndex ? 'active' : ''}"
                     style="background-image: url('${image.src}')"></div>
            `).join('');

            thumbnails.querySelectorAll('.thumbnail').forEach((thumb, index) => {
                thumb.addEventListener('click', () => {
                    currentIndex = index;
                    updateImage();
                });
            });
        } else {
            thumbnails.style.display = 'none';
        }

        // 初始化图片
        updateImage();

        // 事件处理
        const closeBtn = imageViewer.querySelector('.viewer-close');
        const overlay = imageViewer.querySelector('.viewer-overlay');

        closeBtn.addEventListener('click', hideImageViewer);
        overlay.addEventListener('click', hideImageViewer);

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateImage();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentIndex < images.length - 1) {
                currentIndex++;
                updateImage();
            }
        });

        // 键盘事件
        function handleKeydown(e) {
            switch (e.key) {
                case 'Escape':
                    hideImageViewer();
                    break;
                case 'ArrowLeft':
                    if (currentIndex > 0) {
                        currentIndex--;
                        updateImage();
                    }
                    break;
                case 'ArrowRight':
                    if (currentIndex < images.length - 1) {
                        currentIndex++;
                        updateImage();
                    }
                    break;
            }
        }

        document.addEventListener('keydown', handleKeydown);

        // 缩放功能
        const zoomIn = imageViewer.querySelector('.zoom-in');
        const zoomOut = imageViewer.querySelector('.zoom-out');
        const zoomReset = imageViewer.querySelector('.zoom-reset');
        let scale = 1;

        zoomIn.addEventListener('click', () => {
            scale = Math.min(scale + 0.2, 3);
            viewerImage.style.transform = `scale(${scale})`;
        });

        zoomOut.addEventListener('click', () => {
            scale = Math.max(scale - 0.2, 1);
            viewerImage.style.transform = `scale(${scale})`;
        });

        zoomReset.addEventListener('click', () => {
            scale = 1;
            viewerImage.style.transform = `scale(${scale})`;
        });

        // 清理函数
        function hideImageViewer() {
            imageViewer.classList.remove('active');
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeydown);
            scale = 1;
            viewerImage.style.transform = '';
        }
    }
}

// 页面加载时初始化图片预览
document.addEventListener('DOMContentLoaded', () => {
    initImageViewer();
});