<template>
  <el-container class="app-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
      <div class="logo">
        <i class="el-icon-s-platform logo-icon"></i>
        <span v-show="!isCollapse">卡密管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :collapse="isCollapse"
        :collapse-transition="true"
        router>
        <el-menu-item index="/home">
          <i class="el-icon-key"></i>
          <span slot="title">卡密管理</span>
        </el-menu-item>
        <el-menu-item v-if="userInfo.role === 'root'" index="/home/users">
          <i class="el-icon-user"></i>
          <span slot="title">用户管理</span>
        </el-menu-item>
        <el-menu-item index="/home/my-orders">
          <i class="el-icon-s-order"></i>
          <span slot="title">我的订单</span>
        </el-menu-item>
        <el-menu-item v-if="userInfo.role === 'root'" index="/home/orders">
          <i class="el-icon-s-order"></i>
          <span slot="title">订单管理</span>
        </el-menu-item>

        <el-menu-item v-if="userInfo.role === 'root'" index="/home/notices">
          <i class="el-icon-bell"></i>
          <span slot="title">公告管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header" :style="{ left: isCollapse ? '64px' : '200px' }">
        <div class="header-left">
          <i class="el-icon-menu" @click="toggleSidebar"></i>
          <span>{{ currentTitle }}</span>
          <div class="notice-marquee" v-if="latestNotice">
            <el-tooltip :content="latestNotice.content" placement="bottom">
              <div class="marquee-content">
                <i class="el-icon-bell notice-icon"></i>
                <span>{{ latestNotice.title }}: {{ latestNotice.content }}</span>
              </div>
            </el-tooltip>
          </div>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <i class="el-icon-user-solid avatar-icon"></i>
              {{ userInfo.username }}
              <i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="profile">个人信息</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main" :style="{ marginLeft: isCollapse ? '64px' : '200px' }">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import CardManager from '../components/CardManager.vue'
import { getNotices } from '@/api/notice'

export default {
  name: 'MainLayout',
  components: {
    CardManager
  },
  data() {
    return {
      isCollapse: false,
      userInfo: {
        username: '',
        role: ''
      },
      latestNotice: null
    }
  },
  created() {
    // 获取用户信息
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr) {
      this.userInfo = JSON.parse(userInfoStr)
    } else {
      // 如果没有用户信息，跳转到登录页
      this.$router.push('/')
    }
    this.getLatestNotice()
  },
  computed: {
    activeMenu() {
      return this.$route.path
    },
    currentTitle() {
      return this.$route.meta.title || '卡密管理'
    }
  },
  methods: {
    toggleSidebar() {
      this.isCollapse = !this.isCollapse
    },
    handleCommand(command) {
      switch(command) {
        case 'profile':
          if (this.$route.name !== 'profile') {
            this.$router.push('/home/profile').catch(err => {
              if (err.name !== 'NavigationDuplicated') {
                throw err
              }
            })
          }
          break
        case 'logout':
          // 清除本地存储的用户信息
          localStorage.removeItem('userInfo')
          this.$router.push('/').then(() => {
            this.$message.success('退出登录成功')
          }).catch(err => {
            console.error('退出登录失败:', err)
          })
          break
      }
    },
    async getLatestNotice() {
      try {
        const res = await getNotices({
          pageNum: 1,
          pageSize: 1
        })
        if (res.code === 200 && res.data.list.length > 0) {
          this.latestNotice = res.data.list[0]
        }
      } catch (error) {
        console.error('获取最新公告失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.app-container {
  height: 100%;
  overflow: hidden;
}

.aside {
  background-color: #304156;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  transition: width 0.3s;
  z-index: 1001;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: #fff;
  font-size: 18px;
  border-bottom: 1px solid #1f2d3d;
  overflow: hidden;
  white-space: nowrap;
}

.logo-icon {
  font-size: 24px;
  margin-right: 12px;
}

.menu {
  border: none;
}

.menu:not(.el-menu--collapse) {
  width: 200px;
}

.header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  transition: left 0.3s;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 3;
  overflow: hidden;
}

.header-left i {
  margin-right: 10px;
  font-size: 20px;
  cursor: pointer;
}

.avatar-icon {
  font-size: 20px;
  margin-right: 8px;
  color: #409EFF;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.main {
  margin-top: 60px;
  background: #f0f2f5;
  height: calc(100% - 60px);
  padding: 20px;
  transition: margin-left 0.3s;
  overflow-y: auto;
  box-sizing: border-box;
}

.notice-marquee {
  margin-left: 20px;
  max-width: 600px;
  width: 50%;
  overflow: hidden;
  position: relative;
}

.notice-icon {
  color: #409EFF;
  margin-right: 8px;
}

.marquee-content {
  display: flex;
  align-items: center;
  white-space: nowrap;
  animation: marquee 10s linear infinite;
  cursor: pointer;
}

@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  margin-left: 20px;
}

/* 当鼠标悬停时暂停动画 */
.marquee-content:hover {
  animation-play-state: paused;
}
</style> 