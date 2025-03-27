<template>
  <app-layout>
    <head>
      
    </head>
    <div class="container-fluid my-3">
      <!-- Header -->
   
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Quản lý nhân viên</h1>
        <button v-if="isAdmin" class="btn btn-primary" @click="openCreateModal">
          <i class="fas fa-plus me-2"></i> Thêm nhân viên mới
        </button>
      </div>
      
      <!-- Filters -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <div class="input-group">
                <span class="input-group-text"><i class="fas fa-search"></i></span>
                <input 
                  type="text" 
                  class="form-control"
                  placeholder="Tìm kiếm nhân viên..." 
                  v-model="searchQuery"
                  @input="filterEmployees"
                />
              </div>
            </div>
            <div class="col-md-3">
              <select v-model="selectedCompany" @change="filterEmployees" class="form-select">
                <option :value="null">Tất cả các công ty</option>
                <option 
                  v-for="company in companies" 
                  :key="company.id" 
                  :value="company.id"
                >
                  {{ company.name }}
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <select v-model="selectedDepartment" @change="filterEmployees" class="form-select">
                <option :value="null">Tất cả phòng ban</option>
                <option 
                  v-for="department in departments" 
                  :key="department.id" 
                  :value="department.id"
                >
                  {{ department.name }}
                </option>
              </select>
            </div>
            <div class="col-md-2">
              <select v-model="statusFilter" @change="filterEmployees" class="form-select">
                <option value="">Tất cả trạng thái</option>
                <option value="1">Đang làm việc</option>
                <option value="2">Tạm nghỉ</option>
                <option value="3">Đã nghỉ việc</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <p class="mt-2">Đang tải dữ liệu...</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>
      
      <!-- Empty State -->
      <div v-else-if="filteredEmployees.length === 0" class="text-center py-5">
        <div class="display-1 text-muted">
          <i class="fas fa-user-slash"></i>
        </div>
        <h3 class="mt-3">Không tìm thấy nhân viên</h3>
        <p v-if="searchQuery || selectedCompany || selectedDepartment || statusFilter">
          Không có kết quả phù hợp với bộ lọc của bạn.
        </p>
        <p v-else>Chưa có nhân viên nào trong hệ thống.</p>
        <button v-if="isAdmin" class="btn btn-primary mt-3" @click="openCreateModal">
          Thêm nhân viên mới
        </button>
      </div>
      
      <!-- Employee List -->
      <div v-else class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
        <div 
          v-for="employee in filteredEmployees" 
          :key="employee.id" 
          class="col"
        >
          <div class="card h-100" :class="{'border-warning bg-light': employee.status !== 1}">
            <div class="card-header d-flex align-items-center">
              <div class="flex-shrink-0">
                <div class="employee-avatar">
                  <img v-if="employee.user?.profileImage" :src="employee.user.profileImage" :alt="employee.user.fullName" class="rounded-circle" width="50" height="50" />
                  <div v-else class="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white" style="width: 50px; height: 50px; font-weight: bold;">
                    {{ getEmployeeInitials(employee.user.fullName) }}
                  </div>
                </div>
              </div>
              <div class="ms-3">
                <h5 class="card-title mb-0">{{ employee.user.fullName }}</h5>
                <span class="badge" :class="getStatusBadgeClass(employee.status)">
                  {{ getStatusText(employee.status) }}
                </span>
              </div>
            </div>
            <div class="card-body">
              <p class="card-text fw-bold text-primary">{{ employee.jobTitle || 'Chưa có chức danh' }}</p>
              <div class="mb-2">
                <i class="fas fa-building me-2 text-muted"></i>
                {{ getCompanyName(employee.companyId) }}
              </div>
              <div class="mb-2">
                <i class="fas fa-sitemap me-2 text-muted"></i>
                {{ getDepartmentName(employee.departmentId) }}
              </div>
              <div v-if="employee.workEmail" class="mb-2 text-truncate">
                <i class="fas fa-envelope me-2 text-muted"></i>
                {{ employee.workEmail }}
              </div>
              <div v-if="employee.workPhone" class="mb-2">
                <i class="fas fa-phone me-2 text-muted"></i>
                {{ employee.workPhone }}
              </div>
            </div>
            <div class="card-footer bg-transparent d-flex justify-content-between">
              <router-link :to="`/employees/${employee.id}`" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-eye me-1"></i> Chi tiết
              </router-link>
              <div class="dropdown" v-if="isAdmin">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="fas fa-cog"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
                  <li>
                    <button @click="editEmployee(employee)" class="dropdown-item">
                      <i class="fas fa-edit me-2"></i> Chỉnh sửa
                    </button>
                  </li>
                  <li>
                    <button 
                      @click="deactivateEmployee(employee)" 
                      class="dropdown-item"
                    >
                      <i class="fas fa-user-times me-2"></i> 
                      {{ employee.status === 1 ? 'Vô hiệu hóa' : 'Kích hoạt' }}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Employee Modal -->
      <div class="modal fade" id="employeeModal" tabindex="-1" aria-labelledby="employeeModalLabel" aria-hidden="true" ref="employeeModal">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="employeeModalLabel">{{ isEditing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới' }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveEmployee">
                <!-- User Information -->
                <h6 class="fw-bold border-bottom pb-2 mb-3">Thông tin cá nhân</h6>
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label for="userId" class="form-label">Người dùng <span class="text-danger">*</span></label>
                    <select id="userId" v-model="employeeForm.userId" class="form-select" required>
                      <option value="">-- Chọn người dùng --</option>
                      <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                        {{ user.fullName }} ({{ user.username }})
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
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
                <h6 class="fw-bold border-bottom pb-2 mb-3">Thông tin công ty và phòng ban</h6>
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label for="companyId" class="form-label">Công ty <span class="text-danger">*</span></label>
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
                  <div class="col-md-6">
                    <label for="departmentId" class="form-label">Phòng ban chính <span class="text-danger">*</span></label>
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
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label for="positionId" class="form-label">Vị trí/chức vụ <span class="text-danger">*</span></label>
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
                  <div class="col-md-6">
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
                <div class="mb-3">
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
                <h6 class="fw-bold border-bottom pb-2 mb-3">Thông tin liên hệ</h6>
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label for="workEmail" class="form-label">Email công việc</label>
                    <input 
                      type="email" 
                      id="workEmail" 
                      v-model="employeeForm.workEmail" 
                      class="form-control"
                      placeholder="Ví dụ: nhanvien@congty.com"
                    />
                  </div>
                  <div class="col-md-6">
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
                <h6 class="fw-bold border-bottom pb-2 mb-3">Thông tin bổ sung</h6>
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label for="hireDate" class="form-label">Ngày vào làm</label>
                    <input 
                      type="date" 
                      id="hireDate" 
                      v-model="employeeForm.hireDate" 
                      class="form-control"
                    />
                  </div>
                  <div class="col-md-6">
                    <label for="status" class="form-label">Trạng thái</label>
                    <select id="status" v-model="employeeForm.status" class="form-select">
                      <option value="1">Đang làm việc</option>
                      <option value="2">Tạm nghỉ</option>
                      <option value="3">Đã nghỉ việc</option>
                    </select>
                  </div>
                </div>
                
                <!-- Secondary Departments -->
                <div class="mb-3">
                  <label class="form-label">Phòng ban phụ</label>
                  <div class="border p-3 rounded">
                    <div class="row row-cols-2 g-2">
                      <div 
                        v-for="dept in availableDepartments" 
                        :key="dept.id" 
                        class="col"
                        v-show="dept.id !== employeeForm.departmentId"
                      >
                        <div class="form-check">
                          <input 
                            type="checkbox" 
                            :id="`secondary-dept-${dept.id}`" 
                            :value="dept.id" 
                            v-model="employeeForm.secondaryDepartmentIds"
                            class="form-check-input"
                          />
                          <label :for="`secondary-dept-${dept.id}`" class="form-check-label">{{ dept.name }}</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Teams -->
                <div class="mb-3">
                  <label class="form-label">Nhóm</label>
                  <div class="border p-3 rounded">
                    <div class="row row-cols-2 g-2">
                      <div 
                        v-for="team in availableTeams" 
                        :key="team.id" 
                        class="col"
                      >
                        <div class="form-check">
                          <input 
                            type="checkbox" 
                            :id="`team-${team.id}`" 
                            :value="team.id" 
                            v-model="employeeForm.teamIds"
                            class="form-check-input"
                          />
                          <label :for="`team-${team.id}`" class="form-check-label">{{ team.name }}</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="d-flex justify-content-end mt-4">
                  <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Hủy bỏ</button>
                  <button type="submit" class="btn btn-primary" :disabled="saving">
                    {{ saving ? 'Đang lưu...' : 'Lưu nhân viên' }}
                  </button>
                </div>
              </form>
            </div>
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
import { Modal } from 'bootstrap'; 

export default defineComponent({
  name: 'EmployeeListView',
  components: {
    AppLayout
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const employeeModal = ref<HTMLElement | null>(null)
    
    // Data refs
    const employees = ref<any[]>([])
    const users = ref<any[]>([])
    const companies = ref<any[]>([])
    const departments = ref<any[]>([])
    const positions = ref<any[]>([])
    const teams = ref<any[]>([])
    
    // UI state refs
    const loading = ref(true)
    const error = ref('')
    const isEditing = ref(false)
    const saving = ref(false)
    
    // Filter refs
    const searchQuery = ref('')
    const selectedCompany = ref<number | null>(null)
    const selectedDepartment = ref<number | null>(null)
    const statusFilter = ref('')
    const filteredEmployees = ref<any[]>([])
      let bsModal: Modal | null = null;
    // Form data
    const employeeForm = reactive({
      id: null as number | null,
      employeeId: '',
      userId: null as number | null,
      companyId: null as number | null,
      departmentId: null as number | null,
      positionId: null as number | null,
      managerId: null as number | null,
      jobTitle: '',
      workEmail: '',
      workPhone: '',
      hireDate: '',
      status: 1,
      secondaryDepartmentIds: [] as number[],
      teamIds: [] as number[]
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
        if (statusFilter.value && employee.status != statusFilter.value) {
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
      showModal()
    }
    
    const editEmployee = (employee: any) => {
      isEditing.value = true
      
      // Điền thông tin nhân viên vào form
      Object.keys(employeeForm).forEach(key => {
        if (key in employee) {
          // @ts-ignore: Safely set dynamic properties
          employeeForm[key] = employee[key]
        }
      })
      
      showModal()
    }
    
    const saveEmployee = async () => {
      saving.value = true
      
      try {
        if (isEditing.value) {
          await EmployeeService.updateEmployee(employeeForm.id, employeeForm)
        } else {
          await EmployeeService.createEmployee(employeeForm)
        }
        
        hideModal()
        fetchData()
      } catch (err: any) {
        console.error('Lỗi lưu nhân viên:', err)
        error.value = err.response?.data?.message || 'Không thể lưu thông tin nhân viên. Vui lòng thử lại sau.'
      } finally {
        saving.value = false
      }
    }
    
    const deactivateEmployee = async (employee: any) => {
      const isActive = employee.status === 1
      const action = isActive ? 'vô hiệu hóa' : 'kích hoạt'
      
      if (confirm(`Bạn có chắc chắn muốn ${action} nhân viên này?`)) {
        try {
          if (isActive) {
            await EmployeeService.deactivateEmployee(employee.id)
          } else {
            // Implement reactivation if needed
            await EmployeeService.updateEmployee(employee.id, {...employee, status: 1})
          }
          fetchData()
        } catch (err) {
          console.error(`Lỗi ${action} nhân viên:`, err)
          error.value = `Không thể ${action} nhân viên. Vui lòng thử lại sau.`
        }
      }
    }
    
    const showModal = () => {
      if (employeeModal.value && !bsModal) {
        bsModal = new Modal(employeeModal.value)
      }
      bsModal?.show()
    }
    
    const hideModal = () => {
      bsModal?.hide()
    }
    
    const resetForm = () => {
      Object.keys(employeeForm).forEach(key => {
        if (key === 'status') {
          employeeForm.status = 1
        } else if (key === 'secondaryDepartmentIds' || key === 'teamIds') {
          // @ts-ignore: Type 'never[]' is not assignable to type 'number[]'
          employeeForm[key] = []
        } else {
          // @ts-ignore: Safely set dynamic properties
          employeeForm[key] = null
        }
      })
      employeeForm.employeeId = ''
      employeeForm.jobTitle = ''
      employeeForm.workEmail = ''
      employeeForm.workPhone = ''
      employeeForm.hireDate = ''
    }
    
    // Utility methods
    const getUserName = (employee: any) => {
      const user = users.value.find(u => u.id === employee.userId)
      return user ? user.fullName : 'N/A'
    }
    
    const getCompanyName = (companyId: number) => {
      const company = companies.value.find(c => c.id === companyId)
      return company ? company.name : 'Không xác định'
    }
    
    const getDepartmentName = (departmentId: number) => {
      const department = departments.value.find(d => d.id === departmentId)
      return department ? department.name : 'Không xác định'
    }
    
    const getEmployeeInitials = (fullName: string) => {
      if (!fullName) return 'EM'
      
      return fullName.split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    }
    
    const getStatusText = (status: number) => {
      switch (status) {
        case 1: return 'Đang làm việc'
        case 2: return 'Tạm nghỉ'
        case 3: return 'Đã nghỉ việc'
        default: return 'Không xác định'
      }
    }
    
    const getStatusBadgeClass = (status: number) => {
      switch (status) {
        case 1: return 'bg-success'
        case 2: return 'bg-warning'
        case 3: return 'bg-danger'
        default: return 'bg-secondary'
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
      // Filters
      searchQuery,
      selectedCompany,
      selectedDepartment,
      statusFilter,
      // Form
      employeeForm,
      employeeModal,
      // Computed
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
      showModal,
      hideModal,
      resetForm,
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