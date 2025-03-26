<template>
    <app-layout>
      <div class="department-list-page">
        <div class="page-header">
          <h1>Quản lý phòng ban</h1>
          <button v-if="isAdmin" class="btn-primary" @click="openCreateModal">
            <i class="fas fa-plus"></i> Thêm phòng ban mới
          </button>
        </div>
        
        <div class="filters">
          <div class="search-box">
            <input 
              type="text" 
              placeholder="Tìm kiếm phòng ban..." 
              v-model="searchQuery"
              @input="filterDepartments"
            />
            <i class="fas fa-search"></i>
          </div>
          
          <div class="filter-options">
            <select 
              v-model="selectedCompany" 
              @change="filterDepartments"
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
          </div>
        </div>
        
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
        
        <div v-else-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-else-if="filteredDepartments.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-building"></i>
          </div>
          <h3>Không tìm thấy phòng ban</h3>
          <p v-if="searchQuery">Không có kết quả phù hợp với tìm kiếm của bạn.</p>
          <p v-else>Chưa có phòng ban nào trong hệ thống.</p>
          <button v-if="isAdmin" class="btn-primary" @click="openCreateModal">
            Thêm phòng ban mới
          </button>
        </div>
        
        <div v-else class="department-grid">
          <div 
            v-for="department in filteredDepartments" 
            :key="department.id" 
            class="department-card"
          >
            <div class="department-info">
              <h3 class="department-name">
                {{ department.name }}
                <span v-if="department.code" class="department-code">
                  ({{ department.code }})
                </span>
              </h3>
              <p class="department-description" v-if="department.description">
                {{ truncateDescription(department.description) }}
              </p>
              <div class="department-meta">
                <span class="company-name">
                  <i class="fas fa-building"></i> 
                  {{ getCompanyName(department.companyId) }}
                </span>
                <span v-if="department.parentId" class="parent-department">
                  <i class="fas fa-sitemap"></i>
                  Trực thuộc: {{ getParentDepartmentName(department.parentId) }}
                </span>
              </div>
            </div>
            
            <div class="department-actions">
              <router-link :to="`/departments/${department.id}`" class="btn-view">
                <i class="fas fa-eye"></i> Chi tiết
              </router-link>
              <div class="dropdown" v-if="isAdmin">
                <button class="btn-more" @click="toggleDropdown($event)">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="dropdown-menu">
                  <button @click="editDepartment(department)" class="dropdown-item">
                    <i class="fas fa-edit"></i> Chỉnh sửa
                  </button>
                  <button 
                    @click="deleteDepartment(department)" 
                    class="dropdown-item text-danger"
                  >
                    <i class="fas fa-trash"></i> Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Modal thêm/chỉnh sửa phòng ban -->
        <div v-if="showModal" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h2>{{ isEditing ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới' }}</h2>
              <button class="modal-close" @click="closeModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="modal-body">
              <form @submit.prevent="saveDepartment">
                <div class="form-group">
                  <label for="name">Tên phòng ban <span class="required">*</span></label>
                  <input 
                    type="text" 
                    id="name" 
                    v-model="departmentForm.name" 
                    class="form-control" 
                    required
                  />
                </div>
                
                <div class="form-group">
                  <label for="code">Mã phòng ban</label>
                  <input 
                    type="text" 
                    id="code" 
                    v-model="departmentForm.code" 
                    class="form-control"
                  />
                </div>
                
                <div class="form-group">
                  <label for="description">Mô tả</label>
                  <textarea 
                    id="description" 
                    v-model="departmentForm.description" 
                    class="form-control"
                  ></textarea>
                </div>
                
                <div class="form-group">
                  <label for="company">Công ty <span class="required">*</span></label>
                  <select 
                    id="company" 
                    v-model="departmentForm.companyId" 
                    class="form-control" 
                    required
                  >
                    <option 
                      v-for="company in companies" 
                      :key="company.id" 
                      :value="company.id"
                    >
                      {{ company.name }}
                    </option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="parentDepartment">Phòng ban cha</label>
                  <select 
                    id="parentDepartment" 
                    v-model="departmentForm.parentId" 
                    class="form-control"
                  >
                    <option :value="null">Không có</option>
                    <option 
                      v-for="dept in departmentsForParent" 
                      :key="dept.id" 
                      :value="dept.id"
                    >
                      {{ dept.name }}
                    </option>
                  </select>
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
  import AppLayout from '../../components/layout/AppLayout.vue'
  import { useAuthStore } from '../../store/auth'
  import DepartmentService from '../../services/DepartmentService'
  import CompanyService from '../../services/CompanyService'
  
  export default defineComponent({
    name: 'DepartmentListView',
    components: {
      AppLayout
    },
    setup() {
      const authStore = useAuthStore()
      
      const departments = ref([])
      const companies = ref([])
      const loading = ref(true)
      const error = ref('')
      
      const searchQuery = ref('')
      const selectedCompany = ref(null)
      const filteredDepartments = ref([])
      
      const showModal = ref(false)
      const isEditing = ref(false)
      const saving = ref(false)
      
      const departmentForm = reactive({
        id: null,
        name: '',
        code: '',
        description: '',
        companyId: null,
        parentId: null
      })
      
      const isAdmin = computed(() => authStore.isAdmin)
      
      const departmentsForParent = computed(() => {
        return departments.value.filter(dept => 
          dept.id !== departmentForm.id && 
          (!departmentForm.companyId || dept.companyId === departmentForm.companyId)
        )
      })
      
      // Lấy danh sách phòng ban và công ty
      const fetchData = async () => {
        loading.value = true
        error.value = ''
        
        try {
          const [departmentsResponse, companiesResponse] = await Promise.all([
            DepartmentService.getAllDepartments(),
            CompanyService.getAllCompanies()
          ])
          
          departments.value = departmentsResponse.data
          companies.value = companiesResponse.data
          filterDepartments()
        } catch (err) {
          console.error('Failed to fetch data:', err)
          error.value = 'Không thể tải dữ liệu. Vui lòng thử lại sau.'
        } finally {
          loading.value = false
        }
      }
      
      // Lọc danh sách phòng ban
      const filterDepartments = () => {
        filteredDepartments.value = departments.value.filter(department => {
          // Lọc theo công ty
          if (selectedCompany.value && department.companyId !== selectedCompany.value) {
            return false
          }
          
          // Lọc theo từ khóa tìm kiếm
          if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase()
            return (
              department.name.toLowerCase().includes(query) ||
              (department.code && department.code.toLowerCase().includes(query))
            )
          }
          
          return true
        })
      }
      
      // Lấy tên công ty
      const getCompanyName = (companyId) => {
        const company = companies.value.find(c => c.id === companyId)
        return company ? company.name : 'Không xác định'
      }
      
      // Lấy tên phòng ban cha
      const getParentDepartmentName = (parentId) => {
        const parentDept = departments.value.find(d => d.id === parentId)
        return parentDept ? parentDept.name : 'Không xác định'
      }
      
      // Mở modal thêm phòng ban mới
      const openCreateModal = () => {
        isEditing.value = false
        resetForm()
        showModal.value = true
      }
      
      // Mở modal chỉnh sửa phòng ban
      const editDepartment = (department) => {
        isEditing.value = true
        
        // Điền thông tin phòng ban vào form
        Object.keys(departmentForm).forEach(key => {
          departmentForm[key] = department[key]
        })
        
        showModal.value = true
      }
      
      // Lưu thông tin phòng ban
      const saveDepartment = async () => {
        saving.value = true
        
        try {
          if (isEditing.value) {
            // Cập nhật phòng ban
            await DepartmentService.updateDepartment(departmentForm.id, departmentForm)
          } else {
            // Tạo phòng ban mới
            await DepartmentService.createDepartment(departmentForm)
          }
          
          // Đóng modal và tải lại danh sách
          closeModal()
          fetchData()
        } catch (err) {
          console.error('Failed to save department:', err)
          error.value = 'Không thể lưu thông tin phòng ban. Vui lòng thử lại sau.'
        } finally {
          saving.value = false
        }
      }
      
      // Xóa phòng ban
      const deleteDepartment = async (department) => {
        if (confirm(`Bạn có chắc chắn muốn xóa phòng ban "${department.name}"?`)) {
          try {
            await DepartmentService.deleteDepartment(department.id)
            fetchData()
          } catch (err) {
            console.error('Failed to delete department:', err)
            error.value = 'Không thể xóa phòng ban. Vui lòng thử lại sau.'
          }
        }
      }
      
      // Đóng modal
      const closeModal = () => {
        showModal.value = false
        resetForm()
      }
      
      // Reset form
      const resetForm = () => {
        departmentForm.id = null
        departmentForm.name = ''
        departmentForm.code = ''
        departmentForm.description = ''
        departmentForm.companyId = null
        departmentForm.parentId = null
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
      
      // Cắt ngắn mô tả
      const truncateDescription = (text, maxLength = 100) => {
        return text.length > maxLength 
          ? text.substring(0, maxLength) + '...' 
          : text
      }
      
      // Tải dữ liệu khi component được mount
      onMounted(fetchData)
      
      return {
        departments,
        companies,
        filteredDepartments,
        departmentsForParent,
        loading,
        error,
        searchQuery,
        selectedCompany,
        showModal,
        isEditing,
        saving,
        departmentForm,
        isAdmin,
        getCompanyName,
        getParentDepartmentName,
        filterDepartments,
        openCreateModal,
        editDepartment,
        saveDepartment,
        deleteDepartment,
        closeModal,
        toggleDropdown,
        truncateDescription
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