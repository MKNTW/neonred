import { ref } from 'vue'
import { useApi } from './useApi'
import { useToast } from './useToast'

export function useProducts() {
  const { request, loading } = useApi()
  const { showToast } = useToast()

  const products = ref([])
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalProducts = ref(0)

  async function loadProducts(page = 1, useCache = false, silent = false) {
    try {
      if (!silent) {
        loading.value = true
      }
      const data = await request(`/products?page=${page}&limit=20`)

      if (data.products) {
        // Обновляем только если данные действительно изменились
        // Это предотвращает ненужные перерисовки при фоновом обновлении
        const newProducts = data.products
        const hasChanges = JSON.stringify(products.value) !== JSON.stringify(newProducts)
        
        if (hasChanges) {
          products.value = newProducts
          currentPage.value = data.page || page
          totalPages.value = data.totalPages || 1
          totalProducts.value = data.total || data.products.length
        }
      } else {
        const newProducts = Array.isArray(data) ? data : []
        const hasChanges = JSON.stringify(products.value) !== JSON.stringify(newProducts)
        
        if (hasChanges) {
          products.value = newProducts
          currentPage.value = 1
          totalPages.value = 1
          totalProducts.value = Array.isArray(data) ? data.length : 0
        }
      }

      return true
    } catch (error) {
      // Не показываем toast для ошибок подключения (уже показан в useApi)
      if (!error.isConnectionError && !silent) {
        showToast(error.message || 'Ошибка загрузки товаров', 'error')
      }
      return false
    } finally {
      if (!silent) {
        loading.value = false
      }
    }
  }

  return {
    products,
    currentPage,
    totalPages,
    totalProducts,
    loading,
    loadProducts
  }
}

