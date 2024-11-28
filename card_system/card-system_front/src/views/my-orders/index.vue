<template>
  <div class="app-container">
    <el-card>
      <div class="filter-container">
        <el-button type="primary" @click="handleRefresh">刷新</el-button>
      </div>

      <el-table
        v-loading="listLoading"
        :data="orderList"
        element-loading-text="加载中..."
        border
        fit
        highlight-current-row
      >
        <el-table-column label="订单号" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.order_no }}</span>
          </template>
        </el-table-column>

        <el-table-column label="充值积分" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.points }}</span>
          </template>
        </el-table-column>

        <el-table-column label="支付金额" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.amount }}元</span>
          </template>
        </el-table-column>

        <el-table-column label="订单状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.create_time }}</span>
          </template>
        </el-table-column>

        <el-table-column label="支付时间" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.pay_time || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="listQuery.pageNum"
        :limit.sync="listQuery.pageSize"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script>
import { getMyOrders } from '@/api/order'
import Pagination from '@/components/Pagination'

export default {
  name: 'MyOrders',
  components: { Pagination },
  data() {
    return {
      orderList: [],
      total: 0,
      listLoading: false,
      listQuery: {
        pageNum: 1,
        pageSize: 10
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async getList() {
      this.listLoading = true
      try {
        const { data } = await getMyOrders(this.listQuery)
        this.orderList = data.list
        this.total = data.total
      } catch (error) {
        console.error('获取订单列表失败:', error)
      }
      this.listLoading = false
    },
    handleRefresh() {
      this.getList()
    },
    getStatusType(status) {
      const statusMap = {
        pending: 'warning',
        paid: 'success',
        cancelled: 'danger'
      }
      return statusMap[status] || 'info'
    },
    getStatusText(status) {
      const statusMap = {
        pending: '待支付',
        paid: '已支付',
        cancelled: '已取消'
      }
      return statusMap[status] || status
    }
  }
}
</script> 