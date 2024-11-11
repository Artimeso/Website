// 图片预览功能
class ImageViewer {
    constructor() {
        this.createViewer();
        this.bindEvents();

        // 添加新的属性
        this.preloadedImages = new Set();
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isMoving = false;
    }

    // 创建预览器DOM
    createViewer() {
        const viewer = document.createElement('div');
        viewer.className = 'image-viewer';
        viewer.innerHTML = `
            <div class="viewer-overlay"></div>
            <div class="viewer-container">
                <button class="viewer-close">
                    <span class="material-icons">close</span>
                </button>
                <button class="viewer-prev">
                    <span class="material-icons">chevron_left</span>
                </button>
                <button class="viewer-next">
                    <span class="material-icons">chevron_right</span>
                </button>
                <div class="viewer-content">
                    <img src="" alt="预览图片">
                </div>
                <div class="viewer-thumbnails"></div>
                <div class="viewer-caption"></div>
            </div>
        `;
        document.body.appendChild(viewer);

        this.viewer = viewer;
        this.image = viewer.querySelector('img');
        this.thumbnails = viewer.querySelector('.viewer-thumbnails');
        this.caption = viewer.querySelector('.viewer-caption');
        this.currentIndex = 0;
        this.images = [];
    }

    // 绑定事件
    bindEvents() {
        // 关闭按钮
        this.viewer.querySelector('.viewer-close').addEventListener('click', () => {
            this.hide();
        });

        // 点击遮罩层关闭
        this.viewer.querySelector('.viewer-overlay').addEventListener('click', () => {
            this.hide();
        });

        // 上一张
        this.viewer.querySelector('.viewer-prev').addEventListener('click', () => {
            this.prev();
        });

        // 下一张
        this.viewer.querySelector('.viewer-next').addEventListener('click', () => {
            this.next();
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (!this.viewer.classList.contains('active')) return;

            switch (e.key) {
                case 'Escape':
                    this.hide();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
            }
        });

        // 手势支持
        let touchStartX = 0;
        let touchEndX = 0;

        this.viewer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        this.viewer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) { // 最小滑动距离
                if (diff > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }
        });

        // 缩放功能
        let scale = 1;
        let currentScale = 1;
        let startDistance = 0;

        this.image.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            scale = Math.max(1, Math.min(3, scale + delta));
            this.image.style.transform = `scale(${scale})`;
        });

        this.viewer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                startDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
            }
        });

        this.viewer.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                
                const delta = (currentDistance - startDistance) / 100;
                currentScale = Math.max(1, Math.min(3, scale + delta));
                this.image.style.transform = `scale(${currentScale})`;
            }
        });

        this.viewer.addEventListener('touchend', () => {
            scale = currentScale;
        });
    }

    // 显示预览
    show(images, startIndex = 0) {
        this.images = Array.isArray(images) ? images : [images];
        this.currentIndex = startIndex;
        this.viewer.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.update();
        this.updateThumbnails();
    }

    // 隐藏预览
    hide() {
        this.viewer.classList.remove('active');
        document.body.style.overflow = '';
        this.image.style.transform = 'scale(1)';
        scale = 1;
        currentScale = 1;
    }

    // 上一张
    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.update();
        }
    }

    // 下一张
    next() {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
            this.update();
        }
    }

    // 更新显示
    update() {
        const image = this.images[this.currentIndex];
        this.image.src = typeof image === 'string' ? image : image.src;
        this.caption.textContent = typeof image === 'string' ? '' : image.caption;
        
        // 更新导航按钮状态
        this.viewer.querySelector('.viewer-prev').style.display = 
            this.currentIndex > 0 ? '' : 'none';
        this.viewer.querySelector('.viewer-next').style.display = 
            this.currentIndex < this.images.length - 1 ? '' : 'none';

        // 更新缩略图选中状态
        const thumbnails = this.thumbnails.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === this.currentIndex);
        });
    }

    // 更新缩略图
    updateThumbnails() {
        if (this.images.length <= 1) {
            this.thumbnails.style.display = 'none';
            return;
        }

        this.thumbnails.style.display = '';
        this.thumbnails.innerHTML = this.images.map((image, index) => `
            <div class="thumbnail ${index === this.currentIndex ? 'active' : ''}"
                 style="background-image: url('${typeof image === 'string' ? image : image.src}')">
            </div>
        `).join('');

        // 绑定缩略图点击事件
        this.thumbnails.querySelectorAll('.thumbnail').forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                this.currentIndex = index;
                this.update();
            });
        });
    }

    // 添加图片预加载功能
    preloadImages(images) {
        images.forEach(src => {
            if (this.preloadedImages.has(src)) return;

            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.preloadedImages.add(src);
            };
        });
    }

    // 添加放大镜效果
    initMagnifier() {
        const magnifier = document.createElement('div');
        magnifier.className = 'image-magnifier';
        this.viewer.appendChild(magnifier);

        this.image.addEventListener('mousemove', (e) => {
            if (this.scale > 1) return;

            const rect = this.image.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            magnifier.style.left = `${x}px`;
            magnifier.style.top = `${y}px`;
            magnifier.style.backgroundImage = `url(${this.image.src})`;
            magnifier.style.backgroundPosition = `-${x * 2}px -${y * 2}px`;
            magnifier.style.display = 'block';
        });

        this.image.addEventListener('mouseleave', () => {
            magnifier.style.display = 'none';
        });
    }

    // 添加手势支持
    initGestureSupport() {
        let startDistance = 0;
        let initialScale = 1;

        this.viewer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                startDistance = this.getDistance(e.touches[0], e.touches[1]);
                initialScale = this.scale;
                e.preventDefault();
            }
        });

        this.viewer.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scaleDiff = currentDistance / startDistance;
                this.scale = Math.min(Math.max(initialScale * scaleDiff, 1), 3);
                this.updateImageTransform();
                e.preventDefault();
            }
        });
    }

    // 计算两点之间的距离
    getDistance(touch1, touch2) {
        return Math.hypot(
            touch1.clientX - touch2.clientX,
            touch1.clientY - touch2.clientY
        );
    }

    // 更新图片变换
    updateImageTransform() {
        this.image.style.transform = `
            translate(${this.translateX}px, ${this.translateY}px) 
            scale(${this.scale})
        `;
    }

    // 添加图片切换动画
    switchImage(index) {
        const currentImage = this.images[this.currentIndex];
        const nextImage = this.images[index];
        const direction = index > this.currentIndex ? 1 : -1;

        // 创建动画容器
        const animContainer = document.createElement('div');
        animContainer.className = 'image-switch-animation';
        this.viewer.appendChild(animContainer);

        // 添加当前图片和下一张图片
        animContainer.innerHTML = `
            <img src="${currentImage}" class="current" style="transform: translateX(0)">
            <img src="${nextImage}" class="next" style="transform: translateX(${100 * direction}%)">
        `;

        // 触发动画
        requestAnimationFrame(() => {
            const imgs = animContainer.querySelectorAll('img');
            imgs[0].style.transform = `translateX(${-100 * direction}%)`;
            imgs[1].style.transform = 'translateX(0)';
        });

        // 动画结束后清理
        setTimeout(() => {
            this.image.src = nextImage;
            animContainer.remove();
            this.currentIndex = index;
            this.updateThumbnails();
        }, 300);
    }

    // 添加键盘快捷键支持
    initKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;

            switch (e.key) {
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
                case '+':
                    this.zoomIn();
                    break;
                case '-':
                    this.zoomOut();
                    break;
                case 'r':
                    this.resetZoom();
                    break;
            }
        });
    }

    // 缩放控制
    zoomIn() {
        this.scale = Math.min(this.scale + 0.2, 3);
        this.updateImageTransform();
    }

    zoomOut() {
        this.scale = Math.max(this.scale - 0.2, 1);
        this.updateImageTransform();
    }

    resetZoom() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateImageTransform();
    }
}

// 创建全局实例
const imageViewer = new ImageViewer();

// 导出实例
export default imageViewer; 