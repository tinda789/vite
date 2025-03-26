import api from './api'

export default {
  getAllCompanies() {
    return api.get('/companies')
  },
  getActiveCompanies() {
    return api.get('/companies/active')
  },
  getCompanyById(id: number) {
    return api.get(`/companies/${id}`)
  },
  getCompanyDetail(id: number) {
    return api.get(`/companies/${id}/detail`)
  },
  getCompanyStats(id: number) {
    return api.get(`/companies/${id}/stats`)
  },
  createCompany(companyData: any) {
    return api.post('/companies', companyData)
  },
  updateCompany(id: number, companyData: any) {
    return api.put(`/companies/${id}`, companyData)
  },
  deleteCompany(id: number) {
    return api.delete(`/companies/${id}`)
  },
  restoreCompany(id: number) {
    return api.put(`/companies/${id}/restore`)
  }
}