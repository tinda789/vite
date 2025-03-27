<template>
    <div class="app-layout">
      <header class="header">
        
        <nav class="main-nav">
          <router-link to="/" class="nav-item">Trang chủ</router-link>
          <router-link to="/companies" class="nav-item">Công ty</router-link>
          <router-link to="/departments" class="nav-item">Phòng ban</router-link>
          <router-link to="/employees" class="nav-item">Nhân viên</router-link>
          <router-link to="/tasks" class="nav-item">Công việc</router-link>
          <router-link v-if="isAdmin" to="/admin" class="nav-item">Quản trị</router-link>
        </nav>
        
        <div class="user-menu" v-if="isAuthenticated">
          <div class="user-info" @click="toggleUserDropdown">
            <img v-if="user?.profileImage" :src="user.profileImage" alt="" class="avatar" />
            <div v-else class="avatar-placeholder">{{ userInitials }}</div>
            <span class="username">{{ user?.fullName }}</span>
            <span class="dropdown-icon">▼</span>
          </div>
          
          <div class="dropdown-menu" v-if="showUserDropdown">
            <router-link to="/profile" class="dropdown-item">Hồ sơ</router-link>
            <router-link to="/settings" class="dropdown-item">Cài đặt</router-link>
            <div class="dropdown-divider"></div>
            <button @click="logout" class="dropdown-item logout">Đăng xuất</button>
          </div>
        </div>
      </header>
      
      <div class="content-container">
        <slot></slot>
      </div>
      
      <footer class="footer">
        <div class="copyright">
          &copy; {{ currentYear }} Hệ thống quản lý. Mọi quyền được bảo lưu.
        </div>
      </footer>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../../store/auth'
  
  export default defineComponent({
    name: 'AppLayout',
    setup() {
      const authStore = useAuthStore()
      const router = useRouter()
      const showUserDropdown = ref(false)
      
      const user = computed(() => authStore.user)
      const isAuthenticated = computed(() => authStore.isAuthenticated)
      const isAdmin = computed(() => authStore.isAdmin)
      const currentYear = computed(() => new Date().getFullYear())
      
      const userInitials = computed(() => {
        if (!user.value?.fullName) return 'U'
        return user.value.fullName.split(' ')
          .map(word => word[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      })
      
      const toggleUserDropdown = () => {
        showUserDropdown.value = !showUserDropdown.value
      }
      
      const logout = () => {
        authStore.logout()
        router.push('/login')
      }
      
      // Click outside to close dropdown
      document.addEventListener('click', (event) => {
        if (showUserDropdown.value && !event.target.closest('.user-menu')) {
          showUserDropdown.value = false
        }
      })
      
      return {
        user,
        isAuthenticated,
        isAdmin,
        userInitials,
        currentYear,
        showUserDropdown,
        toggleUserDropdown,
        logout
      }
    }
  })
  </script>
  
  <style scoped>
  .app-layout {
    display: flex;
    flex-direction: column;
    min-block-size: 100vh;
    background-color: #f5f7fa;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 2rem;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .logo-image {
    height: 2.5rem;
  }
  
  .logo-text {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
  }
  
  .main-nav {
    display: flex;
    gap: 1.5rem;
  }
  
  .nav-item {
    color: #666;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 0;
    position: relative;
  }
  
  .nav-item:hover, .nav-item.router-link-active {
    color: #4361ee;
  }
  
  .nav-item.router-link-active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #4361ee;
  }
  
  .user-menu {
    position: relative;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .user-info:hover {
    background-color: #f5f7fa;
  }
  
  .avatar, .avatar-placeholder {
    width: 2rem;
    block-size: 2rem;
    border-radius: 50%;
    background-color: #4361ee;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
  }
  
  .username {
    font-weight: 500;
  }
  
  .dropdown-icon {
    font-size: 0.7rem;
    color: #999;
  }
  
  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    width: 200px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 0.5rem 0;
    margin-top: 0.5rem;
  }
  
  .dropdown-item {
    display: block;
    padding: 0.5rem 1rem;
    color: #333;
    text-decoration: none;
  }
  
  .dropdown-item:hover {
    background-color: #f5f7fa;
  }
  
  .dropdown-divider {
    height: 1px;
    background-color: #eee;
    margin: 0.5rem 0;
  }
  
  .logout {
    color: #f44336;
    text-align: left;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
  }
  
  .content-container {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  
  .footer {
    background-color: #fff;
    padding: 1rem 2rem;
    text-align: center;
    color: #666;
    border-top: 1px solid #eee;
  }
  </style>