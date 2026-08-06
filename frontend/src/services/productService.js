import api from './api';

export const productService = {
  getProducts:       (params) => api.get('/products', { params }),
  getProduct:        (id)     => api.get(`/products/${id}`),
  getFeatured:       ()       => api.get('/products/featured'),
  getCategories:     ()       => api.get('/products/categories'),
  searchSuggestions: (q)      => api.get('/products/search/suggestions', { params: { q } }),
  getRecentlyViewed: ()       => api.get('/products/recently-viewed'),
  trackView:         (id)     => api.post(`/products/${id}/track-view`),
  addReview:         (id, data) => api.post(`/products/${id}/reviews`, data),
  checkPurchased:    (id)     => api.get(`/products/${id}/check-purchased`),
};

export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: ()     => api.get('/orders'),
  getOrder:    (id)   => api.get(`/orders/${id}`),
  cancelOrder: (id)   => api.put(`/orders/${id}/cancel`),
};

export const couponService = {
  validate: (code, cartTotal) => api.post('/coupons/validate', { code, cartTotal }),
};

export const returnService = {
  createRequest:  (data)       => api.post('/returns', data),
  uploadEvidence: (id, formData) => api.post(`/returns/${id}/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyRequests:  ()           => api.get('/returns'),
  getRequest:     (id)         => api.get(`/returns/${id}`),
};

export const addressService = {
  getAddresses:    ()           => api.get('/addresses'),
  createAddress:   (data)       => api.post('/addresses', data),
  updateAddress:   (id, data)   => api.put(`/addresses/${id}`, data),
  deleteAddress:   (id)         => api.delete(`/addresses/${id}`),
  setDefault:      (id)         => api.put(`/addresses/${id}/default`),
};

export const adminService = {
  getDashboard:        ()           => api.get('/admin/dashboard'),
  getAllOrders:         (params)     => api.get('/admin/orders', { params }),
  getOrderDetails:     (id)         => api.get(`/admin/orders/${id}`),
  updateOrderStatus:   (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  getAllUsers:          ()           => api.get('/admin/users'),
  createProduct:       (data)       => api.post('/admin/products', data),
  updateProduct:       (id, data)   => api.put(`/admin/products/${id}`, data),
  deleteProduct:       (id)         => api.delete(`/admin/products/${id}`),
  // Returns management
  getAllReturns:        (params)     => api.get('/admin/returns', { params }),
  updateReturnStatus:  (id, status, admin_notes) => api.put(`/admin/returns/${id}/status`, { status, admin_notes }),
};
