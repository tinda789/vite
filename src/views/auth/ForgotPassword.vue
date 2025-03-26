<template>
    <div class="forgot-password-page">
      <div class="forgot-password-container">
        <div class="forgot-password-header">
          <h1>Quên mật khẩu</h1>
          <p>Vui lòng nhập địa chỉ email của bạn để đặt lại mật khẩu</p>
        </div>
        
        <div v-if="message" class="alert" :class="isSuccess ? 'alert-success' : 'alert-danger'">
          {{ message }}
        </div>
        
        <form @submit.prevent="handleSubmit" class="forgot-password-form" v-if="!isSuccess">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email"
              id="email"
              v-model="email"
              required
              class="form-control"
              placeholder="Nhập địa chỉ email"
              :disabled="loading"
            />
          </div>
          
          <button type="submit" class="submit-button" :disabled="loading">
            <span v-if="loading">Đang xử lý...</span>
            <span v-else>Gửi yêu cầu</span>
          </button>
        </form>
        
        <div class="back-to-login">
          <router-link to="/login">Quay lại đăng nhập</router-link>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue'
  import AuthService from '../../services/AuthService'
  
  export default defineComponent({
    name: 'ForgotPasswordView',
    setup() {
      const email = ref('')
      const loading = ref(false)
      const message = ref('')
      const isSuccess = ref(false)
      
      const handleSubmit = async () => {
        loading.value = true
        message.value = ''
        
        try {
          const response = await AuthService.forgotPassword(email.value)
          message.value = response.data.message || 'Vui lòng kiểm tra email để đặt lại mật khẩu.'
          isSuccess.value = true
        } catch (err: any) {
          console.error('Forgot password error:', err)
          message.value = err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
          isSuccess.value = false
        } finally {
          loading.value = false
        }
      }
      
      return {
        email,
        loading,
        message,
        isSuccess,
        handleSubmit
      }
    }
  })
  </script>
  
  <style scoped>
  .forgot-password-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f7fa;
  }
  
  .forgot-password-container {
    width: 100%;
    max-width: 400px;
    padding: 2rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .forgot-password-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .forgot-password-header h1 {
    font-size: 1.8rem;
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .forgot-password-header p {
    color: #666;
  }
  
  .alert {
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    border-radius: 4px;
  }
  
  .alert-danger {
    background-color: #ffebee;
    color: #d32f2f;
  }
  
  .alert-success {
    background-color: #e8f5e9;
    color: #2e7d32;
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
  
  .submit-button {
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
  
  .submit-button:hover {
    background-color: #3a56d4;
  }
  
  .submit-button:disabled {
    background-color: #a1a1a1;
    cursor: not-allowed;
  }
  
  .back-to-login {
    text-align: center;
    margin-top: 2rem;
  }
  
  .back-to-login a {
    color: #4361ee;
    text-decoration: none;
    font-weight: 500;
  }
  
  .back-to-login a:hover {
    text-decoration: underline;
  }
  </style>