<template>
    <div class="login-page">
      <div class="login-container">
        <div class="login-header">
          <h1>Đăng nhập</h1>
          <p>Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>
        </div>
        
        <div v-if="authStore.error" class="alert alert-danger">
          {{ authStore.error }}
        </div>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">Tên đăng nhập</label>
            <input 
              type="text"
              id="username"
              v-model="username"
              required
              class="form-control"
              placeholder="Nhập tên đăng nhập"
              :disabled="authStore.loading"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Mật khẩu</label>
            <div class="password-input">
              <input 
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="password"
                required
                class="form-control"
                placeholder="Nhập mật khẩu"
                :disabled="authStore.loading"
              />
              <button 
                type="button" 
                class="password-toggle" 
                @click="togglePassword"
              >
                {{ showPassword ? 'Ẩn' : 'Hiện' }}
              </button>
            </div>
          </div>
          
          <div class="form-options">
            <div class="remember-me">
              <input type="checkbox" id="remember" v-model="rememberMe" />
              <label for="remember">Ghi nhớ đăng nhập</label>
            </div>
            <router-link to="/forgot-password" class="forgot-password">
              Quên mật khẩu?
            </router-link>
          </div>
          
          <button type="submit" class="login-button" :disabled="authStore.loading">
            <span v-if="authStore.loading">Đang đăng nhập...</span>
            <span v-else>Đăng nhập</span>
          </button>
        </form>
        
        <div class="login-footer">
          <p>Chưa có tài khoản? <router-link to="/register">Đăng ký ngay</router-link></p>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../../store/auth'
  
  export default defineComponent({
    name: 'LoginView',
    setup() {
      const router = useRouter()
      const authStore = useAuthStore()
      
      const username = ref('')
      const password = ref('')
      const rememberMe = ref(false)
      const showPassword = ref(false)
      
      const togglePassword = () => {
        showPassword.value = !showPassword.value
      }
      
      const handleLogin = async () => {
        const success = await authStore.login(username.value, password.value)
        
        if (success) {
          router.push('/')
        }
      }
      
      return {
        username,
        password,
        rememberMe,
        showPassword,
        togglePassword,
        handleLogin,
        authStore
      }
    }
  })
  </script>
  
  <style scoped>
  .login-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f7fa;
  }
  
  .login-container {
    width: 100%;
    max-width: 400px;
    padding: 2rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .login-header h1 {
    font-size: 1.8rem;
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .login-header p {
    color: #666;
  }
  
  .alert {
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    border-radius: 4px;
  }
  
  .alert-danger {
    background-color: #ffebee;
    color: #d32f2f;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }
  
  .form-control {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .form-control:focus {
    outline: none;
    border-color: #4361ee;
    box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
  }
  
  .password-input {
    position: relative;
  }
  
  .password-toggle {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
  }
  
  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .remember-me {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .forgot-password {
    color: #4361ee;
    text-decoration: none;
  }
  
  .login-button {
    width: 100%;
    padding: 0.75rem;
    background-color: #4361ee;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .login-button:hover {
    background-color: #3a56d4;
  }
  
  .login-button:disabled {
    background-color: #a1a1a1;
    cursor: not-allowed;
  }
  
  .login-footer {
    text-align: center;
    margin-top: 2rem;
    color: #666;
  }
  
  .login-footer a {
    color: #4361ee;
    text-decoration: none;
    font-weight: 500;
  }
  </style>