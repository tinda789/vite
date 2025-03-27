<template>
  <app-layout>
    <div class="employee-detail-page">
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

      <div v-else-if="employee" class="employee-detail-content">
        <div class="employee-header">
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
          
          <div class="employee-basic-info">
            <h1>{{ employee.user.fullName }}</h1>
            <div class="employee-meta">
              <span class="employee-id">
                Mã nhân viên: {{ employee.employeeId || 'Chưa cập nhật' }}
              </span>
              <span class="employee-status" :class="getStatusClass(employee.status)">
                {{ getStatusText(employee.status) }}
              </span>
            </div>
          </div>
        </div>

        <div class="employee-details">
          <div class="section contact-info">
            <h3>Thông tin liên hệ</h3>
            <div class="info-grid">
              <div class="info-item">
                <i class="fas fa-envelope"></i>
                <div>
                  <span class="label">Email cá nhân</span>
                  <p>{{ employee.user.email }}</p>
                </div>
              </div>
              <div class="info-item">
                <i class="fas fa-envelope-open"></i>
                <div>
                  <span class="label">Email công việc</span>
                  <p>{{ employee.workEmail || 'Chưa cập nhật' }}</p>
                </div>
              </div>
              <div class="info-item">
                <i class="fas fa-phone"></i>
                <div>
                  <span class="label">Số điện thoại</span>
                  <p>{{ employee.user.phoneNumber || 'Chưa cập nhật' }}</p>
                </div>
              </div>
              <div class="info-item">
                <i class="fas fa-phone-office"></i>
                <div>
                  <span class="label">Số điện thoại công việc</span>
                  <p>{{ employee.workPhone || 'Chưa cập nhật' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="section job-info">
            <h3>Thông tin công việc</h3>
            <div class="info-grid">
              <div class="info-item">
                <i class="fas fa-building"></i>
                <div>
                  <span class="label">Công ty</span>
                  <p>{{ company?.name || 'Chưa xác định' }}</p>
                </div>
              </div>
              <div class="info-item">
                <i class="fas fa-sitemap"></i>
                <div>
                  <span class="label">Phòng ban chính</span>
                  <p>{{ department?.name || 'Chưa xác định' }}</p>
                </div>
              </div>
              <div class="info-item">
                <i class="fas fa-briefcase"></i>
                <div>
                  <span class="label">Vị trí</span>
                  <p>{{ position?.name || 'Chưa xác định' }}</p>
                </div>
              </div>
              <div class="info-item">
                <i class="fas fa-id-badge"></i>
                <div>
                  <span class="label">Chức danh</span>
                  <p>{{ employee.jobTitle || 'Chưa cập nhật' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="section additional-info">
            <h3>Thông tin bổ sung</h3>
            <div class="info-grid">
              <div class="info-item">
                <i class="fas fa-calendar-plus"></i>
                <div>
                  <span class="label">Ngày bắt đầu</span>
                  <p>{{ formatDate(employee.hireDate) }}</p>
                </div>
              </div>
              <div v-if="employee.terminationDate" class="info-item">
                <i class="fas fa-calendar-times"></i>
                <div>
                  <span class="label">Ngày kết thúc</span>
                  <p>{{ formatDate(employee.terminationDate) }}</p>
                </div>
              </div>
              <div class="info-item">
                <i class="fas fa-user-tie"></i>
                <div>
                  <span class="label">Quản lý trực tiếp</span>
                  <p>{{ manager?.user?.fullName || 'Không có' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="section department-info">
            <h3>Phòng ban phụ</h3>
            <div v-if="secondaryDepartments.length" class="secondary-departments">
              <div 
                v-for="dept in secondaryDepartments" 
                :key="dept.id" 
                class="department-chip"
              >
                {{ dept.name }}
              </div>
            </div>
            <p v-else class="text-muted">Không có phòng ban phụ</p>
          </div>

          <div class="section team-info">
            <h3>Các nhóm</h3>
            <div v-if="teams.length" class="team-list">
              <div 
                v-for="team in teams" 
                :key="team.id" 
                class="team-chip"
              >
                {{ team.name }}
              </div>
            </div>
            <p v-else class="text-muted">Chưa tham gia nhóm nào</p>
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
import EmployeeService from '../../services/EmployeeService'
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
  phoneNumber?: string;
  profileImage?: string;
  [key: string]: any;
}

interface Employee {
  id: number;
  employeeId?: string;
  user: User;
  companyId: number;
  departmentId: number;
  positionId: number;
  managerId?: number;
  jobTitle?: string;
  workEmail?: string;
  workPhone?: string;
  hireDate?: string;
  terminationDate?: string;
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
  [key: string]: any;
}

interface Position {
  id: number;
  name: string;
  [key: string]: any;
}

interface Team {
  id: number;
  name: string;
  [key: string]: any;
}

export default defineComponent({
  name: 'EmployeeDetailView',
  components: {
    AppLayout
  },
  setup() {
    const route = useRoute()
    const employeeId = ref(Number(route.params.id))
    
    const employee = ref<Employee | null>(null)
    const company = ref<Company | null>(null)
    const department = ref<Department | null>(null)
    const position = ref<Position | null>(null)
    const manager = ref<Employee | null>(null)
    const secondaryDepartments = ref<Department[]>([])
    const teams = ref<Team[]>([])
    
    const loading = ref(true)
    const error = ref('')
    
    const fetchEmployeeDetails = async () => {
      loading.value = true
      try {
        // Lấy thông tin nhân viên
        const employeeResponse = await EmployeeService.getEmployeeById(employeeId.value)
        employee.value = employeeResponse.data
        
        if (employee.value) {
          // Lấy thông tin công ty
          const companyResponse = await CompanyService.getCompanyById(employee.value.companyId)
          company.value = companyResponse.data
          
          // Lấy thông tin phòng ban
          const departmentResponse = await DepartmentService.getDepartmentById(employee.value.departmentId)
          department.value = departmentResponse.data
          
          // Lấy thông tin vị trí
          const positionResponse = await PositionService.getPositionById(employee.value.positionId)
          position.value = positionResponse.data
          
          // Lấy thông tin quản lý
          if (employee.value.managerId) {
            const managerResponse = await EmployeeService.getEmployeeById(employee.value.managerId)
            manager.value = managerResponse.data
          }
          
          // Lấy phòng ban phụ
          if (employee.value.secondaryDepartmentIds?.length) {
            const secondaryDeptPromises = employee.value.secondaryDepartmentIds.map(id => 
              DepartmentService.getDepartmentById(id)
            )
            const secondaryDeptResponses = await Promise.all(secondaryDeptPromises)
            secondaryDepartments.value = secondaryDeptResponses.map(resp => resp.data)
          }
          
          // Lấy các nhóm
          if (employee.value.teamIds?.length) {
            const teamPromises = employee.value.teamIds.map(id => 
              TeamService.getTeamById(id)
            )
            const teamResponses = await Promise.all(teamPromises)
            teams.value = teamResponses.map(resp => resp.data)
          }
        }
      } catch (err) {
        console.error('Lỗi tải chi tiết nhân viên:', err)
        error.value = 'Không thể tải thông tin nhân viên'
      } finally {
        loading.value = false
      }
    }
    
    const getEmployeeInitials = (fullName: string): string => {
      if (!fullName) return 'NV'
      return fullName.split(' ')
        .map((word: string) => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    }
    
    const formatDate = (dateString?: string): string => {
      return dateString 
        ? new Date(dateString).toLocaleDateString('vi-VN') 
        : 'Chưa xác định'
    }
    
    const getStatusClass = (status: number): string => {
      switch(status) {
        case 1: return 'status-active'
        case 2: return 'status-inactive'
        case 3: return 'status-terminated'
        default: return ''
      }
    }
    
    const getStatusText = (status: number): string => {
      switch(status) {
        case 1: return 'Đang làm việc'
        case 2: return 'Tạm ngưng'
        case 3: return 'Đã nghỉ việc'
        default: return 'Chưa xác định'
      }
    }
    
    onMounted(fetchEmployeeDetails)
    
    return {
      employee,
      company,
      department,
      position,
      manager,
      secondaryDepartments,
      teams,
      loading,
      error,
      getEmployeeInitials,
      formatDate,
      getStatusClass,
      getStatusText
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