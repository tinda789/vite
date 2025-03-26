<!-- src/views/admin/EmployeeManagement.vue -->
<template>
    <app-layout>
      <div class="employee-management">
        <div class="page-header">
          <h1>Quản lý nhân viên</h1>
          <button class="btn-primary" @click="openCreateModal">
            <i class="fas fa-user-plus"></i> Thêm nhân viên mới
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
            <select v-model="companyFilter" @change="filterEmployees" class="select-filter">
              <option value="">Tất cả công ty</option>
              <option v-for="company in companies" :key="company.id" :value="company.id">
                {{ company.name }}
              </option>
            </select>
            
            <select v-model="departmentFilter" @change="filterEmployees" class="select-filter">
              <option value="">Tất cả phòng ban</option>
              <option v-for="dept in filteredDepartments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </option>
            </select>
            
            <select v-model="statusFilter" @change="filterEmployees" class="select-filter">
              <option value="">Tất cả trạng thái</option>
              <option value="1">Đang làm việc</option>
              <option value="2">Tạm nghỉ</option>
              <option value="3">Đã nghỉ việc</option>
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
            <i class="fas fa-user-tie"></i>
          </div>
          <h3>Không tìm thấy nhân viên nào</h3>
          <p v-if="searchQuery || companyFilter || departmentFilter || statusFilter">
            Không có kết quả phù hợp với bộ lọc của bạn.
          </p>
          <p v-else>Chưa có nhân viên nào trong hệ thống.</p>
          <button class="btn-primary" @click="openCreateModal">
            Thêm nhân viên mới
          </button>
        </div>
        
        <div v-else class="employee-cards">
          <div 
            v-for="employee in filteredEmployees" 
            :key="employee.id" 
            class="employee-card"
            :class="{'employee-inactive': employee.status !== 1}"
          >
            <div class="employee-header">
              <div class="employee-avatar">
                <img v-if="getProfileImage(employee)" :src="getProfileImage(employee)" alt="" />
                <div v-else class="avatar-placeholder">{{ getEmployeeInitials(employee) }}</div>
              </div>
              <div class="employee-id">{{ employee.employeeId || 'N/A' }}</div>
            </div>
            
            <div class="employee-body">
              <h3 class="employee-name">{{ getUserName(employee) }}</h3>
              <p class="employee-position">{{ getPositionName(employee) }}</p>
              <p class="employee-department">{{ getDepartmentName(employee) }}</p>
              
              <div class="employee-contact">
                <div v-if="employee.workEmail" class="contact-item">
                  <i class="fas fa-envelope"></i> {{ employee.workEmail }}
                </div>
                <div v-if="employee.workPhone" class="contact-item">
                  <i class="fas fa-phone"></i> {{ employee.workPhone }}
                </div>
              </div>
              
              <div class="employee-status" :class="getStatusClass(employee)">
                {{ getStatusText(employee.status) }}
              </div>
            </div>
            
            <div class="employee-footer">
              <button class="btn-view" @click="viewEmployee(employee)">
                <i class="fas fa-eye"></i> Chi tiết
              </button>
              <button class="btn-edit" @click="editEmployee(employee)">
                <i class="fas fa-edit"></i> Sửa
              </button>
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
                <!-- Thông tin cơ bản -->
                <h3 class="form-section-title">Thông tin cơ bản</h3>
                
                <div class="form-group">
                  <label for="userId">Người dùng <span class="required">*</span></label>
                  <select id="userId" v-model="employeeForm.userId" class="form-control" required>
                    <option value="">-- Chọn người dùng --</option>
                    <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                      {{ user.fullName }} ({{ user.username }})
                    </option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="employeeId">Mã nhân viên</label>
                  <input 
                    type="text" 
                    id="employeeId" 
                    v-model="employeeForm.employeeId" 
                    class="form-control"
                    placeholder="Ví dụ: NV001"
                  />
                </div>
                
                <div class="form-row">
                  <div class="form-group half">
                    <label for="companyId">Công ty <span class="required">*</span></label>
                    <select 
                      id="companyId" 
                      v-model="employeeForm.companyId" 
                      class="form-control" 
                      required
                      @change="loadDepartmentsForCompany"
                    >
                      <option value="">-- Chọn công ty --</option>
                      <option v-for="company in companies" :key="company.id" :value="company.id">
                        {{ company.name }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="form-group half">
                    <label for="departmentId">Phòng ban chính <span class="required">*</span></label>
                    <select 
                      id="departmentId" 
                      v-model="employeeForm.departmentId" 
                      class="form-control" 
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
                
                <div class="form-row">
                  <div class="form-group half">
                    <label for="positionId">Vị trí/chức vụ <span class="required">*</span></label>
                    <select 
                      id="positionId" 
                      v-model="employeeForm.positionId" 
                      class="form-control" 
                      required
                    >
                      <option value="">-- Chọn vị trí --</option>
                      <option v-for="pos in availablePositions" :key="pos.id" :value="pos.id">
                        {{ pos.name }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="form-group half">
                    <label for="managerId">Người quản lý</label>
                    <select id="managerId" v-model="employeeForm.managerId" class="form-control">
                      <option value="">-- Không có --</option>
                      <option v-for="manager in availableManagers" :key="manager.id" :value="manager.id">
                        {{ getUserName(manager) }}
                      </option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="jobTitle">Chức danh</label>
                  <input 
                    type="text" 
                    id="jobTitle" 
                    v-model="employeeForm.jobTitle" 
                    class="form-control"
                    placeholder="Ví dụ: Nhân viên kinh doanh"
                  />
                </div>
                
                <!-- Thông tin liên hệ -->
                <h3 class="form-section-title">Thông tin liên hệ</h3>
                
                <div class="form-row">
                  <div class="form-group half">
                    <label for="workEmail">Email công việc</label>
                    <input 
                      type="email" 
                      id="workEmail" 
                      v-model="employeeForm.workEmail" 
                      class="form-control"
                      placeholder="Ví dụ: nhanvien@congty.com"
                    />
                  </div>
                  
                  <div class="form-group half">
                    <label for="workPhone">Điện thoại công việc</label>
                    <input 
                      type="tel" 
                      id="workPhone" 
                      v-model="employeeForm.workPhone" 
                      class="form-control"
                      placeholder="Ví dụ: 0912345678"
                    />
                  </div>
                </div>
                
                <!-- Thông tin bổ sung -->
                <h3 class="form-section-title">Thông tin bổ sung</h3>
                
                <div class="form-row">
                  <div class="form-group half">
                    <label for="hireDate">Ngày vào làm</label>
                    <input 
                      type="date" 
                      id="hireDate" 
                      v-model="employeeForm.hireDate" 
                      class="form-control"
                    />
                  </div>
                  
                  <div class="form-group half">
                    <label for="status">Trạng thái</label>
                    <select id="status" v-model="employeeForm.status" class="form-control">
                      <option value="1">Đang làm việc</option>
                      <option value="2">Tạm nghỉ</option>
                      <option value="3">Đã nghỉ việc</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Phòng ban phụ</label>
                  <div class="checkbox-list">
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
                      />
                      <label :for="`secondary-dept-${dept.id}`">{{ dept.name }}</label>
                    </div>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Nhóm</label>
                  <div class="checkbox-list">
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
                      />
                      <label :for="`team-${team.id}`">{{ team.name }}</label>
                    </div>
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
  import { defineComponent, ref, computed, reactive, onMounted, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import AppLayout from '../../components/layout/AppLayout.vue';
  import EmployeeService from '../../services/EmployeeService';
  import UserService from '../../services/UserService';
  import CompanyService from '../../services/CompanyService';
  import DepartmentService from '../../services/DepartmentService';
  import PositionService from '../../services/PositionService';
  import TeamService from '../../services/TeamService';
  
  export default defineComponent({
    name: 'EmployeeManagementView',
    components: {
      AppLayout
    },
    setup() {
      const router = useRouter();
      
      // Data
      const employees = ref([]);
      const users = ref([]);
      const companies = ref([]);
      const departments = ref([]);
      const positions = ref([]);
      const teams = ref([]);
      
      // Filters
      const searchQuery = ref('');
      const companyFilter = ref('');
      const departmentFilter = ref('');
      const statusFilter = ref('');
      
     // UI state
    const loading = ref(true);
    const error = ref('');
    const showModal = ref(false);
    const isEditing = ref(false);
    const saving = ref(false);
    
    // Form data
    const employeeForm = reactive({
      id: null,
      employeeId: '',
      userId: '',
      companyId: '',
      departmentId: '',
      positionId: '',
      managerId: '',
      jobTitle: '',
      workEmail: '',
      workPhone: '',
      hireDate: '',
      status: 1,
      secondaryDepartmentIds: [],
      teamIds: []
    });
    
    // Computed properties for filtered data
    const filteredEmployees = ref([]);
    
    const availableUsers = computed(() => {
      // Lọc người dùng chưa được gán cho nhân viên nào
      const assignedUserIds = employees.value
        .filter(emp => emp.id !== employeeForm.id) // Không loại trừ người dùng của nhân viên đang chỉnh sửa
        .map(emp => emp.userId);
      
      return users.value.filter(user => 
        !assignedUserIds.includes(user.id) || 
        (isEditing.value && user.id === employeeForm.userId)
      );
    });
    
    const filteredDepartments = computed(() => {
      if (!companyFilter.value) return departments.value;
      return departments.value.filter(dept => dept.companyId == companyFilter.value);
    });
    
    const availableDepartments = computed(() => {
      if (!employeeForm.companyId) return [];
      return departments.value.filter(dept => dept.companyId == employeeForm.companyId);
    });
    
    const availablePositions = computed(() => {
      if (!employeeForm.departmentId) return [];
      return positions.value.filter(pos => pos.departmentId == employeeForm.departmentId);
    });
    
    const availableTeams = computed(() => {
      if (!employeeForm.departmentId) return [];
      return teams.value.filter(team => team.departmentId == employeeForm.departmentId);
    });
    
    const availableManagers = computed(() => {
      if (!employeeForm.companyId) return [];
      return employees.value.filter(emp => 
        emp.companyId == employeeForm.companyId && 
        emp.id !== employeeForm.id // Không thể tự quản lý mình
      );
    });
    
    // Methods
    const fetchEmployees = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const response = await EmployeeService.getAllEmployees();
        employees.value = response.data;
        filterEmployees();
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        error.value = 'Không thể tải dữ liệu nhân viên. Vui lòng thử lại sau.';
      } finally {
        loading.value = false;
      }
    };
    
    const fetchCompanies = async () => {
      try {
        const response = await CompanyService.getAllCompanies();
        companies.value = response.data;
      } catch (err) {
        console.error('Failed to fetch companies:', err);
      }
    };
    
    const fetchDepartments = async () => {
      try {
        const response = await DepartmentService.getAllDepartments();
        departments.value = response.data;
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      }
    };
    
    const fetchPositions = async () => {
      try {
        const response = await PositionService.getAllPositions();
        positions.value = response.data;
      } catch (err) {
        console.error('Failed to fetch positions:', err);
      }
    };
    
    const fetchTeams = async () => {
      try {
        const response = await TeamService.getAllTeams();
        teams.value = response.data;
      } catch (err) {
        console.error('Failed to fetch teams:', err);
      }
    };
    
    const fetchAvailableUsers = async () => {
      try {
        const response = await UserService.getAllUsers();
        users.value = response.data;
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    
    const filterEmployees = () => {
      filteredEmployees.value = employees.value.filter(employee => {
        // Lọc theo từ khóa tìm kiếm
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase();
          const userFullName = getUserName(employee).toLowerCase();
          const employeeId = employee.employeeId ? employee.employeeId.toLowerCase() : '';
          const jobTitle = employee.jobTitle ? employee.jobTitle.toLowerCase() : '';
          
          if (!userFullName.includes(query) && 
              !employeeId.includes(query) && 
              !jobTitle.includes(query)) {
            return false;
          }
        }
        
        // Lọc theo công ty
        if (companyFilter.value && employee.companyId != companyFilter.value) {
          return false;
        }
        
        // Lọc theo phòng ban
        if (departmentFilter.value && employee.departmentId != departmentFilter.value) {
          return false;
        }
        
        // Lọc theo trạng thái
        if (statusFilter.value && employee.status != statusFilter.value) {
          return false;
        }
        
        return true;
      });
    };
    
    const loadDepartmentsForCompany = async () => {
      if (!employeeForm.companyId) return;
      
      employeeForm.departmentId = '';
      employeeForm.positionId = '';
      employeeForm.secondaryDepartmentIds = [];
      employeeForm.teamIds = [];
      
      try {
        const response = await DepartmentService.getDepartmentsByCompany(employeeForm.companyId);
        departments.value = response.data;
      } catch (err) {
        console.error('Failed to fetch departments for company:', err);
      }
    };
    
    const loadPositionsForDepartment = async () => {
      if (!employeeForm.departmentId) return;
      
      employeeForm.positionId = '';
      
      try {
        const response = await PositionService.getPositionsByDepartment(employeeForm.departmentId);
        positions.value = response.data;
      } catch (err) {
        console.error('Failed to fetch positions for department:', err);
      }
    };
    
    const getUserName = (employee) => {
      const user = users.value.find(u => u.id === employee.userId);
      return user ? user.fullName : 'N/A';
    };
    
    const getDepartmentName = (employee) => {
      const department = departments.value.find(d => d.id === employee.departmentId);
      return department ? department.name : 'N/A';
    };
    
    const getPositionName = (employee) => {
      const position = positions.value.find(p => p.id === employee.positionId);
      return position ? position.name : 'N/A';
    };
    
    const getProfileImage = (employee) => {
      const user = users.value.find(u => u.id === employee.userId);
      return user ? user.profileImage : null;
    };
    
    const getEmployeeInitials = (employee) => {
      const user = users.value.find(u => u.id === employee.userId);
      if (!user || !user.fullName) return 'EM';
      
      return user.fullName.split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    };
    
    const getStatusText = (status) => {
      switch (status) {
        case 1: return 'Đang làm việc';
        case 2: return 'Tạm nghỉ';
        case 3: return 'Đã nghỉ việc';
        default: return 'Không xác định';
      }
    };
    
    const getStatusClass = (employee) => {
      switch (employee.status) {
        case 1: return 'status-active';
        case 2: return 'status-leave';
        case 3: return 'status-terminated';
        default: return '';
      }
    };
    
    const openCreateModal = () => {
      isEditing.value = false;
      resetForm();
      showModal.value = true;
    };
    
    const editEmployee = (employee) => {
      isEditing.value = true;
      
      Object.keys(employeeForm).forEach(key => {
        if (key in employee) {
          employeeForm[key] = employee[key];
        }
      });
      
      showModal.value = true;
    };
    
    const viewEmployee = (employee) => {
      router.push(`/employees/${employee.id}`);
    };
    
    const saveEmployee = async () => {
      saving.value = true;
      
      try {
        if (isEditing.value) {
          await EmployeeService.updateEmployee(employeeForm.id, employeeForm);
        } else {
          await EmployeeService.createEmployee(employeeForm);
        }
        
        closeModal();
        fetchEmployees();
      } catch (err) {
        console.error('Failed to save employee:', err);
        error.value = 'Không thể lưu thông tin nhân viên. Vui lòng thử lại sau.';
      } finally {
        saving.value = false;
      }
    };
    
    const closeModal = () => {
      showModal.value = false;
      resetForm();
    };
    
    const resetForm = () => {
      Object.keys(employeeForm).forEach(key => {
        if (key === 'status') {
          employeeForm[key] = 1;
        } else if (key === 'secondaryDepartmentIds' || key === 'teamIds') {
          employeeForm[key] = [];
        } else {
          employeeForm[key] = '';
        }
      });
    };
    
    // Watch for filter changes
    watch([searchQuery, companyFilter, departmentFilter, statusFilter], () => {
      filterEmployees();
    });
    
    // Initialize data
    onMounted(async () => {
      await Promise.all([
        fetchCompanies(),
        fetchDepartments(),
        fetchPositions(),
        fetchTeams(),
        fetchAvailableUsers(),
        fetchEmployees()
      ]);
    });
    
    return {
      employees,
      filteredEmployees,
      companies,
      departments,
      searchQuery,
      companyFilter,
      departmentFilter,
      statusFilter,
      loading,
      error,
      showModal,
      isEditing,
      saving,
      employeeForm,
      availableUsers,
      availableDepartments,
      availablePositions,
      availableTeams,
      availableManagers,
      filteredDepartments,
      getUserName,
      getDepartmentName,
      getPositionName,
      getProfileImage,
      getEmployeeInitials,
      getStatusText,
      getStatusClass,
      filterEmployees,
      openCreateModal,
      editEmployee,
      viewEmployee,
      saveEmployee,
      loadDepartmentsForCompany,
      loadPositionsForDepartment,
      closeModal
    };
  }
});
</script>

<style scoped>
.employee-management {
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
  flex-wrap: wrap;
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

.employee-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.employee-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.employee-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.employee-inactive {
  opacity: 0.7;
}

.employee-header {
  padding: 1.5rem;
  background-color: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.employee-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e5e7eb;
}

.employee-avatar img {
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
  font-size: 2rem;
}

.employee-id {
  background-color: #e5e7eb;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #4b5563;
}

.employee-body {
  padding: 1.5rem;
}

.employee-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.employee-position {
  font-size: 1rem;
  font-weight: 500;
  color: #4361EE;
  margin-bottom: 0.25rem;
}

.employee-department {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}

.employee-contact {
  margin-bottom: 1rem;
}

.contact-item {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.employee-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 1rem;
}

.status-active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-leave {
  background-color: #fff8e1;
  color: #f57f17;
}

.status-terminated {
  background-color: #ffebee;
  color: #d32f2f;
}

.employee-footer {
  display: flex;
  border-top: 1px solid #eee;
}

.btn-view, .btn-edit {
  flex: 1;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.btn-view {
  background-color: #f8fafc;
  color: #4361EE;
}

.btn-view:hover {
  background-color: #edf2ff;
}

.btn-edit {
  background-color: #f8fafc;
  color: #3b82f6;
  border-left: 1px solid #eee;
}

.btn-edit:hover {
  background-color: #e3f2fd;
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
  max-width: 700px;
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
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 1;
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

.form-section-title {
  font-size: 1.1rem;
  color: #4361EE;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group.half {
  flex: 1;
  min-width: 0;
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

.checkbox-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  max-height: 150px;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
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
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .filter-options {
    flex-direction: column;
    width: 100%;
  }
  
  .select-filter {
    width: 100%;
  }
  
  .checkbox-list {
    grid-template-columns: 1fr;
  }
}
</style>