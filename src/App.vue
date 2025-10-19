<script setup lang="ts">
// 从本地引入layui
import 'layui/dist/css/layui.css'
import Header from './components/Header.vue'
</script>

<template>
  <!-- 固定的Header组件 -->
  <Header />
  
  <!-- 路由视图 -->
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style scoped>
/* 页面淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>