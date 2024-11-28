<template>
  <div class="user-profile">
    <el-card class="profile-card">
      <div slot="header" class="card-header">
        <span>个人信息</span>
        <el-button 
          type="text" 
          icon="el-icon-edit"
          @click="startEdit"
          v-if="!isEditing"
        >
          编辑
        </el-button>
      </div>
      
      <el-form 
        ref="form" 
        :model="userInfo" 
        :rules="rules"
        label-width="80px"
        :disabled="!isEditing"
      >
        <el-form-item label="身份">
          <el-tag :type="userInfo.role === 'root' ? 'danger' : 'primary'">
            {{ userInfo.role === 'root' ? '管理员' : '代理商' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="userInfo.username" disabled></el-input>
        </el-form-item>
        
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userInfo.name"></el-input>
        </el-form-item>
        

        
        <el-form-item label="积分余额">
          <div class="points-wrapper">
            <el-input v-model="userInfo.points_balance" disabled>
              <template slot="append">积分</template>
            </el-input>
            <el-button type="primary" @click="showRechargeDialog">充值</el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="微信号" prop="wechat">
          <el-input v-model="userInfo.wechat"></el-input>
        </el-form-item>
        
        <el-form-item label="密码" v-if="isEditing">
          <div class="custom-input">
            <input
              type="password"
              v-model="userInfo.password"
              placeholder="不修改请留空"
              class="native-input"
            >
          </div>
        </el-form-item>
        
        <el-form-item label="确认密码" v-if="isEditing">
          <div class="custom-input">
            <input
              type="password"
              v-model="userInfo.confirmPassword"
              placeholder="请再次输入密码"
              class="native-input"
            >
          </div>
        </el-form-item>

        <el-form-item v-if="!isEditing" label="密码">
          <el-input 
            value="******" 
            disabled>
          </el-input>
        </el-form-item>

        <el-form-item v-if="isEditing">
          <el-button type="primary" @click="submitForm">保存</el-button>
          <el-button @click="cancelEdit">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 添加充值对话框 -->
    <el-dialog
      title="积分充值"
      :visible.sync="rechargeDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="rechargeForm" :rules="rechargeRules" ref="rechargeForm" label-width="100px">
        <el-form-item label="充值积分" prop="points">
          <el-input-number 
            v-model="rechargeForm.points" 
            :min="1"
            :step="1"
            @change="calculateAmount"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="支付金额">
          <span class="amount">{{ rechargeForm.amount }}元</span>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="rechargeDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleRecharge">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 支付二维码对话框 -->
    <el-dialog
      title="请扫码支付"
      :visible.sync="payDialogVisible"
      width="300px"
      :close-on-click-modal="false"
      center
    >
      <div class="qr-container">
        <img :src="require('../assets/pay/alipay.png')" v-if="payMethod === 'alipay'" class="qr-code">
        <img :src="require('../assets/pay/wechat.png')" v-if="payMethod === 'wechat'" class="qr-code">
        <div class="pay-switch">
          <el-radio-group v-model="payMethod">
            <el-radio label="alipay">支付宝</el-radio>
            <el-radio label="wechat">微信</el-radio>
          </el-radio-group>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import request from '../utils/request'

export default {
  data() {
    return {
      isEditing: false,
      userInfo: {
        username: '',
        name: '',
        role: '',
        points_balance: '',
        wechat: '',
        password: '',
        confirmPassword: ''
      },
      originalInfo: null,
      rules: {
        name: [
          { required: true, message: '请输入姓名', trigger: 'blur' },
          { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        wechat: [
          { required: true, message: '请输入微信号', trigger: 'blur' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ]
      },
      rechargeDialogVisible: false,
      payDialogVisible: false,
      payMethod: 'alipay',
      rechargeForm: {
        points: 1,
        amount: 1
      },
      rechargeRules: {
        points: [
          { required: true, message: '请输入充值积分', trigger: 'blur' }
        ]
      }
    }
  },
  watch: {
    // 监听密码变化
    'userInfo.password'(newVal) {
      // 如果清空密码，也清空确认密码
      if (!newVal) {
        this.userInfo.confirmPassword = ''
      }
    }
  },
  methods: {
    // 获取用户信息
    async fetchUserInfo() {
      try {
        const response = await request({
          url: '/api/user/info',
          method: 'get'
        })
        
        if (response.code === 200) {
          this.userInfo = response.data
          this.originalInfo = { ...response.data }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.$message.error('获取用户信息失败')
      }
    },
    
    // 开始编辑
    startEdit() {
      this.isEditing = true
      this.originalInfo = { ...this.userInfo }
      this.userInfo.password = ''
      this.userInfo.confirmPassword = ''
    },
    
    // 取消编辑
    cancelEdit() {
      this.isEditing = false
      this.userInfo = { ...this.originalInfo }
      this.userInfo.password = ''
      this.userInfo.confirmPassword = ''
      this.$refs.form.clearValidate()
    },
    
    // 提交表单
    submitForm() {
      this.$refs.form.validate(async valid => {
        if (!valid) return

        // 如果输入了密码，进行验证
        if (this.userInfo.password) {
          if (this.userInfo.password.length < 6) {
            this.$message.error('密码不能少于6个字符')
            return
          }
          if (this.userInfo.password !== this.userInfo.confirmPassword) {
            this.$message.error('两次输入的密码不一致')
            return
          }
        }

        try {
          const updateData = {
            name: this.userInfo.name,
            wechat: this.userInfo.wechat
          }
          
          if (this.userInfo.password) {
            updateData.password = this.userInfo.password
          }
          
          const response = await request({
            url: '/api/user/update',
            method: 'post',
            data: updateData
          })
          
          if (response.code === 200) {
            this.$message.success('更新成功')
            this.isEditing = false
            this.originalInfo = { ...this.userInfo }
            this.userInfo.password = ''
            this.userInfo.confirmPassword = ''
          }
        } catch (error) {
          console.error('更新用户信息失败:', error)
          this.$message.error('更新用户信息失败')
        }
      })
    },
    
    // 显示充值对话框
    showRechargeDialog() {
      this.rechargeDialogVisible = true
      this.rechargeForm.points = 10
      this.calculateAmount()
    },
    
    // 计算支付金额
    calculateAmount() {
      this.rechargeForm.amount = this.rechargeForm.points
    },
    
    // 处理充值请求
    async handleRecharge() {
      try {
        const response = await request({
          url: '/api/orders/create',
          method: 'post',
          data: this.rechargeForm
        })
        
        if (response.code === 200) {
          this.rechargeDialogVisible = false
          
          // 判断是否为移动设备
          if (/mobile|android|iphone|ipad|phone/i.test(navigator.userAgent.toLowerCase())) {
            // 移动设备直接跳转支付链接
            window.location.href = 'https://qr.alipay.com/2m610324gpgvrlih3rtmzf0'
          } else {
            // PC端显示二维码
            this.payDialogVisible = true
          }
        }
      } catch (error) {
        this.$message.error('创建订单失败')
        console.error('创建订单失败:', error)
      }
    }
  },
  
  created() {
    this.fetchUserInfo()
  }
}
</script>

<style scoped>
.user-profile {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-form-item__content) {
  max-width: 400px;
}

.el-tag {
  text-transform: capitalize;
}

.el-button + .el-button {
  margin-left: 10px;
}

.custom-input {
  position: relative;
  width: 100%;
}

.native-input {
  width: 100%;
  height: 40px;
  line-height: 40px;
  padding: 0 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.native-input:hover {
  border-color: #c0c4cc;
}

.native-input:focus {
  outline: none;
  border-color: #409eff;
}

.native-input::placeholder {
  color: #c0c4cc;
}

.points-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.amount {
  font-size: 20px;
  color: #f56c6c;
  font-weight: bold;
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.qr-code {
  width: 200px;
  height: 200px;
  object-fit: contain;
}

.pay-switch {
  margin-top: 10px;
}
</style> 