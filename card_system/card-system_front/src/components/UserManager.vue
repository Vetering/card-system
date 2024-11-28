<template>
  <div class="user-manager">
    <el-card class="table-card">
      <div slot="header" class="card-header">
        <span>用户管理</span>
        <el-button type="primary" @click="showAddUserDialog">添加用户</el-button>
      </div>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="管理员列表" name="root">
          <el-table :data="rootUsers" border stripe>
            <el-table-column prop="username" label="用户名" width="180"></el-table-column>
            <el-table-column prop="name" label="姓名" width="180"></el-table-column>
            <el-table-column prop="wechat" label="微信号"></el-table-column>
            <el-table-column prop="points_balance" label="积分余额"></el-table-column>
            <el-table-column label="操作" width="200" align="center">
              <template slot-scope="scope">
                <el-button 
                  type="primary" 
                  size="mini"
                  @click="handleEdit(scope.row)"
                >编辑</el-button>
                <el-button 
                  type="danger" 
                  size="mini"
                  @click="handleDelete(scope.row, 'root')"
                >删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="代理商列表" name="agent">
          <el-table :data="agentUsers" border stripe>
            <el-table-column prop="username" label="用户名" width="180"></el-table-column>
            <el-table-column prop="name" label="姓名" width="180"></el-table-column>
            <el-table-column prop="wechat" label="微信号"></el-table-column>
            <el-table-column prop="points_balance" label="积分余额"></el-table-column>
            <el-table-column label="操作" width="200" align="center">
              <template slot-scope="scope">
                <el-button 
                  type="primary" 
                  size="mini"
                  @click="handleEdit(scope.row)"
                >编辑</el-button>
                <el-button 
                  type="danger" 
                  size="mini"
                  @click="handleDelete(scope.row, 'agent')"
                >删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="500px">
      <el-form :model="userForm" :rules="rules" ref="userForm" label-width="100px">
        <el-form-item label="用户类型" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择用户类型">
            <el-option label="管理员" value="root"></el-option>
            <el-option label="代理商" value="agent"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="isEdit"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name"></el-input>
        </el-form-item>
        <el-form-item label="微信号" prop="wechat">
          <el-input v-model="userForm.wechat"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="userForm.password" type="password"></el-input>
        </el-form-item>
        <el-form-item label="积分余额" prop="points_balance">
          <el-input-number v-model="userForm.points_balance" :min="0"></el-input-number>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import request from '../utils/request'

export default {
  name: 'UserManager',
  data() {
    return {
      activeTab: 'root',
      rootUsers: [],
      agentUsers: [],
      dialogVisible: false,
      isEdit: false,
      userForm: {
        role: '',
        username: '',
        name: '',
        wechat: '',
        password: '',
        points_balance: 0
      },
      rules: {
        role: [{ required: true, message: '请选择用户类型', trigger: 'change' }],
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入姓名', trigger: 'blur' },
          { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        wechat: [
          { required: true, message: '请输入微信号', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ],
        points_balance: [
          { required: true, message: '请输入积分余额', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogTitle() {
      return this.isEdit ? '编辑用户' : '添加用户'
    }
  },
  created() {
    this.fetchUsers()
  },
  methods: {
    async fetchUsers() {
      try {
        console.log('开始获取用户列表');
        const response = await request({
          url: '/api/users/list',
          method: 'get'
        });
        console.log('获取用户列表响应:', response);
        
        if(response.code === 200) {
          this.rootUsers = response.data.rootUsers;
          this.agentUsers = response.data.agentUsers;
        }
      } catch(error) {
        console.error('获取用户列表失败:', error);
        this.$message.error('获取用户列表失败');
      }
    },
    
    showAddUserDialog() {
      this.isEdit = false
      this.userForm = {
        role: '',
        username: '',
        name: '',
        wechat: '',
        password: '',
        points_balance: 0
      }
      this.dialogVisible = true
    },
    
    handleEdit(user) {
      this.isEdit = true
      this.userForm = { ...user }
      this.dialogVisible = true
    },
    
    async handleDelete(user, type) {
      try {
        await this.$confirm('确认删除该用户?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const response = await request({
          url: '/api/users/delete',
          method: 'post',
          data: {
            username: user.username,
            type
          }
        })
        
        if(response.code === 200) {
          this.$message.success('删除成功')
          this.fetchUsers()
        }
      } catch(error) {
        if(error !== 'cancel') {
          this.$message.error('删除失败')
          console.error('删除用户失败:', error)
        }
      }
    },
    
    submitForm() {
      this.$refs.userForm.validate(async valid => {
        if (!valid) return
        
        try {
          const url = this.isEdit ? '/api/users/update' : '/api/users/create'
          const response = await request({
            url,
            method: 'post',
            data: this.userForm
          })
          
          if(response.code === 200) {
            this.$message.success(this.isEdit ? '更新成功' : '添加成功')
            this.dialogVisible = false
            this.fetchUsers()
          }
        } catch(error) {
          this.$message.error(this.isEdit ? '更新失败' : '添加失败')
          console.error('提交表单失败:', error)
        }
      })
    }
  }
}
</script>

<style scoped>
.user-manager {
  padding: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-pagination {
  margin-top: 20px;
  text-align: right;
}
</style> 