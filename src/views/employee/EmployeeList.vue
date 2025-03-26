<template>
    <app-layout>
      <div class="employee-list-page">
        <div class="page-header">
          <h1>Quản lý nhân viên</h1>
          <button v-if="isAdmin" class="btn-primary" @click="openCreateModal">
            <i class="fas fa-plus"></i> Thêm nhân viên mới
          </button>
        </div>
        
        <div class="filters">
          <div class="search-box">
            <input 
              type="text" 
              placeholder="Tìm kiếm nhân viên..." 
              v-model="searchQuery"
              @input="filterEmployees"
            />
            <i class="fas fa-search"></i>
          </div>
          
          <div class="filter-options">
            <select 
              v-model="selectedCompany" 
              @change="filterEmployees"
              class="company-filter"
            >
              <option :value="null">Tất cả các công ty</option>
              <option 
                v-for="company in companies" 
                :key="company.id" 
                :value="company.id"
              >
                {{ company.name }}
              </option>
            </select>
            
            <select 
              v-model="selectedDepartment" 
              @change="filterEmployees"
              class="department-filter"
            >
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
        </div>
        
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
        
        <div v-else-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-else-if="filteredEmployees.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-user-slash"></i>
          </div>
          <h3>Không tìm thấy nhân viên</h3>
          <p v-if="searchQuery">Không có kết quả phù hợp với tìm kiếm của bạn.</p>
          <p v-else>Chưa có nhân viên nào trong hệ thống.</p>
          <button v-if="isAdmin" class="btn-primary" @click="openCreateModal">
            Thêm nhân viên mới
          </button>
        </div>
        
        <div v-else class="employee-grid">
          <div 
            v-for="employee in filteredEmployees" 
            :key="employee.id" 
            class="employee-card"
          >
            <div class="employee-avatar">
              <img 
                v-if="employee.user?.profileImage" 
                :src="employee.user.profileImage" 
                :alt="employee.user.fullName"
              />
              <div v-else class="avatar-placeholder">
                {{ getEmployeeInitials(employee.user.fullName) }}
              </div>
            </div>
            
            <div class="employee-info">
              <h3 class="employee-name">
                {{ employee.user.fullName }}
                <span v-if="employee.employeeId" class="employee-code">
                  (#{{ employee.employeeId }})
                </span>
              </h3>
              <p class="employee-job-title">{{ employee.jobTitle }}</p>
              <div class="employee-details">
                <span class="company-name">
                  <i class="fas fa-building"></i> 
                  {{ getCompanyName(employee.companyId) }}
                </span>
                <span class="department-name">
                  <i class="fas fa-sitemap"></i>
                  {{ getDepartmentName(employee.departmentId) }}
                </span>
              </div>
            </div>
            
            <div class="employee-actions">
              <router-link :to="`/employees/${employee.id}`" class="btn-view">
                <i class="fas fa-eye"></i> Chi tiết
              </router-link>
              <div class="dropdown" v-if="isAdmin">
                <button class="btn-more" @click="toggleDropdown($event)">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="dropdown-menu">
                  <button @click="editEmployee(employee)" class="dropdown-item">
                    <i class="fas fa-edit"></i> Chỉnh sửa
                  </button>
                  <button 
                    @click="deactivateEmployee(employee)" 
                    class="dropdown-item text-danger"
                  >
                    <i class="fas fa-user-times"></i> 
                    {{ employee.status === 1 ? 'Vô hiệu hóa' : 'Kích hoạt' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Modal thêm/chỉnh sửa nhân viên -->
        <div v-if="showModal" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h2>{{ isEditing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới' }}</h2>
              <button class="modal-close" @click="closeModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="modal-body">
              <form @submit.prevent="saveEmployee">
                <!-- Form fields for employee details -->
                <div class="form-group">
                  <label>Thông tin cá nhân</label>
                  <div class="form-row">
                    <input 
                      type="text" 
                      placeholder="Họ và tên" 
                      v-model="employeeForm.user.fullName" 
                      required 
                      class="form-control"
                    />
                    <input 
                      type="email" 
                      placeholder="Email" 
                      v-model="employeeForm.user.email" 
                      required 
                      class="form-control"
                    />
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Thông tin công việc</label>
                  <div class="form-row">
                    <select 
                      v-model="employeeForm.companyId" 
                      required 
                      class="form-control"
                    >
                      <option value="">Chọn công ty</option>
                      <option 
                        v-for="company in companies" 
                        :key="company.id" 
                        :value="company.id"
                      >
                        {{ company.name }}
                      </option>
                    </select>
                    
                    <select 
                      v-model="employeeForm.departmentId" 
                      required 
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
                  
                  <div class="form-row">
                    <select 
                      v-model="employeeForm.positionId" 
                      required 
                      class="form-control"
                    >
                      <option value="">Chọn vị trí</option>
                      <option 
                        v-for="position in positions" 
                        :key="position.id" 
                        :value="position.id"
                      >
                        {{ position.name }}
                      </option>
                    </select>
                    
                    <input 
                      type="text" 
                      placeholder="Chức danh" 
                      v-model="employeeForm.jobTitle" 
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
  import { useAuthStore } from '../../store/auth'
  import EmployeeService from '../../services/EmployeeService'
  import CompanyService from '../../services/CompanyService'
  import DepartmentService from '../../services/DepartmentService'
  import PositionService from '../../services/PositionService'
  
  export default defineComponent({
    name: 'EmployeeListView',
    components: {
      AppLayout
    },
    setup() {
      const authStore = useAuthStore()
      
      const employees = ref([])
      const companies = ref([])
      const departments = ref([])
      const positions = ref([])
      
      const loading = ref(true)
      const error = ref('')
      
      const searchQuery = ref('')
      const selectedCompany = ref(null)
      const selectedDepartment = ref(null)
      const filteredEmployees = ref([])
      
      const showModal = ref(false)
      const isEditing = ref(false)
      const saving = ref(false)
      
      const employeeForm = reactive({
        id: null,
        user: {
          fullName: '',
          email: ''
        },
        companyId: null,
        departmentId: null,
        positionId: null,
        jobTitle: ''
      })
      
      const isAdmin = computed(() => authStore.isAdmin)
      
      // Lấy toàn bộ dữ liệu
      const fetchData = async () => {
        loading.value = true
        try {
          const [
            employeesResponse, 
            companiesResponse, 
            departmentsResponse, 
            positionsResponse
          ] = await Promise.all([
            EmployeeService.getAllEmployees(),
            CompanyService.getAllCompanies(),
            DepartmentService.getAllDepartments(),
            PositionService.getAllPositions()
          ])
          
          employees.value = employeesResponse.data
          companies.value = companiesResponse.data
          departments.value = departmentsResponse.data
          positions.value = positionsResponse.data
          
          filterEmployees()
        } catch (err) {
          console.error('Lỗi tải dữ liệu:', err)
          error.value = 'Không thể tải dữ liệu. Vui lòng thử lại.'
        } finally {
          loading.value = false
        }
      }
      
      // Lọc nhân viên
      const filterEmployees = () => {
        filteredEmployees.value = employees.value.filter(employee => {
          // Lọc theo công ty
          if (selectedCompany.value && employee.companyId !== selectedCompany.value) {
            return false
          }
          
          // Lọc theo phòng ban
          if (selectedDepartment.value && employee.departmentId !== selectedDepartment.value) {
            return false
          }
          
          // Lọc theo từ khóa tìm kiếm
          if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase()
            return (
              employee.user.fullName.toLowerCase().includes(query) ||
              (employee.employeeId && employee.employeeId.includes(query)) ||
              (employee.jobTitle && employee.jobTitle.toLowerCase().includes(query))
            )
          }
          
          return true
        })
      }
      
      // Các hàm hỗ trợ
      const getEmployeeInitials = (fullName) => {
        if (!fullName) return 'NV'
        return fullName.split(' ')
          .map(word => word[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      }
      
      const getCompanyName = (companyId) => {
        const company = companies.value.find(c => c.id === companyId)
        return company ? company.name : 'Không xác định'
      }
      
      const getDepartmentName = (departmentId) => {
        const department = departments.value.find(d => d.id === departmentId)
        return department ? department.name : 'Không xác định'
      }
      
      // Các hàm quản lý modal
      const openCreateModal = () => {
        isEditing.value = false
        resetForm()
        showModal.value = true
      }
      
      const editEmployee = (employee) => {
        isEditing.value = true
        
        // Điền thông tin nhân viên vào form
        employeeForm.id = employee.id
        employeeForm.user.fullName = employee.user.fullName
        employeeForm.user.email = employee.user.email
        employeeForm.companyId = employee.companyId
        employeeForm.departmentId = employee.departmentId
        employeeForm.positionId = employee.positionId
        employeeForm.jobTitle = employee.jobTitle
        
        showModal.value = true
      }
      
      const saveEmployee = async () => {
        saving.value = true
        try {
          if (isEditing.value) {
            await EmployeeService.updateEmployee(employeeForm.id, employeeForm)
          } else {
            await EmployeeService.createEmployee(employeeForm)
          }
          
          closeModal()
          fetchData()
        } catch (err) {
          console.error('Lỗi lưu nhân viên:', err)
          error.value = 'Không thể lưu thông tin nhân viên'
        } finally {
          saving.value = false
        }
      }
      
      const deactivateEmployee = async (employee) => {
        try {
          if (employee.status === 1) {
            await EmployeeService.deactivateEmployee(employee.id)
          } else {
            // Nếu muốn kích hoạt lại nhân viên
            // Thêm logic kích hoạt tại đây
          }
          fetchData()
        } catch (err) {
          console.error('Lỗi vô hiệu hóa nhân viên:', err)
          error.value = 'Không thể vô hiệu hóa nhân viên'
        }
      }
      
      const closeModal = () => {
        showModal.value = false
        resetForm()
      }
      
      const resetForm = () => {
      employeeForm.id = null
      employeeForm.user.fullName = ''
      employeeForm.user.email = ''
      employeeForm.companyId = null
      employeeForm.departmentId = null
      employeeForm.positionId = null
      employeeForm.jobTitle = ''
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
    
    // Tải dữ liệu khi component được mount
    onMounted(fetchData)
    
    return {
      employees,
      companies,
      departments,
      positions,
      filteredEmployees,
      loading,
      error,
      searchQuery,
      selectedCompany,
      selectedDepartment,
      showModal,
      isEditing,
      saving,
      employeeForm,
      isAdmin,
      getEmployeeInitials,
      getCompanyName,
      getDepartmentName,
      filterEmployees,
      openCreateModal,
      editEmployee,
      saveEmployee,
      deactivateEmployee,
      closeModal,
      toggleDropdown
    }
  }
})
</script>

<style scoped>
.employee-list-page {
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

.company-filter, 
.department-filter {
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

.employee-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.employee-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  padding: 1.5rem;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.employee-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.employee-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.employee-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background-color: #4361ee;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.employee-info {
  flex-grow: 1;
}

.employee-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: #333;
}

.employee-code {
  font-size: 0.8rem;
  color: #666;
  margin-left: 0.5rem;
}

.employee-job-title {
  margin: 0 0 0.5rem 0;
  color: #666;
}

.employee-details {
  display: flex;
  gap: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.employee-details i {
  margin-right: 0.5rem;
  color: #4361ee;
}

.employee-actions {
  display: flex;
  align-items: center;
}

.btn-view {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4361ee;
  text-decoration: none;
  margin-right: 0.5rem;
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

.text-danger {
  color: #d32f2f;
}

/* Modal styles similar to previous components */
</style>