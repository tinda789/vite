import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import AuthService from '../services/AuthService'
import UserService from '../services/UserService'

// Định nghĩa kiểu dữ liệu cho User
interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  roles: string[];
  
}

export const useAuthStore = defineStore('auth', () => {
  // state
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // getters
  const isAuthenticated = computed(() => !!token.value);
const isAdmin = computed(() => {
  if (!user.value) return false;
  return user.value.roles.some(role => 
    role.authority === "ROLE_ADMIN" || role.authority === "ROLE_SYSTEM_ADMIN"
  );
});

  // actions
  async function login(username: string, password: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await AuthService.login(username, password);
      
      // Kiểm tra nếu cần xác thực 2 yếu tố
      if (response.data.requires2FA) {
        // Lưu token tạm thời và chuyển hướng đến trang xác thực 2FA
        return false;
      }
      
      token.value = response.data.token;
      localStorage.setItem('token', response.data.token);
      
      // Lấy thông tin người dùng
      await fetchUserInfo();
      
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      error.value = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      return false;
    } finally {
      loading.value = false;
    }
  }
  
  async function fetchUserInfo(): Promise<User | null> {
    try {
      const response = await UserService.getCurrentUser();
      user.value = response.data;
      return user.value;
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      logout();
      return null;
    }
  }
  
  function logout(): void {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
  }
  
  async function initAuth(): Promise<void> {
    if (token.value && !user.value) {
      await fetchUserInfo();
    }
  }

  return {
    // state
    user,
    token,
    loading,
    error,
    // getters
    isAuthenticated,
    isAdmin,
    // actions
    login,
    fetchUserInfo,
    logout,
    initAuth
  }
})