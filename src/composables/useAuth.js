import { ref, computed } from 'vue'
import { useApi } from './useApi'
import { useToast } from './useToast'

// Singleton для аутентификации - все компоненты используют одно состояние
let authInstance = null
let userInstance = null
let tokenInstance = null

export function useAuth() {
  // Используем singleton pattern для единого состояния аутентификации
  if (!authInstance) {
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
    
    userInstance = ref(initialUser)
    tokenInstance = ref(initialToken)
    
    authInstance = {
      user: userInstance,
      token: tokenInstance,
      isAuthenticated: computed(() => !!userInstance.value && !!tokenInstance.value),
      isAdmin: computed(() => userInstance.value?.isAdmin || false)
    }
  }
  
  const { request } = useApi()
  const { showToast } = useToast()
  
  const user = authInstance.user
  const token = authInstance.token
  const isAuthenticated = authInstance.isAuthenticated
  const isAdmin = authInstance.isAdmin

  function saveAuth(userData, authToken) {
    // Сначала сохраняем в localStorage (синхронно)
    try {
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', authToken)
    } catch (e) {
      // Ошибка сохранения в localStorage
    }
    // Затем обновляем реактивное состояние (singleton - обновится везде)
    user.value = userData
    token.value = authToken
  }

  function clearAuth() {
    user.value = null
    token.value = null
    try {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    } catch (e) {
      // Игнорируем ошибки
    }
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
