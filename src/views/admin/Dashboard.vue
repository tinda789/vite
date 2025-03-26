<template>
    <app-layout>
      <div class="admin-dashboard">
        <div class="page-header">
          <h1>Bảng điều khiển quản trị</h1>
        </div>
        
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
        
        <div v-else class="dashboard-content">
          <!-- Thống kê tổng quan -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon user-icon">
                <i class="fas fa-users"></i>
              </div>
              <div class="stat-info">
                <h3>Người dùng</h3>
                <p class="stat-value">{{ stats.totalUsers || 0 }}</p>
                <p class="stat-desc">{{ stats.activeUsers || 0 }} đang hoạt động</p>
              </div>
              <router-link to="/admin/users" class="stat-link">Quản lý</router-link>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon company-icon">
                <i class="fas fa-building"></i>
              </div>
              <div class="stat-info">
                <h3>Công ty</h3>
                <p class="stat-value">{{ stats.totalCompanies || 0 }}</p>
                <p class="stat-desc">{{ stats.activeCompanies || 0 }} đang hoạt động</p>
              </div>
              <router-link to="/companies" class="stat-link">Quản lý</router-link>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon department-icon">
                <i class="fas fa-sitemap"></i>
              </div>
              <div class="stat-info">
                <h3>Phòng ban</h3>
                <p class="stat-value">{{ stats.totalDepartments || 0 }}</p>
              </div>
              <router-link to="/departments" class="stat-link">Quản lý</router-link>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon employee-icon">
                <i class="fas fa-user-tie"></i>
              </div>
              <div class="stat-info">
                <h3>Nhân viên</h3>
                <p class="stat-value">{{ stats.totalEmployees || 0 }}</p>
                <p class="stat-desc">{{ stats.activeEmployees || 0 }} đang hoạt động</p>
              </div>
              <router-link to="/employees" class="stat-link">Quản lý</router-link>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon task-icon">
                <i class="fas fa-tasks"></i>
              </div>
              <div class="stat-info">
                <h3>Công việc</h3>
                <p class="stat-value">{{ stats.totalTasks || 0 }}</p>
                <p class="stat-desc">{{ stats.pendingTasks || 0 }} đang xử lý</p>
              </div>
              <router-link to="/tasks" class="stat-link">Quản lý</router-link>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon system-icon">
                <i class="fas fa-cog"></i>
              </div>
              <div class="stat-info">
                <h3>Cài đặt hệ thống</h3>
                <p class="stat-desc">Cấu hình chung hệ thống</p>
              </div>
              <router-link to="/admin/settings" class="stat-link">Quản lý</router-link>
            </div>
          </div>
          
          <!-- Hệ thống hiện tại -->
          <div class="system-info-card">
            <h2>Thông tin hệ thống</h2>
            <div class="system-grid">
              <div class="system-item">
                <div class="system-label">Phiên bản</div>
                <div class="system-value">1.0.0</div>
              </div>
              <div class="system-item">
                <div class="system-label">Trạng thái</div>
                <div class="system-value status-online">Đang hoạt động</div>
              </div>
              <div class="system-item">
                <div class="system-label">Thời gian hoạt động</div>
                <div class="system-value">{{ uptime }}</div>
              </div>
              <div class="system-item">
                <div class="system-label">Máy chủ</div>
                <div class="system-value">backend.service.local</div>
              </div>
              <div class="system-item">
                <div class="system-label">Cơ sở dữ liệu</div>
                <div class="system-value status-online">Kết nối</div>
              </div>
              <div class="system-item">
                <div class="system-label">Bộ nhớ đệm</div>
                <div class="system-value status-online">Hoạt động</div>
              </div>
            </div>
          </div>
          
          <!-- Hoạt động gần đây -->
          <div class="recent-activities-card">
            <h2>Hoạt động gần đây</h2>
            <div class="activities-list">
              <div v-if="activities.length === 0" class="empty-state">
                <p>Chưa có hoạt động hệ thống nào được ghi nhận</p>
              </div>
              <div v-else v-for="(activity, index) in activities" :key="index" class="activity-item">
                <div class="activity-time">{{ formatTime(activity.time) }}</div>
                <div :class="['activity-icon', getActivityClass(activity.type)]">
                  <i :class="getActivityIcon(activity.type)"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-text" v-html="activity.text"></div>
                  <div class="activity-detail">{{ activity.detail }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-layout>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue';
  import AppLayout from '../../components/layout/AppLayout.vue';
  import UserService from '../../services/UserService';
  import CompanyService from '../../services/CompanyService';
  import DepartmentService from '../../services/DepartmentService';
  import EmployeeService from '../../services/EmployeeService';
  import TaskService from '../../services/TaskService';
  
  export default defineComponent({
    name: 'AdminDashboardView',
    components: {
      AppLayout
    },
    setup() {
      const loading = ref(true);
      const stats = ref({
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        totalCompanies: 0,
        activeCompanies: 0,
        totalDepartments: 0,
        totalEmployees: 0,
        activeEmployees: 0,
        totalTasks: 0,
        pendingTasks: 0
      });
      const activities = ref([]);
      const uptime = ref('7 ngày, 3 giờ, 45 phút');
      
      const fetchStats = async () => {
        try {
          // Thống kê người dùng
          const userStatsResponse = await UserService.getUserStats();
          stats.value.totalUsers = userStatsResponse.data.totalUsers || 0;
          stats.value.activeUsers = userStatsResponse.data.activeUsers || 0;
          stats.value.newUsersToday = userStatsResponse.data.newUsersToday || 0;
          
          // Đếm số công ty, phòng ban, nhân viên, công việc
          // Trong thực tế, bạn sẽ có API riêng cho mục đích này
          const companies = await CompanyService.getAllCompanies();
          stats.value.totalCompanies = companies.data.length;
          stats.value.activeCompanies = companies.data.filter(c => c.active).length;
          
          const departments = await DepartmentService.getAllDepartments();
          stats.value.totalDepartments = departments.data.length;
          
          const employees = await EmployeeService.getAllEmployees();
          stats.value.totalEmployees = employees.data.length;
          stats.value.activeEmployees = employees.data.filter(e => e.status === 1).length;
          
          const tasks = await TaskService.getAllTasks();
          stats.value.totalTasks = tasks.data.length;
          stats.value.pendingTasks = tasks.data.filter(t => t.status !== 'DONE').length;
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      };
      
      const fetchActivities = () => {
        // Mock data - trong thực tế sẽ gọi API
        activities.value = [
          {
            type: 'login',
            text: '<strong>Admin</strong> đã đăng nhập vào hệ thống',
            detail: 'IP: 192.168.1.1',
            time: new Date(Date.now() - 5 * 60 * 1000) // 5 phút trước
          },
          {
            type: 'user_create',
            text: '<strong>Admin</strong> đã tạo tài khoản mới <strong>user123</strong>',
            detail: 'Vai trò: User',
            time: new Date(Date.now() - 30 * 60 * 1000) // 30 phút trước
          },
          {
            type: 'company_update',
            text: '<strong>Admin</strong> đã cập nhật thông tin công ty <strong>Công ty ABC</strong>',
            detail: 'Thay đổi: Thông tin liên hệ',
            time: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 giờ trước
          },
          {
            type: 'department_create',
            text: '<strong>Manager</strong> đã tạo phòng ban mới <strong>Phòng Kinh doanh</strong>',
            detail: 'Thuộc công ty: Công ty XYZ',
            time: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 giờ trước
          },
          {
            type: 'error',
            text: 'Lỗi kết nối cơ sở dữ liệu',
            detail: 'Đã tự động khôi phục sau 5 giây',
            time: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 giờ trước
          }
        ];
      };
      
      const formatTime = (date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (60 * 1000));
        const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        
        if (diffMins < 60) {
          return `${diffMins} phút trước`;
        } else if (diffHours < 24) {
          return `${diffHours} giờ trước`;
        } else {
          return `${diffDays} ngày trước`;
        }
      };
      
      const getActivityClass = (type) => {
        switch (type) {
          case 'login': return 'activity-login';
          case 'user_create': return 'activity-user';
          case 'company_update': return 'activity-company';
          case 'department_create': return 'activity-department';
          case 'error': return 'activity-error';
          default: return 'activity-default';
        }
      };
      
      const getActivityIcon = (type) => {
        switch (type) {
          case 'login': return 'fas fa-sign-in-alt';
          case 'user_create': return 'fas fa-user-plus';
          case 'company_update': return 'fas fa-building';
          case 'department_create': return 'fas fa-sitemap';
          case 'error': return 'fas fa-exclamation-triangle';
          default: return 'fas fa-bell';
        }
      };
      
      onMounted(async () => {
        loading.value = true;
        await fetchStats();
        fetchActivities();
        loading.value = false;
      });
      
      return {
        loading,
        stats,
        activities,
        uptime,
        formatTime,
        getActivityClass,
        getActivityIcon
      };
    }
  });
  </script>
  
  <style scoped>
  .admin-dashboard {
    width: 100%;
  }
  
  .page-header {
    margin-bottom: 2rem;
  }
  
  .page-header h1 {
    font-size: 1.8rem;
    color: #333;
    margin: 0;
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
  
  .dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .stat-card {
    background-color: #fff;
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    align-items: flex-start;
    position: relative;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.stat-icon i {
  font-size: 1.5rem;
  color: white;
}

.user-icon {
  background-color: #4361EE;
}

.company-icon {
  background-color: #3A0CA3;
}

.department-icon {
  background-color: #7209B7;
}

.employee-icon {
  background-color: #F72585;
}

.task-icon {
  background-color: #4CC9F0;
}

.system-icon {
  background-color: #560BAD;
}

.stat-info {
  flex-grow: 1;
}

.stat-info h3 {
  font-size: 1rem;
  color: #555;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.25rem;
}

.stat-desc {
  font-size: 0.9rem;
  color: #666;
}

.stat-link {
  position: absolute;
  bottom: 1rem;
  right: 1.5rem;
  color: #4361EE;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-link:hover {
  text-decoration: underline;
}

.system-info-card, .recent-activities-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.system-info-card h2, .recent-activities-card h2 {
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 1.5rem;
}

.system-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.system-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.system-label {
  font-weight: 500;
  color: #555;
}

.system-value {
  color: #333;
  font-weight: 600;
}

.status-online {
  color: #10b981;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
  position: relative;
}

.activity-time {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.8rem;
  color: #666;
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.activity-icon i {
  font-size: 1rem;
  color: white;
}

.activity-login {
  background-color: #4361EE;
}

.activity-user {
  background-color: #3A0CA3;
}

.activity-company {
  background-color: #7209B7;
}

.activity-department {
  background-color: #F72585;
}

.activity-error {
  background-color: #ef4444;
}

.activity-default {
  background-color: #64748b;
}

.activity-content {
  flex-grow: 1;
}

.activity-text {
  margin-bottom: 0.25rem;
  color: #333;
}

.activity-detail {
  font-size: 0.85rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

@media (max-width: 768px) {
  .stats-grid, .system-grid {
    grid-template-columns: 1fr;
  }
}
</style>