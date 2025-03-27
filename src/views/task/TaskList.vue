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
                  v-if="task.status === 'TODO'"
                >
                  <i class="fas fa-play"></i> Bắt đầu
                </button>
                <button 
                  @click="updateTaskStatus(task, 'DONE')" 
                  class="dropdown-item text-success"
                  v-if="task.status !== 'DONE'"
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

// Định nghĩa các interface phù hợp với dữ liệu
interface Employee {
  id: number;
  user: {
    fullName: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface Workspace {
  id: number;
  name: string;
  [key: string]: any;
}

interface Department {
  id: number;
  name: string;
  [key: string]: any;
}

interface TaskDTO {
  id?: number;
  title: string;
  description?: string;
  workspaceId?: number | undefined;
  departmentId?: number | undefined;
  assigneeId?: number | undefined;
  priority: string;
  status: string; // Thay đổi từ status?: string thành status: string để tránh undefined
  dueDate?: string | undefined;
  progress: number;
  [key: string]: any;
}

export default defineComponent({
  name: 'TaskListView',
  components: {
    AppLayout
  },
  setup() {
    // Data refs
    const tasks = ref<TaskDTO[]>([]);
    const workspaces = ref<Workspace[]>([]);
    const departments = ref<Department[]>([]);
    const employees = ref<Employee[]>([]);
    
    // UI state
    const loading = ref(true);
    const error = ref('');
    const showModal = ref(false);
    const isEditing = ref(false);
    const saving = ref(false);
    
    // Filters
    const searchQuery = ref('');
    const selectedStatus = ref('');
    const selectedWorkspace = ref<number | undefined>(undefined);
    const filteredTasks = ref<TaskDTO[]>([]);
    
    // Form data
    const taskForm = reactive<TaskDTO>({
      title: '',
      description: '',
      workspaceId: undefined,
      departmentId: undefined,
      assigneeId: undefined,
      priority: 'MEDIUM',
      status: 'TODO', // Đảm bảo luôn có giá trị mặc định
      dueDate: undefined,
      progress: 0
    });
    
    // Constants
    const taskStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'];
    const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    
    // Fetch all data
    const fetchData = async () => {
      loading.value = true;
      error.value = '';
      
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
        ]);
        
        tasks.value = tasksResponse.data;
        workspaces.value = workspacesResponse.data;
        departments.value = departmentsResponse.data;
        employees.value = employeesResponse.data;
        
        filterTasks();
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', err);
        error.value = 'Không thể tải dữ liệu. Vui lòng thử lại.';
      } finally {
        loading.value = false;
      }
    };
    
    // Filter tasks
    const filterTasks = () => {
      filteredTasks.value = tasks.value.filter(task => {
        // Filter by status
        if (selectedStatus.value && task.status !== selectedStatus.value) {
          return false;
        }
        
        // Filter by workspace
        if (selectedWorkspace.value && task.workspaceId !== selectedWorkspace.value) {
          return false;
        }
        
        // Filter by search query
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase();
          return (
            (task.title && task.title.toLowerCase().includes(query)) ||
            (task.description && task.description.toLowerCase().includes(query))
          );
        }
        
        return true;
      });
    };
    
    // Helper methods
    const getStatusLabel = (status: string): string => {
      const statusLabels: Record<string, string> = {
        'TODO': 'Chưa bắt đầu',
        'IN_PROGRESS': 'Đang thực hiện',
        'REVIEW': 'Đang kiểm duyệt',
        'DONE': 'Hoàn thành',
        'CANCELLED': 'Đã hủy'
      };
      return statusLabels[status] || status;
    };
    
    const getPriorityLabel = (priority: string): string => {
      const priorityLabels: Record<string, string> = {
        'LOW': 'Thấp',
        'MEDIUM': 'Trung bình',
        'HIGH': 'Cao',
        'URGENT': 'Khẩn cấp'
      };
      return priorityLabels[priority] || priority;
    };
    
    const getTaskStatusClass = (status: string): string => {
      const statusClasses: Record<string, string> = {
        'TODO': 'status-todo',
        'IN_PROGRESS': 'status-in-progress',
        'REVIEW': 'status-review',
        'DONE': 'status-done',
        'CANCELLED': 'status-cancelled'
      };
      return statusClasses[status] || '';
    };
    
    const getPriorityClass = (priority: string): string => {
      const priorityClasses: Record<string, string> = {
        'LOW': 'priority-low',
        'MEDIUM': 'priority-medium',
        'HIGH': 'priority-high',
        'URGENT': 'priority-urgent'
      };
      return priorityClasses[priority] || '';
    };
    
    const truncateDescription = (description?: string, maxLength = 100): string => {
      if (!description) return 'Không có mô tả';
      return description.length > maxLength 
        ? description.substring(0, maxLength) + '...' 
        : description;
    };
    
    const formatDate = (dateString?: string): string => {
      return dateString 
        ? new Date(dateString).toLocaleDateString('vi-VN') 
        : 'Không có hạn';
    };
    
    const getAssigneeName = (assigneeId?: number): string => {
      if (!assigneeId) return 'Chưa phân công';
      const employee = employees.value.find(emp => emp.id === assigneeId);
      return employee ? employee.user.fullName : 'Chưa phân công';
    };
    
    // Modal functions
    const openCreateModal = () => {
      isEditing.value = false;
      resetForm();
      showModal.value = true;
    };
    
    const editTask = (task: TaskDTO) => {
      isEditing.value = true;
      
      // Fill form with task data
      Object.keys(taskForm).forEach(key => {
        if (key in task) {
          (taskForm as any)[key] = task[key as keyof TaskDTO];
        }
      });
      
      showModal.value = true;
    };
    
    const saveTask = async () => {
      saving.value = true;
      try {
        if (isEditing.value && taskForm.id) {
          await TaskService.updateTask(taskForm.id, taskForm);
        } else {
          await TaskService.createTask(taskForm);
        }
        
        closeModal();
        fetchData();
      } catch (err) {
        console.error('Lỗi lưu nhiệm vụ:', err);
        error.value = 'Không thể lưu nhiệm vụ';
      } finally {
        saving.value = false;
      }
    };
    
    const updateTaskStatus = async (task: TaskDTO, newStatus: string) => {
      try {
        if (task.id !== undefined) {
          await TaskService.updateTaskStatus(task.id, newStatus);
          fetchData();
        }
      } catch (err) {
        console.error('Lỗi cập nhật trạng thái:', err);
        error.value = 'Không thể cập nhật trạng thái nhiệm vụ';
      }
    };
    
    const toggleDropdown = (event: Event) => {
      const dropdown = (event.target as HTMLElement).closest('.dropdown');
      if (!dropdown) return;
      
      const menu = dropdown.querySelector('.dropdown-menu');
      if (!menu) return;
      
      document.querySelectorAll('.dropdown-menu').forEach(el => {
        if (el !== menu) el.classList.remove('show');
      });
      
      menu.classList.toggle('show');
      
      // Click outside to close
      setTimeout(() => {
        const closeDropdownHandler = (e: Event) => {
          if (!dropdown.contains(e.target as Node)) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeDropdownHandler);
          }
        };
        document.addEventListener('click', closeDropdownHandler);
      }, 0);
    };
    
    const closeModal = () => {
      showModal.value = false;
      resetForm();
    };
    
    const resetForm = () => {
      taskForm.id = undefined;
      taskForm.title = '';
      taskForm.description = '';
      taskForm.workspaceId = undefined;
      taskForm.departmentId = undefined;
      taskForm.assigneeId = undefined;
      taskForm.priority = 'MEDIUM';
      taskForm.status = 'TODO'; // Đảm bảo luôn có giá trị mặc định
      taskForm.dueDate = undefined;
      taskForm.progress = 0;
    };
    
    // Initialize data
    onMounted(fetchData);
    
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
    };
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

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

.btn-primary {
  padding: 0.75rem 1.5rem;
  background-color: #4361ee;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.btn-view:hover {
  text-decoration: underline;
}

.dropdown {
  position: relative;
}

.dropdown .btn-more {
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
}

.dropdown .btn-more:hover {
  background-color: #f5f7fa;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 150px;
  display: none;
}

.dropdown-menu.show {
  display: block;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
}

.dropdown-item:hover {
  background-color: #f5f7fa;
}

.text-success {
  color: #2e7d32;
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
  width: 90%;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
  border-color: #4361ee;
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
}

textarea.form-control {
  min-height: 120px;
  resize: vertical;
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

.btn-primary:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .task-list {
    grid-template-columns: 1fr;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-options {
    width: 100%;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>