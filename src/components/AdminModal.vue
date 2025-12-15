<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    content-class="admin-modal-content"
  >
    <div class="admin-header">
      <h2>Админ-панель</h2>
    </div>
    
    <div class="admin-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['admin-tab', { active: activeTab === tab.id }]"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-text">{{ tab.label }}</span>
      </button>
    </div>
    
    <div class="admin-tab-content">
      <div v-if="activeTab === 'products'" class="admin-section">
        <div class="admin-section-header">
          <h3>Управление товарами</h3>
          <button @click="openEditModal(null)" class="admin-btn">
            <span>+</span>
            <span class="btn-text">Добавить товар</span>
          </button>
        </div>
        <div class="admin-list-container">
          <div v-if="adminProducts.length === 0 && !loading" class="empty-state">
            <p>Товаров пока нет</p>
          </div>
          <div v-else-if="loading" class="loading-state">
            <p>Загрузка...</p>
          </div>
          <div v-else class="admin-list">
            <div
              v-for="product in adminProducts"
              :key="product.id"
              class="admin-item"
            >
              <div class="admin-item-content">
                <h4>{{ product.title }}</h4>
                <p>{{ product.price }} ₽</p>
                <p>В наличии: {{ product.quantity }}</p>
              </div>
              <div class="admin-item-actions">
                <button @click="openEditModal(product)" class="admin-btn">
                  Редактировать
                </button>
                <button @click="openDeleteConfirm(product.id)" class="admin-btn delete-btn">
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ProductEditModal
        v-model="showEditModal"
        :product="editingProduct"
        @saved="handleProductSaved"
      />

      <ConfirmDialog
        v-model="showDeleteConfirm"
        title="Удаление товара"
        message="Вы уверены, что хотите удалить этот товар? Это действие необратимо."
        icon="🗑️"
        confirm-text="Удалить"
        cancel-text="Отмена"
        @confirm="confirmDelete"
      />
      
      <div v-if="activeTab === 'users'" class="admin-section">
        <div class="admin-section-header">
          <h3>Пользователи</h3>
        </div>
        <div class="admin-list-container">
          <div v-if="adminUsers.length === 0 && !loadingUsers" class="empty-state">
            <p>Пользователей пока нет</p>
          </div>
          <div v-else-if="loadingUsers" class="loading-state">
            <p>Загрузка...</p>
          </div>
          <div v-else class="admin-list">
            <div
              v-for="user in adminUsers"
              :key="user.id"
              class="admin-item"
            >
              <div class="admin-item-content">
                <h4>{{ user.username }}</h4>
                <p>{{ user.email }}</p>
                <p v-if="user.fullName">{{ user.fullName }}</p>
                <p>
                  <span :class="user.isAdmin ? 'admin-badge' : ''">
                    {{ user.isAdmin ? '👑 Администратор' : '👤 Пользователь' }}
                  </span>
                </p>
                <p>Заказов: {{ Number(user.ordersCount) || 0 }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'orders'" class="admin-section">
        <div class="admin-section-header">
          <h3>Заказы</h3>
        </div>
        <div class="admin-list-container">
          <div v-if="adminOrders.length === 0 && !loadingOrders" class="empty-state">
            <p>Заказов пока нет</p>
          </div>
          <div v-else-if="loadingOrders" class="loading-state">
            <p>Загрузка...</p>
          </div>
          <div v-else class="admin-list">
            <div
              v-for="order in adminOrders"
              :key="order.id"
              class="admin-item order-item"
            >
              <div class="admin-item-content">
                <h4>Заказ #{{ order.id.substring(0, 8) }}</h4>
                <p>Пользователь: {{ order.user?.username || order.user_id || 'Неизвестно' }}</p>
                <p>Дата: {{ formatDate(order.created_at) }}</p>
                <p>Сумма: <strong>{{ formatPrice(order.total_amount || order.total || 0) }} ₽</strong></p>
                <p>Статус: 
                  <select 
                    :value="order.status" 
                    @change="updateOrderStatus(order.id, $event.target.value)"
                    class="status-select"
                  >
                    <option value="pending">Ожидает обработки</option>
                    <option value="processing">В обработке</option>
                    <option value="shipped">Отправлен</option>
                    <option value="delivered">Доставлен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                </p>
                <p v-if="order.shipping_address">Адрес: {{ order.shipping_address }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Modal from './Modal.vue'
import ProductEditModal from './ProductEditModal.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { useApi } from '../composables/useApi'
import { useToast } from '../composables/useToast'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])

const { request } = useApi()
const { showToast } = useToast()

const activeTab = ref('products')
const adminProducts = ref([])
const adminUsers = ref([])
const adminOrders = ref([])
const showEditModal = ref(false)
const editingProduct = ref(null)
const loading = ref(false)
const loadingUsers = ref(false)
const loadingOrders = ref(false)

const tabs = [
  { id: 'products', label: 'Товары', icon: '📦' },
  { id: 'users', label: 'Пользователи', icon: '👥' },
  { id: 'orders', label: 'Заказы', icon: '📋' }
]

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    loadProducts()
    if (activeTab.value === 'users') {
      loadUsers()
    } else if (activeTab.value === 'orders') {
      loadOrders()
    }
  }
})

watch(activeTab, (newTab) => {
  if (props.modelValue) {
    if (newTab === 'users' && adminUsers.value.length === 0) {
      loadUsers()
    } else if (newTab === 'orders' && adminOrders.value.length === 0) {
      loadOrders()
    }
  }
})

onMounted(async () => {
  await loadProducts()
})

async function loadProducts() {
  loading.value = true
  try {
    const data = await request('/products?page=1&limit=100')
    adminProducts.value = data.products || data || []
  } catch (error) {
    // Ошибка загрузки товаров обработана в showToast
    showToast('Ошибка загрузки товаров', 'error')
  } finally {
    loading.value = false
  }
}

function openEditModal(product) {
  editingProduct.value = product
  showEditModal.value = true
}

const showDeleteConfirm = ref(false)
const productToDelete = ref(null)

function openDeleteConfirm(productId) {
  productToDelete.value = productId
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!productToDelete.value) return
  
  try {
    await request(`/admin/products/${productToDelete.value}`, { method: 'DELETE' })
    showToast('Товар удален', 'success')
    showDeleteConfirm.value = false
    productToDelete.value = null
    await loadProducts()
  } catch (error) {
    showToast(error.message || 'Ошибка удаления товара', 'error')
  }
}

function handleProductSaved() {
  loadProducts()
}

async function loadUsers() {
  loadingUsers.value = true
  try {
    const data = await request('/admin/users')
    adminUsers.value = Array.isArray(data) ? data : []
  } catch (error) {
    showToast('Ошибка загрузки пользователей', 'error')
    adminUsers.value = []
  } finally {
    loadingUsers.value = false
  }
}

async function loadOrders() {
  loadingOrders.value = true
  try {
    const data = await request('/admin/orders')
    adminOrders.value = Array.isArray(data) ? data : []
  } catch (error) {
    showToast('Ошибка загрузки заказов', 'error')
    adminOrders.value = []
  } finally {
    loadingOrders.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Не указана'
  try {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return 'Неверная дата'
  }
}

function formatPrice(price) {
  if (price == null || price === '') return '0.00'
  const num = parseFloat(price)
  if (isNaN(num)) return '0.00'
  return num.toFixed(2)
}

async function updateOrderStatus(orderId, newStatus) {
  if (!orderId || !newStatus) {
    showToast('Неверные данные для обновления статуса', 'error')
    return
  }
  
  try {
    await request(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    })
    showToast('Статус заказа обновлен', 'success')
    await loadOrders()
  } catch (error) {
    showToast(error.message || 'Ошибка обновления статуса', 'error')
    await loadOrders() // Перезагружаем чтобы вернуть старый статус
  }
}
</script>

<style scoped>
.admin-modal-content {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.admin-header {
  text-align: center;
  margin-bottom: 30px;
}

.admin-header h2 {
  color: var(--neon-red);
  font-size: 1.8rem;
  font-weight: 900;
  text-shadow: 0 0 10px rgba(255, 0, 51, 0.5);
}

.admin-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid var(--border-color);
}

.admin-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
}

.admin-tab:hover {
  color: var(--text-primary);
}

.admin-tab.active {
  color: var(--neon-red);
  border-bottom-color: var(--neon-red);
}

.admin-section {
  margin-bottom: 30px;
}

.admin-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.admin-section-header h3 {
  color: var(--text-primary);
  font-size: 1.3rem;
  font-weight: 700;
}

.admin-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--neon-red);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
}

.admin-btn:hover {
  background: var(--neon-pink);
  box-shadow: 0 0 20px rgba(255, 0, 51, 0.5);
}

.admin-list-container {
  max-height: 400px;
  overflow-y: auto;
}

.admin-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.admin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid var(--border-color);
  border-radius: 10px;
  gap: 15px;
}

.admin-item-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.delete-btn {
  background: rgba(255, 0, 51, 0.2);
  border: 2px solid var(--neon-red);
}

.delete-btn:hover {
  background: var(--neon-red);
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.admin-item-content h4 {
  color: var(--text-primary);
  margin-bottom: 5px;
  font-weight: 600;
}

.admin-item-content p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 3px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.admin-badge {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(255, 0, 51, 0.2);
  border: 1px solid var(--neon-red);
  border-radius: 12px;
  color: var(--neon-red);
  font-size: 0.85rem;
  font-weight: 700;
}

.status-select {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.3s;
}

.status-select:focus {
  outline: none;
  border-color: var(--neon-red);
  box-shadow: 0 0 10px rgba(255, 0, 51, 0.3);
}

.order-item {
  flex-direction: column;
  align-items: flex-start;
}
</style>

