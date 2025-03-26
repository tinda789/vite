<template>
    <app-layout>
      <div class="home-page">
        <div class="welcome-section">
          <h1>Chào mừng {{ user?.fullName || 'Bạn' }}</h1>
          <p>Hôm nay là {{ formattedDate }}</p>
        </div>
        
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon task-icon">
              <i class="fas fa-tasks"></i>
            </div>
            <div class="stat-info">
              <h3>Nhiệm vụ của tôi</h3>
              <p class="stat-value">{{ myTasks.length }}</p>
              <p class="stat-desc">{{ pendingTasks }} đang chờ xử lý</p>
            </div>
            <router-link to="/tasks" class="stat-link">Xem tất cả</router-link>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon dept-icon">
              <i class="fas fa-building"></i>
            </div>
            <div class="stat-info">
              <h3>Phòng ban</h3>
              <p class="stat-value">{{ departments.length }}</p>
              <p class="stat-desc">{{ activeDepartments }} đang hoạt động</p>
            </div>
            <router-link to="/departments" class="stat-link">Xem tất cả</router-link>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon employee-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-info">
              <h3>Nhân viên</h3>
              <p class="stat-value">{{ employees.length }}</p>
              <p class="stat-desc">{{ activeEmployees }} đang hoạt động</p>
            </div>
            <router-link to="/employees" class="stat-link">Xem tất cả</router-link>
          </div>
        </div>
        
        <div class="content-section">
          <div class="tasks-section">
            <div class="section-header">
              <h2>Nhiệm vụ gần đây</h2>
              <router-link to="/tasks" class="view-all">Xem tất cả</router-link>
            </div>
            
            <div v-if="loadingTasks" class="loading">
              <div class="spinner"></div>
              <p>Đang tải nhiệm vụ...</p>
            </div>
            
            <div v-else-if="myTasks.length === 0" class="empty-state">
              <p>Bạn chưa có nhiệm vụ nào.</p>
              <router-link to="/tasks/create" class="create-button">Tạo nhiệm vụ mới</router-link>
            </div>
            
            <div v-else class="tasks-list">
              <div v-for="task in myTasks.slice(0, 5)" :key="task.id" class="task-item">
                <div class="task-status" :class="getTaskStatusClass(task.status)"></div>
                <div class="task-content">
                  <h4 class="task-title">{{ task.title }}</h4>
                  <p class="task-desc">{{ truncateDescription(task.description) }}</p>
                  <div class="task-meta">
                    <span class="task-due-date">
                      <i class="fas fa-calendar"></i>
                      {{ formatDate(task.dueDate) }}
                    </span>
                    <span class="task-status-text" :class="getTaskStatusClass(task.status)">
                      {{ task.status }}
                    </span>
                  </div>
                </div>
                <router-link :to="`/tasks/${task.id}`" class="task-view">
                  <i class="fas fa-chevron-right"></i>
                </router-link>
              </div>
            </div>
          </div>
          
          <div class="activities-section">
            <div class="section-header">
              <h2>Hoạt động gần đây</h2>
            </div>
            
            <div v-if="loadingActivities" class="loading">
              <div class="spinner"></div>
              <p>Đang tải hoạt động...</p>
            </div>
            
            <div v-else-if="activities.length === 0" class="empty-state">
              <p>Chưa có hoạt động nào gần đây.</p>
            </div>
            
            <div v-else class="activities-list">
              <div v-for="(activity, index) in activities.slice(0, 5)" :key="index" class="activity-item">
                <div class="activity-icon" :class="getActivityIconClass(activity.type)">
                  <i :class="getActivityIcon(activity.type)"></i>
                </div>
                <div class="activity-content">
                  <p class="activity-text">{{ activity.text }}</p>
                  <p class="activity-time">{{ formatTime(activity.time) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-layout>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted, computed } from 'vue'
  import AppLayout from '../components/layout/AppLayout.vue'
  import { useAuthStore } from '../store/auth'
  import TaskService from '../services/TaskService'
  import DepartmentService from '../services/DepartmentService'
  import EmployeeService from '../services/EmployeeService'
  
  export default defineComponent({
    name: 'HomeView',
    components: {
      AppLayout
    },
    setup() {
      const authStore = useAuthStore()
      const user = computed(() => authStore.user)
      
      const myTasks = ref([])
      const departments = ref([])
      const employees = ref([])
      const activities = ref([])
      
      const loadingTasks = ref(true)
      const loadingDepartments = ref(true)
      const loadingEmployees = ref(true)
      const loadingActivities = ref(true)
      
      const formattedDate = computed(() => {
        const today = new Date()
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        return today.toLocaleDateString('vi-VN', options)
      })
      
      const pendingTasks = computed(() => {
        return myTasks.value.filter(task => task.status !== 'DONE').length
      })
      
      const activeDepartments = computed(() => {
        // Giả định tất cả đều hoạt động
        return departments.value.length
      })
      
      const activeEmployees = computed(() => {
        return employees.value.filter(employee => employee.status === 1).length
      })
      
      const fetchMyTasks = async () => {
        loadingTasks.value = true
        try {
          const response = await TaskService.getTasksAssignedToMe()
          myTasks.value = response.data
        } catch (error) {
          console.error('Error fetching tasks:', error)
        } finally {
          loadingTasks.value = false
        }
      }
      
      const fetchDepartments = async () => {
        loadingDepartments.value = true
        try {
          const response = await DepartmentService.getAllDepartments()
          departments.value = response.data
        } catch (error) {
          console.error('Error fetching departments:', error)
        } finally {
          loadingDepartments.value = false
        }
      }
      
      const fetchEmployees = async () => {
        loadingEmployees.value = true
        try {
          const response = await EmployeeService.getAllEmployees()
          employees.value = response.data
        } catch (error) {
          console.error('Error fetching employees:', error)
        } finally {
          loadingEmployees.value = false
        }
      }
      
      // Mock dữ liệu hoạt động - Trong thực tế cần API để lấy dữ liệu này
      const fetchActivities = () => {
        loadingActivities.value = true
        setTimeout(() => {
          activities.value = [
            { 
              type: 'task_updated', 
              text: 'Nguyễn Văn A đã cập nhật trạng thái công việc "Chuẩn bị báo cáo quý"',
              time: new Date(Date.now() - 30 * 60 * 1000) // 30 phút trước
            },
            { 
              type: 'user_added', 
              text: 'Lê Thị B đã thêm nhân viên mới "Trần Văn C"',
              time: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 giờ trước
            },
            { 
              type: 'department_updated', 
              text: 'Phòng IT đã được cập nhật thông tin',
              time: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 giờ trước
            },
            { 
              type: 'task_created', 
              text: 'Bạn đã tạo công việc mới "Họp kế hoạch tháng 4"',
              time: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 ngày trước
            },
            { 
              type: 'employee_onboarded', 
              text: 'Nhân viên mới Nguyễn Thị D đã được thêm vào hệ thống',
              time: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 ngày trước
            }
          ]
          loadingActivities.value = false
        }, 1000)
      }
      
      const formatDate = (dateString) => {
        if (!dateString) return 'Không có hạn'
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN')
      }
      
      const formatTime = (date) => {
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / (60 * 1000))
        const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
        
        if (diffMins < 60) {
          return `${diffMins} phút trước`
        } else if (diffHours < 24) {
          return `${diffHours} giờ trước`
        } else {
          return `${diffDays} ngày trước`
        }
      }
      
      const truncateDescription = (text) => {
        if (!text) return 'Không có mô tả'
        return text.length > 60 ? text.substring(0, 60) + '...' : text
      }
      
      const getTaskStatusClass = (status) => {
        switch (status) {
          case 'TODO': return 'status-todo'
          case 'IN_PROGRESS': return 'status-in-progress'
          case 'REVIEW': return 'status-review'
          case 'DONE': return 'status-done'
          case 'CANCELLED': return 'status-cancelled'
          default: return ''
        }
      }
      
      const getActivityIconClass = (type) => {
        switch (type) {
          case 'task_created': return 'activity-icon-create'
          case 'task_updated': return 'activity-icon-update'
          case 'user_added': return 'activity-icon-user'
          case 'department_updated': return 'activity-icon-department'
          case 'employee_onboarded': return 'activity-icon-employee'
          default: return 'activity-icon-default'
        }
      }
      
      const getActivityIcon = (type) => {
        switch (type) {
          case 'task_created': return 'fas fa-plus'
          case 'task_updated': return 'fas fa-pencil-alt'
          case 'user_added': return 'fas fa-user-plus'
          case 'department_updated': return 'fas fa-building'
          case 'employee_onboarded': return 'fas fa-user-tie'
          default: return 'fas fa-bell'
        }
      }
      
      onMounted(() => {
        fetchMyTasks()
        fetchDepartments()
        fetchEmployees()
        fetchActivities()
      })
      
      return {
        user,
        myTasks,
        departments,
        employees,
        activities,
        loadingTasks,
        loadingActivities,
        formattedDate,
        pendingTasks,
        activeDepartments,
        activeEmployees,
        formatDate,
        formatTime,
        truncateDescription,
        getTaskStatusClass,
        getActivityIconClass,
        getActivityIcon
      }
    }
  })
  </script>
  
  <style scoped>
  .home-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .welcome-section {
    background-color: #fff;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .welcome-section h1 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
    color: #333;
  }
  
  .welcome-section p {
    color: #666;
    font-size: 1.1rem;
  }
  
  .stats-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
  
  .task-icon {
    background-color: #4361EE;
  }
  
  .dept-icon {
    background-color: #3A0CA3;
  }
  
  .employee-icon {
    background-color: #4CC9F0;
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

.content-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 992px) {
  .content-section {
    grid-template-columns: 1fr;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  font-size: 1.25rem;
  color: #333;
}

.view-all {
  color: #4361EE;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.view-all:hover {
  text-decoration: underline;
}

.tasks-section, .activities-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
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

.empty-state {
  text-align: center;
  padding: 2rem 0;
  color: #666;
}

.create-button {
  display: inline-block;
  background-color: #4361EE;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 1rem;
  font-weight: 500;
}

.create-button:hover {
  background-color: #3a56d4;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f8fafc;
  border-left: 4px solid #ddd;
}

.task-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 1rem;
}

.status-todo {
  background-color: #64748b;
  border-color: #64748b;
}

.status-in-progress {
  background-color: #f59e0b;
  border-color: #f59e0b;
}

.status-review {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.status-done {
  background-color: #10b981;
  border-color: #10b981;
}

.status-cancelled {
  background-color: #ef4444;
  border-color: #ef4444;
}

.task-content {
  flex-grow: 1;
}

.task-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.task-desc {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8rem;
}

.task-due-date {
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.task-status-text {
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  color: #fff;
  font-weight: 500;
  font-size: 0.75rem;
}

.task-view {
  color: #999;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.task-view:hover {
  background-color: #eee;
  color: #333;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e5e7eb;
  color: #374151;
  flex-shrink: 0;
}

.activity-icon i {
  font-size: 0.9rem;
}

.activity-icon-create {
  background-color: #d1fae5;
  color: #047857;
}

.activity-icon-update {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.activity-icon-user {
  background-color: #fef3c7;
  color: #b45309;
}

.activity-icon-department {
  background-color: #e0e7ff;
  color: #4338ca;
}

.activity-icon-employee {
  background-color: #fce7f3;
  color: #be185d;
}

.activity-content {
  flex-grow: 1;
}

.activity-text {
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.8rem;
  color: #666;
}
</style>