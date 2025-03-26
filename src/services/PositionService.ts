import api from './api'

export default {
  getAllPositions() {
    return api.get('/positions')
  },
  getActivePositions() {
    return api.get('/positions/active')
  },
  getPositionsByDepartment(departmentId: number) {
    return api.get(`/positions/department/${departmentId}`)
  },
  getPositionsByLevel(level: number) {
    return api.get(`/positions/level/${level}`)
  },
  getPositionById(id: number) {
    return api.get(`/positions/${id}`)
  },
  createPosition(positionData: any) {
    return api.post('/positions', positionData)
  },
  updatePosition(id: number, positionData: any) {
    return api.put(`/positions/${id}`, positionData)
  },
  deletePosition(id: number) {
    return api.delete(`/positions/${id}`)
  }
}