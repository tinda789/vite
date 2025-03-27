// src/services/TeamService.ts
import api from './api';

export default {
  getAllTeams() {
    return api.get('/teams');
  },
  getActiveTeams() {
    return api.get('/teams/active');
  },
  getTeamsByDepartment(departmentId: number) {
    return api.get(`/teams/department/${departmentId}`);
  },
  getTeamById(id: number) {
    return api.get(`/teams/${id}`);
  },
  createTeam(teamData: any) {
    return api.post('/teams', teamData);
  },
  updateTeam(id: number, teamData: any) {
    return api.put(`/teams/${id}`, teamData);
  },
  deleteTeam(id: number) {
    return api.delete(`/teams/${id}`);
  }
};