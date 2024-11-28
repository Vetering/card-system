<template>
  <el-menu
    :default-active="activeIndex"
    class="el-menu-vertical"
    @select="handleSelect"
    :collapse="isCollapse"
  >
    <el-menu-item index="/cards">
      <i class="el-icon-document"></i>
      <span slot="title">卡密管理</span>
    </el-menu-item>

    <!-- 添加我的订单菜单项 -->
    <el-menu-item index="/my-orders">
      <i class="el-icon-shopping-cart-2"></i>
      <span slot="title">我的订单</span>
    </el-menu-item>

    <el-menu-item index="/users" v-if="isRoot">
      <i class="el-icon-user"></i>
      <span slot="title">用户管理</span>
    </el-menu-item>

    <el-menu-item index="/profile">
      <i class="el-icon-setting"></i>
      <span slot="title">个人信息</span>
    </el-menu-item>
  </el-menu>
</template> 