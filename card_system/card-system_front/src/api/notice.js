import request from '@/utils/request'

// 获取公告列表
export function getNotices(params) {
  return request({
    url: '/api/notices/list',
    method: 'post',
    data: params
  })
}

// 添加公告
export function addNotice(data) {
  return request({
    url: '/api/notices/create',
    method: 'post', 
    data
  })
}

// 更新公告
export function updateNotice(data) {
  return request({
    url: '/api/notices/update',
    method: 'post',
    data
  })
}

// 删除公告
export function deleteNotice(data) {
  return request({
    url: '/api/notices/delete',
    method: 'post',
    data
  })
} 