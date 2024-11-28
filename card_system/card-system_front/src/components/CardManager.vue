<template>
  <div class="card-manager">
    <el-card class="operation-card">
      <div class="operation-bar">
        <div class="left">
          <el-input
            v-model="batchNumber"
            placeholder="请输入生成数量"
            type="number"
            style="width: 200px"
            class="batch-input"
          >
            <template slot="prepend">生成数量</template>
          </el-input>
          <el-button type="primary" icon="el-icon-plus" @click="generateCards">批量生成</el-button>
          <el-button icon="el-icon-plus" @click="generateCard">单个生成</el-button>
          
          <el-popover
            placement="bottom"
            width="400"
            trigger="click"
          >
            <div class="expiry-setting">
              <div class="expiry-title">设置卡密有效期</div>
              <div class="expiry-inputs">
                <div class="input-group">
                  <el-input-number 
                    v-model="expiryTime.years" 
                    :min="0" 
                    :max="10"
                    size="small"
                    controls-position="right"
                    @change="calculateTotalDays"
                  >
                  </el-input-number>
                  <span class="expiry-unit">年</span>
                </div>
                
                <div class="input-group">
                  <el-input-number 
                    v-model="expiryTime.months" 
                    :min="0" 
                    :max="12"
                    size="small"
                    controls-position="right"
                    @change="calculateTotalDays"
                  >
                  </el-input-number>
                  <span class="expiry-unit">月</span>
                </div>
                
                <div class="input-group">
                  <el-input-number 
                    v-model="expiryTime.days" 
                    :min="0" 
                    :max="31"
                    size="small"
                    controls-position="right"
                    @change="calculateTotalDays"
                  >
                  </el-input-number>
                  <span class="expiry-unit">日</span>
                </div>
              </div>
              <div class="expiry-total">
                总计约 {{ totalDays }} 天
              </div>
            </div>
            <el-button 
              slot="reference" 
              type="info" 
              plain
              icon="el-icon-time"
            >
              时效：{{ formatExpiryDisplay() }}
            </el-button>
          </el-popover>
        </div>
        <div class="right">
          <el-button 
            type="primary" 
            icon="el-icon-document-copy"
            @click="batchCopy"
            :disabled="selectedCards.length === 0"
            style="margin-right: 10px"
          >批量复制</el-button>
          <el-button 
            type="danger" 
            icon="el-icon-delete"
            @click="batchDelete"
            :disabled="selectedCards.length === 0"
          >批量删除</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card">
      <div slot="header" class="card-header">
        <span>卡密列表</span>
        <span class="card-count">共 {{ cards.length }} 个卡密</span>
      </div>
      
      <el-table 
        :data="cards" 
        style="width: 100%"
        @selection-change="handleSelectionChange"
        border
        stripe
        highlight-current-row
      >
        <el-table-column
          type="selection"
          width="55">
        </el-table-column>
        <el-table-column prop="cami" label="卡密" min-width="220">
          <template slot-scope="scope">
            <el-tag effect="dark">{{ scope.row.cami }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column 
          prop="creation_time" 
          label="创建时间" 
          width="180"
          :formatter="(row) => formatDateTime(row.creation_time)">
        </el-table-column>
        <el-table-column 
          prop="expiration_time" 
          label="过期时间" 
          width="180"
          :formatter="(row) => formatDateTime(row.expiration_time)">
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-select 
              v-model="scope.row.status" 
              size="mini"
              @change="handleStatusChange(scope.row)"
            >
              <el-option label="有效" value="effective"></el-option>
              <el-option label="已过期" value="expired"></el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="agent_name" label="创建者" width="120"></el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template slot-scope="scope">
            <el-button 
              type="primary" 
              size="mini" 
              icon="el-icon-document-copy"
              @click="copyCard(scope.row)"
            >复制</el-button>
            <el-button 
              type="danger" 
              size="mini" 
              icon="el-icon-delete"
              @click="deleteCard(scope.row)"
            >删除</el-button>
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
import CryptoJS from 'crypto-js'  // 需要先安装: npm install crypto-js

export default {
  data() {
    return {
      cards: [],
      selectedCards: [],
      batchNumber: 1,
      expiryTime: {
        years: 0,
        months: 0,
        days: 14 // 默认7天
      },
      totalDays: 7, // 默认7天
      pageNum: 1,
      pageSize: 5,
      total: 0
    }
  },
  methods: {
    // 添加时间格式化方法
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

    // 修改生成唯一卡密的方法
    generateUniqueCode() {
      const timestamp = Date.now().toString(36)
      const randomStr = Math.random().toString(36).substr(2, 9)
      const originalCode = `CARD-${timestamp}-${randomStr}`.toUpperCase()
      
      // 第一次 MD5 hash
      const firstHash = CryptoJS.MD5(originalCode).toString()
      // 第二次 MD5 hash，使用第一次的结果
      const secondHash = CryptoJS.MD5(firstHash).toString()
      
      // 截取前 16 位并转大写
      const shortHash = secondHash.substring(0, 16).toUpperCase()
      
      // 按照 XXXX-XXXX-XXXX-XXXX 格式输出
      return shortHash.replace(/(.{4})/g, '$1-').slice(0, -1)
    },

    // 使用自定义的双重 hash 生成方法
    generateShortHash() {
      const chars = '0123456789ABCDEF'  // 只使用16进制字符
      const timestamp = Date.now().toString(36)
      const randomStr = Math.random().toString(36).substr(2, 4)
      
      // 第一次 hash
      let firstHash = ''
      const seed = timestamp + randomStr
      for (let i = 0; i < 32; i++) {
        const charCode = seed.charCodeAt(i % seed.length)
        const nextCharCode = seed.charCodeAt((i + 1) % seed.length)
        const index = ((charCode * 31 + nextCharCode) + i) % chars.length
        firstHash += chars[index]
      }
      
      // 第二次 hash
      let secondHash = ''
      for (let i = 0; i < 16; i++) {
        const charCode = firstHash.charCodeAt(i)
        const nextCharCode = firstHash.charCodeAt((i + 16) % 32)
        const prevCharCode = firstHash.charCodeAt((i + 31) % 32)
        // 使用三个字符的组合增加复杂度
        const index = ((charCode * 17 + nextCharCode * 13 + prevCharCode * 7) + i) % chars.length
        secondHash += chars[index]
      }
      
      // 按照 XXXX-XXXX-XXXX-XXXX 格式输出
      return secondHash.replace(/(.{4})/g, '$1-').slice(0, -1)
    },

    // 修改 createCardObject 方法，使用新的生成方法
    createCardObject() {
      const now = new Date()
      const expires = new Date(now)
      
      // 添加年月日
      expires.setFullYear(expires.getFullYear() + this.expiryTime.years)
      expires.setMonth(expires.getMonth() + this.expiryTime.months)
      expires.setDate(expires.getDate() + this.expiryTime.days)
      
      // 使用新的生成方法
      // const hashedCami = this.generateUniqueCode() // 使用双重 MD5 方式
      const hashedCami = this.generateShortHash() // 使用自定义双重 hash 方式
      
      return {
        cami: hashedCami,
        status: 'effective',
        creation_time: this.formatDateTime(now),
        expiration_time: this.formatDateTime(expires)
      }
    },

    // 单个生成
    async generateCard() {
      try {
        const cardData = this.createCardObject()
        
        const response = await request({
          url: '/api/cards/create',
          method: 'post',
          data: cardData
        })

        if (response.code === 200) {
          this.loadCards() // 重新加载卡密列表
          this.$message.success('卡密生成成功')
        }
      } catch (error) {
        this.$message.error('卡密生成失败')
        console.error('生成卡密失败:', error)
      }
    },

    // 批量生成
    async generateCards() {
      const num = parseInt(this.batchNumber)
      if (num <= 0 || num > 100) {
        this.$message.error('请输入1-100之间的数量')
        return
      }

      try {
        const cardsData = Array(num).fill().map(() => this.createCardObject())
        
        const response = await request({
          url: '/api/cards/batch-create',
          method: 'post',
          data: { cards: cardsData }
        })

        if (response.code === 200) {
          this.loadCards() // 重新加载卡密列表
          const { deductedPoints, remainingPoints } = response.data
          this.$message.success(
            `成功生成 ${num} 个卡密，消耗 ${deductedPoints} 积分，剩余 ${remainingPoints} 积分`
          )
        }
      } catch (error) {
        if (error.response?.data?.code === 400) {
          this.$message.error(error.response.data.msg)
        } else {
          this.$message.error('批量生成卡密失败')
          console.error('批量生成卡密失败:', error)
        }
      }
    },

    // 复制卡密
    copyCard(card) {
      const input = document.createElement('input')
      input.value = card.cami
      document.body.appendChild(input)
      input.select()
      
      try {
        document.execCommand('copy')
        this.$message({
          message: '卡密已复制到剪贴板',
          type: 'success'
        })
      } catch (err) {
        this.$message.error('复制失败，请手动复制')
        console.error('复制失败:', err)
      } finally {
        document.body.removeChild(input)
      }
    },

    // 删除单个卡密
    async deleteCard(card) {
      try {
        await this.$confirm('确认删除该卡密?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await request({
          url: '/api/cards/delete',
          method: 'post',
          data: { id: card.id }
        })

        if (response.code === 200) {
          this.loadCards() // 重新加载卡密列表
          this.$message.success('删除成功')
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(error.msg || '删除失败')
          console.error('删除卡密失败:', error)
        }
      }
    },

    // 批量删除
    async batchDelete() {
      if (this.selectedCards.length === 0) return

      try {
        await this.$confirm(`确认删除选中的 ${this.selectedCards.length} 个卡密?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await request({
          url: '/api/cards/batch-delete',
          method: 'post',
          data: { ids: this.selectedCards.map(card => card.id) }
        })

        if (response.code === 200) {
          this.loadCards() // 重新加载卡密列表
          this.$message.success('批量删除成功')
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error(error.msg || '批量删除失败')
          console.error('批量删除失败:', error)
        }
      }
    },

    // 表格选择变化
    handleSelectionChange(val) {
      this.selectedCards = val
    },

    // 批量复制卡密
    batchCopy() {
      if (this.selectedCards.length === 0) return
      
      const cardCodes = this.selectedCards.map(card => card.cami).join('\n')
      const input = document.createElement('textarea')
      input.value = cardCodes
      document.body.appendChild(input)
      input.select()
      
      try {
        document.execCommand('copy')
        this.$message({
          message: `成功复制 ${this.selectedCards.length} 个卡密`,
          type: 'success'
        })
      } catch (err) {
        this.$message.error('复制失败，请手动复制')
        console.error('复制失败:', err)
      } finally {
        document.body.removeChild(input)
      }
    },

    // 加载卡密列表
    async loadCards() {
      try {
        const response = await request({
          url: '/api/cards/list',
          method: 'post',
          data: {
            pageNum: this.pageNum,
            pageSize: this.pageSize
          }
        })

        if (response.code === 200) {
          this.cards = response.data.list.map(card => ({
            ...card,
            creation_time: this.formatDateTime(card.creation_time),
            expiration_time: this.formatDateTime(card.expiration_time)
          }))
          this.total = response.data.total
        }
      } catch (error) {
        this.$message.error('加载卡密列表失败')
        console.error('加载卡密列表失败:', error)
      }
    },

    // 计算总天数
    calculateTotalDays() {
      const { years, months, days } = this.expiryTime
      this.totalDays = years * 365 + months * 30 + days
    },

    // 格式化显示时效
    formatExpiryDisplay() {
      const { years, months, days } = this.expiryTime
      const parts = []
      if (years > 0) parts.push(`${years}年`)
      if (months > 0) parts.push(`${months}月`)
      if (days > 0) parts.push(`${days}日`)
      return parts.length > 0 ? parts.join('') : '7日'
    },

    // 添加分页改变事件处理方法
    handleCurrentChange(val) {
      this.pageNum = val
      this.loadCards()
    },

    // 处理状态变更
    async handleStatusChange(card) {
      try {
        const response = await request({
          url: '/api/cards/update-status',
          method: 'post',
          data: {
            id: card.id,
            status: card.status
          }
        })

        if (response.code === 200) {
          this.$message.success('状态更新成功')
          this.loadCards() // 重新加载列表
        }
      } catch (error) {
        this.$message.error('状态更新失败')
        console.error('更新卡密状态失败:', error)
        // 恢复原状态
        this.loadCards()
      }
    }
  },
  
  // 组件创建时加载卡密列表
  created() {
    this.loadCards()
  }
}
</script>

<style scoped>
.card-manager {
  min-height: calc(100vh - 120px);
}

.operation-card {
  margin-bottom: 20px;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left {
  display: flex;
  gap: 15px;
  align-items: center;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-count {
  font-size: 14px;
  color: #909399;
}

:deep(.el-table) {
  margin-top: 10px;
}

:deep(.el-tag) {
  margin: 0 2px;
}

.el-button + .el-button {
  margin-left: 10px;
}

.batch-input :deep(.el-input__inner) {
  text-align: center;
  padding-right: 15px;
}

.batch-input :deep(.el-input-group__prepend) {
  min-width: 80px;
  justify-content: center;
}

.expiry-setting {
  padding: 15px;
  background-color: #fff;
  border-radius: 4px;
}

.expiry-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 20px;
  font-weight: bold;
}

.expiry-inputs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expiry-unit {
  font-size: 14px;
  color: #606266;
  width: 20px;
}

.expiry-total {
  font-size: 13px;
  color: #909399;
  text-align: right;
  padding-right: 10px;
}

:deep(.el-input-number) {
  width: 100px !important;
}

:deep(.el-input-number .el-input__inner) {
  padding-right: 30px !important;
  text-align: center;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  width: 24px !important;
  right: 0;
}

:deep(.el-input-number__decrease) {
  border-radius: 0 0 4px 0;
}

:deep(.el-input-number__increase) {
  border-radius: 0 4px 0 0;
}
</style> 