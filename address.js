// 地址管理
class AddressManager {
    constructor() {
        this.modal = document.getElementById('addressModal');
        this.form = document.getElementById('addressForm');
        this.addressList = document.querySelector('.address-list');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadRegionData();
        this.loadAddresses();
    }

    setupEventListeners() {
        // 打开新增地址模态框
        document.querySelector('.add-address')?.addEventListener('click', () => {
            this.openModal();
        });

        // 打开编辑地址模态框
        document.querySelectorAll('.edit-address').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const addressId = e.target.closest('.address-item').dataset.id;
                this.openModal(addressId);
            });
        });

        // 关闭模态框
        this.modal?.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // 取消按钮
        this.modal?.querySelector('.cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });

        // 表单提交
        this.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAddress();
        });

        // 省市区联动
        document.getElementById('province')?.addEventListener('change', () => {
            this.updateCityOptions();
        });

        document.getElementById('city')?.addEventListener('change', () => {
            this.updateDistrictOptions();
        });
    }

    // 打开模态框
    openModal(addressId = null) {
        this.modal.classList.add('active');
        if (addressId) {
            this.loadAddressData(addressId);
        } else {
            this.form.reset();
        }
    }

    // 关闭模态框
    closeModal() {
        this.modal.classList.remove('active');
        this.form.reset();
    }

    // 加载地址数据
    async loadAddressData(addressId) {
        try {
            const response = await fetch(`/api/addresses/${addressId}`);
            const address = await response.json();
            this.fillFormData(address);
        } catch (error) {
            console.error('Failed to load address:', error);
            showNotification('加载地址信息失败', 'error');
        }
    }

    // 填充表单数据
    fillFormData(address) {
        Object.entries(address).forEach(([key, value]) => {
            const input = this.form.elements[key];
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = value;
                } else if (input.type === 'radio') {
                    this.form.querySelector(`input[name="${key}"][value="${value}"]`).checked = true;
                } else {
                    input.value = value;
                }
            }
        });
    }

    // 保存地址
    async saveAddress() {
        const formData = new FormData(this.form);
        const addressData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/addresses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addressData)
            });

            if (!response.ok) throw new Error('Failed to save address');

            showNotification('地址保存成功', 'success');
            this.closeModal();
            this.loadAddresses(); // 重新加载地址列表
        } catch (error) {
            console.error('Failed to save address:', error);
            showNotification('保存地址失败', 'error');
        }
    }

    // 加载地址列表
    async loadAddresses() {
        try {
            const response = await fetch('/api/addresses');
            const addresses = await response.json();
            this.renderAddresses(addresses);
        } catch (error) {
            console.error('Failed to load addresses:', error);
            showNotification('加载地址列表失败', 'error');
        }
    }

    // 渲染地址列表
    renderAddresses(addresses) {
        if (!this.addressList) return;

        const addressHTML = addresses.map(address => `
            <div class="address-item ${address.isDefault ? 'selected' : ''}" data-id="${address.id}">
                <div class="address-info">
                    <div class="recipient">
                        <span class="name">${address.recipient}</span>
                        <span class="phone">${address.phone}</span>
                        ${address.isDefault ? '<span class="tag default">默认</span>' : ''}
                    </div>
                    <div class="address">
                        ${address.province}${address.city}${address.district}${address.street}
                    </div>
                </div>
                <button class="edit-address">
                    <span class="material-icons">edit</span>
                </button>
            </div>
        `).join('');

        this.addressList.innerHTML = addressHTML + `
            <button class="add-address">
                <span class="material-icons">add</span>
                添加新地址
            </button>
        `;
    }

    // 加载省市区数据
    async loadRegionData() {
        try {
            const response = await fetch('/api/regions');
            const regions = await response.json();
            this.regions = regions;
            this.updateProvinceOptions();
        } catch (error) {
            console.error('Failed to load region data:', error);
        }
    }

    // 更新省份选项
    updateProvinceOptions() {
        const provinceSelect = document.getElementById('province');
        if (!provinceSelect) return;

        provinceSelect.innerHTML = `
            <option value="">选择省份</option>
            ${this.regions.map(province => `
                <option value="${province.code}">${province.name}</option>
            `).join('')}
        `;
    }

    // 更新城市选项
    updateCityOptions() {
        const provinceCode = document.getElementById('province').value;
        const citySelect = document.getElementById('city');
        if (!citySelect) return;

        const province = this.regions.find(p => p.code === provinceCode);
        if (!province) return;

        citySelect.innerHTML = `
            <option value="">选择城市</option>
            ${province.cities.map(city => `
                <option value="${city.code}">${city.name}</option>
            `).join('')}
        `;
        citySelect.disabled = false;
        document.getElementById('district').innerHTML = '<option value="">选择区县</option>';
        document.getElementById('district').disabled = true;
    }

    // 更新区县选项
    updateDistrictOptions() {
        const provinceCode = document.getElementById('province').value;
        const cityCode = document.getElementById('city').value;
        const districtSelect = document.getElementById('district');
        if (!districtSelect) return;

        const province = this.regions.find(p => p.code === provinceCode);
        const city = province?.cities.find(c => c.code === cityCode);
        if (!city) return;

        districtSelect.innerHTML = `
            <option value="">选择区县</option>
            ${city.districts.map(district => `
                <option value="${district.code}">${district.name}</option>
            `).join('')}
        `;
        districtSelect.disabled = false;
    }
}

// 创建地址管理���例
const addressManager = new AddressManager();

export default addressManager; 