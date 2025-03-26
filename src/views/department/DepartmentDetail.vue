<template>
    <app-layout>
      <div class="department-detail-page">
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
  
        <div v-else-if="error" class="error-container">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h2>Có lỗi xảy ra</h2>
          <p>{{ error }}</p>
        </div>
  
        <div v-else-if="department" class="department-detail-content">
          <div class="department-header">
            <div class="department-info">
              <h1>{{ department.name }}</h1>
              <div class="department-meta">
                <span v-if="department.code" class="department-code">
                  Mã phòng ban: {{ department.code }}
                </span>
                <span v-if="parentDepartment" class="parent-department">
                  Trực thuộc: {{ parentDepartment.name }}
                </span>
              </div>
            </div>
          </div>
  
          <div class="department-details">
            <div class="section company-info">
              <h3>Thông tin công ty</h3>
              <div class="company-details">
                <img 
                  v-if="company?.logo" 
                  :src="company.logo" 
                  :alt="company.name" 
                  class="company-logo"
                />
                <div class="company-text">
                  <h4>{{ company?.name }}</h4>
                  <p>{{ company?.address }}</p>
                  <p>{{ company?.email }}</p>
                </div>
              </div>
            </div>
  
            <div class="section description">
              <h3>Mô tả phòng ban</h3>
              <p v-if="department.description">{{ department.description }}</p>
              <p v-else class="text-muted">Chưa có mô tả</p>
            </div>
  
            <div class="section stats">
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-icon">
                    <i class="fas fa-users"></i>
                  </div>
                  <div class="stat-content">
                    <h4>Nhân viên</h4>
                    <p class="stat-number">{{ employeeStats.total }}</p>
                  </div>
                </div>
  
                <div class="stat-card">
                  <div class="stat-icon">
                    <i class="fas fa-briefcase"></i>
                  </div>
                  <div class="stat-content">
                    <h4>Vị trí</h4>
                    <p class="stat-number">{{ positions.length }}</p>
                  </div>
                </div>
  
                <div class="stat-card">
                  <div class="stat-icon">
                    <i class="fas fa-sitemap"></i>
                  </div>
                  <div class="stat-content">
                    <h4>Nhóm</h4>
                    <p class="stat-number">{{ teams.length }}</p>
                  </div>
                </div>
              </div>
            </div>
  
            <div class="section employees">
              <h3>Nhân viên</h3>
              <div v-if="employees.length === 0" class="empty-state">
                <p>Chưa có nhân viên trong phòng ban</p>
              </div>
              <div v-else class="employee-grid">
                <div 
                  v-for="employee in employees" 
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
                    <h4>{{ employee.user.fullName }}</h4>
                    <p>{{ employee.jobTitle }}</p>
                  </div>
                </div>
              </div>
            </div>
  
            <div class="section positions">
              <h3>Các vị trí</h3>
              <div v-if="positions.length === 0" class="empty-state">
                <p>Chưa có vị trí nào trong phòng ban</p>
              </div>
              <div v-else class="position-list">
                <div 
                  v-for="position in positions" 
                  :key="position.id" 
                  class="position-item"
                >
                  <div class="position-info">
                    <h4>{{ position.name }}</h4>
                    <p>{{ position.description }}</p>
                  </div>
                  <div class="position-meta">
                    <span class="position-level">
                      Cấp độ: {{ formatPositionLevel(position.level) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-layout>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import AppLayout from '../../components/layout/AppLayout.vue'
  import DepartmentService from '../../services/DepartmentService'
  import CompanyService from '../../services/CompanyService'
  import EmployeeService from '../../services/EmployeeService'
  import PositionService from '../../services/PositionService'
  import TeamService from '../../services/TeamService'
  
  export default defineComponent({
    name: 'DepartmentDetailView',
    components: {
      AppLayout
    },
    setup() {
      const route = useRoute()
      const departmentId = ref(Number(route.params.id))
      
      const department = ref(null)
      const parentDepartment = ref(null)
      const company = ref(null)
      const employees = ref([])
      const positions = ref([])
      const teams = ref([])
      
      const loading = ref(true)
      const error = ref('')
      
      const employeeStats = ref({
        total: 0,
        activeEmployees: 0
      })
      
      const fetchDepartmentDetails = async () => {
        loading.value = true
        try {
          // Lấy thông tin phòng ban
          const departmentResponse = await DepartmentService.getDepartmentById(departmentId.value)
          department.value = departmentResponse.data
          
          // Lấy thông tin công ty
          const companyResponse = await CompanyService.getCompanyById(department.value.companyId)
          company.value = companyResponse.data
          
          // Lấy phòng ban cha nếu có
          if (department.value.parentId) {
            const parentResponse = await DepartmentService.getDepartmentById(department.value.parentId)
            parentDepartment.value = parentResponse.data
          }
          
          // Lấy nhân viên
          const employeesResponse = await EmployeeService.getEmployeesByDepartment(departmentId.value)
          employees.value = employeesResponse.data
          employeeStats.value.total = employees.value.length
          
          // Lấy vị trí
          const positionsResponse = await PositionService.getPositionsByDepartment(departmentId.value)
          positions.value = positionsResponse.data
          
          // Lấy nhóm
          const teamsResponse = await TeamService.getTeamsByDepartment(departmentId.value)
          teams.value = teamsResponse.data
          
        } catch (err) {
          console.error('Failed to fetch department details:', err)
          error.value = 'Không thể tải thông tin phòng ban'
        } finally {
          loading.value = false
        }
      }
      
      const getEmployeeInitials = (fullName) => {
        if (!fullName) return 'NV'
        return fullName.split(' ')
          .map(word => word[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      }
      
      const formatPositionLevel = (level) => {
        switch(level) {
          case 1: return 'Nhân viên'
          case 2: return 'Trưởng nhóm'
          case 3: return 'Quản lý'
          case 4: return 'Giám đốc'
          case 5: return 'Lãnh đạo cấp cao'
          default: return 'Chưa xác định'
        }
      }
      
      onMounted(fetchDepartmentDetails)
      
      return {
        department,
        parentDepartment,
        company,
        employees,
        positions,
        teams,
        loading,
        error,
        employeeStats,
        getEmployeeInitials,
        formatPositionLevel
      }
    }
  })
  </script>
  
  <style scoped>
  .department-detail-page {
    background-color: #f5f7fa;
    padding: 2rem;
  }
  
  .loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
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
  
  .department-detail-content {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
  
  .department-header {
    padding: 2rem;
    border-bottom: 1px solid #eee;
  }
  
  .department-header h1 {
    margin: 0;
    color: #333;
  }
  
  .department-meta {
    margin-top: 0.5rem;
    color: #666;
    display: flex;
    gap: 1rem;
  }
  
  .department-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    padding: 2rem;
  }
  
  .section {
    background-color: #f9fafb;
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .section h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
    border-bottom: 2px solid #4361ee;
    padding-bottom: 0.5rem;
  }
  
  .company-details {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .company-logo {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .company-text h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }
  
  .company-text p {
    margin: 0;
    color: #666;
  }
  
  .description p {
    line-height: 1.6;
  }
  
  .text-muted {
    color: #999;
    font-style: italic;
  }
  
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  
  .stat-card {
    background-color: #f1f5f9;
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .stat-icon {
    background-color: #4361ee;
    color: white;
    width: 50px;
    height: 50px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .stat-content h4 {
    margin: 0;
    color: #666;
    font-size: 1rem;
  }
  
  .stat-number {
    font-size: 1.8rem;
    font-weight: bold;
    color: #333;
    margin: 0.5rem 0 0;
  }
  
  .employee-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .employee-card {
    display: flex;
    align-items: center;
    background-color: #f1f5f9;
    border-radius: 8px;
    padding: 1rem;
    gap: 1rem;
  }
  
  .employee-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    overflow: hidden;
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
  
  .employee-info h4 {
    margin: 0 0 0.25rem 0;
    color: #333;
  }
  
  .employee-info p {
    margin: 0;
    color: #666;
  }
  
  .position-list {
    display: grid;
    gap: 1rem;
  }
  
  .position-item {
    background-color: #f1f5f9;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .position-info h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }
  
  .position-info p {
    margin: 0;
    color: #666;
  }
  
  .position-meta {
    color: #4361ee;
  }
  
  .empty-state {
    text-align: center;
    color: #999;
    padding: 1rem;
  }
  
  @media (max-width: 992px) {
    .department-details {
      grid-template-columns: 1fr;
    }
    
    .stat-grid {
      grid-template-columns: 1fr;
    }
  }
  </style>