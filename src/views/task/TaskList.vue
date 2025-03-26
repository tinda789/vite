<template>
  <app-layout>
    <div class="task-list-page">
      <div class="page-header">
        <h1>Quản lý nhiệm vụ</h1>
        <button class="btn-primary" @click="openCreateModal">
          <i class="fas fa-plus"></i> Tạo nhiệm vụ mới
        </button>
      </div>
      
      <div class="filters">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Tìm kiếm nhiệm vụ..." 
            v-model="searchQuery"
            @input="filterTasks"
          />
          <i class="fas fa-search"></i>
        </div>
        
        <div class="filter-options">
          <select v-model="selectedStatus" @change="filterTasks" class="status-filter">
            <option value="">Tất cả trạng thái</option>
            <option 
              v-for="status in taskStatuses" 
              :key="status" 
              :value="status"
            >
              {{ getStatusLabel(status) }}
            </option>
          </select>
          
          <select v-model="selectedWorkspace" @change="filterTasks" class="workspace-filter">
            <option value="">Tất cả không gian làm việc</option>
            <option 
              v-for="workspace in workspaces" 
              :key="workspace.id" 
              :value="workspace.id"
            >
              {{ workspace.name }}
            </option>
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
      
      <div v-else-if="filteredTasks.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-tasks"></i>
        </div>
        <h3>Không có nhiệm vụ nào</h3>
        <p v-if="searchQuery">Không có kết quả phù hợp với tìm kiếm của bạn.</p>
        <p v-else>Chưa có nhiệm vụ nào trong hệ thống.</p>
        <button class="btn-primary" @click="openCreateModal">
          Tạo nhiệm vụ mới
        </button>
      </div>
      
      <div v-else class="task-list">
        <div 
          v-for="task in filteredTasks" 
          :key="task.id" 
          class="task-card"
          :class="getTaskStatusClass(task.status)"
        >
          <div class="task-header">
            <h3 class="task-title">{{ task.title }}</h3>
            <div class="task-badges">
              <span class="task-priority" :class="getPriorityClass(task.priority)">
                {{ getPriorityLabel(task.priority) }}
              </span>
              <span class="task-status">
                {{ getStatusLabel(task.status) }}
              </span>
            </div>
          </div>
          
          <div class="task-description">
            {{ truncateDescription(task.description) }}
          </div>
          
          <div class="task-meta">
            <div class="task-dates">
              <span class="due-date">
                <i class="fas fa-calendar-alt"></i>
                {{ formatDate(task.dueDate) }}
              </span>
              <span class="progress">
                <i class="fas fa-percent"></i>
                {{ task.progress }}% hoàn thành
              </span>
            </div>
            
            <div class="task-assignee">
              <span>
                <i class="fas fa-user-tie"></i>
                {{ getAssigneeName(task.assigneeId) }}
              </span>
            </div>
          </div>
          
          <div class="task-actions">
            <router-link :to="`/tasks/${task.id}`" class="btn-view">
              <i class="fas fa-eye"></i> Chi tiết
            </router-link>
            <div class="dropdown">
              <button class="btn-more" @click="toggleDropdown($event)">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <div class="dropdown-menu">
                <button @click="editTask(task)" class="dropdown-item">
                  <i class="fas fa-edit"></i> Chỉnh sửa
                </button>
                <button 
                  @click="updateTaskStatus(task, 'IN_PROGRESS')" 
                  class="dropdown-item"
                >
                  <i class="fas fa-play"></i> Bắt đầu
                </button>
                <button 
                  @click="updateTaskStatus(task, 'DONE')" 
                  class="dropdown-item text-success"
                >
                  <i class="fas fa-check"></i> Hoàn thành
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal tạo/chỉnh sửa nhiệm vụ -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ isEditing ? 'Chỉnh sửa nhiệm vụ' : 'Tạo nhiệm vụ mới' }}</h2>
            <button class="modal-close" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <form @submit.prevent="saveTask">
              <div class="form-group">
                <label for="title">Tiêu đề <span class="required">*</span></label>
                <input 
                  type="text" 
                  id="title" 
                  v-model="taskForm.title" 
                  required 
                  class="form-control"
                />
              </div>
              
              <div class="form-group">
                <label for="description">Mô tả</label>
                <textarea 
                  id="description" 
                  v-model="taskForm.description" 
                  class="form-control"
                ></textarea>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="workspace">Không gian làm việc</label>
                  <select 
                    id="workspace" 
                    v-model="taskForm.workspaceId" 
                    class="form-control"
                  >
                    <option value="">Chọn không gian làm việc</option>
                    <option 
                      v-for="workspace in workspaces" 
                      :key="workspace.id" 
                      :value="workspace.id"
                    >
                      {{ workspace.name }}
                    </option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="department">Phòng ban</label>
                  <select 
                    id="department" 
                    v-model="taskForm.departmentId" 
                    class="form-control"
                  >
                    <option value="">Chọn phòng ban</option>
                    <option 
                      v-for="department in departments" 
                      :key="department.id" 
                      :value="department.id"
                    >
                      {{ department.name }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="assignee">Người thực hiện</label>
                  <select 
                    id="assignee" 
                    v-model="taskForm.assigneeId" 
                    class="form-control"
                  >
                    <option value="">Chọn người thực hiện</option>
                    <option 
                      v-for="employee in employees" 
                      :key="employee.id" 
                      :value="employee.id"
                    >
                      {{ employee.user.fullName }}
                    </option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="priority">Mức độ ưu tiên</label>
                  <select 
                    id="priority" 
                    v-model="taskForm.priority" 
                    class="form-control"
                  >
                    <option 
                      v-for="priority in taskPriorities" 
                      :key="priority" 
                      :value="priority"
                    >
                      {{ getPriorityLabel(priority) }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="dueDate">Ngày đến hạn</label>
                  <input 
                    type="date" 
                    id="dueDate" 
                    v-model="taskForm.dueDate" 
                    class="form-control"
                  />
                </div>
                
                <div class="form-group">
                  <label for="progress">Tiến độ (%)</label>
                  <input 
                    type="number" 
                    id="progress" 
                    v-model.number="taskForm.progress" 
                    min="0" 
                    max="100" 
                    class="form-control"
                  />
                </div>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn-cancel" @click="closeModal">
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  class="btn-primary" 
                  :disabled="saving"
                >
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
import { defineComponent, ref, computed, reactive, onMounted } from 'vue'
import AppLayout from '../../components/layout/AppLayout.vue'
import TaskService from '../../services/TaskService'
import WorkspaceService from '../../services/WorkspaceService'
import DepartmentService from '../../services/DepartmentService'
import EmployeeService from '../../services/EmployeeService'

export default defineComponent({
  name: 'TaskListView',
  components: {
    AppLayout
  },
  setup() {
    const tasks = ref([])
    const workspaces = ref([])
    const departments = ref([])
    const employees = ref([])
    
    const loading = ref(true)
    const error = ref('')
    
    const searchQuery = ref('')
    const selectedStatus = ref('')
    const selectedWorkspace = ref('')
    const filteredTasks = ref([])
    
    const showModal = ref(false)
    const isEditing = ref(false)
    const saving = ref(false)
    
    const taskForm = reactive({
      id: null,
      title: '',
      description: '',
      workspaceId: null,
      departmentId: null,
      assigneeId: null,
      priority: 'MEDIUM',
      dueDate: null,
      progress: 0
    })
    
    const taskStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']
    const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    
    // Lấy toàn bộ dữ liệu
    const fetchData = async () => {
      loading.value = true
      try {
        const [
          tasksResponse, 
          workspacesResponse, 
          departmentsResponse, 
          employeesResponse
        ] = await Promise.all([
          TaskService.getAllTasks(),
          WorkspaceService.getAllWorkspaces(),
          DepartmentService.getAllDepartments(),
          EmployeeService.getAllEmployees()
        ])
        
        tasks.value = tasksResponse.data
        workspaces.value = workspacesResponse.data
        departments.value = departmentsResponse.data
        employees.value = employeesResponse.data
        
        filterTasks()
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', err)
        error.value = 'Không thể tải dữ liệu. Vui lòng thử lại.'
      } finally {
        loading.value = false
      }
    }
    
    // Lọc nhiệm vụ
    const filterTasks = () => {
      filteredTasks.value = tasks.value.filter(task => {
        // Lọc theo trạng thái
        if (selectedStatus.value && task.status !== selectedStatus.value) {
          return false
        }
        
        // Lọc theo không gian làm việc
        if (selectedWorkspace.value && task.workspaceId !== selectedWorkspace.value) {
          return false
        }
        
        // Lọc theo từ khóa tìm kiếm
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase()
          return (
            task.title.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
          )
        }
        
        return true
      })
    }
    
    // Các hàm hỗ trợ
    const getStatusLabel = (status) => {
      const statusLabels = {
        'TODO': 'Chưa bắt đầu',
        'IN_PROGRESS': 'Đang thực hiện',
        'REVIEW': 'Đang kiểm duyệt',
        'DONE': 'Hoàn thành',
        'CANCELLED': 'Đã hủy'
      }
      return statusLabels[status] || status
    }
    
    const getPriorityLabel = (priority) => {
      const priorityLabels = {
        'LOW': 'Thấp',
        'MEDIUM': 'Trung bình',
        'HIGH': 'Cao',
        'URGENT': 'Khẩn cấp'
      }
      return priorityLabels[priority] || priority
    }
    
    const getTaskStatusClass = (status) => {
      const statusClasses = {
        'TODO': 'status-todo',
        'IN_PROGRESS': 'status-in-progress',
        'REVIEW': 'status-review',
        'DONE': 'status-done',
        'CANCELLED': 'status-cancelled'
      }
      return statusClasses[status] || ''
    }
    
    const getPriorityClass = (priority) => {
      const priorityClasses = {
        'LOW': 'priority-low',
        'MEDIUM': 'priority-medium',
        'HIGH': 'priority-high',
        'URGENT': 'priority-urgent'
      }
      return priorityClasses[priority] || ''
    }
    
    const truncateDescription = (description: string, maxLength = 100) => {
      return description && description.length > maxLength 
        ? description.substring(0, maxLength) + '...' 
        : description || 'Không có mô tả'
    }
    
    const formatDate = (dateString: string) => {
      return dateString 
        ? new Date(dateString).toLocaleDateString('vi-VN') 
        : 'Không có hạn'
    }
    
    const getAssigneeName = (assigneeId: number) => {
      const employee = employees.value.find(emp => emp.id === assigneeId)
      return employee ? employee.user.fullName : 'Chưa phân công'
    }
    
    // Các hàm quản lý modal
    const openCreateModal = () => {
      isEditing.value = false
      resetForm()
      showModal.value = true
    }
    
    const editTask = (task) => {
      isEditing.value = true
      
      // Điền thông tin nhiệm vụ vào form
      Object.keys(taskForm).forEach(key => {
        taskForm[key] = task[key]
      })
      
      showModal.value = true
    }
    
    const saveTask = async () => {
      saving.value = true
      try {
        if (isEditing.value) {
          await TaskService.updateTask(taskForm.id, taskForm)
        } else {
          await TaskService.createTask(taskForm)
        }
        
        closeModal()
        fetchData()
      } catch (err) {
        console.error('Lỗi lưu nhiệm vụ:', err)
        error.value = 'Không thể lưu nhiệm vụ'
      } finally {
        saving.value = false
      }
    }
    
    const updateTaskStatus = async (task, newStatus) => {
      try {
        await TaskService.updateTaskStatus(task.id, newStatus)
        fetchData()
      } catch (err) {
        console.error('Lỗi cập nhật trạng thái:', err)
        error.value = 'Không thể cập nhật trạng thái nhiệm vụ'
      }
    }
    
    // Mở/đóng dropdown menu
    const toggleDropdown = (event) => {
      const dropdown = event.target.closest('.dropdown')
      const menu = dropdown.querySelector('.dropdown-menu')
      
      document.querySelectorAll('.dropdown-menu').forEach(el => {
        if (el !== menu) el.classList.remove('show')
      })
      
      menu.classList.toggle('show')
      
      // Click outside to close
      setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
          if (!dropdown.contains(e.target)) {
            menu.classList.remove('show')
            document.removeEventListener('click', closeDropdown)
          }
        })
      }, 0)
    }
    
    const closeModal = () => {
      showModal.value = false
      resetForm()
    }
    
    const resetForm = () => {
      taskForm.id = null
      taskForm.title = ''
      taskForm.description = ''
      taskForm.workspaceId = null
      taskForm.departmentId = null
      taskForm.assigneeId = null
      taskForm.priority = 'MEDIUM'
      taskForm.dueDate = null
      taskForm.progress = 0
    }
    
    // Tải dữ liệu khi component được mount
    onMounted(fetchData)
    
    return {
      tasks,
      workspaces,
      departments,
      employees,
      filteredTasks,
      loading,
      error,
      searchQuery,
      selectedStatus,
      selectedWorkspace,
      showModal,
      isEditing,
      saving,
      taskForm,
      taskStatuses,
      taskPriorities,
      getStatusLabel,
      getPriorityLabel,
      getTaskStatusClass,
      getPriorityClass,
      truncateDescription,
      formatDate,
      getAssigneeName,
      openCreateModal,
      editTask,
      saveTask,
      updateTaskStatus,
      toggleDropdown,
      closeModal,
      resetForm,
      filterTasks
    }
  }
})
</script>

<style scoped>
.task-list-page {
  background-color: #f5f7fa;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #333;
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.search-box {
  position: relative;
  flex-grow: 1;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
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

.status-filter, 
.workspace-filter {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #4361ee;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.task-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.task-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.task-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-title {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.task-badges {
  display: flex;
  gap: 0.5rem;
}

.task-priority, 
.task-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.priority-low { background-color: #e8f5e9; color: #2e7d32; }
.priority-medium { background-color: #fff3e0; color: #fb8c00; }
.priority-high { background-color: #ffebee; color: #d32f2f; }
.priority-urgent { background-color: #b71c1c; color: white; }

.status-todo { background-color: #e3f2fd; color: #1976d2; }
.status-in-progress { background-color: #fff3e0; color: #fb8c00; }
.status-review { background-color: #f3e5f5; color: #8e24aa; }
.status-done { background-color: #e8f5e9; color: #2e7d32; }
.status-cancelled { background-color: #fbe9e7; color: #d32f2f; }

.task-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #666;
  font-size: 0.9rem;
}

.task-dates, 
.task-assignee {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.task-dates i, 
.task-assignee i {
  color: #4361ee;
}

.task-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.btn-view {
  color: #4361ee;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  display: none;
  position: absolute;
  right: 0;
  top: 100%;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.dropdown-menu.show {
  display: block;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f5f7fa;
}

.text-success {
  color: #2e7d32;
}

/* Modal styles similar to previous components */
</style>