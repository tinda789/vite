<template>
  <app-layout>
    <div class="company-list-page">
      <div class="page-header">
        <h1>Quản lý công ty</h1>
        <button v-if="isAdmin" class="btn-primary" @click="openCreateModal">
          <i class="fas fa-plus"></i> Thêm công ty mới
        </button>
      </div>
      
      <div class="filters">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Tìm kiếm công ty..." 
            v-model="searchQuery"
            @input="filterCompanies"
          />
          <i class="fas fa-search"></i>
        </div>
        
        <div class="filter-options">
          <label class="checkbox-filter">
            <input type="checkbox" v-model="showActiveOnly" @change="filterCompanies" />
            <span>Chỉ hiện công ty đang hoạt động</span>
          </label>
        </div>
      </div>
      
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-else-if="filteredCompanies.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-building"></i>
        </div>
        <h3>Không tìm thấy công ty nào</h3>
        <p v-if="searchQuery">Không có kết quả phù hợp với tìm kiếm của bạn.</p>
        <p v-else>Chưa có công ty nào trong hệ thống.</p>
        <button v-if="isAdmin" class="btn-primary" @click="openCreateModal">
          Thêm công ty mới
        </button>
      </div>
      
      <div v-else class="company-grid">
        <div 
          v-for="company in filteredCompanies" 
          :key="company.id" 
          class="company-card"
          :class="{ 'inactive': !company.active }"
        >
          <div class="company-logo">
            <img v-if="company.logo" :src="company.logo" :alt="company.name" />
            <div v-else class="logo-placeholder">
              {{ getCompanyInitials(company.name) }}
            </div>
          </div>
          
          <div class="company-info">
            <h3 class="company-name">{{ company.name }}</h3>
            <p class="company-email" v-if="company.email">
              <i class="fas fa-envelope"></i> {{ company.email }}
            </p>
            <p class="company-phone" v-if="company.phone">
              <i class="fas fa-phone"></i> {{ company.phone }}
            </p>
            <div class="company-status" :class="company.active ? 'status-active' : 'status-inactive'">
              {{ company.active ? 'Đang hoạt động' : 'Không hoạt động' }}
            </div>
          </div>
          
          <div class="company-actions">
            <router-link :to="`/companies/${company.id}`" class="btn-view">
              <i class="fas fa-eye"></i> Xem chi tiết
            </router-link>
            <div class="dropdown" v-if="isAdmin">
              <button class="btn-more" @click="toggleDropdown($event)">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <div class="dropdown-menu">
                <button @click="editCompany(company)" class="dropdown-item">
                  <i class="fas fa-edit"></i> Chỉnh sửa
                </button>
                <button 
                  v-if="company.active" 
                  @click="deactivateCompany(company)" 
                  class="dropdown-item text-danger"
                >
                  <i class="fas fa-ban"></i> Vô hiệu hóa
                </button>
                <button 
                  v-else 
                  @click="activateCompany(company)" 
                  class="dropdown-item text-success"
                >
                  <i class="fas fa-check"></i> Kích hoạt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal thêm/chỉnh sửa công ty -->
      <div v-if="showModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ isEditing ? 'Chỉnh sửa công ty' : 'Thêm công ty mới' }}</h2>
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
    </div>
  </app-layout>
</template>

<script lang="ts">
import { defineComponent, ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../../components/layout/AppLayout.vue'
import { useAuthStore } from '../../store/auth'
import CompanyService from '../../services/CompanyService'

export default defineComponent({
  name: 'CompanyListView',
  components: {
    AppLayout
  },
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    
    const companies = ref([])
    const loading = ref(true)
    const error = ref('')
    
    const searchQuery = ref('')
    const showActiveOnly = ref(false)
    const filteredCompanies = ref([])
    
    const showModal = ref(false)
    const isEditing = ref(false)
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
    
    const isAdmin = computed(() => authStore.isAdmin)
    
    // Lấy danh sách công ty
    const fetchCompanies = async () => {
      loading.value = true
      error.value = ''
      
      try {
        const response = await CompanyService.getAllCompanies()
        companies.value = response.data
        filterCompanies()
      } catch (err) {
        console.error('Failed to fetch companies:', err)
        error.value = 'Không thể tải dữ liệu công ty. Vui lòng thử lại sau.'
      } finally {
        loading.value = false
      }
    }
    
    // Lọc danh sách công ty theo từ khóa tìm kiếm và trạng thái
    const filterCompanies = () => {
      filteredCompanies.value = companies.value.filter(company => {
        // Lọc theo trạng thái
        if (showActiveOnly.value && !company.active) {
          return false
        }
        
        // Lọc theo từ khóa tìm kiếm
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase()
          return (
            company.name.toLowerCase().includes(query) ||
            (company.email && company.email.toLowerCase().includes(query)) ||
            (company.phone && company.phone.includes(query))
          )
        }
        
        return true
      })
    }
    
    // Tạo viết tắt từ tên công ty
    const getCompanyInitials = (name) => {
      if (!name) return 'CO'
      return name.split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    }
    
    // Mở modal thêm công ty mới
    const openCreateModal = () => {
      isEditing.value = false
      resetForm()
      showModal.value = true
    }
    
    // Mở modal chỉnh sửa công ty
    const editCompany = (company) => {
      isEditing.value = true
      
      // Điền thông tin công ty vào form
      Object.keys(companyForm).forEach(key => {
        if (key in company) {
          companyForm[key] = company[key]
        }
      })
      
      showModal.value = true
    }
    
    // Lưu thông tin công ty
    const saveCompany = async () => {
      saving.value = true
      
      try {
        if (isEditing.value) {
          // Cập nhật công ty
          await CompanyService.updateCompany(companyForm.id, companyForm)
        } else {
          // Tạo công ty mới
          await CompanyService.createCompany(companyForm)
        }
        
        // Đóng modal và tải lại danh sách
        closeModal()
        fetchCompanies()
      } catch (err) {
        console.error('Failed to save company:', err)
        error.value = 'Không thể lưu thông tin công ty. Vui lòng thử lại sau.'
      } finally {
        saving.value = false
      }
    }
    
    // Vô hiệu hóa công ty
    const deactivateCompany = async (company) => {
      if (confirm(`Bạn có chắc chắn muốn vô hiệu hóa công ty "${company.name}"?`)) {
        try {
          await CompanyService.deleteCompany(company.id)
          fetchCompanies()
        } catch (err) {
          console.error('Failed to deactivate company:', err)
          error.value = 'Không thể vô hiệu hóa công ty. Vui lòng thử lại sau.'
        }
      }
    }
    
    // Kích hoạt lại công ty
    const activateCompany = async (company) => {
      try {
        await CompanyService.restoreCompany(company.id)
        fetchCompanies()
      } catch (err) {
        console.error('Failed to activate company:', err)
        error.value = 'Không thể kích hoạt công ty. Vui lòng thử lại sau.'
      }
    }
    
    // Đóng modal
    const closeModal = () => {
      showModal.value = false
      resetForm()
    }
    
    // Reset form
    const resetForm = () => {
      companyForm.id = null
      companyForm.name = ''
      companyForm.logo = ''
      companyForm.email = ''
      companyForm.phone = ''
      companyForm.address = ''
      companyForm.website = ''
      companyForm.taxCode = ''
      companyForm.businessCode = ''
      companyForm.establishedDate = ''
      companyForm.active = true
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
    onMounted(() => {
      fetchCompanies()
    })
    
    return {
      companies,
      filteredCompanies,
      loading,
      error,
      searchQuery,
      showActiveOnly,
      showModal,
      isEditing,
      saving,
      companyForm,
      isAdmin,
      getCompanyInitials,
      filterCompanies,
      openCreateModal,
      editCompany,
      saveCompany,
      deactivateCompany,
      activateCompany,
      closeModal,
      toggleDropdown
    }
  }
})
</script>

<style scoped>
.company-list-page {
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

.checkbox-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
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

.company-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.company-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
}

.company-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.company-card.inactive {
  opacity: 0.7;
}

.company-logo {
  height: 120px;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #eee;
}

.company-logo img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}

.logo-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background-color: #4361EE;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
}

.company-info {
  padding: 1.5rem;
  flex-grow: 1;
}

.company-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
}

.company-email, .company-phone {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.company-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 0.75rem;
}

.status-active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-inactive {
  background-color: #ffebee;
  color: #d32f2f;
}

.company-actions {
  display: flex;
  border-top: 1px solid #eee;
}

.btn-view {
  flex: 1;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #f8fafc;
  color: #4361EE;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-view:hover {
  background-color: #edf2ff;
}

.btn-more {
  padding: 0 1rem;
  background: none;
  border: none;
  border-left: 1px solid #eee;
  cursor: pointer;
  color: #666;
  transition: background-color 0.2s;
}

.btn-more:hover {
  background-color: #f5f5f5;
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  width: 200px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  display: none;
  z-index: 10;
}

.dropdown-menu.show {
  display: block;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
}

.dropdown-item:hover {
  background-color: #f5f7fa;
}

.text-danger {
  color: #d32f2f;
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
  .company-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>