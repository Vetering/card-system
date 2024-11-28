import axios from 'axios'
import router from '../router'
import { Message } from 'element-ui'

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 5000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const { token } = JSON.parse(userInfo)
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 403) {
      console.log('接口返回403:', res)
      Message.error(res.msg || '无权访问')
      return Promise.reject(res)
    }
    return res
  },
  error => {
    console.log('请求发生错误:', error)
    if (error.response && error.response.status === 403) {
      Message.error('无权访问')
    }
    return Promise.reject(error)
  }
)

export default service 














