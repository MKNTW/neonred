import { ref, computed } from 'vue'
import { useApi } from './useApi'
import { useToast } from './useToast'

export function useAuth() {
  const { request } = useApi()
  const { showToast } = useToast()

  // Безопасная загрузка из localStorage
  let initialUser = null
  let initialToken = null
  try {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      initialUser = JSON.parse(savedUser)
    }
    initialToken = localStorage.getItem('token')
  } catch (e) {
    // Игнорируем ошибки парсинга
  }
  
  const user = ref(initialUser)
  const token = ref(initialToken)
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => user.value?.isAdmin || false)

  function saveAuth(userData, authToken) {
    // Сначала сохраняем в localStorage (синхронно)
    try {
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', authToken)
    } catch (e) {
      // Ошибка сохранения в localStorage
    }
    // Затем обновляем реактивное состояние
    // Это гарантирует, что токен будет доступен в useApi до обновления реактивности
    user.value = userData
    token.value = authToken
  }

  function clearAuth() {
    user.value = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  async function login(usernameOrEmail, password) {
    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usernameOrEmail)
      const requestBody = isEmail 
        ? { email: usernameOrEmail.trim(), password }
        : { username: usernameOrEmail.trim(), password }
      
      const data = await request('/login', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      if (data.user && data.token) {
        saveAuth(data.user, data.token)
        showToast('Вход выполнен успешно!', 'success')
        return true
      }

      return false
    } catch (error) {
      // Для ошибок 401 показываем понятное сообщение
      if (error.status === 401) {
        showToast('Неверное имя пользователя или пароль', 'error')
      }
      // Не показываем дополнительный toast для ошибок подключения
      // (уже показан в useApi)
      return false
    }
  }

  function logout() {
    clearAuth()
    showToast('Вы вышли из системы', 'info')
  }

  async function validateToken() {
    if (!token.value) return false

    try {
      const data = await request('/validate-token')
      if (data.user) {
        saveAuth(data.user, token.value)
        return true
      }
      return false
    } catch (error) {
      // Тихая проверка токена - не показываем ошибки подключения
      return false
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    validateToken,
    saveAuth,
    clearAuth
  }
}

