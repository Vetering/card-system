<template>
  <div class="order-manager">
    <el-card class="table-card">
      <div slot="header" class="card-header">
        <span>订单管理</span>
      </div>
      
      <el-table :data="orders" border stripe>
        <el-table-column prop="order_no" label="订单号" width="120"></el-table-column>
        <el-table-column prop="username" label="用户名" width="120"></el-table-column>
        <el-table-column prop="role" label="用户类型" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.role === 'root' ? 'danger' : 'primary'">
              {{ scope.row.role === 'root' ? '管理员' : '代理商' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="充值积分" width="100"></el-table-column>
        <el-table-column prop="amount" label="支付金额" width="100">
          <template slot-scope="scope">
            {{ scope.row.amount }}元
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="pay_time" label="支付时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.pay_time ? formatDateTime(scope.row.pay_time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template slot-scope="scope">
            <el-button 
              type="success" 
              size="mini"
              @click="handleConfirmPayment(scope.row)"
              v-if="scope.row.status === 'pending'"
            >确认支付</el-button>
            <el-button 
              type="danger" 
              size="mini"
              @click="handleCancelOrder(scope.row)"
              v-if="scope.row.status === 'pending'"
            >取消订单</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; text-align: center;">
      </el-pagination>
    </el-card>
  </div>
</template>

<script>
import request from '../utils/request'

export default {
  name: 'OrderManager',
  data() {
    return {
      orders: [],
      pageNum: 1,
      pageSize: 10,
      total: 0
    }
  },
  methods: {
    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    getStatusType(status) {
      const types = {
        pending: 'warning',
        paid: 'success',
        cancelled: 'info'
      }
      return types[status] || 'info'
    },

    getStatusText(status) {
      const texts = {
        pending: '待支付',
        paid: '已支付',
        cancelled: '已取消'
      }
      return texts[status] || status
    },

    async loadOrders() {
      try {
        const response = await request({
          url: '/api/orders/list',
          method: 'post',
          data: {
            pageNum: this.pageNum,
            pageSize: this.pageSize
          }
        })

        if (response.code === 200) {
          this.orders = response.data.list
          this.total = response.data.total
        }
      } catch (error) {
        this.$message.error('加载订单列表失败')
        console.error('加载订单列表失败:', error)
      }
    },

    async handleConfirmPayment(order) {
      try {
        await this.$confirm('确认该订单已支付?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await request({
          url: '/api/orders/update-status',
          method: 'post',
          data: {
            orderNo: order.order_no,
            status: 'paid'
          }
        })

        if (response.code === 200) {
          this.$message.success('订单状态更新成功')
          this.loadOrders()
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('更新订单状态失败')
          console.error('更新订单状态失败:', error)
        }
      }
    },

    async handleCancelOrder(order) {
      try {
        await this.$confirm('确认取消该订单?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await request({
          url: '/api/orders/update-status',
          method: 'post',
          data: {
            orderNo: order.order_no,
            status: 'cancelled'
          }
        })

        if (response.code === 200) {
          this.$message.success('订单已取消')
          this.loadOrders()
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('取消订单失败')
          console.error('取消订单失败:', error)
        }
      }
    },

    handleCurrentChange(val) {
      this.pageNum = val
      this.loadOrders()
    }
  },
  created() {
    this.loadOrders()
  }
}
</script>

<style scoped>
.order-manager {
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