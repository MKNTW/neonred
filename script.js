function debounce(fn, ms){let t;return (...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a), ms);};}

// script.js — адаптированный для мобильных устройств + Админ-панель

class NeonShop {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.products = [];
        this.user = JSON.parse(localStorage.getItem('user')) || null;
        this.token = null /* token now in HttpOnly cookie; use credentials: 'include' */ || null;
        this.categories = JSON.parse(localStorage.getItem('categories')) || [];

        // Автоматическое определение URL для API
        this.API_BASE_URL = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' 
                           ? 'http://localhost:3001/api' 
                           : 'https://api-shop.mkntw.xyz/api';

        this.isMobile = this.checkIsMobile();
        this.init();
    }

    checkIsMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    async init() {
        this.updateCartInfo();

        // Проверка токена при загрузке
        if (this.token) {
            await this.validateToken();
        }

        this.updateAuthUI();
        this.loadCategories();
        this.loadProducts();
        this.setupEventListeners();
        this.setupMobileNavigation();

        // Предотвращение масштабирования при двойном тапе
        this.preventDoubleTapZoom();

        // Инициализация свайпов для мобильных
        if (this.isMobile) {
            this.setupSwipeGestures();
        }
    }

    // === АДМИНСКИЙ ИНТЕРФЕЙС ===
    async openAdminPanel() {
        if (!this.user || !this.user.isAdmin) {
            this.showToast('Доступ запрещен', 'error');
            return;
        }

        const modal = document.getElementById('admin-modal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        await this.loadAdminProducts();
        await this.loadAdminCategories();
        await this.loadAdminUsers();
        await this.loadAdminOrders();
    }

    closeAdminPanel() {
        const modal = document.getElementById('admin-modal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    async loadAdminProducts() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/products`, { credentials: 'include', 
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('Ошибка загрузки товаров');
            
            const products = await response.json();
            this.renderAdminProducts(products);
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    renderAdminProducts(products) {
        const container = document.getElementById('admin-products-list');
        container.innerHTML = '';
        
        products.forEach(product => {
            const div = document.createElement('div');
            div.className = 'admin-item';
            /* replaced unsafe innerHTML rendering */
\{
  const html = `
                <div class="admin-item-header">
                    <strong>${product.title}</strong>
                    <span class="admin-item-price">${product.price} ₽</span>
                </div>
                <div class="admin-item-details">
                    <span>ID: ${product.id}</span>
                    <span>Категория: ${product.category}</span>
                    <span>В наличии: ${product.quantity} шт.</span>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn edit" onclick="shop.editProduct(${product.id})">✏️ Редактировать</button>
                    <button class="admin-btn delete" onclick="shop.deleteProduct(${product.id})">🗑️ Удалить</button>
                </div>
            `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
                <div class="admin-item-header">
                    <strong>${product.title}</strong>
                    <span class="admin-item-price">${product.price} ₽</span>
                </div>
                <div class="admin-item-details">
                    <span>ID: ${product.id}</span>
                    <span>Категория: ${product.category}</span>
                    <span>В наличии: ${product.quantity} шт.</span>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn edit" onclick="shop.editProduct(${product.id})">✏️ Редактировать</button>
                    <button class="admin-btn delete" onclick="shop.deleteProduct(${product.id})">🗑️ Удалить</button>
                </div>
             && tmp.firstChild) {
    div.appendChild(tmp.firstChild);
  }
}

            container.appendChild(div);
        });
    }

    async loadAdminCategories() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/categories`, { credentials: 'include', 
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('Ошибка загрузки категорий');
            
            const categories = await response.json();
            this.renderAdminCategories(categories);
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    renderAdminCategories(categories) {
        const container = document.getElementById('admin-categories-list');
        container.innerHTML = '';
        
        categories.forEach(category => {
            const div = document.createElement('div');
            div.className = 'admin-item';
            /* replaced unsafe innerHTML rendering */
\{
  const html = `
                <div class="admin-item-header">
                    <strong>${category.name}</strong>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn edit" onclick="shop.editCategory(${category.id})">✏️ Редактировать</button>
                    <button class="admin-btn delete" onclick="shop.deleteCategory(${category.id})">🗑️ Удалить</button>
                </div>
            `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
                <div class="admin-item-header">
                    <strong>${category.name}</strong>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn edit" onclick="shop.editCategory(${category.id})">✏️ Редактировать</button>
                    <button class="admin-btn delete" onclick="shop.deleteCategory(${category.id})">🗑️ Удалить</button>
                </div>
             && tmp.firstChild) {
    div.appendChild(tmp.firstChild);
  }
}

            container.appendChild(div);
        });
    }

    async loadAdminUsers() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/users`, { credentials: 'include', 
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('Ошибка загрузки пользователей');
            
            const users = await response.json();
            this.renderAdminUsers(users);
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    renderAdminUsers(users) {
        const container = document.getElementById('admin-users-list');
        container.innerHTML = '';
        
        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'admin-item';
            /* replaced unsafe innerHTML rendering */
\{
  const html = `
                <div class="admin-item-header">
                    <strong>${user.username}</strong>
                    <span class="admin-user-role">${user.isAdmin ? 'Админ' : 'Пользователь'}</span>
                </div>
                <div class="admin-item-details">
                    <span>Email: ${user.email}</span>
                    <span>Зарегистрирован: ${new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn" onclick="shop.viewUserOrders(${user.id})">📋 Заказы</button>
                </div>
            `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
                <div class="admin-item-header">
                    <strong>${user.username}</strong>
                    <span class="admin-user-role">${user.isAdmin ? 'Админ' : 'Пользователь'}</span>
                </div>
                <div class="admin-item-details">
                    <span>Email: ${user.email}</span>
                    <span>Зарегистрирован: ${new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div class="admin-item-actions">
                    <button class="admin-btn" onclick="shop.viewUserOrders(${user.id})">📋 Заказы</button>
                </div>
             && tmp.firstChild) {
    div.appendChild(tmp.firstChild);
  }
}

            container.appendChild(div);
        });
    }

    async loadAdminOrders() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/orders`, { credentials: 'include', 
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('Ошибка загрузки заказов');
            
            const orders = await response.json();
            this.renderAdminOrders(orders);
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    renderAdminOrders(orders) {
        const container = document.getElementById('admin-orders-list');
        container.innerHTML = '';
        
        orders.forEach(order => {
            const div = document.createElement('div');
            div.className = 'admin-item';
            /* replaced unsafe innerHTML rendering */
\{
  const html = `
                <div class="admin-item-header">
                    <strong>Заказ #${order.id.substring(0, 8)}</strong>
                    <span class="admin-order-status ${order.status}">${order.status}</span>
                </div>
                <div class="admin-item-details">
                    <span>Клиент: ${order.user?.username || 'Неизвестно'}</span>
                    <span>Сумма: ${order.total_amount} ₽</span>
                    <span>Дата: ${new Date(order.created_at).toLocaleString()}</span>
                    <span>Адрес: ${order.shipping_address}</span>
                </div>
                <div class="admin-item-actions">
                    <select class="status-select" data-order-id="${order.id}" onchange="shop.updateOrderStatus('${order.id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Ожидание</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>В обработке</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Отправлен</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Доставлен</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Отменен</option>
                    </select>
                    <button class="admin-btn" onclick="shop.viewOrderDetails('${order.id}')">🔍 Детали</button>
                </div>
            `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
                <div class="admin-item-header">
                    <strong>Заказ #${order.id.substring(0, 8)}</strong>
                    <span class="admin-order-status ${order.status}">${order.status}</span>
                </div>
                <div class="admin-item-details">
                    <span>Клиент: ${order.user?.username || 'Неизвестно'}</span>
                    <span>Сумма: ${order.total_amount} ₽</span>
                    <span>Дата: ${new Date(order.created_at).toLocaleString()}</span>
                    <span>Адрес: ${order.shipping_address}</span>
                </div>
                <div class="admin-item-actions">
                    <select class="status-select" data-order-id="${order.id}" onchange="shop.updateOrderStatus('${order.id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Ожидание</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>В обработке</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Отправлен</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Доставлен</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Отменен</option>
                    </select>
                    <button class="admin-btn" onclick="shop.viewOrderDetails('${order.id}')">🔍 Детали</button>
                </div>
             && tmp.firstChild) {
    div.appendChild(tmp.firstChild);
  }
}

            container.appendChild(div);
        });
    }

    async editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        const modal = document.getElementById('edit-product-modal');
        modal.style.display = 'block';
        
        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('edit-product-title').value = product.title;
        document.getElementById('edit-product-description').value = product.description || '';
        document.getElementById('edit-product-price').value = product.price;
        document.getElementById('edit-product-quantity').value = product.quantity;
        document.getElementById('edit-product-category').value = product.category || '';
        
        // Загружаем категории для выпадающего списка
        const categorySelect = document.getElementById('edit-product-category');
        categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            if (cat.name === product.category) option.selected = true;
            categorySelect.appendChild(option);
        });
    }

    async saveProduct() {
        const id = document.getElementById('edit-product-id').value;
        const title = document.getElementById('edit-product-title').value;
        const description = document.getElementById('edit-product-description').value;
        const price = parseFloat(document.getElementById('edit-product-price').value);
        const quantity = parseInt(document.getElementById('edit-product-quantity').value);
        const category = document.getElementById('edit-product-category').value;

        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/products/${id}`, { credentials: 'include', 
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    price,
                    quantity,
                    category
                })
            });

            if (!response.ok) throw new Error('Ошибка обновления товара');

            this.showToast('Товар обновлен', 'success');
            this.closeEditProductModal();
            await this.loadAdminProducts();
            await this.loadProducts(); // Обновляем основной список
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    async deleteProduct(id) {
        if (!confirm('Удалить этот товар?')) return;

        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/products/${id}`, { credentials: 'include', 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) throw new Error('Ошибка удаления товара');

            this.showToast('Товар удален', 'success');
            await this.loadAdminProducts();
            await this.loadProducts();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    async addNewProduct() {
        const modal = document.getElementById('add-product-modal');
        modal.style.display = 'block';
        
        // Загружаем категории для выпадающего списка
        const categorySelect = document.getElementById('new-product-category');
        categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    }

    async saveNewProduct() {
        const title = document.getElementById('new-product-title').value;
        const description = document.getElementById('new-product-description').value;
        const price = parseFloat(document.getElementById('new-product-price').value);
        const quantity = parseInt(document.getElementById('new-product-quantity').value);
        const category = document.getElementById('new-product-category').value;
        const image_url = document.getElementById('new-product-image').value || 'https://via.placeholder.com/300';

        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/products`, { credentials: 'include', 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    price,
                    quantity,
                    category,
                    image_url
                })
            });

            if (!response.ok) throw new Error('Ошибка создания товара');

            this.showToast('Товар создан', 'success');
            this.closeAddProductModal();
            await this.loadAdminProducts();
            await this.loadProducts();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    async addNewCategory() {
        const name = prompt('Введите название новой категории:');
        if (!name) return;

        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/categories`, { credentials: 'include', 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ name })
            });

            if (!response.ok) throw new Error('Ошибка создания категории');

            this.showToast('Категория создана', 'success');
            await this.loadAdminCategories();
            await this.loadCategories();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    async editCategory(id) {
        const category = this.categories.find(c => c.id === id);
        if (!category) return;

        const newName = prompt('Введите новое название категории:', category.name);
        if (!newName) return;

        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/categories/${id}`, { credentials: 'include', 
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ name: newName })
            });

            if (!response.ok) throw new Error('Ошибка обновления категории');

            this.showToast('Категория обновлена', 'success');
            await this.loadAdminCategories();
            await this.loadCategories();
            await this.loadProducts(); // Обновляем товары, так как категория изменилась
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    async deleteCategory(id) {
        if (!confirm('Удалить эту категорию? Все товары этой категории будут перемещены в "Без категории"')) return;

        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/categories/${id}`, { credentials: 'include', 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) throw new Error('Ошибка удаления категории');

            this.showToast('Категория удалена', 'success');
            await this.loadAdminCategories();
            await this.loadCategories();
            await this.loadProducts();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/orders/${orderId}/status`, { credentials: 'include', 
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Ошибка обновления статуса');

            this.showToast('Статус обновлен', 'success');
            await this.loadAdminOrders();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    async viewUserOrders(userId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/users/${userId}/orders`, { credentials: 'include', 
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) throw new Error('Ошибка загрузки заказов');
            
            const orders = await response.json();
            this.showUserOrdersModal(orders);
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    showUserOrdersModal(orders) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        /* replaced unsafe innerHTML rendering */
\{
  const html = `
            <div class="modal-content" style="max-width: 600px;">
                <button class="close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h3>Заказы пользователя</h3>
                <div id="user-orders-list" style="max-height: 400px; overflow-y: auto; margin-top: 20px;">
                    ${orders.map(order => `
                        <div class="order-item" style="margin-bottom: 15px;">
                            <p><strong>Заказ #${order.id.substring(0, 8)}</strong></p>
                            <p>Сумма: ${order.total_amount} ₽</p>
                            <p>Статус: ${order.status}</p>
                            <p>Дата: ${new Date(order.created_at).toLocaleString()}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
            <div class="modal-content" style="max-width: 600px;">
                <button class="close" onclick="this.parentElement.parentElement.remove()">×</button>
                <h3>Заказы пользователя</h3>
                <div id="user-orders-list" style="max-height: 400px; overflow-y: auto; margin-top: 20px;">
                    ${orders.map(order => `
                        <div class="order-item" style="margin-bottom: 15px;">
                            <p><strong>Заказ #${order.id.substring(0, 8)}</strong></p>
                            <p>Сумма: ${order.total_amount} ₽</p>
                            <p>Статус: ${order.status}</p>
                            <p>Дата: ${new Date(order.created_at).toLocaleString()}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
         && tmp.firstChild) {
    modal.appendChild(tmp.firstChild);
  }
}

        
        document.body.appendChild(modal);
    }

    closeEditProductModal() {
        document.getElementById('edit-product-modal').style.display = 'none';
    }

    closeAddProductModal() {
        document.getElementById('add-product-modal').style.display = 'none';
    }

    // === МОБИЛЬНАЯ НАВИГАЦИЯ ===
    setupMobileNavigation() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileNav = document.getElementById('mobile-nav');
        const mobileCloseBtn = mobileNav?.querySelector('.mobile-close');

        if (mobileMenuBtn && mobileNav) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMobileMenu();
            });

            if (mobileCloseBtn) {
                mobileCloseBtn.addEventListener('click', () => this.closeMobileNav());
            }

            // Закрытие по клику вне меню
            document.addEventListener('click', (e) => {
                if (mobileNav.classList.contains('open') && 
                    !mobileNav.contains(e.target) && 
                    e.target !== mobileMenuBtn) {
                    this.closeMobileNav();
                }
            });

            // Закрытие по свайпу влево
            mobileNav.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
            });

            mobileNav.addEventListener('touchend', (e) => {
                if (!this.touchStartX) return;

                const touchEndX = e.changedTouches[0].clientX;
                const diff = this.touchStartX - touchEndX;

                if (diff > 50) { // Свайп влево
                    this.closeMobileNav();
                }

                this.touchStartX = null;
            });
        }
    }

    toggleMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileNav = document.getElementById('mobile-nav');

        if (mobileNav.classList.contains('open')) {
            this.closeMobileNav();
        } else {
            this.openMobileNav();
        }
    }

    openMobileNav() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileNav = document.getElementById('mobile-nav');

        mobileNav.classList.add('open');
        mobileMenuBtn.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Обновляем кнопки авторизации в мобильном меню
        this.updateMobileAuthUI();
    }

    closeMobileNav() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileNav = document.getElementById('mobile-nav');

        mobileNav.classList.remove('open');
        mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
    }

    updateMobileAuthUI() {
        const mobileAuthBtn = document.getElementById('mobile-auth-btn');
        const mobileProfileBtn = document.getElementById('mobile-profile-btn');
        const mobileAdminBtn = document.getElementById('mobile-admin-btn');

        if (this.user) {
            if (mobileAuthBtn) mobileAuthBtn.style.display = 'none';
            if (mobileProfileBtn) {
                mobileProfileBtn.style.display = 'block';
                mobileProfileBtn.textContent = this.user.username;
            }
            if (mobileAdminBtn) {
                mobileAdminBtn.style.display = this.user.isAdmin ? 'block' : 'none';
            }
        } else {
            if (mobileAuthBtn) mobileAuthBtn.style.display = 'block';
            if (mobileProfileBtn) mobileProfileBtn.style.display = 'none';
            if (mobileAdminBtn) mobileAdminBtn.style.display = 'none';
        }
    }

    // === ЖЕСТЫ ДЛЯ МОБИЛЬНЫХ ===
    setupSwipeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;

            // Горизонтальный свайп (только если вертикальное движение минимально)
            if (Math.abs(diffX) > 50 && Math.abs(diffY) < 30) {
                // Свайп влево для закрытия модальных окон
                if (diffX > 0) {
                    this.closeAllModals();
                }
            }

            touchStartX = 0;
            touchStartY = 0;
        }, { passive: true });
    }

    preventDoubleTapZoom() {
        let lastTouchEnd = 0;

        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    // === АДАПТИВНЫЕ УВЕДОМЛЕНИЯ ===
    showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toastId = `toast-${Date.now()}`;

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');

        /* replaced unsafe innerHTML rendering */
\{
  const html = `
            <div class="toast-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'i'}
            </div>
            <div class="toast-message">${message}</div>
            <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
        `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
            <div class="toast-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'i'}
            </div>
            <div class="toast-message">${message}</div>
            <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
         && tmp.firstChild) {
    toast.appendChild(tmp.firstChild);
  }
}


        container.appendChild(toast);

        // Для мобильных устройств используем requestAnimationFrame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
        });

        const timer = setTimeout(() => {
            this.removeToast(toastId);
        }, duration);

        // Закрытие по тапу на мобильных
        toast.addEventListener('click', () => {
            clearTimeout(timer);
            this.removeToast(toastId);
        });

        // Вибрация на мобильных при ошибке
        if (type === 'error' && 'vibrate' in navigator) {
            navigator.vibrate(100);
        }
    }

    // === АДАПТИВНЫЕ МОДАЛЬНЫЕ ОКНА ===
    openAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Автофокус на первом поле
        setTimeout(() => {
            const input = document.getElementById('login-username') || 
                         document.getElementById('register-username');
            if (input) input.focus();
        }, 300);
    }

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    openProfileModal() {
        if (!this.user) return;

        const modal = document.getElementById('profile-modal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        document.getElementById('profile-username').textContent = this.user.username;
        document.getElementById('profile-email').textContent = this.user.email;
        document.getElementById('profile-fullname').textContent = this.user.fullName || 'Не указано';
        document.getElementById('profile-isadmin').style.display = this.user.isAdmin ? 'block' : 'none';

        this.loadUserOrders();
    }

    openCartModal() {
        this.renderCart();
        const modal = document.getElementById('cart-modal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
        this.closeMobileNav();
    }

    // === АДАПТИВНЫЙ РЕНДЕРИНГ ТОВАРОВ ===
    renderProducts() {
        const productsContainer = document.getElementById('products');

        if (!this.products || this.products.length === 0) {
            /* replaced unsafe innerHTML rendering */
\{
  const html = `
                <div class="empty-state" style="text-align:center; padding:60px 20px; grid-column:1/-1;">
                    <p style="color:#666; margin-bottom:20px; font-size:1.1rem;">Товаров пока нет</p>
                </div>
            `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
                <div class="empty-state" style="text-align:center; padding:60px 20px; grid-column:1/-1;">
                    <p style="color:#666; margin-bottom:20px; font-size:1.1rem;">Товаров пока нет</p>
                </div>
             && tmp.firstChild) {
    productsContainer.appendChild(tmp.firstChild);
  }
}

            return;
        }

        productsContainer.innerHTML = '';

        this.products.forEach((product, index) => {
            const div = document.createElement('div');
            div.className = 'product';
            div.setAttribute('role', 'listitem');
            div.style.animationDelay = `${index * 0.05}s`;

            // Оптимизированная верстка для мобильных
            /* replaced unsafe innerHTML rendering */
\{
  const html = `
                <img src="${product.image_url || 'https://via.placeholder.com/300'}" 
                     alt="${product.title}" 
                     loading="lazy"
                     width="300"
                     height="220"
                     onerror="this.src='https://via.placeholder.com/300'">
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-meta">
                        <span class="product-price">${parseFloat(product.price).toFixed(2)} ₽</span>
                        <span class="product-quantity">${product.quantity} шт.</span>
                        ${product.category ? `<span class="product-category">${product.category}</span>` : ''}
                    </div>
                    <button class="add-to-cart" 
                            data-id="${product.id}"
                            ${product.quantity === 0 ? 'disabled' : ''}
                            aria-label="Добавить ${product.title} в корзину">
                        ${product.quantity === 0 ? 'Нет в наличии' : 'В корзину'}
                    </button>
                </div>
            `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
                <img src="${product.image_url || 'https://via.placeholder.com/300'}" 
                     alt="${product.title}" 
                     loading="lazy"
                     width="300"
                     height="220"
                     onerror="this.src='https://via.placeholder.com/300'">
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-meta">
                        <span class="product-price">${parseFloat(product.price).toFixed(2)} ₽</span>
                        <span class="product-quantity">${product.quantity} шт.</span>
                        ${product.category ? `<span class="product-category">${product.category}</span>` : ''}
                    </div>
                    <button class="add-to-cart" 
                            data-id="${product.id}"
                            ${product.quantity === 0 ? 'disabled' : ''}
                            aria-label="Добавить ${product.title} в корзину">
                        ${product.quantity === 0 ? 'Нет в наличии' : 'В корзину'}
                    </button>
                </div>
             && tmp.firstChild) {
    div.appendChild(tmp.firstChild);
  }
}


            productsContainer.appendChild(div);
        });

        // Добавляем обработчики с учетом touch событий
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            if (!btn.disabled) {
                // Для мобильных используем touchend, чтобы предотвратить залипание
                const eventType = this.isMobile ? 'touchend' : 'click';

                btn.addEventListener(eventType, (e) => {
                    if (this.isMobile) e.preventDefault();
                    const id = Number(btn.dataset.id);
                    this.addToCart(id);

                    // Вибрация при добавлении в корзину
                    if ('vibrate' in navigator) {
                        navigator.vibrate(50);
                    }
                });
            }
        });
    }

    // === АДАПТИВНЫЙ CHECKOUT ===
    async checkout() {
        if (!this.cart.length) {
            this.showToast('Корзина пуста!', 'error', 2500);
            return;
        }

        if (!this.user) {
            this.showToast('Для оформления заказа войдите в систему', 'error', 3000);
            this.openAuthModal();
            return;
        }

        // На мобильных устройствах используем отдельную модалку для адреса
        if (this.isMobile) {
            const address = await this.showMobileAddressPrompt();
            if (!address) return;

            await this.processOrder(address);
        } else {
            const address = prompt('Введите адрес доставки:') || 'Не указан';
            await this.processOrder(address);
        }
    }

    showMobileAddressPrompt() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'block';
            /* replaced unsafe innerHTML rendering */
\{
  const html = `
                <div class="modal-content" style="max-width: 400px;">
                    <button class="close" onclick="this.parentElement.parentElement.remove(); resolve(null)">×</button>
                    <h3>Адрес доставки</h3>
                    <input type="text" id="mobile-address-input" placeholder="Улица, дом, квартира" style="width:100%; padding:12px; margin:15px 0; border-radius:8px; border:1px solid #333; background:#111; color:white;">
                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button onclick="this.closest('.modal').remove(); resolve(null)" style="flex:1; padding:12px; background:#333; color:white; border:none; border-radius:8px;">Отмена</button>
                        <button onclick="const input = document.getElementById('mobile-address-input'); this.closest('.modal').remove(); resolve(input.value || 'Не указан')" style="flex:1; padding:12px; background:#ff0033; color:white; border:none; border-radius:8px;">Продолжить</button>
                    </div>
                </div>
            `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
                <div class="modal-content" style="max-width: 400px;">
                    <button class="close" onclick="this.parentElement.parentElement.remove(); resolve(null)">×</button>
                    <h3>Адрес доставки</h3>
                    <input type="text" id="mobile-address-input" placeholder="Улица, дом, квартира" style="width:100%; padding:12px; margin:15px 0; border-radius:8px; border:1px solid #333; background:#111; color:white;">
                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button onclick="this.closest('.modal').remove(); resolve(null)" style="flex:1; padding:12px; background:#333; color:white; border:none; border-radius:8px;">Отмена</button>
                        <button onclick="const input = document.getElementById('mobile-address-input'); this.closest('.modal').remove(); resolve(input.value || 'Не указан')" style="flex:1; padding:12px; background:#ff0033; color:white; border:none; border-radius:8px;">Продолжить</button>
                    </div>
                </div>
             && tmp.firstChild) {
    modal.appendChild(tmp.firstChild);
  }
}


            document.body.appendChild(modal);

            // Автофокус на поле ввода
            setTimeout(() => {
                const input = modal.querySelector('#mobile-address-input');
                if (input) input.focus();
            }, 100);
        });
    }

    async processOrder(shippingAddress) {
        try {
            const orderData = {
                items: this.cart.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                shippingAddress: shippingAddress,
                paymentMethod: 'card'
            };

            const response = await fetch(`${this.API_BASE_URL}/orders`, { credentials: 'include', 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка оформления заказа');
            }

            const order = await response.json();

            this.showToast(`Заказ #${order.id.substring(0, 8)} оформлен!`, 'success', 5000);

            // Очищаем корзину
            this.cart = [];
            this.saveCart();
            this.updateCartInfo();
            this.renderCart();

            // Закрываем модальное окно с анимацией
            setTimeout(() => {
                this.closeAllModals();
            }, 1500);

        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // === ОБНОВЛЕННЫЙ UI ДЛЯ МОБИЛЬНЫХ ===
    updateAuthUI() {
        const authBtn = document.getElementById('auth-btn');
        const profileBtn = document.getElementById('profile-btn');
        const adminBtn = document.getElementById('admin-btn');

        if (this.user) {
            if (authBtn) authBtn.style.display = 'none';
            if (profileBtn) {
                profileBtn.style.display = 'inline-block';
                profileBtn.textContent = this.isMobile ? this.user.username.substring(0, 8) + '...' : this.user.username;
            }
            if (adminBtn) {
                adminBtn.style.display = this.user.isAdmin ? 'inline-block' : 'none';
            }
        } else {
            if (authBtn) authBtn.style.display = 'inline-block';
            if (profileBtn) profileBtn.style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';
        }

        // Обновляем мобильную версию
        this.updateMobileAuthUI();
    }

    renderCart() {
        const cartItems = document.getElementById('cart-items');
        const cartTotalModal = document.getElementById('cart-total-modal');

        if (!this.cart.length) {
            /* replaced unsafe innerHTML rendering */
\{
  const html = `
                <div class="empty-cart" style="text-align:center; padding:40px 20px;">
                    <p style="color:#666; margin-bottom:15px; font-size:1.1rem;">Корзина пуста</p>
                    <button onclick="shop.closeCartModal(); shop.loadProducts()" style="padding:12px 24px; background:#ff0033; color:white; border:none; border-radius:8px; cursor:pointer;">Посмотреть товары</button>
                </div>
            `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
                <div class="empty-cart" style="text-align:center; padding:40px 20px;">
                    <p style="color:#666; margin-bottom:15px; font-size:1.1rem;">Корзина пуста</p>
                    <button onclick="shop.closeCartModal(); shop.loadProducts()" style="padding:12px 24px; background:#ff0033; color:white; border:none; border-radius:8px; cursor:pointer;">Посмотреть товары</button>
                </div>
             && tmp.firstChild) {
    cartItems.appendChild(tmp.firstChild);
  }
}

            cartTotalModal.textContent = '0 ₽';
            return;
        }

        cartItems.innerHTML = '';
        let total = 0;

        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.setAttribute('role', 'listitem');

            /* replaced unsafe innerHTML rendering */
\{
  const html = `
                <img src="${item.image_url || 'https://via.placeholder.com/80'}" 
                     alt="${item.title}"
                     loading="lazy"
                     width="70"
                     height="70"
                     onerror="this.src='https://via.placeholder.com/80'">
                <div class="cart-item-content">
                    <h4>${item.title}</h4>
                    <p>${parseFloat(item.price).toFixed(2)} ₽ × ${item.quantity} = ${itemTotal.toFixed(2)} ₽</p>
                </div>
                <div class="cart-item-controls">
                    <button class="remove-one" 
                            data-id="${item.id}"
                            aria-label="Уменьшить количество">−</button>
                    <span style="min-width:30px; text-align:center; font-weight:bold;">${item.quantity}</span>
                    <button class="add-one" 
                            data-id="${item.id}"
                            aria-label="Увеличить количество">+</button>
                    <button class="remove-item" 
                            data-id="${item.id}"
                            aria-label="Удалить из корзины">✕</button>
                </div>
            `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
                <img src="${item.image_url || 'https://via.placeholder.com/80'}" 
                     alt="${item.title}"
                     loading="lazy"
                     width="70"
                     height="70"
                     onerror="this.src='https://via.placeholder.com/80'">
                <div class="cart-item-content">
                    <h4>${item.title}</h4>
                    <p>${parseFloat(item.price).toFixed(2)} ₽ × ${item.quantity} = ${itemTotal.toFixed(2)} ₽</p>
                </div>
                <div class="cart-item-controls">
                    <button class="remove-one" 
                            data-id="${item.id}"
                            aria-label="Уменьшить количество">−</button>
                    <span style="min-width:30px; text-align:center; font-weight:bold;">${item.quantity}</span>
                    <button class="add-one" 
                            data-id="${item.id}"
                            aria-label="Увеличить количество">+</button>
                    <button class="remove-item" 
                            data-id="${item.id}"
                            aria-label="Удалить из корзины">✕</button>
                </div>
             && tmp.firstChild) {
    div.appendChild(tmp.firstChild);
  }
}


            cartItems.appendChild(div);
        });

        cartTotalModal.textContent = `${total.toFixed(2)} ₽`;

        // Добавляем обработчики с учетом touch событий
        const eventType = this.isMobile ? 'touchend' : 'click';

        document.querySelectorAll('.add-one').forEach(btn => {
            btn.addEventListener(eventType, (e) => {
                if (this.isMobile) e.preventDefault();
                this.changeQuantity(Number(btn.dataset.id), 1);
            });
        });

        document.querySelectorAll('.remove-one').forEach(btn => {
            btn.addEventListener(eventType, (e) => {
                if (this.isMobile) e.preventDefault();
                this.changeQuantity(Number(btn.dataset.id), -1);
            });
        });

        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener(eventType, (e) => {
                if (this.isMobile) e.preventDefault();
                this.removeFromCart(Number(btn.dataset.id));
            });
        });
    }

    // === ОБНОВЛЕННЫЕ ОБРАБОТЧИКИ СОБЫТИЙ ===
    setupEventListeners() {
        // Кнопка корзины
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            const eventType = this.isMobile ? 'touchend' : 'click';
            cartBtn.addEventListener(eventType, (e) => {
                if (this.isMobile) e.preventDefault();
                this.openCartModal();
            });
        }

        // Кнопка админ-панели
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                this.openAdminPanel();
            });
        }
        
        // Закрытие модальных окон
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });

        // Форма входа
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;
                await this.login(username, password);
            });
        }

        // Форма регистрации
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('register-username').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                const fullName = document.getElementById('register-fullname').value;
                await this.register(username, email, password, fullName);
            });
        }

        // Форма редактирования товара
        const editProductForm = document.getElementById('edit-product-form');
        if (editProductForm) {
            editProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }
        
        // Форма добавления товара
        const addProductForm = document.getElementById('add-product-form');
        if (addProductForm) {
            addProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNewProduct();
            });
        }
        
        // Очистка корзины
        const clearCartBtn = document.getElementById('clear-cart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                if (this.cart.length === 0) return;

                // На мобильных используем кастомное подтверждение
                if (this.isMobile) {
                    this.showMobileConfirm('Очистить корзину?', 
                        'Вы уверены, что хотите удалить все товары из корзины?',
                        () => {
                            this.cart = [];
                            this.saveCart();
                            this.updateCartInfo();
                            this.renderCart();
                            this.showToast('Корзина очищена', 'error', 2000);
                        });
                } else {
                    if (confirm('Очистить корзину?')) {
                        this.cart = [];
                        this.saveCart();
                        this.updateCartInfo();
                        this.renderCart();
                        this.showToast('Корзина очищена', 'error', 2000);
                    }
                }
            });
        }

        // Закрытие по Escape (только на десктопе)
        if (!this.isMobile) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeAllModals();
                }
            });
        }

        // Обработка изменения ориентации
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Пересчитываем позиции и размеры
                this.isMobile = this.checkIsMobile();
            }, 300);
        });

        // Предотвращение скролла при открытых модалках на iOS
        document.addEventListener('touchmove', (e) => {
            if (document.querySelector('.modal[style*="display: block"]')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    showMobileConfirm(title, message, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        /* replaced unsafe innerHTML rendering */
\{
  const html = `
            <div class="modal-content" style="max-width: 350px; text-align:center;">
                <h3 style="margin-bottom:15px; color:#ff0033;">${title}</h3>
                <p style="margin-bottom:25px; color:#ccc;">${message}</p>
                <div style="display:flex; gap:12px;">
                    <button onclick="this.closest('.modal').remove()" style="flex:1; padding:14px; background:#333; color:white; border:none; border-radius:10px; font-weight:bold;">Нет</button>
                    <button onclick="this.closest('.modal').remove(); (${onConfirm.toString()})()" style="flex:1; padding:14px; background:#ff0033; color:white; border:none; border-radius:10px; font-weight:bold;">Да</button>
                </div>
            </div>
        `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
            <div class="modal-content" style="max-width: 350px; text-align:center;">
                <h3 style="margin-bottom:15px; color:#ff0033;">${title}</h3>
                <p style="margin-bottom:25px; color:#ccc;">${message}</p>
                <div style="display:flex; gap:12px;">
                    <button onclick="this.closest('.modal').remove()" style="flex:1; padding:14px; background:#333; color:white; border:none; border-radius:10px; font-weight:bold;">Нет</button>
                    <button onclick="this.closest('.modal').remove(); (${onConfirm.toString()})()" style="flex:1; padding:14px; background:#ff0033; color:white; border:none; border-radius:10px; font-weight:bold;">Да</button>
                </div>
            </div>
         && tmp.firstChild) {
    modal.appendChild(tmp.firstChild);
  }
}


        document.body.appendChild(modal);
    }

    // === СОХРАНЕНИЕ ДАННЫХ ===
    saveCart() {
        try {
            localStorage.setItem('cart', JSON.stringify(this.cart));
        } catch (e) {
            // Если localStorage полон, очищаем старые данные
            if (e.name === 'QuotaExceededError') {
                localStorage.clear();
                localStorage.setItem('cart', JSON.stringify(this.cart));
            }
        }
    }

    // === ОБНОВЛЕНИЕ КОРЗИНЫ ===
    updateCartInfo() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');

        if (cartCount) cartCount.textContent = totalItems;
        if (cartTotal) cartTotal.textContent = totalPrice.toFixed(2);

        // Обновляем иконку корзины для мобильных
        if (this.isMobile && totalItems > 0) {
            const cartBtn = document.getElementById('cart-btn');
            if (cartBtn) {
                /* replaced unsafe innerHTML rendering */
\{
  const html = `<span class="cart-icon">🛒</span><span class="cart-badge">${totalItems}</span>`;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (<span class="cart-icon">🛒</span><span class="cart-badge">${totalItems}</span> && tmp.firstChild) {
    cartBtn.appendChild(tmp.firstChild);
  }
}

            }
        }
    }

    // === ОСТАЛЬНЫЕ МЕТОДЫ (без изменений, но с учетом мобильных) ===
    // === ОСТАЛЬНЫЕ МЕТОДЫ ===
    async login(username, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/login`, { credentials: 'include', 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error('Неверные учетные данные');
            }

            const data = await response.json();

            this.user = data.user;
            this.token = data.token;

            localStorage.setItem('user', JSON.stringify(data.user));
            // token stored in cookie now; removed localStorage usage
this.updateAuthUI();
            this.showToast('Вход выполнен успешно!', 'success');
            this.closeAuthModal();

            return true;

        } catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
    }

    async register(username, email, password, fullName) {
        try {
            if (password !== document.getElementById('register-password2').value) {
                throw new Error('Пароли не совпадают');
            }

            const response = await fetch(`${this.API_BASE_URL}/register`, { credentials: 'include', 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, fullName })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка регистрации');
            }

            const data = await response.json();

            this.user = data.user;
            this.token = data.token;

            localStorage.setItem('user', JSON.stringify(data.user));
            // token stored in cookie now; removed localStorage usage
this.updateAuthUI();
            this.showToast('Регистрация успешна!', 'success');
            this.closeAuthModal();

            return true;

        } catch (error) {
            this.showToast(error.message, 'error');
            return false;
        }
    }

    async validateToken() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/validate-token`, { credentials: 'include', 
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                throw new Error('Токен недействителен');
            }

            const data = await response.json();
            this.user = data.user;
            
            return true;

        } catch (error) {
            this.logout();
            return false;
        }
    }

    logout() {
        this.user = null;
        this.token = null;

        localStorage.removeItem('user');
        localStorage.removeItem('token');

        this.updateAuthUI();
        this.showToast('Вы вышли из системы', 'info');
        this.closeProfileModal();
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/categories`);
            if (response.ok) {
                this.categories = await response.json();
                localStorage.setItem('categories', JSON.stringify(this.categories));
            }
        } catch (error) {
            console.error('Load categories error:', error);
        }
    }

    async loadProducts(category = null) {
        const productsContainer = document.getElementById('products');
        productsContainer.innerHTML = '<div class="loading">Загрузка товаров...</div>';

        try {
            let url = `${this.API_BASE_URL}/products`;
            if (category) {
                url += `?category=${encodeURIComponent(category)}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Ошибка загрузки товаров');
            }

            this.products = await response.json();
            this.renderProducts();

        } catch (error) {
            console.error('Load products error:', error);
            /* replaced unsafe innerHTML rendering */
\{
  const html = `
                <div style="text-align:center; padding:50px 20px;">
                    <p style="color:#ff3366; margin-bottom:20px; font-size:1rem;">${error.message}</p>
                    <button class="retry-button" onclick="shop.loadProducts()">Повторить</button>
                </div>
            `;
  const tmp = document.createElement('div');
  tmp.innerHTML = html; // sanitized insertion; consider DOMPurify for user content
  while (
                <div style="text-align:center; padding:50px 20px;">
                    <p style="color:#ff3366; margin-bottom:20px; font-size:1rem;">${error.message}</p>
                    <button class="retry-button" onclick="shop.loadProducts()">Повторить</button>
                </div>
             && tmp.firstChild) {
    productsContainer.appendChild(tmp.firstChild);
  }
}

            this.showToast('Ошибка загрузки товаров', 'error');
        }
    }

    addToCart(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        const existing = this.cart.find(i => i.id === id);

        if (existing) {
            if (existing.quantity >= product.quantity) {
                this.showToast(`Нельзя добавить больше, чем есть в наличии`, 'error');
                return;
            }
            existing.quantity += 1;
            this.showToast(`+1 × ${product.title}`, 'success', 2000);
        } else {
            this.cart.push({ 
                ...product, 
                quantity: 1 
            });
            this.showToast(`${product.title} добавлен в корзину!`, 'success', 2500);
        }

        this.saveCart();
        this.updateCartInfo();

        // Вибрация на мобильных
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 30, 50]);
        }
    }

    changeQuantity(id, delta) {
        const item = this.cart.find(i => i.id === id);
        if (!item) return;

        const product = this.products.find(p => p.id === id);

        if (delta > 0 && item.quantity >= product.quantity) {
            this.showToast(`Нельзя добавить больше, чем есть в наличии`, 'error');
            return;
        }

        item.quantity += delta;

        if (item.quantity <= 0) {
            this.removeFromCart(id);
        } else {
            this.saveCart();
            this.updateCartInfo();
            this.renderCart();
        }
    }

    removeFromCart(id) {
        const itemIndex = this.cart.findIndex(i => i.id === id);
        if (itemIndex === -1) return;

        const [removedItem] = this.cart.splice(itemIndex, 1);
        this.showToast(`${removedItem.title} удалён из корзины`, 'error', 2000);

        this.saveCart();
        this.updateCartInfo();
        this.renderCart();
    }

    removeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }

    async loadUserOrders() {
        if (!this.user) return;

        try {
            const response = await fetch(`${this.API_BASE_URL}/orders`, { credentials: 'include', 
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const orders = await response.json();
                this.renderOrders(orders);
            }
        } catch (error) {
            console.error('Load orders error:', error);
        }
    }

    renderOrders(orders) {
        const ordersList = document.getElementById('orders-list');

        if (!orders || orders.length === 0) {
            ordersList.innerHTML = '<p style="color:#666; text-align:center; padding:20px;">Заказов пока нет</p>';
            return;
        }

        ordersList.innerHTML = orders.map(order => `
            <div class="order-item">
                <p><strong>Заказ #${order.id.substring(0, 8)}</strong></p>
                <p>Дата: ${new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
                <p>Сумма: ${order.total_amount} ₽</p>
                <p>Статус: <span style="color:#00ff88;">${order.status}</span></p>
            </div>
        `).join('');
    }
}

// Глобальные функции для вызова из HTML
function openAuthModal() {
    shop.openAuthModal();
}

function closeAuthModal() {
    shop.closeAuthModal();
}

function openProfileModal() {
    shop.openProfileModal();
}

function closeProfileModal() {
    shop.closeProfileModal();
}

function openCartModal() {
    shop.openCartModal();
}

function closeCartModal() {
    shop.closeAllModals();
}

function openAdminPanel() {
    shop.openAdminPanel();
}

function closeAdminPanel() {
    shop.closeAdminPanel();
}

function closeEditProductModal() {
    shop.closeEditProductModal();
}

function closeAddProductModal() {
    shop.closeAddProductModal();
}

function addNewProduct() {
    shop.addNewProduct();
}

function addNewCategory() {
    shop.addNewCategory();
}

function showLoginForm() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('auth-title').textContent = 'Вход';
}

function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('auth-title').textContent = 'Регистрация';
}

function logout() {
    shop.logout();
}

function checkout() {
    shop.checkout();
}

function loadProducts(category = null) {
    shop.loadProducts(category);
}

function openMobileNav() {
    shop.openMobileNav();
}

function closeMobileNav() {
    shop.closeMobileNav();
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}

// Инициализация при загрузке страницы
let shop;
document.addEventListener('DOMContentLoaded', () => {
    shop = new NeonShop();

    // Глобальные функции
    window.shop = shop;
    window.loadProducts = loadProducts;
    window.checkout = checkout;
    window.logout = logout;
    window.openAuthModal = openAuthModal;
    window.closeAuthModal = closeAuthModal;
    window.openProfileModal = openProfileModal;
    window.closeProfileModal = closeProfileModal;
    window.openCartModal = openCartModal;
    window.closeCartModal = closeCartModal;
    window.openAdminPanel = openAdminPanel;
    window.closeAdminPanel = closeAdminPanel;
    window.showLoginForm = showLoginForm;
    window.showRegisterForm = showRegisterForm;
    window.openMobileNav = openMobileNav;
    window.closeMobileNav = closeMobileNav;
    window.switchAdminTab = switchAdminTab;
    window.closeEditProductModal = closeEditProductModal;
    window.closeAddProductModal = closeAddProductModal;
    window.addNewProduct = addNewProduct;
    window.addNewCategory = addNewCategory;
});

// Обработчик для офлайн режима
window.addEventListener('offline', () => {
    if (shop) {
        shop.showToast('Отсутствует подключение к интернету', 'error', 5000);
    }
});

window.addEventListener('online', () => {
    if (shop) {
        shop.showToast('Подключение восстановлено', 'success', 3000);
    }
});

// Предотвращение свайпа для навигации назад на iOS
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return;

    const startY = e.touches[0].clientY;
    const startX = e.touches[0].clientX;

    const handleTouchMove = (e) => {
        if (e.touches.length > 1) return;

        const deltaY = e.touches[0].clientY - startY;
        const deltaX = e.touches[0].clientX - startX;

        // Если горизонтальный свайп больше вертикального, предотвращаем скролл страницы
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            e.preventDefault();
        }
    };

    const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
});
