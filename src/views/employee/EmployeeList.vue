<template>
  <app-layout>
    <div class="employee-list-page">
      <!-- Header -->
      <div class="page-header">
        <h1>Quản lý nhân viên</h1>
        <button v-if="isAdmin" class="btn-primary" @click="openCreateModal">
          <i class="fas fa-plus"></i> Thêm nhân viên mới
        </button>
      </div>
      
      <!-- Filters -->
      <div class="filters-container">
        <div class="search-box">
          <span class="search-icon"><i class="fas fa-search"></i></span>
          <input 
            type="text" 
            class="search-input"
            placeholder="Tìm kiếm nhân viên..." 
            v-model="searchQuery"
            @input="filterEmployees"
          />
        </div>
        <div class="filter-options">
          <select v-model="selectedCompany" @change="filterEmployees" class="filter-select">
            <option :value="null">Tất cả các công ty</option>
            <option 
              v-for="company in companies" 
              :key="company.id" 
              :value="company.id"
            >
              {{ company.name }}
            </option>
          </select>
          <select v-model="selectedDepartment" @change="filterEmployees" class="filter-select">
            <option :value="null">Tất cả phòng ban</option>
            <option 
              v-for="department in departments" 
              :key="department.id" 
              :value="department.id"
            >
              {{ department.name }}
            </option>
          </select>
          <select v-model="statusFilter" @change="filterEmployees" class="filter-select">
            <option value="">Tất cả trạng thái</option>
            <option value="1">Đang làm việc</option>
            <option value="2">Tạm nghỉ</option>
            <option value="3">Đã nghỉ việc</option>
          </select>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <!-- Empty State -->
      <div v-else-if="filteredEmployees.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-user-slash"></i>
        </div>
        <h3>Không tìm thấy nhân viên</h3>
        <p v-if="searchQuery || selectedCompany || selectedDepartment || statusFilter">
          Không có kết quả phù hợp với bộ lọc của bạn.
        </p>
        <p v-else>Chưa có nhân viên nào trong hệ thống.</p>
        <button v-if="isAdmin" class="btn-primary" @click="openCreateModal">
          Thêm nhân viên mới
        </button>
      </div>
      
      <!-- Employee List -->
      <div v-else class="employee-grid">
        <div 
          v-for="employee in filteredEmployees" 
          :key="employee.id" 
          class="employee-card"
          :class="{'employee-inactive': employee.status !== 1}"
        >
          <div class="employee-header">
            <div class="employee-avatar">
              <img v-if="employee.user?.profileImage" :src="employee.user.profileImage" :alt="employee.user.fullName" class="avatar-image" />
              <div v-else class="avatar-placeholder">
                {{ getEmployeeInitials(employee.user.fullName) }}
              </div>
            </div>
            <div class="employee-title">
              <h5 class="employee-name">{{ employee.user.fullName }}</h5>
              <span class="status-badge" :class="getStatusBadgeClass(employee.status)">
                {{ getStatusText(employee.status) }}
              </span>
            </div>
          </div>
          <div class="employee-body">
            <p class="employee-job-title">{{ employee.jobTitle || 'Chưa có chức danh' }}</p>
            <div class="employee-detail">
              <i class="fas fa-building icon-detail"></i>
              {{ getCompanyName(employee.companyId) }}
            </div>
            <div class="employee-detail">
              <i class="fas fa-sitemap icon-detail"></i>
              {{ getDepartmentName(employee.departmentId) }}
            </div>
            <div v-if="employee.workEmail" class="employee-detail employee-email">
              <i class="fas fa-envelope icon-detail"></i>
              {{ employee.workEmail }}
            </div>
            <div v-if="employee.workPhone" class="employee-detail">
              <i class="fas fa-phone icon-detail"></i>
              {{ employee.workPhone }}
            </div>
          </div>
          <div class="employee-footer">
            <router-link :to="`/employees/${employee.id}`" class="btn-view">
              <i class="fas fa-eye"></i> Chi tiết
            </router-link>
            <div class="dropdown" v-if="isAdmin">
              <button class="btn-action dropdown-toggle" @click="toggleDropdown($event)">
                <i class="fas fa-cog"></i>
              </button>
              <ul class="dropdown-menu">
                <li>
                  <button @click="editEmployee(employee)" class="dropdown-item">
                    <i class="fas fa-edit"></i> Chỉnh sửa
                  </button>
                </li>
                <li>
                  <button 
                    @click="deactivateEmployee(employee)" 
                    class="dropdown-item"
                  >
                    <i class="fas fa-user-times"></i> 
                    {{ employee.status === 1 ? 'Vô hiệu hóa' : 'Kích hoạt' }}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Employee Modal -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>{{ isEditing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới' }}</h2>
            <button type="button" class="btn-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveEmployee">
              <!-- User Information -->
              <h3 class="form-section-title">Thông tin cá nhân</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="userId" class="form-label">Người dùng <span class="required">*</span></label>
                  <select id="userId" v-model="employeeForm.userId" class="form-select" required>
                    <option value="">-- Chọn người dùng --</option>
                    <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                      {{ user.fullName }} ({{ user.username }})
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="employeeId" class="form-label">Mã nhân viên</label>
                  <input 
                    type="text" 
                    id="employeeId" 
                    v-model="employeeForm.employeeId" 
                    class="form-control"
                    placeholder="Ví dụ: NV001"
                  />
                </div>
              </div>
              
              <!-- Company & Department -->
              <h3 class="form-section-title">Thông tin công ty và phòng ban</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="companyId" class="form-label">Công ty <span class="required">*</span></label>
                  <select 
                    id="companyId" 
                    v-model="employeeForm.companyId" 
                    class="form-select" 
                    required
                    @change="loadDepartmentsForCompany"
                  >
                    <option value="">-- Chọn công ty --</option>
                    <option v-for="company in companies" :key="company.id" :value="company.id">
                      {{ company.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="departmentId" class="form-label">Phòng ban chính <span class="required">*</span></label>
                  <select 
                    id="departmentId" 
                    v-model="employeeForm.departmentId" 
                    class="form-select" 
                    required
                    @change="loadPositionsForDepartment"
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    <option v-for="dept in availableDepartments" :key="dept.id" :value="dept.id">
                      {{ dept.name }}
                    </option>
                  </select>
                </div>
              </div>
              
              <!-- Position & Manager -->
              <div class="form-row">
                <div class="form-group">
                  <label for="positionId" class="form-label">Vị trí/chức vụ <span class="required">*</span></label>
                  <select 
                    id="positionId" 
                    v-model="employeeForm.positionId" 
                    class="form-select" 
                    required
                  >
                    <option value="">-- Chọn vị trí --</option>
                    <option v-for="pos in availablePositions" :key="pos.id" :value="pos.id">
                      {{ pos.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="managerId" class="form-label">Người quản lý</label>
                  <select id="managerId" v-model="employeeForm.managerId" class="form-select">
                    <option value="">-- Không có --</option>
                    <option v-for="manager in availableManagers" :key="manager.id" :value="manager.id">
                      {{ getUserName(manager) }}
                    </option>
                  </select>
                </div>
              </div>
              
              <!-- Job Title -->
              <div class="form-group">
                <label for="jobTitle" class="form-label">Chức danh</label>
                <input 
                  type="text" 
                  id="jobTitle" 
                  v-model="employeeForm.jobTitle" 
                  class="form-control"
                  placeholder="Ví dụ: Nhân viên kinh doanh"
                />
              </div>
              
              <!-- Contact Info -->
              <h3 class="form-section-title">Thông tin liên hệ</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="workEmail" class="form-label">Email công việc</label>
                  <input 
                    type="email" 
                    id="workEmail" 
                    v-model="employeeForm.workEmail" 
                    class="form-control"
                    placeholder="Ví dụ: nhanvien@congty.com"
                  />
                </div>
                <div class="form-group">
                  <label for="workPhone" class="form-label">Điện thoại công việc</label>
                  <input 
                    type="tel" 
                    id="workPhone" 
                    v-model="employeeForm.workPhone" 
                    class="form-control"
                    placeholder="Ví dụ: 0912345678"
                  />
                </div>
              </div>
              
              <!-- Additional Info -->
              <h3 class="form-section-title">Thông tin bổ sung</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="hireDate" class="form-label">Ngày vào làm</label>
                  <input 
                    type="date" 
                    id="hireDate" 
                    v-model="employeeForm.hireDate" 
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label for="status" class="form-label">Trạng thái</label>
                  <select id="status" v-model="employeeForm.status" class="form-select">
                    <option value="1">Đang làm việc</option>
                    <option value="2">Tạm nghỉ</option>
                    <option value="3">Đã nghỉ việc</option>
                  </select>
                </div>
              </div>
              
              <!-- Secondary Departments -->
              <div class="form-group">
                <label class="form-label">Phòng ban phụ</label>
                <div class="checkbox-container">
                  <div class="checkbox-grid">
                    <div 
                      v-for="dept in availableDepartments" 
                      :key="dept.id" 
                      class="checkbox-item"
                      v-show="dept.id !== employeeForm.departmentId"
                    >
                      <input 
                        type="checkbox" 
                        :id="`secondary-dept-${dept.id}`" 
                        :value="dept.id" 
                        v-model="employeeForm.secondaryDepartmentIds"
                        class="checkbox-input"
                      />
                      <label :for="`secondary-dept-${dept.id}`" class="checkbox-label">{{ dept.name }}</label>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Teams -->
              <div class="form-group">
                <label class="form-label">Nhóm</label>
                <div class="checkbox-container">
                  <div class="checkbox-grid">
                    <div 
                      v-for="team in availableTeams" 
                      :key="team.id" 
                      class="checkbox-item"
                    >
                      <input 
                        type="checkbox" 
                        :id="`team-${team.id}`" 
                        :value="team.id" 
                        v-model="employeeForm.teamIds"
                        class="checkbox-input"
                      />
                      <label :for="`team-${team.id}`" class="checkbox-label">{{ team.name }}</label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn-cancel" @click="closeModal">Hủy bỏ</button>
                <button type="submit" class="btn-submit" :disabled="saving">
                  {{ saving ? 'Đang lưu...' : 'Lưu nhân viên' }}
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
import { useRouter } from 'vue-router'
import AppLayout from '../../components/layout/AppLayout.vue'
import { useAuthStore } from '../../store/auth'
import EmployeeService from '../../services/EmployeeService'
import UserService from '../../services/UserService'
import CompanyService from '../../services/CompanyService'
import DepartmentService from '../../services/DepartmentService'
import PositionService from '../../services/PositionService'
import TeamService from '../../services/TeamService'

// Define interfaces for our data types
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  [key: string]: any;
}

interface Employee {
  id: number;
  userId: number;
  user: User;
  employeeId?: string;
  companyId: number;
  departmentId: number;
  positionId: number|null;
  managerId?: number | null;
  jobTitle?: string;
  workEmail?: string;
  workPhone?: string;
  hireDate?: string;
  status: number;
  secondaryDepartmentIds?: number[];
  teamIds?: number[];
  [key: string]: any;
}

interface Company {
  id: number;
  name: string;
  [key: string]: any;
}

interface Department {
  id: number;
  name: string;
  companyId: number;
  [key: string]: any;
}

interface Position {
  id: number;
  name: string;
  departmentId: number;
  [key: string]: any;
}

interface Team {
  id: number;
  name: string;
  departmentId: number;
  [key: string]: any;
}

interface EmployeeForm {
  id: number | null;
  employeeId: string;
  userId: number | null;
  companyId: number | null;
  departmentId: number | null;
  positionId: number | null;
  managerId: number | null;
  jobTitle: string;
  workEmail: string;
  workPhone: string;
  hireDate: string;
  status: number;
  secondaryDepartmentIds: number[];
  teamIds: number[];
  [key: string]: any;
}

export default defineComponent({
  name: 'EmployeeListView',
  components: {
    AppLayout
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    // Data refs
    const employees = ref<Employee[]>([])
    const users = ref<User[]>([])
    const companies = ref<Company[]>([])
    const departments = ref<Department[]>([])
    const positions = ref<Position[]>([])
    const teams = ref<Team[]>([])
    
    // UI state refs
    const loading = ref(true)
    const error = ref('')
    const showModal = ref(false)
    const isEditing = ref(false)
    const saving = ref(false)
    
    // Filter refs
    const searchQuery = ref('')
    const selectedCompany = ref<number | null>(null)
    const selectedDepartment = ref<number | null>(null)
    const statusFilter = ref('')
    const filteredEmployees = ref<Employee[]>([])
    
    // Form data
    const employeeForm = reactive<EmployeeForm>({
      id: null,
      employeeId: '',
      userId: null,
      companyId: null,
      departmentId: null,
      positionId: null,
      managerId: null,
      jobTitle: '',
      workEmail: '',
      workPhone: '',
      hireDate: '',
      status: 1,
      secondaryDepartmentIds: [],
      teamIds: []
    })
    
    // Computed properties
    const isAdmin = computed(() => authStore.isAdmin)
    
    const availableUsers = computed(() => {
      // Lọc người dùng chưa được gán cho nhân viên nào
      const assignedUserIds = employees.value
        .filter(emp => emp.id !== employeeForm.id)
        .map(emp => emp.userId)
      
      return users.value.filter(user => 
        !assignedUserIds.includes(user.id) || 
        (isEditing.value && user.id === employeeForm.userId)
      )
    })
    
    const availableDepartments = computed(() => {
      if (!employeeForm.companyId) return []
      return departments.value.filter(dept => dept.companyId == employeeForm.companyId)
    })
    
    const availablePositions = computed(() => {
      if (!employeeForm.departmentId) return []
      return positions.value.filter(pos => pos.departmentId == employeeForm.departmentId)
    })
    
    const availableTeams = computed(() => {
      if (!employeeForm.departmentId) return []
      return teams.value.filter(team => team.departmentId == employeeForm.departmentId)
    })
    
    const availableManagers = computed(() => {
      if (!employeeForm.companyId) return []
      return employees.value.filter(emp => 
        emp.companyId == employeeForm.companyId && 
        emp.id !== employeeForm.id
      )
    })
    
    // Methods for data fetching
    const fetchData = async () => {
      loading.value = true
      error.value = ''
      
      try {
        const [
          employeesRes, 
          companiesRes, 
          departmentsRes, 
          positionsRes, 
          teamsRes, 
          usersRes
        ] = await Promise.all([
          EmployeeService.getAllEmployees(),
          CompanyService.getAllCompanies(),
          DepartmentService.getAllDepartments(),
          PositionService.getAllPositions(),
          TeamService.getAllTeams(),
          UserService.getAllUsers()
        ])
        
        employees.value = employeesRes.data
        companies.value = companiesRes.data
        departments.value = departmentsRes.data
        positions.value = positionsRes.data
        teams.value = teamsRes.data
        users.value = usersRes.data
        
        filterEmployees()
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', err)
        error.value = 'Không thể tải dữ liệu. Vui lòng thử lại sau.'
      } finally {
        loading.value = false
      }
    }
    
    // Methods for filtering
    const filterEmployees = () => {
      filteredEmployees.value = employees.value.filter(employee => {
        // Lọc theo từ khóa tìm kiếm
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase()
          const userFullName = getUserName(employee).toLowerCase()
          const employeeId = employee.employeeId ? employee.employeeId.toLowerCase() : ''
          const jobTitle = employee.jobTitle ? employee.jobTitle.toLowerCase() : ''
          
          if (!userFullName.includes(query) && 
              !employeeId.includes(query) && 
              !jobTitle.includes(query)) {
            return false
          }
        }
        
        // Lọc theo công ty
        if (selectedCompany.value && employee.companyId != selectedCompany.value) {
          return false
        }
        
        // Lọc theo phòng ban
        if (selectedDepartment.value && employee.departmentId != selectedDepartment.value) {
          return false
        }
        
        // Lọc theo trạng thái
        if (statusFilter.value && employee.status != Number(statusFilter.value)) {
          return false
        }
        
        return true
      })
    }
    
    // Methods for form handling
    const loadDepartmentsForCompany = async () => {
      if (!employeeForm.companyId) return
      
      employeeForm.departmentId = null
      employeeForm.positionId = null
      employeeForm.secondaryDepartmentIds = []
      employeeForm.teamIds = []
      
      try {
        const response = await DepartmentService.getDepartmentsByCompany(employeeForm.companyId)
        departments.value = response.data
      } catch (err) {
        console.error('Lỗi tải phòng ban theo công ty:', err)
      }
    }
    
    const loadPositionsForDepartment = async () => {
      if (!employeeForm.departmentId) return
      
      employeeForm.positionId = null
      
      try {
        const response = await PositionService.getPositionsByDepartment(employeeForm.departmentId)
        positions.value = response.data
      } catch (err) {
        console.error('Lỗi tải vị trí theo phòng ban:', err)
      }
    }
    
    // Methods for modal actions
    const openCreateModal = () => {
      isEditing.value = false
      resetForm()
      showModal.value = true
    }
    
    const editEmployee = (employee: Employee) => {
      isEditing.value = true
      
      // Điền thông tin nhân viên vào form
      employeeForm.id = employee.id
      employeeForm.employeeId = employee.employeeId || ''
      employeeForm.userId = employee.userId
      employeeForm.companyId = employee.companyId
      employeeForm.departmentId = employee.departmentId
      employeeForm.positionId = employee.positionId
      employeeForm.managerId = employee.managerId || null
      employeeForm.jobTitle = employee.jobTitle || ''
      employeeForm.workEmail = employee.workEmail || ''
      employeeForm.workPhone = employee.workPhone || ''
      employeeForm.hireDate = employee.hireDate || ''
      employeeForm.status = employee.status
      employeeForm.secondaryDepartmentIds = employee.secondaryDepartmentIds || []
      employeeForm.teamIds = employee.teamIds || []
      
      showModal.value = true
    }
    
    const saveEmployee = async () => {
      saving.value = true
      
      try {
        if (isEditing.value && employeeForm.id) {
          await EmployeeService.updateEmployee(employeeForm.id, employeeForm)
        } else {
          await EmployeeService.createEmployee(employeeForm)
        }
        
        closeModal()
        fetchData()
      } catch (err: any) {
        console.error('Lỗi lưu nhân viên:', err)
        error.value = err.response?.data?.message || 'Không thể lưu thông tin nhân viên. Vui lòng thử lại sau.'
      } finally {
        saving.value = false
      }
    }
    
    const deactivateEmployee = async (employee: Employee) => {
      const isActive = employee.status === 1
      const action = isActive ? 'vô hiệu hóa' : 'kích hoạt'
      
      if (confirm(`Bạn có chắc chắn muốn ${action} nhân viên này?`)) {
        try {
          if (isActive) {
            await EmployeeService.deactivateEmployee(employee.id)
          } else {
            // Implement reactivation if needed
            await EmployeeService.updateEmployee(employee.id, { ...employee, status: 1 })
          }
          fetchData()
        } catch (err) {
          console.error(`Lỗi ${action} nhân viên:`, err)
          error.value = `Không thể ${action} nhân viên. Vui lòng thử lại sau.`
        }
      }
    }
    
    const closeModal = () => {
      showModal.value = false
    }
    
    const toggleDropdown = (event: Event) => {
      const dropdown = (event.target as HTMLElement).closest('.dropdown')
      if (!dropdown) return
      
      const menu = dropdown.querySelector('.dropdown-menu')
      if (!menu) return
      
      // Close all other dropdowns
      document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (m !== menu) m.classList.remove('show')
      })
      
      // Toggle current dropdown
      menu.classList.toggle('show')
      
      // Close dropdown when clicking outside
      setTimeout(() => {
        const closeDropdownHandler = (e: Event) => {
          if (!dropdown.contains(e.target as Node)) {
            menu.classList.remove('show')
            document.removeEventListener('click', closeDropdownHandler)
          }
        }
        document.addEventListener('click', closeDropdownHandler)
      }, 0)
    }
    
    const resetForm = () => {
      employeeForm.id = null
      employeeForm.employeeId = ''
      employeeForm.userId = null
      employeeForm.companyId = null
      employeeForm.departmentId = null
      employeeForm.positionId = null
      employeeForm.managerId = null
      employeeForm.jobTitle = ''
      employeeForm.workEmail = ''
      employeeForm.workPhone = ''
      employeeForm.hireDate = ''
      employeeForm.status = 1
      employeeForm.secondaryDepartmentIds = []
      employeeForm.teamIds = []
    }
    
    // Utility methods
    const getUserName = (employee: Employee): string => {
      const user = users.value.find(u => u.id === employee.userId)
      return user ? user.fullName : 'N/A'
    }
    
    const getCompanyName = (companyId: number): string => {
      const company = companies.value.find(c => c.id === companyId)
      return company ? company.name : 'Không xác định'
    }
    
    const getDepartmentName = (departmentId: number): string => {
      const department = departments.value.find(d => d.id === departmentId)
      return department ? department.name : 'Không xác định'
    }
    
    const getEmployeeInitials = (fullName: string): string => {
      if (!fullName) return 'EM'
      
      return fullName.split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    }
    
    const getStatusText = (status: number): string => {
      switch (status) {
        case 1: return 'Đang làm việc'
        case 2: return 'Tạm nghỉ'
        case 3: return 'Đã nghỉ việc'
        default: return 'Không xác định'
      }
    }
    
    const getStatusBadgeClass = (status: number): string => {
      switch (status) {
        case 1: return 'status-active'
        case 2: return 'status-warning'
        case 3: return 'status-danger'
        default: return 'status-secondary'
      }
    }
    
    // Lifecycle hooks
    onMounted(() => {
      fetchData()
    })
    
    return {
      // Data
      employees,
      filteredEmployees,
      companies,
      departments,
      positions,
      teams,
      users,
      // UI state
      loading,
      error,
      isEditing,
      saving,
      showModal,
     // Filters
     searchQuery,
      selectedCompany,
      selectedDepartment,
      statusFilter,
      // Form
      employeeForm,
      // Computed
      isAdmin,
      availableUsers,
      availableDepartments,
      availablePositions,
      availableTeams,
      availableManagers,
      // Methods
      fetchData,
      filterEmployees,
      loadDepartmentsForCompany,
      loadPositionsForDepartment,
      openCreateModal,
      editEmployee,
      saveEmployee,
      deactivateEmployee,
      closeModal,
      resetForm,
      toggleDropdown,
      getUserName,
      getCompanyName,
      getDepartmentName,
      getEmployeeInitials,
      getStatusText,
      getStatusBadgeClass
    }
  }
})
</script>

<style scoped>
/* Page Layout */
.employee-list-page {
  width: 100%;
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.8rem;
  color: #333;
  margin: 0;
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
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

/* Filters */
.filters-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  padding-left: 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 180px;
  font-size: 1rem;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #4361EE;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

/* Empty State */
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

/* Employee Grid */
.employee-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.employee-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.employee-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.employee-inactive {
  border-left: 3px solid #f59e0b;
  background-color: #fefce8;
}

.employee-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #eee;
}

.employee-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background-color: #4361EE;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
}

.employee-title {
  flex-grow: 1;
}

.employee-name {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #333;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-warning {
  background-color: #fff8e1;
  color: #f57c00;
}

.status-danger {
  background-color: #ffebee;
  color: #d32f2f;
}

.status-secondary {
  background-color: #eceff1;
  color: #607d8b;
}

.employee-body {
  padding: 1rem;
  flex-grow: 1;
}

.employee-job-title {
  font-size: 1rem;
  color: #4361EE;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.employee-detail {
  margin-bottom: 0.5rem;
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
}

.icon-detail {
  width: 1.5rem;
  color: #777;
  margin-right: 0.5rem;
}

.employee-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.employee-footer {
  border-top: 1px solid #eee;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-view {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #4361EE;
  text-decoration: none;
  font-weight: 500;
}

.btn-view:hover {
  text-decoration: underline;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: #f5f7fa;
  color: #666;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-action:hover {
  background-color: #e5e9f0;
  color: #333;
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  min-width: 180px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  z-index: 10;
  display: none;
}

.dropdown-menu.show {
  display: block;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  color: #333;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f5f7fa;
}

.dropdown-item i {
  width: 1rem;
  text-align: center;
}

/* Modal */
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

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 1.5rem;
}

.form-section-title {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #4361EE;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.required {
  color: #d32f2f;
}

.form-control, .form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-control:focus, .form-select:focus {
  outline: none;
  border-color: #4361EE;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.checkbox-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.75rem;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.checkbox-input {
  margin-right: 0.5rem;
}

.checkbox-label {
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background-color: white;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  background-color: #4361EE;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.btn-submit:hover {
  background-color: #3a56d4;
}

.btn-submit:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

/* Responsive design */
@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
  }
  
  .filter-options {
    width: 100%;
  }
  
  .filter-select {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .employee-grid {
    grid-template-columns: 1fr;
  }
}
</style>