<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HelloWorld from '@/components/HelloWorld.vue'

// 定义响应式数据
const count = ref(0)
const message = ref('Hello Vue 3 + TypeScript + Vite')

// 定义函数
const increment = () => {
  count.value++
}

// 定义异步函数
const fetchData = async (): Promise<void> => {
  try {
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.value = 'Data loaded successfully!'
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }
}

// 生命周期钩子
onMounted(() => {
  console.log('Home component mounted')
})

// 导出需要在模板中使用的变量和函数
defineExpose({
  count,
  message,
  increment,
  fetchData
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