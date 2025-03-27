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

// Định nghĩa interface cho User
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  profileImage?: string;
  status: number;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  roles: string[];
  accountNonLocked: boolean;
  createdAt: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
}

// Định nghĩa interface cho form dữ liệu
interface UserForm {
  id: number | null;
  username: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  profileImage: string;
  roles: string[];
  status: number;
  emailVerified: boolean;
}

// Bổ sung các phương thức còn thiếu cho UserService
declare module '../../services/UserService' {
  export function lockUser(id: number): Promise<any>;
  export function unlockUser(id: number): Promise<any>;
}

export default defineComponent({
  name: 'UserManagementView',
  components: {
    AppLayout
  },
  setup() {
    const loading = ref<boolean>(true);
    const error = ref<string>('');
    const users = ref<User[]>([]);
    const filteredUsers = ref<User[]>([]);
    
    const searchQuery = ref<string>('');
    const roleFilter = ref<string>('');
    const statusFilter = ref<string>('');
    
    const showModal = ref<boolean>(false);
    const isEditing = ref<boolean>(false);
    const saving = ref<boolean>(false);
    const showPassword = ref<boolean>(false);
    
    const availableRoles = ['SYSTEM_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'];
    
    const userForm = reactive<UserForm>({
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
    
    const getUserInitials = (fullName: string): string => {
      if (!fullName) return 'U';
      return fullName.split(' ')
        .map((word: string) => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    };
    
    const getRoleBadgeClass = (role: string): string => {
      switch (role) {
        case 'SYSTEM_ADMIN': return 'role-system-admin';
        case 'ADMIN': return 'role-admin';
        case 'MANAGER': return 'role-manager';
        case 'EMPLOYEE': return 'role-employee';
        case 'USER': return 'role-user';
        default: return '';
      }
    };
    
    const getStatusBadgeClass = (status: number): string => {
      switch (status) {
        case 1: return 'status-active';
        case 0: return 'status-inactive';
        case 2: return 'status-locked';
        default: return '';
      }
    };
    
    const getStatusText = (status: number): string => {
      switch (status) {
        case 1: return 'Hoạt động';
        case 0: return 'Không hoạt động';
        case 2: return 'Bị khóa';
        default: return 'Không xác định';
      }
    };
    
    const formatDate = (dateString: string): string => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN');
    };
    
    const openCreateModal = () => {
      isEditing.value = false;
      resetForm();
      showModal.value = true;
    };
    
    const editUser = (user: User) => {
      isEditing.value = true;
      
      userForm.id = user.id;
      userForm.username = user.username;
      userForm.email = user.email;
      userForm.fullName = user.fullName;
      userForm.phoneNumber = user.phoneNumber || '';
      userForm.profileImage = user.profileImage || '';
      userForm.roles = [...user.roles];
      userForm.status = user.status;
      userForm.emailVerified = user.emailVerified;
      
      showModal.value = true;
    };
    
    const saveUser = async () => {
      saving.value = true;
      try {
        if (isEditing.value && userForm.id !== null) {
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
    
    const lockUser = async (user: User) => {
      if (confirm(`Bạn có chắc chắn muốn khóa tài khoản "${user.username}"?`)) {
        try {
          // Thêm phương thức này vào UserService nếu chưa có
          await UserService.lockUser(user.id);
          fetchUsers();
        } catch (err) {
          console.error('Failed to lock user:', err);
          error.value = 'Không thể khóa tài khoản. Vui lòng thử lại sau.';
        }
      }
    };
    
    const unlockUser = async (user: User) => {
      try {
        // Thêm phương thức này vào UserService nếu chưa có
        await UserService.unlockUser(user.id);
        fetchUsers();
      } catch (err) {
        console.error('Failed to unlock user:', err);
        error.value = 'Không thể mở khóa tài khoản. Vui lòng thử lại sau.';
      }
    };
    
    const deactivateUser = async (user: User) => {
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
    
    const activateUser = async (user: User) => {
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
    
    // Khởi tạo dữ liệu
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

