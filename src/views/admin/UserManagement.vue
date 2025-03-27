
<template>
    <app-layout>
      <div class="user-management">
        <div class="page-header">
          <h1>Quản lý người dùng</h1>
          <button class="btn-primary" @click="openCreateModal">
            <i class="fas fa-user-plus"></i> Thêm người dùng mới
          </button>
        </div>
        
        <div class="filters">
          <div class="search-box">
            <input 
              type="text" 
              placeholder="Tìm kiếm người dùng..." 
              v-model="searchQuery"
              @input="filterUsers"
            />
            <i class="fas fa-search"></i>
          </div>
          
          <div class="filter-options">
            <select v-model="roleFilter" @change="filterUsers" class="select-filter">
              <option value="">Tất cả vai trò</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="USER">User</option>
            </select>
            
            <select v-model="statusFilter" @change="filterUsers" class="select-filter">
              <option value="">Tất cả trạng thái</option>
              <option value="1">Đang hoạt động</option>
              <option value="0">Không hoạt động</option>
              <option value="2">Bị khóa</option>
            </select>
          </div>
        </div>
        
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
        
        <div v-else-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-else-if="filteredUsers.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-users"></i>
          </div>
          <h3>Không tìm thấy người dùng nào</h3>
          <p v-if="searchQuery || roleFilter || statusFilter">Không có kết quả phù hợp với bộ lọc của bạn.</p>
          <p v-else>Chưa có người dùng nào trong hệ thống.</p>
          <button class="btn-primary" @click="openCreateModal">
            Thêm người dùng mới
          </button>
        </div>
        
        <div v-else class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Đăng nhập gần đây</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id" :class="{'row-inactive': user.status === 0}">
                <td>{{ user.id }}</td>
                <td class="user-info-cell">
                  <div class="user-avatar">
                    <img v-if="user.profileImage" :src="user.profileImage" alt="" />
                    <div v-else class="avatar-placeholder">{{ getUserInitials(user.fullName) }}</div>
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ user.fullName }}</div>
                    <div class="user-username">@{{ user.username }}</div>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <div class="roles-list">
                    <span 
                      v-for="(role, index) in user.roles" 
                      :key="index"
                      :class="['role-badge', getRoleBadgeClass(role)]"
                    >
                      {{ role }}
                    </span>
                  </div>
                </td>
                <td>
                  <span :class="['status-badge', getStatusBadgeClass(user.status)]">
                    {{ getStatusText(user.status) }}
                  </span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>{{ user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Chưa đăng nhập' }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon btn-edit" @click="editUser(user)" title="Chỉnh sửa">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button 
                      v-if="user.status === 1"
                      class="btn-icon btn-lock" 
                      @click="lockUser(user)" 
                      title="Khóa tài khoản"
                    >
                      <i class="fas fa-lock"></i>
                    </button>
                    <button 
                      v-else-if="user.status === 2"
                      class="btn-icon btn-unlock" 
                      @click="unlockUser(user)" 
                      title="Mở khóa tài khoản"
                    >
                      <i class="fas fa-unlock"></i>
                    </button>
                    <button 
                      v-if="user.status === 1"
                      class="btn-icon btn-deactivate" 
                      @click="deactivateUser(user)" 
                      title="Vô hiệu hóa"
                    >
                      <i class="fas fa-ban"></i>
                    </button>
                    <button 
                      v-else-if="user.status === 0"
                      class="btn-icon btn-activate" 
                      @click="activateUser(user)" 
                      title="Kích hoạt"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Modal thêm/chỉnh sửa người dùng -->
        <div v-if="showModal" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h2>{{ isEditing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới' }}</h2>
              <button class="modal-close" @click="closeModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="modal-body">
              <form @submit.prevent="saveUser">
                <div class="form-group">
                  <label for="username">Tên đăng nhập <span class="required">*</span></label>
                  <input 
                    type="text" 
                    id="username" 
                    v-model="userForm.username" 
                    class="form-control" 
                    required
                    :disabled="isEditing"
                  />
                </div>
                
                <div class="form-group">
                  <label for="email">Email <span class="required">*</span></label>
                  <input 
                    type="email" 
                    id="email" 
                    v-model="userForm.email" 
                    class="form-control" 
                    required
                  />
                </div>
                
                <div class="form-group">
                  <label for="fullName">Họ và tên <span class="required">*</span></label>
                  <input 
                    type="text" 
                    id="fullName" 
                    v-model="userForm.fullName" 
                    class="form-control" 
                    required
                  />
                </div>
                
                <div v-if="!isEditing" class="form-group">
                  <label for="password">Mật khẩu <span class="required">*</span></label>
                  <div class="password-input">
                    <input 
                      :type="showPassword ? 'text' : 'password'" 
                      id="password" 
                      v-model="userForm.password" 
                      class="form-control" 
                      required
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
                  <label for="phoneNumber">Số điện thoại</label>
                  <input 
                    type="tel" 
                    id="phoneNumber" 
                    v-model="userForm.phoneNumber" 
                    class="form-control"
                  />
                </div>
                
                <div class="form-group">
                  <label>Vai trò <span class="required">*</span></label>
                  <div class="roles-checkboxes">
                    <label class="role-checkbox" v-for="role in availableRoles" :key="role">
                      <input 
                        type="checkbox" 
                        :value="role" 
                        v-model="userForm.roles"
                      />
                      <span>{{ role }}</span>
                    </label>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Trạng thái</label>
                  <div class="radio-group">
                    <label class="radio-option">
                      <input type="radio" v-model="userForm.status" :value="1" />
                      <span>Hoạt động</span>
                    </label>
                    <label class="radio-option">
                      <input type="radio" v-model="userForm.status" :value="0" />
                      <span>Không hoạt động</span>
                    </label>
                  </div>
                </div>
                
                <div class="form-actions">
                  <button type="button" class="btn-cancel" @click="closeModal">Hủy bỏ</button>
                  <button type="submit" class="btn-primary" :disabled="saving">
  {{ saving ? 'Đang lưu...' : 'Lưu lại' }}
</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </app-layout>
</template>

<script lang="ts">
import { defineComponent, ref, computed, reactive, onMounted } from 'vue';
import AppLayout from '../../components/layout/AppLayout.vue';
import UserService from '../../services/UserService';

export default defineComponent({
  name: 'UserManagementView',
  components: {
    AppLayout
  },
  setup() {
    const loading = ref(true);
    const error = ref('');
    const users = ref([]);
    const filteredUsers = ref([]);
    
    const searchQuery = ref('');
    const roleFilter = ref('');
    const statusFilter = ref('');
    
    const showModal = ref(false);
    const isEditing = ref(false);
    const saving = ref(false);
    const showPassword = ref(false);
    
    const availableRoles = ['SYSTEM_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'];
    
    const userForm = reactive({
      id: null,
      username: '',
      email: '',
      password: '',
      fullName: '',
      phoneNumber: '',
      profileImage: '',
      roles: ['USER'],
      status: 1,
      emailVerified: true
    });
    
    const fetchUsers = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const response = await UserService.getAllUsers();
        users.value = response.data;
        filterUsers();
      } catch (err) {
        console.error('Failed to fetch users:', err);
        error.value = 'Không thể tải dữ liệu người dùng. Vui lòng thử lại sau.';
      } finally {
        loading.value = false;
      }
    };
    
    const filterUsers = () => {
      filteredUsers.value = users.value.filter(user => {
        // Lọc theo từ khóa
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase();
          const matchesName = user.fullName && user.fullName.toLowerCase().includes(query);
          const matchesUsername = user.username.toLowerCase().includes(query);
          const matchesEmail = user.email.toLowerCase().includes(query);
          
          if (!matchesName && !matchesUsername && !matchesEmail) {
            return false;
          }
        }
        
        // Lọc theo vai trò
        if (roleFilter.value && !user.roles.includes(roleFilter.value)) {
          return false;
        }
        
        // Lọc theo trạng thái
        if (statusFilter.value !== '' && user.status.toString() !== statusFilter.value) {
          return false;
        }
        
        return true;
      });
    };
    
    const getUserInitials = (fullName) => {
      if (!fullName) return 'U';
      return fullName.split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    };
    
    const getRoleBadgeClass = (role) => {
      switch (role) {
        case 'SYSTEM_ADMIN': return 'role-system-admin';
        case 'ADMIN': return 'role-admin';
        case 'MANAGER': return 'role-manager';
        case 'EMPLOYEE': return 'role-employee';
        case 'USER': return 'role-user';
        default: return '';
      }
    };
    
    const getStatusBadgeClass = (status) => {
      switch (status) {
        case 1: return 'status-active';
        case 0: return 'status-inactive';
        case 2: return 'status-locked';
        default: return '';
      }
    };
    
    const getStatusText = (status) => {
      switch (status) {
        case 1: return 'Hoạt động';
        case 0: return 'Không hoạt động';
        case 2: return 'Bị khóa';
        default: return 'Không xác định';
      }
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN');
    };
    
    const openCreateModal = () => {
      isEditing.value = false;
      resetForm();
      showModal.value = true;
    };
    
    const editUser = (user) => {
      isEditing.value = true;
      
      userForm.id = user.id;
      userForm.username = user.username;
      userForm.email = user.email;
      userForm.fullName = user.fullName;
      userForm.phoneNumber = user.phoneNumber;
      userForm.profileImage = user.profileImage;
      userForm.roles = [...user.roles];
      userForm.status = user.status;
      userForm.emailVerified = user.emailVerified;
      
      showModal.value = true;
    };
    
    const saveUser = async () => {
  saving.value = true;
  try {
    if (isEditing.value) {
      await UserService.updateUser(userForm.id, userForm);
      
      // Cập nhật vai trò nếu đang chỉnh sửa
      if (userForm.roles) {
        await UserService.updateUserRoles(userForm.id, userForm.roles);
      }
    } else {
      await UserService.createUser(userForm);
    }
    
    closeModal();
    fetchUsers();
  } catch (err) {
    console.error('Failed to save user:', err);
    error.value = 'Không thể lưu thông tin người dùng. Vui lòng thử lại sau.';
  } finally {
    saving.value = false;
  }
};
    
    const lockUser = async (user) => {
      if (confirm(`Bạn có chắc chắn muốn khóa tài khoản "${user.username}"?`)) {
        try {
          await UserService.lockUser(user.id);
          fetchUsers();
        } catch (err) {
          console.error('Failed to lock user:', err);
          error.value = 'Không thể khóa tài khoản. Vui lòng thử lại sau.';
        }
      }
    };
    
    const unlockUser = async (user) => {
      try {
        await UserService.unlockUser(user.id);
        fetchUsers();
      } catch (err) {
        console.error('Failed to unlock user:', err);
        error.value = 'Không thể mở khóa tài khoản. Vui lòng thử lại sau.';
      }
    };
    
    const deactivateUser = async (user) => {
      if (confirm(`Bạn có chắc chắn muốn vô hiệu hóa tài khoản "${user.username}"?`)) {
        try {
          await UserService.updateUserStatus(user.id, 0);
          fetchUsers();
        } catch (err) {
          console.error('Failed to deactivate user:', err);
          error.value = 'Không thể vô hiệu hóa tài khoản. Vui lòng thử lại sau.';
        }
      }
    };
    
    const activateUser = async (user) => {
      try {
        await UserService.updateUserStatus(user.id, 1);
        fetchUsers();
      } catch (err) {
        console.error('Failed to activate user:', err);
        error.value = 'Không thể kích hoạt tài khoản. Vui lòng thử lại sau.';
      }
    };
    
    const closeModal = () => {
      showModal.value = false;
      resetForm();
    };
    
    const resetForm = () => {
      userForm.id = null;
      userForm.username = '';
      userForm.email = '';
      userForm.password = '';
      userForm.fullName = '';
      userForm.phoneNumber = '';
      userForm.profileImage = '';
      userForm.roles = ['USER'];
      userForm.status = 1;
      userForm.emailVerified = true;
    };
    
    const togglePassword = () => {
      showPassword.value = !showPassword.value;
    };
    
    onMounted(() => {
      fetchUsers();
    });
    
    return {
      loading,
      error,
      users,
      filteredUsers,
      searchQuery,
      roleFilter,
      statusFilter,
      showModal,
      isEditing,
      saving,
      showPassword,
      userForm,
      availableRoles,
      getUserInitials,
      getRoleBadgeClass,
      getStatusBadgeClass,
      getStatusText,
      formatDate,
      filterUsers,
      openCreateModal,
      editUser,
      saveUser,
      lockUser,
      unlockUser,
      deactivateUser,
      activateUser,
      closeModal,
      togglePassword
    };
  }
});
</script>

<style scoped>
.user-management {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.8rem;
  color: #333;
  margin: 0;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover {
  background-color: #3a56d4;
}

.btn-primary:disabled {
  background-color: #a1a1a1;
  cursor: not-allowed;
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.filter-options {
  display: flex;
  gap: 1rem;
}

.select-filter {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  font-size: 1rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
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
  background-color: #ffebee;
  border-radius: 8px;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.empty-icon {
  font-size: 3rem;
  color: #ccc;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 1.5rem;
}

.users-table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.users-table th, .users-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #333;
}

.users-table tr:last-child td {
  border-bottom: none;
}

.row-inactive {
  opacity: 0.7;
}

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e5e7eb;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4361EE;
  color: #fff;
  font-weight: 600;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.user-username {
  font-size: 0.85rem;
  color: #666;
}

.roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.role-system-admin {
  background-color: #7209B7;
  color: #fff;
}

.role-admin {
  background-color: #4361EE;
  color: #fff;
}

.role-manager {
  background-color: #3A0CA3;
  color: #fff;
}

.role-employee {
  background-color: #F72585;
  color: #fff;
}

.role-user {
  background-color: #4CC9F0;
  color: #fff;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-inactive {
  background-color: #ffebee;
  color: #d32f2f;
}

.status-locked {
  background-color: #fff8e1;
  color: #f57f17;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-edit {
  background-color: #e3f2fd;
  color: #1976d2;
}

.btn-edit:hover {
  background-color: #bbdefb;
}

.btn-lock {
  background-color: #fff8e1;
  color: #f57f17;
}

.btn-lock:hover {
  background-color: #ffecb3;
}

.btn-unlock {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.btn-unlock:hover {
  background-color: #c8e6c9;
}

.btn-deactivate {
  background-color: #ffebee;
  color: #d32f2f;
}

.btn-deactivate:hover {
  background-color: #ffcdd2;
}

.btn-activate {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.btn-activate:hover {
  background-color: #c8e6c9;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background-color: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #666;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
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

.required {
  color: #e53935;
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

.form-control:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
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

.roles-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.role-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-group {
  display: flex;
  gap: 1.5rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background-color: #fff;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-cancel:hover {
  background-color: #f5f5f5;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-options {
    flex-direction: column;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
}
</style>