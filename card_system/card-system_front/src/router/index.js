import Vue from 'vue'
import VueRouter from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainLayout from '../layouts/MainLayout.vue'
import UserProfile from '../components/UserProfile.vue'
import CardManager from '../components/CardManager.vue'
import UserManager from '../components/UserManager.vue'
import OrderManager from '../components/OrderManager.vue'
import request from '@/utils/request'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
      meta: {
        title: ''
      }
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('../views/403.vue'),
      meta: {
        title: '403'
      }
    },
    {
      path: '/home',
      component: MainLayout,
      meta: {
        title: '卡密管理'
      },
      children: [
        {
          path: '',
          name: 'home',
          component: CardManager,
          meta: {
            title: '卡密管理'
          }
        },
        {
          path: 'profile',
          name: 'profile',
          component: UserProfile,
          meta: {
            title: '个人信息'
          }
        },
        {
          path: 'users',
          name: 'users',
          component: UserManager,
          meta: {
            title: '用户管理',
            requiresRoot: true
          }
        },
        {
          path: 'orders',
          name: 'orders',
          component: OrderManager,
          meta: {
            title: '订单管理',
            requiresRoot: true
          }
        },
        {
          path: 'my-orders',
          name: 'MyOrders',
          component: () => import('@/views/my-orders/index'),
          meta: {
            title: '我的订单'
          }
        },
        {
          path: 'notices',
          name: 'notices',
          component: () => import('@/views/notice/index'),
          meta: {
            title: '公告管理',
            requiresRoot: true
          }
        }
      ]
    }
  ]
})

// 修改路由守卫
router.beforeEach(async (to, from, next) => {
  const userInfo = localStorage.getItem('userInfo')
  
  if (to.path === '/') {
    if (userInfo) {
      next('/home')
    } else {
      next()
    }
  } else if (to.path === '/403') {
    next()
  } else {
    if (!userInfo) {
      next('/')
    } else {
      // 检查是否需要root权限
      if (to.meta.requiresRoot) {
        try {
          // 调用权限校验接口
          await request.post('/api/menu/check-permission', {
            menuPath: to.path
          })
          next()
        } catch (error) {
          console.log('权限检查失败:', error)
          // 重新获取用户信息
          try {
            const res = await request.get('/api/user/info')
            if (res.code === 200) {
              // 更新localStorage中的用户信息
              const currentInfo = JSON.parse(userInfo)
              localStorage.setItem('userInfo', JSON.stringify({
                ...currentInfo,
                role: res.data.role // 使用后端返回的真实角色
              }))
            }
          } catch (e) {
            console.error('获取用户信息失败:', e)
          }
          router.replace('/403')
        }
      } else {
        next()
      }
    }
  }
})

export default router
