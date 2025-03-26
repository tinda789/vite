<template>
  <app-layout>
    <div class="company-detail-page">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Đang tải thông tin công ty...</p>
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <template v-else>
        <div class="page-header">
          <div class="header-content">
            <div class="back-link">
              <router-link to="/companies">
                <i class="fas fa-arrow-left"></i> Danh sách công ty
              </router-link>
            </div>
            <h1>{{ company.name }}</h1>
            <div class="company-status" :class="company.active ? 'status-active' : 'status-inactive'">
              {{ company.active ? 'Đang hoạt động' : 'Không hoạt động' }}
            </div>
          </div>
          
          <div class="header-actions" v-if="isAdmin">
            <button class="btn-secondary" @click="editCompany">
              <i class="fas fa-edit"></i> Chỉnh sửa
            </button>
            <button 
              v-if="company.active" 
              class="btn-danger" 
              @click="deactivateCompany"
            >
              <i class="fas fa-ban"></i> Vô hiệu hóa
            </button>
            <button 
              v-else 
              class="btn-success" 
              @click="activateCompany"
            >
              <i class="fas fa-check"></i> Kích hoạt
            </button>
          </div>
        </div>
        
        <div class="company-content">
          <div class="company-info-card">
            <div class="card-header">
              <h2>Thông tin công ty</h2>
            </div>
            <div class="card-body">
              <div class="company-logo">
                <img v-if="company.logo" :src="company.logo" :alt="company.name" />
                <div v-else class="logo-placeholder">
                  {{ getCompanyInitials(company.name) }}
                </div>
              </div>
              
              <div class="info-list">
                <div class="info-item">
                  <div class="info-label">
                    <i class="fas fa-envelope"></i> Email
                  </div>
                  <div class="info-value">{{ company.email || 'Chưa cập nhật' }}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">
                    <i class="fas fa-phone"></i> Điện thoại
                  </div>
                  <div class="info-value">{{ company.phone || 'Chưa cập nhật' }}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">
                    <i class="fas fa-map-marker-alt"></i> Địa chỉ
                  </div>
                  <div class="info-value">{{ company.address || 'Chưa cập nhật' }}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">
                    <i class="fas fa-globe"></i> Website
                  </div>
                  <div class="info-value">
                    <a v-if="company.website" :href="company.website" target="_blank">{{ company.website }}</a>
                    <span v-else>Chưa cập nhật</span>
                  </div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">
                    <i class="fas fa-receipt"></i> Mã số thuế
                  </div>
                  <div class="info-value">{{ company.taxCode || 'Chưa cập nhật' }}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">
                    <i class="fas fa-building"></i> Mã số doanh nghiệp
                  </div>
                  <div class="info-value">{{ company.businessCode || 'Chưa cập nhật' }}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">
                    <i class="fas fa-calendar"></i> Ngày thành lập
                  </div>
                  <div class="info-value">{{ formatDate(company.establishedDate) || 'Chưa cập nhật' }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="company-stats-card">
            <div class="card-header">
              <h2>Thống kê</h2>
            </div>
            <div class="card-body">
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ stats.totalDepartments }}</div>
                  <div class="stat-label">Phòng ban</div>
                  <router-link :to="`/departments?companyId=${companyId}`" class="stat-link">Xem danh sách</router-link>
                </div>
                
                <div class="stat-item">
                  <div class="stat-value">{{ stats.totalEmployees }}</div>
                  <div class="stat-label">Nhân viên</div>
                  <router-link :to="`/employees?companyId=${companyId}`" class="stat-link">Xem danh sách</router-link>
                </div>
              </div>
              
              <div class="distribution-chart">
                <h3>Phân bố nhân viên theo phòng ban</h3>
                <div class="chart-placeholder">
                  <!-- Trong thực tế, bạn sẽ tích hợp biểu đồ vào đây -->
                  <p>Đang phát triển biểu đồ phân bố...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="departments-section">
          <div class="section-header">
            <h2>Phòng ban</h2>
            <router-link :to="`/departments?companyId=${companyId}`" class="view-all">
              Xem tất cả
            </router-link>
          </div>
          
          <div v-if="loadingDepartments" class="loading-container">
            <div class="spinner"></div>
            <p>Đang tải danh sách phòng ban...</p>
          </div>
          
          <div v-else-if="departments.length === 0" class="empty-state">
            <p>Công ty chưa có phòng ban nào.</p>
            <button v-if="isAdmin" class="btn-primary" @click="createDepartment">
              <i class="fas fa-plus"></i> Thêm phòng ban
            </button>
          </div>
          
          <div v-else class="departments-grid">
            <div 
              v-for="department in departments.slice(0, 4)" 
              :key="department.id" 
              class="department-card"
            >
              <div class="department-icon">
                <i class="fas fa-sitemap"></i>
              </div>
              <div class="department-content">
                <h3 class="department-name">{{ department.name }}</h3>
                <p class="department-desc">{{ department.description || 'Không có mô tả' }}</p>
                <router-link :to="`/departments/${department.id}`" class="department-link">
                  Xem chi tiết
                </router-link>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Modal chỉnh sửa công ty -->
        <div v-if="showModal" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h2>Chỉnh sửa thông tin công ty</h2>
              <button class="modal-close" @click="closeModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="modal-body">
              <form @submit.prevent="saveCompany">
                <div class="form-group">
                  <label for="name">Tên công ty <span class="required">*</span></label>
                  <input 
                    type="text" 
                    id="name" 
                    v-model="companyForm.name" 
                    class="form-control" 
                    required
                  />
                </div>
                
                <div class="form-group">
                  <label for="email">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    v-model="companyForm.email" 
                    class="form-control"
                  />
                </div>
                
                <div class="form-group">
                  <label for="phone">Số điện thoại</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    v-model="companyForm.phone" 
                    class="form-control"
                  />
                </div>
                
                <div class="form-group">
                  <label for="address">Địa chỉ</label>
                  <input 
                    type="text" 
                    id="address" 
                    v-model="companyForm.address" 
                    class="form-control"
                  />
                </div>
                
                <div class="form-group">
                  <label for="website">Website</label>
                  <input 
                    type="text" 
                    id="website" 
                    v-model="companyForm.website" 
                    class="form-control"
                  />
                </div>
                
                <div class="form-row">
                  <div class="form-group half">
                    <label for="taxCode">Mã số thuế</label>
                    <input 
                      type="text" 
                      id="taxCode" 
                      v-model="companyForm.taxCode" 
                      class="form-control"
                    />
                  </div>
                  
                  <div class="form-group half">
                    <label for="businessCode">Mã số doanh nghiệp</label>
                    <input 
                      type="text" 
                      id="businessCode" 
                      v-model="companyForm.businessCode" 
                      class="form-control"
                    />
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="establishedDate">Ngày thành lập</label>
                  <input 
                    type="date" 
                    id="establishedDate" 
                    v-model="companyForm.establishedDate" 
                    class="form-control"
                  />
                </div>
                
                <div class="form-group">
                  <label>Trạng thái</label>
                  <div class="radio-group">
                    <label class="radio-option">
                      <input type="radio" v-model="companyForm.active" :value="true" />
                      <span>Hoạt động</span>
                    </label>
                    <label class="radio-option">
                      <input type="radio" v-model="companyForm.active" :value="false" />
                      <span>Không hoạt động</span>
                    </label>
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
      </template>
    </div>
  </app-layout>
</template>

<script lang="ts">
import { defineComponent, ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '../../components/layout/AppLayout.vue'
import { useAuthStore } from '../../store/auth'
import CompanyService from '../../services/CompanyService'
import DepartmentService from '../../services/DepartmentService'

export default defineComponent({
  name: 'CompanyDetailView',
  components: {
    AppLayout
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    
    const companyId = computed(() => Number(route.params.id))
    const isAdmin = computed(() => authStore.isAdmin)
    
    const company = ref({})
    const stats = ref({
      totalDepartments: 0,
      totalEmployees: 0
    })
    const departments = ref([])
    
    const loading = ref(true)
    const loadingDepartments = ref(true)
    const error = ref('')
    
    const showModal = ref(false)
    const saving = ref(false)
    
    const companyForm = reactive({
      id: null,
      name: '',
      logo: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      taxCode: '',
      businessCode: '',
      establishedDate: '',
      active: true
    })
    
    // Lấy thông tin công ty
    const fetchCompanyDetail = async () => {
      loading.value = true
      error.value = ''
      
      try {
        const response = await CompanyService.getCompanyDetail(companyId.value)
        company.value = response.data.company
        stats.value = {
          totalDepartments: response.data.departmentCount,
          totalEmployees: response.data.employeeCount
        }
      } catch (err) {
        console.error('Failed to fetch company details:', err)
        error.value = 'Không thể tải thông tin công ty. Vui lòng thử lại sau.'
      } finally {
        loading.value = false
      }
    }
    
    // Lấy danh sách phòng ban của công ty
    const fetchDepartments = async () => {
      loadingDepartments.value = true
      
      try {
        const response = await DepartmentService.getDepartmentsByCompany(companyId.value)
        departments.value = response.data
      } catch (err) {
        console.error('Failed to fetch departments:', err)
      } finally {
        loadingDepartments.value = false
      }
    }
    
    // Tạo viết tắt từ tên công ty
    // Tạo viết tắt từ tên công ty
    const getCompanyInitials = (name) => {
      if (!name) return 'CO'
      return name.split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    }
    
    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return null
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN')
    }
    
    // Mở modal chỉnh sửa
    const editCompany = () => {
      // Copy dữ liệu từ company sang form
      Object.keys(companyForm).forEach(key => {
        if (key in company.value) {
          companyForm[key] = company.value[key]
        }
      })
      
      showModal.value = true
    }
    
    // Lưu thông tin công ty
    const saveCompany = async () => {
      saving.value = true
      
      try {
        await CompanyService.updateCompany(companyId.value, companyForm)
        closeModal()
        fetchCompanyDetail() // Tải lại thông tin
      } catch (err) {
        console.error('Failed to update company:', err)
        error.value = 'Không thể cập nhật thông tin công ty. Vui lòng thử lại sau.'
      } finally {
        saving.value = false
      }
    }
    
    // Vô hiệu hóa công ty
    const deactivateCompany = async () => {
      if (confirm(`Bạn có chắc chắn muốn vô hiệu hóa công ty "${company.value.name}"?`)) {
        try {
          await CompanyService.deleteCompany(companyId.value)
          fetchCompanyDetail() // Tải lại thông tin
        } catch (err) {
          console.error('Failed to deactivate company:', err)
          error.value = 'Không thể vô hiệu hóa công ty. Vui lòng thử lại sau.'
        }
      }
    }
    
    // Kích hoạt lại công ty
    const activateCompany = async () => {
      try {
        await CompanyService.restoreCompany(companyId.value)
        fetchCompanyDetail() // Tải lại thông tin
      } catch (err) {
        console.error('Failed to activate company:', err)
        error.value = 'Không thể kích hoạt công ty. Vui lòng thử lại sau.'
      }
    }
    
    // Tạo phòng ban mới
    const createDepartment = () => {
      router.push({
        path: '/departments/create',
        query: { companyId: companyId.value }
      })
    }
    
    // Đóng modal
    const closeModal = () => {
      showModal.value = false
    }
    
    // Khởi tạo dữ liệu
    onMounted(() => {
      fetchCompanyDetail()
      fetchDepartments()
    })
    
    return {
      companyId,
      company,
      stats,
      departments,
      loading,
      loadingDepartments,
      error,
      isAdmin,
      showModal,
      saving,
      companyForm,
      getCompanyInitials,
      formatDate,
      editCompany,
      saveCompany,
      deactivateCompany,
      activateCompany,
      createDepartment,
      closeModal
    }
  }
})
</script>

<style scoped>
.company-detail-page {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header-content {
  flex: 1;
}

.back-link {
  margin-bottom: 0.5rem;
}

.back-link a {
  color: #666;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.back-link a:hover {
  color: #4361EE;
}

.page-header h1 {
  font-size: 1.8rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.company-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-inactive {
  background-color: #ffebee;
  color: #d32f2f;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-secondary, .btn-danger, .btn-success, .btn-primary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary {
  background-color: #e9ecef;
  color: #495057;
}

.btn-secondary:hover {
  background-color: #dee2e6;
}

.btn-danger {
  background-color: #f44336;
  color: #fff;
}

.btn-danger:hover {
  background-color: #d32f2f;
}

.btn-success {
  background-color: #4caf50;
  color: #fff;
}

.btn-success:hover {
  background-color: #388e3c;
}

.btn-primary {
  background-color: #4361EE;
  color: #fff;
}

.btn-primary:hover {
  background-color: #3a56d4;
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

.company-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 992px) {
  .company-content {
    grid-template-columns: 1fr;
  }
}

.company-info-card, .company-stats-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.card-body {
  padding: 1.5rem;
}

.company-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.company-logo img {
  max-width: 200px;
  max-height: 100px;
  object-fit: contain;
}

.logo-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  background-color: #4361EE;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
}

.info-label {
  width: 150px;
  color: #666;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-value {
  flex: 1;
  color: #333;
}

.info-value a {
  color: #4361EE;
  text-decoration: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #4361EE;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  margin-bottom: 1rem;
}

.stat-link {
  color: #4361EE;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-link:hover {
  text-decoration: underline;
}

.distribution-chart {
  margin-top: 2rem;
}

.distribution-chart h3 {
  font-size: 1rem;
  color: #333;
  margin-bottom: 1rem;
}

.chart-placeholder {
  height: 200px;
  background-color: #f8fafc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.departments-section {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.25rem;
  color: #333;
  margin: 0;
}

.view-all {
  color: #4361EE;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  background-color: #f8fafc;
  border-radius: 8px;
}

.empty-state p {
  color: #666;
  margin-bottom: 1.5rem;
}

.departments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.department-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.department-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.department-icon {
  width: 40px;
  height: 40px;
  background-color: #edf2ff;
  color: #4361EE;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.department-content {
  flex: 1;
}

.department-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.department-desc {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.department-link {
  color: #4361EE;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.department-link:hover {
  text-decoration: underline;
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
  display: flex;
  gap: 1rem;
}

.form-group.half {
  flex: 1;
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

.radio-group {
  display: flex;
  gap: 1.5rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
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
  .page-header {
    flex-direction: column;
  }
  
  .header-actions {
    margin-top: 1rem;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>