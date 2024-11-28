<template>
  <div class="valid-code" @click="refreshCode">
    <canvas id="canvas" width="100" height="36"></canvas>
  </div>
</template>

<script>
export default {
  name: "ValidCode",
  data() {
    return {
      code: ''
    }
  },
  mounted() {
    this.drawCode()
  },
  methods: {
    // 生成随机验证码
    generateCode() {
      let code = ''
      const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    },
    // 绘制验证码
    drawCode() {
      const canvas = document.getElementById('canvas')
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      this.code = this.generateCode()
      this.$emit('update:value', this.code)
      
      ctx.font = '24px Arial'
      ctx.fillStyle = '#333'
      ctx.textBaseline = 'middle'
      
      // 随机生成字符位置
      for (let i = 0; i < this.code.length; i++) {
        const x = 10 + i * 20
        const y = canvas.height / 2 + Math.random() * 8 - 4
        ctx.fillText(this.code[i], x, y)
      }
      
      // 添加干扰线
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = this.randomColor(40, 180)
        ctx.beginPath()
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
        ctx.stroke()
      }
    },
    // 生成随机颜色
    randomColor(min, max) {
      const r = Math.floor(Math.random() * (max - min) + min)
      const g = Math.floor(Math.random() * (max - min) + min)
      const b = Math.floor(Math.random() * (max - min) + min)
      return `rgb(${r},${g},${b})`
    },
    // 刷新验证码
    refreshCode() {
      this.drawCode()
    }
  }
}
</script>

<style scoped>
.valid-code {
  cursor: pointer;
  height: 100%;
}
#canvas {
  width: 100%;
  height: 100%;
}
</style> 