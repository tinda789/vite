import { defineStore } from 'pinia'
import AuthService from '../services/AuthService'
import UserService from '../services/UserService'

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  profileImage?: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.roles.includes('ADMIN') || state.user?.roles.includes('SYSTEM_ADMIN')
  },
  actions: {
    async login(username: string, password: string): Promise<boolean> {
      this.loading = true
      this.error = null
      
      try {
        const response = await AuthService.login(username, password)
        
        // Kiểm tra nếu cần xác thực 2 yếu tố
        if (response.data.requires2FA) {
          // Lưu token tạm thời và chuyển hướng đến trang xác thực 2FA
          return false
        }
        
        this.token = response.data.token
        localStorage.setItem('token', response.data.token)
        
        // Lấy thông tin người dùng
        await this.fetchUserInfo()
        
        return true
      } catch (error) {
        console.error('Login failed:', error)
        this.error = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
        return false
      } finally {
        this.loading = false
      }
    },
    
    async fetchUserInfo() {
      try {
        const response = await UserService.getCurrentUser()
        this.user = response.data
      } catch (error) {
        console.error('Failed to fetch user info:', error)
        this.logout()
      }
    },
    
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    }
  }
})