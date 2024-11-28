<template>
  <div class="my-orders">
    <div class="header">
      <h2>我的订单</h2>
    </div>

    <!-- 订单列表 -->
    <el-table
      :data="orderList"
      style="width: 100%"
      border
      v-loading="loading"
    >
      <el-table-column
        prop="order_no"
        label="订单号"
        width="180">
      </el-table-column>
      
      <el-table-column
        prop="points"
        label="充值积分"
        width="120">
      </el-table-column>
      
      <el-table-column
        prop="amount"
        label="支付金额"
        width="120">
        <template slot-scope="scope">
          ¥{{ scope.row.amount }}
        </template>
      </el-table-column>
      
      <el-table-column
        prop="status"
        label="订单状态"
        width="120">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column
        prop="create_time"
        label="创建时间"
        width="180">
      </el-table-column>
      
      <el-table-column
        prop="pay_time"
        label="支付时间"
        width="180">
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pageNum"
        :page-sizes="[5, 10, 20, 50]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total">
      </el-pagination>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'MyOrders',
  data() {
    return {
      loading: false,
      orderList: [],
      pageNum: 1,
      pageSize: 10,
      total: 0
    }
  },
  created() {
    this.getOrderList()
  },
  methods: {
    // 获取订单列表
    async getOrderList() {
      this.loading = true
      try {
        const res = await request({
          url: '/orders/my-list',
          method: 'post',
          data: {
            pageNum: this.pageNum,
            pageSize: this.pageSize
          }
        })
        
        if (res.code === 200) {
          this.orderList = res.data.list
          this.total = res.data.total
        }
      } catch (error) {
        console.error('获取订单列表失败:', error)
        this.$message.error('获取订单列表失败')
      } finally {
        this.loading = false
      }
    },

    // 获取状态标签类型
    getStatusType(status) {
      const types = {
        pending: 'warning',
        paid: 'success',
        cancelled: 'info'
      }
      return types[status] || 'info'
    },

    // 获取状态显示文本
    getStatusText(status) {
      const texts = {
        pending: '待支付',
        paid: '已支付',
        cancelled: '已取消'
      }
      return texts[status] || status
    },

    // 处理每页显示数量变化
    handleSizeChange(val) {
      this.pageSize = val
      this.pageNum = 1
      this.getOrderList()
    },

    // 处理页码变化
    handleCurrentChange(val) {
      this.pageNum = val
      this.getOrderList()
    }
  }
}
</script>

<style scoped>
.my-orders {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style> 