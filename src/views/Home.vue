<script setup lang="ts">
import HelloWorld from '../components/HelloWorld.vue'
import { onMounted } from 'vue'

// 声明layui的window扩展
declare global {
  interface Window {
    layui: any;
  }
}

onMounted(() => {
  // 初始化layui
  if (window.layui) {
    window.layui.use(['element'], function () {
      var element = window.layui.element;
      // 重新渲染元素
      element.render();
    });
  }
})
</script>

<template>
  <div class="main-container">
    <!-- 主体内容 -->
    <main class="main-content">
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" class="logo" alt="Vite logo" />
        </a>
        <a href="https://vuejs.org/" target="_blank">
          <img src="../assets/vue.svg" class="logo vue" alt="Vue logo" />
        </a>
      </div>
      <HelloWorld msg="Vite + Vue" />
    </main>

    <!-- Footer部分 -->
    <footer class="layui-footer footer-container">
      <div class="layui-tab" lay-filter="footerTab">
        <ul class="layui-tab-title">
          <li class="layui-this">{{ $t('class') }}</li>
        </ul>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-top: 60px; /* 为固定头部留出空间 */
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.footer-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50px;
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.layui-tab {
  width: 100%;
}

.layui-tab-title {
  border-bottom: none;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>