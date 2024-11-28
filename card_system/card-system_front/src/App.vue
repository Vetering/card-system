<template>
  <router-view></router-view>
</template>

<script>
export default {
  name: 'App',
  watch: {
    $route: {
      handler(to) {
        document.title = to.meta.title ? `${to.meta.title} - 卡密管理系统` : '卡密管理系统'
      },
      immediate: true
    }
  }
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

#app {
  height: 100%;
}
</style>
