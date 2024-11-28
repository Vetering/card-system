<template>
  <div class="forbidden-container">
    <h1>403</h1>
    <h2>抱歉，您无权访问此页面</h2>
    <el-button type="primary" @click="goBack">返回首页</el-button>
  </div>
</template>

<script>
export default {
  name: 'Forbidden',
  methods: {
    goBack() {
      this.$router.push('/home')
    }
  }
}
</script>

<style scoped>
.forbidden-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

h1 {
  font-size: 72px;
  color: #409eff;
  margin-bottom: 20px;
}

h2 {
  color: #606266;
  margin-bottom: 30px;
}
</style> 