import api from './api';

// Pass-throughs for now. If the backend's dashboard or tax schema differs from the
// mock, map it to the mock's shape here so no component has to change.
export const insightsService = {
  getDashboard: ({ businessId, period }) => api.getDashboard({ businessId, period }),
  getTaxPosition: ({ businessId }) => api.getTaxPosition({ businessId }),
};
