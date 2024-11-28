<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="title">卡密管理系统</div>
      <el-form :model="loginForm" :rules="rules" ref="loginForm" @keyup.enter.native="handleLogin">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            prefix-icon="el-icon-user" 
            placeholder="用户名">
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            prefix-icon="el-icon-lock" 
            type="password" 
            placeholder="密码">
          </el-input>
        </el-form-item>
        <el-form-item prop="role">
          <el-select 
            v-model="loginForm.role" 
            placeholder="请选择角色" 
            style="width: 100%">
            <el-option label="管理员" value="root"></el-option>
            <el-option label="代理商" value="agent"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="validCode">
          <el-row :gutter="20">
            <el-col :span="16">
              <el-input 
                v-model="loginForm.validCode" 
                prefix-icon="el-icon-key" 
                placeholder="验证码">
              </el-input>
            </el-col>
            <el-col :span="8">
              <ValidCode ref="validCode" @update:value="updateValidCode"/>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" style="width: 100%">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import ValidCode from '../components/ValidCode.vue'
import request from '../utils/request'

export default {
  name: 'LoginView',
  components: {
    ValidCode
  },
  data() {
    return {
      loginForm: {
        username: '',
        password: '',
        validCode: '',
        role: 'root'
      },
      currentValidCode: '',
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ],
        role: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ],
        validCode: [
          { required: true, message: '请输入验证码', trigger: 'blur' },
          { validator: this.validateCode, trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    // 检查是否已登录
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      this.$router.push('/home')
    }
  },
  methods: {
    async handleLogin() {
      this.$refs.loginForm.validate(async valid => {
        if (valid) {
          if (this.loginForm.validCode.toLowerCase() !== this.currentValidCode.toLowerCase()) {
            this.$message.error('验证码错误')
            this.$refs.validCode.refreshCode()
            this.loginForm.validCode = ''
            return
          }

          try {
            const response = await request({
              url: '/api/login',
              method: 'post',
              data: {
                username: this.loginForm.username,
                password: this.loginForm.password,
                role: this.loginForm.role
              }
            })

            // 存储用户信息和token
            const userInfo = {
              username: response.data.username,
              role: response.data.role,
              token: response.data.token,
              loginTime: new Date().getTime()
            }
            localStorage.setItem('userInfo', JSON.stringify(userInfo))
            
            this.$message.success(response.msg)
            this.$router.push('/home')
          } catch (error) {
            console.error('登录失败:', error)
            this.$message.error(error.response?.data?.msg || '登录失败，请检查网络连接')
            this.$refs.validCode.refreshCode()
            this.loginForm.validCode = ''
          }
        }
      })
    },
    updateValidCode(code) {
      this.currentValidCode = code
    },
    validateCode(rule, value, callback) {
      if (!value) {
        callback(new Error('请输入验证码'))
      } else if (value.toLowerCase() !== this.currentValidCode.toLowerCase()) {
        this.$refs.validCode.refreshCode()
        this.loginForm.validCode = ''
        callback(new Error('验证码错误，已刷新'))
      } else {
        callback()
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2d3a4b;
  overflow: hidden;
}

.login-card {
  width: 400px;
}

.title {
  font-size: 26px;
  color: #333;
  margin: 0 auto 30px auto;
  text-align: center;
  font-weight: bold;
}

/* 调整验证码组件样式 */
:deep(.valid-code) {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 调整下拉选择框样式 */
:deep(.el-select .el-input__inner) {
  height: 40px;
  line-height: 40px;
}
</style>