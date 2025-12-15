<template>
  <div id="app">
    <ConnectionStatus />
    <ToastContainer />
    <AgeVerification />

    <Header
      @open-profile="showProfileModal = true"
      @open-auth="showAuthModal = true"
      @open-cart="showCartModal = true"
      @open-admin="showAdminModal = true"
    />

    <ProductList
      :products="products"
      :loading="loading"
      :current-page="currentPage"
      :total-pages="totalPages"
      @open-auth="handleOpenAuth"
      @add-to-cart="handleAddToCart"
      @page-change="handlePageChange"
    />

    <AuthModal
      v-model="showAuthModal"
      :initial-mode="authModalMode"
      @open-forgot-password="showForgotPasswordModal = true"
      @success="handleAuthSuccess"
    />

    <CartModal
      v-model="showCartModal"
      @checkout="handleCheckout"
    />

    <ProfileModal
      v-if="isAuthenticated"
      v-model="showProfileModal"
    />

    <AdminModal
      v-if="isAdmin"
      v-model="showAdminModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAuth } from './composables/useAuth'
import { useCart } from './composables/useCart'
import { useProducts } from './composables/useProducts'
import ConnectionStatus from './components/ConnectionStatus.vue'
import ToastContainer from './components/ToastContainer.vue'
import AgeVerification from './components/AgeVerification.vue'
import Header from './components/Header.vue'
import ProductList from './components/ProductList.vue'
import AuthModal from './components/AuthModal.vue'
import CartModal from './components/CartModal.vue'
import ProfileModal from './components/ProfileModal.vue'
import AdminModal from './components/AdminModal.vue'

const { isAuthenticated, isAdmin, validateToken, user } = useAuth()
const { addToCart, syncCart, clearCart } = useCart()
const { products, loading, currentPage, totalPages, loadProducts } = useProducts()

const showAuthModal = ref(false)
const authModalMode = ref('login')
const showCartModal = ref(false)
const showProfileModal = ref(false)
const showAdminModal = ref(false)
const showForgotPasswordModal = ref(false)

let syncInterval = null
let visibilityHandler = null

onMounted(async () => {
  await validateToken()
  await loadProducts(1, false)
  
  // Синхронизируем корзину с сервером при загрузке
  if (isAuthenticated.value) {
    syncCart()
  }
  
  // Периодическая синхронизация корзины (каждые 30 секунд, только если страница видима)
  const startSyncInterval = () => {
    if (syncInterval) clearInterval(syncInterval)
    syncInterval = setInterval(() => {
      if (isAuthenticated.value && document.visibilityState === 'visible') {
        syncCart(true) // silent mode для фоновой синхронизации
      }
    }, 30000)
  }
  
  startSyncInterval()
  
  // Останавливаем синхронизацию при скрытии страницы
  visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      startSyncInterval()
      if (isAuthenticated.value) {
        syncCart(true) // Синхронизируем при возврате на страницу
      }
    } else {
      if (syncInterval) {
        clearInterval(syncInterval)
        syncInterval = null
      }
    }
  }
  
  document.addEventListener('visibilitychange', visibilityHandler)
})

onUnmounted(() => {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
    visibilityHandler = null
  }
})

function handleOpenAuth(mode = 'login') {
  authModalMode.value = mode
  showAuthModal.value = true
}

function handleAddToCart(product) {
  addToCart(product)
}

function handlePageChange(page) {
  loadProducts(page, false)
}

// Автоматическое обновление при изменении статуса аутентификации
watch(isAuthenticated, async (newVal, oldVal) => {
  if (newVal && !oldVal) {
    // Пользователь только что вошел - загружаем товары и синхронизируем корзину
    await loadProducts(1, false)
    syncCart()
  } else if (!newVal && oldVal) {
    // Пользователь вышел - очищаем корзину
    clearCart()
  }
}, { immediate: false })

async function handleAuthSuccess() {
  // Немедленная загрузка товаров после успешной авторизации
  // Используем nextTick чтобы убедиться что isAuthenticated обновился
  await new Promise(resolve => setTimeout(resolve, 100))
  await loadProducts(1, false)
  syncCart()
}

async function handleCheckout() {
  // Логика оформления заказа будет реализована в CartModal
  // Пока просто закрываем модалку
  showCartModal.value = false
}
</script>

<style>
#app {
  min-height: 100vh;
}
</style>

