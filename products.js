// 产品数据管理
const products = {
    // 产品数据
    items: [
        {
            id: 1,
            name: '智能人体工学椅',
            category: 'office',
            price: 2999,
            originalPrice: 3299,
            description: '自适应脊椎支撑，智能温度调节',
            detailDescription: `
                - 智能温度调节系统
                - 自适应脊椎支撑技术
                - 记忆海绵座垫
                - 多角度调节扶手
                - 静音滚轮设计
            `,
            specifications: {
                dimensions: '680×580×1150mm',
                material: '网布+金属底座',
                weight: '22kg',
                loadCapacity: '150kg',
                warranty: '2年'
            },
            images: {
                main: 'images/chair-large.jpg',
                thumbnails: [
                    'images/chair-1.jpg',
                    'images/chair-2.jpg',
                    'images/chair-3.jpg',
                    'images/chair-4.jpg'
                ]
            },
            colors: [
                { name: '经典黑', value: '#000000', inStock: true },
                { name: '简约白', value: '#FFFFFF', inStock: true },
                { name: '商务灰', value: '#808080', inStock: false }
            ],
            features: [
                '人体工学设计',
                '智能温控',
                '记忆海绵',
                '静音滚轮'
            ],
            stock: 50,
            rating: 4.8,
            reviewCount: 128,
            tags: ['办公椅', '人体工学', '智能家具'],
            isNew: true,
            isFeatured: true,
            discount: 0.1 // 10% off
        },
        // 可以添加更多产品...
    ],

    // 产品分类
    categories: [
        {
            id: 'living',
            name: '客厅家具',
            image: 'images/living-room.jpg',
            description: '打造温馨舒适的生活空间'
        },
        {
            id: 'office',
            name: '办公家具',
            image: 'images/office.jpg',
            description: '提升工作效率的专业选择'
        },
        {
            id: 'bedroom',
            name: '卧室家具',
            image: 'images/bedroom.jpg',
            description: '享受优质睡眠体验'
        }
        // 可以添加更多分类...
    ],

    // 获取产品列表
    getProducts(filters = {}) {
        let filteredProducts = [...this.items];

        // 应用筛选条件
        if (filters.category) {
            filteredProducts = filteredProducts.filter(p => p.category === filters.category);
        }

        if (filters.priceRange) {
            filteredProducts = filteredProducts.filter(p => 
                p.price >= filters.priceRange.min && p.price <= filters.priceRange.max
            );
        }

        if (filters.colors) {
            filteredProducts = filteredProducts.filter(p => 
                p.colors.some(c => filters.colors.includes(c.value))
            );
        }

        // 应用排序
        if (filters.sort) {
            switch (filters.sort) {
                case 'price-low':
                    filteredProducts.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    filteredProducts.sort((a, b) => b.price - a.price);
                    break;
                case 'rating':
                    filteredProducts.sort((a, b) => b.rating - a.rating);
                    break;
                case 'newest':
                    filteredProducts = filteredProducts.filter(p => p.isNew);
                    break;
            }
        }

        return filteredProducts;
    },

    // 获取单个产品详情
    getProduct(id) {
        return this.items.find(p => p.id === parseInt(id));
    },

    // 获取相关产品推荐
    getRelatedProducts(productId, limit = 4) {
        const currentProduct = this.getProduct(productId);
        if (!currentProduct) return [];

        return this.items
            .filter(p => p.id !== productId && p.category === currentProduct.category)
            .sort(() => Math.random() - 0.5)
            .slice(0, limit);
    },

    // 获取特色产品
    getFeaturedProducts(limit = 6) {
        return this.items
            .filter(p => p.isFeatured)
            .sort(() => Math.random() - 0.5)
            .slice(0, limit);
    },

    // 搜索产品
    searchProducts(query) {
        const searchTerm = query.toLowerCase();
        return this.items.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    },

    // 检查库存
    checkStock(productId, quantity = 1) {
        const product = this.getProduct(productId);
        return product && product.stock >= quantity;
    },

    // 计算折扣价格
    calculateDiscountPrice(product) {
        if (!product.discount) return product.price;
        return product.price * (1 - product.discount);
    },

    // 格式化价格
    formatPrice(price) {
        return `¥${price.toFixed(2)}`;
    }
};

export default products; 