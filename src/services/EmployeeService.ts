import api from './api'

export default {
  getAllEmployees() {
    return api.get('/employees')
  },
  getEmployeesByCompany(companyId: number) {
    return api.get(`/employees/company/${companyId}`)
  },
  getEmployeesByDepartment(departmentId: number) {
    return api.get(`/employees/department/${departmentId}`)
  },
  getEmployeesBySecondaryDepartment(departmentId: number) {
    return api.get(`/employees/secondary-department/${departmentId}`)
  },
  getEmployeesByAnyDepartment(departmentId: number) {
    return api.get(`/employees/any-department/${departmentId}`)
  },
  getEmployeesByTeam(teamId: number) {
    return api.get(`/employees/team/${teamId}`)
  },
  getEmployeesByPosition(positionId: number) {
    return api.get(`/employees/position/${positionId}`)
  },
  getEmployeesByManager(managerId: number) {
    return api.get(`/employees/manager/${managerId}`)
  },
  getEmployeeById(id: number) {
    return api.get(`/employees/${id}`)
  },
  getEmployeeByUserId(userId: number) {
    return api.get(`/employees/user/${userId}`)
  },
  getCurrentEmployeeInfo() {
    return api.get('/employees/current')
  },
  createEmployee(employeeData: any) {
    return api.post('/employees', employeeData)
  },
  updateEmployee(id: number, employeeData: any) {
    return api.put(`/employees/${id}`, employeeData)
  },
  deactivateEmployee(id: number) {
    return api.put(`/employees/${id}/deactivate`)
  },
  terminateEmployee(id: number, terminationDate: string) {
    return api.put(`/employees/${id}/terminate?terminationDate=${terminationDate}`)
  }
}