import api from './api';

export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct:  (id)     => api.get(`/products/${id}`),
  getFeatured: ()       => api.get('/products/featured'),
  getCategories: ()     => api.get('/products/categories'),
  searchSuggestions: (q) => api.get('/products/search/suggestions', { params: { q } }),
  getRecentlyViewed: () => api.get('/products/recently-viewed'),
  trackView:   (id)     => api.post(`/products/${id}/track-view`),
  addReview:   (id, data) => api.post(`/products/${id}/reviews`, data),
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

export const adminService = {
  getDashboard:      ()           => api.get('/admin/dashboard'),
  getAllOrders:       (params)     => api.get('/admin/orders', { params }),
  getOrderDetails:   (id)         => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  getAllUsers:        ()           => api.get('/admin/users'),
  createProduct:     (data)       => api.post('/admin/products', data),
  updateProduct:     (id, data)   => api.put(`/admin/products/${id}`, data),
  deleteProduct:     (id)         => api.delete(`/admin/products/${id}`),
};
