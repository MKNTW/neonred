<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    content-class="order-details-modal-content"
  >
    <div class="order-details-header">
      <h2>Детали заказа</h2>
    </div>

    <div v-if="order" class="order-details">
      <div class="order-info-section">
        <h3>Информация о заказе</h3>
        <div class="info-row">
          <span class="info-label">Номер заказа:</span>
          <span class="info-value">#{{ order?.id ? order.id.substring(0, 8) : 'N/A' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Дата создания:</span>
          <span class="info-value">{{ formatDate(order?.created_at) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Статус:</span>
          <span class="info-value" :class="`status-${order?.status || 'unknown'}`">
            {{ getStatusText(order?.status) }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Адрес доставки:</span>
          <span class="info-value">{{ order?.shipping_address || 'Не указан' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Способ оплаты:</span>
          <span class="info-value">{{ order?.payment_method || 'Карта' }}</span>
        </div>
      </div>

      <div class="order-items-section">
        <h3>Товары в заказе</h3>
        <div v-if="order.items && order.items.length > 0" class="items-list">
          <div
            v-for="item in order.items"
            :key="item.id || item.productId"
            class="order-item-row"
          >
            <div class="item-info">
              <span class="item-title">{{ item.title || item.productTitle || 'Товар' }}</span>
              <span class="item-quantity">× {{ item.quantity }}</span>
            </div>
            <div class="item-price">
              {{ formatPrice((item.price || 0) * (item.quantity || 0)) }} ₽
            </div>
          </div>
        </div>
        <div v-else class="empty-items">
          <p>Информация о товарах недоступна</p>
        </div>
      </div>

      <div class="order-total-section">
        <div class="total-row">
          <span class="total-label">Итого:</span>
          <span class="total-amount">{{ formatPrice(order?.total_amount || order?.total || 0) }} ₽</span>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import Modal from './Modal.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  order: {
    type: Object,
    default: null
  }
})

defineEmits(['update:modelValue'])

function formatDate(dateString) {
  if (!dateString) return 'Не указана'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatPrice(price) {
  if (price == null || price === '') return '0.00'
  const num = parseFloat(price)
  if (isNaN(num)) return '0.00'
  return num.toFixed(2)
}

function getStatusText(status) {
  const statusMap = {
    'pending': 'Ожидает обработки',
    'processing': 'В обработке',
    'shipped': 'Отправлен',
    'delivered': 'Доставлен',
    'cancelled': 'Отменен'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.order-details-modal-content {
  max-width: 600px;
  padding: 30px;
}

.order-details-header {
  text-align: center;
  margin-bottom: 30px;
}

.order-details-header h2 {
  color: var(--neon-red);
  font-size: 1.8rem;
  font-weight: 900;
  text-shadow: 0 0 10px rgba(255, 0, 51, 0.5);
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.order-info-section,
.order-items-section,
.order-total-section {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid var(--border-color);
  border-radius: 12px;
}

.order-info-section h3,
.order-items-section h3 {
  color: var(--neon-red);
  font-size: 1.2rem;
  margin-bottom: 15px;
  font-weight: 700;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.info-value {
  color: var(--text-primary);
  font-weight: 600;
}

.status-pending {
  color: var(--neon-blue);
}

.status-processing {
  color: var(--neon-purple);
}

.status-shipped {
  color: var(--neon-green);
}

.status-delivered {
  color: var(--neon-green);
}

.status-cancelled {
  color: var(--neon-red);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-title {
  color: var(--text-primary);
  font-weight: 600;
}

.item-quantity {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.item-price {
  color: var(--neon-red);
  font-weight: 700;
  font-size: 1.1rem;
}

.empty-items {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
}

.order-total-section {
  background: rgba(255, 0, 51, 0.1);
  border-color: var(--neon-red);
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 700;
}

.total-amount {
  color: var(--neon-red);
  font-size: 1.5rem;
  font-weight: 900;
  text-shadow: 0 0 10px rgba(255, 0, 51, 0.5);
}
</style>

