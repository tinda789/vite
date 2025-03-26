<template>
    <app-layout>
      <div class="profile-page">
        <div class="page-header">
          <h1>Hồ sơ cá nhân</h1>
        </div>
        
        <div class="profile-container">
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Đang tải thông tin...</p>
          </div>
          
          <div v-else-if="error" class="error-message">
            {{ error }}
          </div>
          
          <div v-else class="profile-content">
            <div class="profile-sidebar">
              <div class="profile-avatar">
                <img v-if="user?.profileImage" :src="user.profileImage" alt="Avatar" />
                <div v-else class="avatar-placeholder">{{ userInitials }}</div>
              </div>
              
              <h2 class="user-name">{{ user?.fullName }}</h2>
              <p class="user-email">{{ user?.email }}</p>
              
              <div class="sidebar-divider"></div>
              
              <div class="user-info-list">
                <div class="info-item">
                  <span class="info-label">Vai trò:</span>
                  <span class="info-value">{{ userRoles }}</span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">Ngày tham gia:</span>
                  <span class="info-value">{{ formatDate(new Date()) }}</span>
                </div>
              </div>
            </div>
            
            <div class="profile-main">
              <div class="tab-navigation">
                <button 
                  class="tab-button" 
                  :class="{ active: activeTab === 'info' }"
                  @click="activeTab = 'info'"
                >
                  Thông tin cá nhân
                </button>
                <button 
                  class="tab-button" 
                  :class="{ active: activeTab === 'password' }"
                  @click="activeTab = 'password'"
                >
                  Đổi mật khẩu
                </button>
                <button 
                  class="tab-button" 
                  :class="{ active: activeTab === 'preferences' }"
                  @click="activeTab = 'preferences'"
                >
                  Tùy chọn
                </button>
              </div>
              
              <div class="tab-content">
                <!-- Tab thông tin cá nhân -->
                <div v-if="activeTab === 'info'" class="tab-pane">
                  <h3>Thông tin cá nhân</h3>
                  
                  <div v-if="updateSuccess" class="alert alert-success">
                    Cập nhật thông tin thành công!
                  </div>
                  
                  <form @submit.prevent="updateProfile" class="profile-form">
                    <div class="form-group">
                      <label for="fullName">Họ và tên</label>
                      <input 
                        type="text"
                        id="fullName"
                        v-model="profileForm.fullName"
                        class="form-control"
                        required
                      />
                    </div>
                    
                    <div class="form-group">
                      <label for="email">Email</label>
                      <input 
                        type="email"
                        id="email"
                        v-model="profileForm.email"
                        class="form-control"
                        required
                      />
                    </div>
                    
                    <div class="form-group">
                      <label for="phoneNumber">Số điện thoại</label>
                      <input 
                        type="tel"
                        id="phoneNumber"
                        v-model="profileForm.phoneNumber"
                        class="form-control"
                      />
                    </div>
                    
                    <div class="form-actions">
                      <button type="submit" class="btn-primary" :disabled="updatingProfile">
                        <span v-if="updatingProfile">Đang cập nhật...</span>
                        <span v-else>Cập nhật</span>
                      </button>
                    </div>
                  </form>
                </div>
                
                <!-- Tab đổi mật khẩu -->
                <div v-if="activeTab === 'password'" class="tab-pane">
                  <h3>Đổi mật khẩu</h3>
                  
                  <div v-if="passwordSuccess" class="alert alert-success">
                    Đổi mật khẩu thành công!
                  </div>
                  
                  <div v-if="passwordError" class="alert alert-danger">
                    {{ passwordError }}
                  </div>
                  
                  <form @submit.prevent="changePassword" class="password-form">
                    <div class="form-group">
                      <label for="currentPassword">Mật khẩu hiện tại</label>
                      <input 
                        type="password"
                        id="currentPassword"
                        v-model="passwordForm.currentPassword"
                        class="form-control"
                        required
                      />
                    </div>
                    
                    <div class="form-group">
                      <label for="newPassword">Mật khẩu mới</label>
                      <input 
                        type="password"
                        id="newPassword"
                        v-model="passwordForm.newPassword"
                        class="form-control"
                        required
                        minlength="6"
                      />
                    </div>
                    
                    <div class="form-group">
                      <label for="confirmPassword">Xác nhận mật khẩu mới</label>
                      <input 
                        type="password"
                        id="confirmPassword"
                        v-model="passwordForm.confirmPassword"
                        class="form-control"
                        required
                      />
                    </div>
                    
                    <div class="form-actions">
                      <button type="submit" class="btn-primary" :disabled="changingPassword">
                        <span v-if="changingPassword">Đang cập nhật...</span>
                        <span v-else>Đổi mật khẩu</span>
                      </button>
                    </div>
                  </form>
                </div>
                
                <!-- Tab tùy chọn -->
                <div v-if="activeTab === 'preferences'" class="tab-pane">
                  <h3>Tùy chọn người dùng</h3>
                  
                  <div class="preference-group">
                    <h4>Thông báo</h4>
                    
                    <div class="checkbox-group">
                      <input type="checkbox" id="emailNotifications" v-model="preferences.emailNotifications" />
                      <label for="emailNotifications">Nhận thông báo qua email</label>
                    </div>
                    
                    <div class="checkbox-group">
                      <input type="checkbox" id="taskNotifications" v-model="preferences.taskNotifications" />
                      <label for="taskNotifications">Thông báo khi có nhiệm vụ mới</label>
                    </div>
                  </div>
                  
                  <div class="preference-group">
                    <h4>Giao diện</h4>
                    
                    <div class="select-group">
                      <label for="theme">Chủ đề</label>
                      <select id="theme" v-model="preferences.theme" class="form-control">
                        <option value="light">Sáng</option>
                        <option value="dark">Tối</option>
                        <option value="system">Theo hệ thống</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="form-actions">
                    <button class="btn-primary" @click="savePreferences">Lưu tùy chọn</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-layout>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, computed, reactive, onMounted } from 'vue'
  import AppLayout from '../../components/layout/AppLayout.vue'
  import { useAuthStore } from '../../store/auth'
  import UserService from '../../services/UserService'
  
  export default defineComponent({
    name: 'ProfileView',
    components: {
      AppLayout
    },
    setup() {
      const authStore = useAuthStore()
      const user = computed(() => authStore.user)
      
      const loading = ref(false)
      const error = ref('')
      const activeTab = ref('info')
      
      const profileForm = reactive({
        fullName: '',
        email: '',
        phoneNumber: '',
        profileImage: ''
      })
      
      const passwordForm = reactive({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      const preferences = reactive({
        emailNotifications: true,
        taskNotifications: true,
        theme: 'light'
      })
      
      const updatingProfile = ref(false)
      const updateSuccess = ref(false)
      
      const changingPassword = ref(false)
      const passwordSuccess = ref(false)
      const passwordError = ref('')
      
      const userInitials = computed(() => {
        if (!user.value?.fullName) return 'U'
        return user.value.fullName.split(' ')
          .map(word => word[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      })
      
      const userRoles = computed(() => {
        if (!user.value?.roles) return 'Người dùng'
        return user.value.roles.join(', ')
      })
      
      // Khởi tạo form với dữ liệu người dùng
      const initializeForm = () => {
        if (user.value) {
          profileForm.fullName = user.value.fullName || ''
          profileForm.email = user.value.email || ''
          profileForm.phoneNumber = user.value.phoneNumber || ''
          profileForm.profileImage = user.value.profileImage || ''
        }
      }
      
      // Cập nhật thông tin cá nhân
      const updateProfile = async () => {
        updatingProfile.value = true
        updateSuccess.value = false
        
        try {
          const response = await UserService.updateProfile(profileForm)
          if (response.data.success) {
            updateSuccess.value = true
            // Cập nhật lại thông tin người dùng trong store
            authStore.fetchUserInfo()
          } else {
            error.value = response.data.message || 'Có lỗi xảy ra khi cập nhật thông tin'
          }
        } catch (err) {
          console.error('Error updating profile:', err)
          error.value = 'Có lỗi xảy ra khi cập nhật thông tin'
        } finally {
          updatingProfile.value = false
        }
      }
      
      // Đổi mật khẩu
      const changePassword = async () => {
        // Kiểm tra mật khẩu mới và xác nhận
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          passwordError.value = 'Mật khẩu mới và xác nhận mật khẩu không khớp'
          return
        }
        
        changingPassword.value = true
        passwordSuccess.value = false
        passwordError.value = ''
        
        try {
          const response = await UserService.changePassword(passwordForm)
          if (response.data.success) {
            passwordSuccess.value = true
            passwordForm.currentPassword = ''
            passwordForm.newPassword = ''
            passwordForm.confirmPassword = ''
          } else {
            passwordError.value = response.data.message || 'Có lỗi xảy ra khi đổi mật khẩu'
          }
        } catch (err: any) {
          console.error('Error changing password:', err)
          passwordError.value = err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu'
        } finally {
          changingPassword.value = false
        }
      }
      
      // Lưu tùy chọn
      const savePreferences = () => {
        // Xử lý lưu tùy chọn (thường sẽ gọi API)
        alert('Lưu tùy chọn thành công!')
      }
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('vi-VN')
      }
      
      // Khởi tạo dữ liệu
      onMounted(() => {
        loading.value = true
        try {
          initializeForm()
        } catch (err) {
          console.error('Error initializing profile:', err)
          error.value = 'Không thể tải thông tin người dùng'
        } finally {
          loading.value = false
        }
      })
      
      return {
        user,
        loading,
        error,
        activeTab,
        profileForm,
        passwordForm,
        preferences,
        updatingProfile,
        updateSuccess,
        changingPassword,
        passwordSuccess,
        passwordError,
        userInitials,
        userRoles,
        updateProfile,
        changePassword,
        savePreferences,
        formatDate
      }
    }
  })
  </script>
  
  <style scoped>
  .profile-page {
    width: 100%;
  }
  
  .page-header {
    margin-bottom: 2rem;
  }
  
  .page-header h1 {
    font-size: 1.8rem;
    color: #333;
  }
  
  .profile-container {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }
  
  .loading {
    padding: 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-left-color: #4361EE;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .error-message {
    padding: 2rem;
    text-align: center;
    color: #e53935;
  }
  
  .profile-content {
    display: flex;
    min-height: 600px;
  }
  
  .profile-sidebar {
    width: 300px;
    padding: 2rem;
    background-color: #f8fafc;
    border-right: 1px solid #eee;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .profile-avatar {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 1.5rem;
    background-color: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-placeholder {
    font-size: 3rem;
    font-weight: 700;
    color: #fff;
    background-color: #4361EE;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .user-name {
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
    text-align: center;
  }
  
  .user-email {
    color: #666;
    margin-bottom: 1.5rem;
    text-align: center;
  }
  
  .sidebar-divider {
    width: 100%;
    height: 1px;
    background-color: #eee;
    margin: 1rem 0;
  }
  
  .user-info-list {
    width: 100%;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  
  .info-label {
    color: #666;
    font-weight: 500;
  }
  
  .info-value {
    color: #333;
  }
  
  .profile-main {
    flex: 1;
    padding: 2rem;
  }
  
  .tab-navigation {
    display: flex;
    border-bottom: 1px solid #eee;
    margin-bottom: 2rem;
  }
  
  .tab-button {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-weight: 500;
    color: #666;
    transition: all 0.2s;
  }
  
  .tab-button:hover {
    color: #4361EE;
  }
  
  .tab-button.active {
    color: #4361EE;
    border-bottom-color: #4361EE;
  }
  
  .tab-pane h3 {
    font-size: 1.25rem;
    color: #333;
    margin-bottom: 1.5rem;
  }
  
  .alert {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  
  .alert-success {
    background-color: #e8f5e9;
    color: #2e7d32;
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
    border-color: #4361EE;
    box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
  }
  
  .form-actions {
    margin-top: 2rem;
  }
  
  .btn-primary {
    padding: 0.75rem 1.5rem;
    background-color: #4361EE;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .btn-primary:hover {
    background-color: #3a56d4;
  }
  
  .btn-primary:disabled {
    background-color: #a1a1a1;
    cursor: not-allowed;
  }
  
  .preference-group {
    margin-bottom: 2rem;
  }
  
  .preference-group h4 {
    font-size: 1.1rem;
    color: #333;
    margin-bottom: 1rem;
  }
  
  .checkbox-group {
    display: flex;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  
  .checkbox-group input {
    margin-right: 0.75rem;
  }
  
  .select-group {
    margin-bottom: 1rem;
  }
  
  @media (max-width: 992px) {
    .profile-content {
      flex-direction: column;
    }
    
    .profile-sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #eee;
    }
  }
  </style>