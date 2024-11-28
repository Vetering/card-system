<template>
  <div class="notice-container">
    <div class="header">
      <el-button type="primary" @click="handleAdd">新增公告</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="noticeList"
      border
      style="width: 100%">
      <el-table-column
        prop="title"
        label="标题"
        min-width="150">
      </el-table-column>
      <el-table-column
        prop="content"
        label="内容"
        min-width="300">
        <template slot-scope="scope">
          <div class="content-cell">{{ scope.row.content }}</div>
        </template>
      </el-table-column>
      <el-table-column
        prop="create_time"
        label="创建时间"
        width="180">
      </el-table-column>
      <el-table-column
        label="操作"
        width="150"
        fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            @click="handleEdit(scope.row)">编辑</el-button>
          <el-button
            size="mini"
            type="danger"
            @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pageNum"
      :page-sizes="[10, 20, 30, 50]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      class="pagination">
    </el-pagination>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="50%">
      <el-form :model="noticeForm" :rules="rules" ref="noticeForm" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="noticeForm.title" placeholder="请输入公告标题"></el-input>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            type="textarea"
            :rows="4"
            v-model="noticeForm.content"
            placeholder="请输入公告内容">
          </el-input>
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
import { getNotices, addNotice, updateNotice, deleteNotice } from '@/api/notice'

export default {
  name: 'NoticeManager',
  data() {
    return {
      loading: false,
      noticeList: [],
      pageNum: 1,
      pageSize: 10,
      total: 0,
      dialogVisible: false,
      dialogTitle: '',
      noticeForm: {
        id: null,
        title: '',
        content: ''
      },
      rules: {
        title: [
          { required: true, message: '请输入公告标题', trigger: 'blur' },
          { max: 100, message: '标题长度不能超过100个字符', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '请输入公告内容', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.checkPermission()
  },
  methods: {
    // 获取列表数据
    async getList() {
      this.loading = true
      try {
        const res = await getNotices({
          pageNum: this.pageNum,
          pageSize: this.pageSize
        })
        if (res.code === 200) {
          this.noticeList = res.data.list
          this.total = res.data.total
        }
      } catch (error) {
        console.error('获取公告列表失败:', error)
      }
      this.loading = false
    },

    // 处理新增
    handleAdd() {
      this.dialogTitle = '新增公告'
      this.noticeForm = {
        id: null,
        title: '',
        content: ''
      }
      this.dialogVisible = true
    },

    // 处理编辑
    handleEdit(row) {
      this.dialogTitle = '编辑公告'
      this.noticeForm = { ...row }
      this.dialogVisible = true
    },

    // 处理删除
    handleDelete(row) {
      this.$confirm('确认删除该公告?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const res = await deleteNotice({ id: row.id })
          if (res.code === 200) {
            this.$message.success('删除成功')
            this.getList()
          }
        } catch (error) {
          console.error('删除公告失败:', error)
        }
      }).catch(() => {})
    },

    // 提交表单
    submitForm() {
      this.$refs.noticeForm.validate(async (valid) => {
        if (valid) {
          try {
            const api = this.noticeForm.id ? updateNotice : addNotice
            const res = await api(this.noticeForm)
            if (res.code === 200) {
              this.$message.success(this.noticeForm.id ? '更新成功' : '新增成功')
              this.dialogVisible = false
              this.getList()
            }
          } catch (error) {
            console.error('提交公告失败:', error)
          }
        }
      })
    },

    // 处理分页
    handleSizeChange(val) {
      this.pageSize = val
      this.getList()
    },
    handleCurrentChange(val) {
      this.pageNum = val
      this.getList()
    },

    async checkPermission() {
      try {
        await this.$http.post('/api/notices/check-permission');
      } catch (error) {
        // 如果返回403，会被request.js中的拦截器捕获并跳转到403页面
        console.error('权限检查失败:', error);
      }
    }
  }
}
</script>

<style scoped>
.notice-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.content-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style> 