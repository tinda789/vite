import api from './api'

export default {
  getAllDepartments() {
    return api.get('/departments')
  },
  getDepartmentsByCompany(companyId: number) {
    return api.get(`/departments/company/${companyId}`)
  },
  getRootDepartments() {
    return api.get('/departments/root')
  },
  getSubDepartments(parentId: number) {
    return api.get(`/departments/parent/${parentId}`)
  },
  getDepartmentById(id: number) {
    return api.get(`/departments/${id}`)
  },
  createDepartment(departmentData: any) {
    return api.post('/departments', departmentData)
  },
  updateDepartment(id: number, departmentData: any) {
    return api.put(`/departments/${id}`, departmentData)
  },
  deleteDepartment(id: number) {
    return api.delete(`/departments/${id}`)
  }
}