import request from '@/utils/request'

// 获取我的订单列表
export function getMyOrders(data) {
  return request({
    url: '/api/orders/my-list',
    method: 'post',
    data
  })
} 