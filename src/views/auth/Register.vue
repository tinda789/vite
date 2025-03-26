<template>
    <div class="register-page">
      <div class="register-container">
        <div class="register-header">
          <h1>Đăng ký tài khoản</h1>
          <p>Vui lòng điền đầy đủ thông tin để tạo tài khoản</p>
        </div>
        
        <div v-if="error" class="alert alert-danger">
          {{ error }}
        </div>
        
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="username">Tên đăng nhập</label>
            <input 
              type="text"
              id="username"
              v-model="formData.username"
              required
              class="form-control"
              placeholder="Nhập tên đăng nhập"
              :disabled="loading"
            />
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email"
              id="email"
              v-model="formData.email"
              required
              class="form-control"
              placeholder="Nhập địa chỉ email"
              :disabled="loading"
            />
          </div>
          
          <div class="form-group">
            <label for="fullName">Họ và tên</label>
            <input 
              type="text"
              id="fullName"
              v-model="formData.fullName"
              required
              class="form-control"
              placeholder="Nhập họ và tên"
              :disabled="loading"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Mật khẩu</label>
            <div class="password-input">
              <input 
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="formData.password"
                required
                class="form-control"
                placeholder="Nhập mật khẩu"
                :disabled="loading"
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
          
          <div class="form-group">
            <label for="confirmPassword">Xác nhận mật khẩu</label>
            <div class="password-input">
              <input 
                :type="showPassword ? 'text' : 'password'"
                id="confirmPassword"
                v-model="formData.confirmPassword"
                required
                class="form-control"
                placeholder="Nhập lại mật khẩu"
                :disabled="loading"
              />
            </div>
          </div>
          
          <div class="terms-checkbox">
            <input type="checkbox" id="terms" v-model="agreeTerms" required />
            <label for="terms">Tôi đồng ý với <a href="#">Điều khoản sử dụng</a></label>
          </div>
          
          <button type="submit" class="register-button" :disabled="loading || !agreeTerms">
            <span v-if="loading">Đang đăng ký...</span>
            <span v-else>Đăng ký</span>
          </button>
        </form>
        
        <div class="register-footer">
          <p>Đã có tài khoản? <router-link to="/login">Đăng nhập</router-link></p>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import AuthService from '../../services/AuthService'
  
  export default defineComponent({
    name: 'RegisterView',
    setup() {
      const router = useRouter()
      const loading = ref(false)
      const error = ref('')
      const showPassword = ref(false)
      const agreeTerms = ref(false)
      
      const formData = reactive({
        username: '',
        email: '',
        fullName: '',
        password: '',
        confirmPassword: '',
        phoneNumber: ''
      })
      
      const togglePassword = () => {
        showPassword.value = !showPassword.value
      }
      
      const handleRegister = async () => {
        // Kiểm tra mật khẩu khớp nhau
        if (formData.password !== formData.confirmPassword) {
          error.value = 'Mật khẩu xác nhận không khớp!'
          return
        }
        
        loading.value = true
        error.value = ''
        
        try {
          const response = await AuthService.register({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber
          })
          
          if (response.data.success) {
            alert('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.')
            router.push('/login')
          } else {
            error.value = response.data.message || 'Đăng ký thất bại!'
          }
        } catch (err: any) {
          console.error('Register error:', err)
          error.value = err.response?.data?.message || 'Đã xảy ra lỗi khi đăng ký!'
        } finally {
          loading.value = false
        }
      }
      
      return {
        formData,
        loading,
        error,
        showPassword,
        agreeTerms,
        togglePassword,
        handleRegister
      }
    }
  })
  </script>
  
  <style scoped>
  .register-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f7fa;
    padding: 2rem 0;
  }
  
  .register-container {
    width: 100%;
    max-width: 500px;
    padding: 2rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .register-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .register-header h1 {
    font-size: 1.8rem;
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .register-header p {
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
  
  .terms-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .terms-checkbox a {
    color: #4361ee;
    text-decoration: none;
  }
  
  .register-button {
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
  
  .register-button:hover {
    background-color: #3a56d4;
  }
  
  .register-button:disabled {
    background-color: #a1a1a1;
    cursor: not-allowed;
  }
  
  .register-footer {
    text-align: center;
    margin-top: 2rem;
    color: #666;
  }
  
  .register-footer a {
    color: #4361ee;
    text-decoration: none;
    font-weight: 500;
  }
  </style>