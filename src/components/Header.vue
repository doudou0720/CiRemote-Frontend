<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

// 声明layui的window扩展
declare global {
  interface Window {
    layui: any;
  }
}

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// 当前选中的导航项
const activeNav = ref('')

// 滑动指示器的位置和宽度
const indicatorStyle = ref({
  left: '0px',
  width: '0px'
})

// 获取导航项的DOM元素
const navItems = ref<HTMLElement[]>([])

// 在模板中为每个导航项分配不同的ref
const setNavItemRef = (el: HTMLElement | null, index: number) => {
  if (el && !navItems.value.includes(el)) {
    navItems.value[index] = el
  }
}

// 获取当前激活项的索引
// 该函数根据当前活动导航项返回对应的数组索引位置
// home对应索引0，about对应索引1，settings对应索引2
// 如果没有匹配项则返回-1表示未找到
const getActiveIndex = () => {
  switch (activeNav.value) {
    case 'home': return 0
    case 'about': return 1
    case 'settings': return 2
    default: return -1
  }
}

const updateActiveNav = (path: string) => {
  if (path === '/') {
    activeNav.value = 'home'
  } else if (path === '/about') {
    activeNav.value = 'about'
  } else if (path === '/settings') {
    activeNav.value = 'settings'
  } else {
    activeNav.value = ''
  }
  
  // 在下次DOM更新后移动指示器
  nextTick(() => {
    moveIndicator()
  })
}

// 移动滑动指示器到选中项下方
const moveIndicator = () => {
  const activeIndex = getActiveIndex()
  if (activeIndex >= 0 && navItems.value && navItems.value[activeIndex]) {
    const activeItem = navItems.value[activeIndex]
    const { offsetLeft, offsetWidth } = activeItem
    indicatorStyle.value = {
      left: `${offsetLeft}px`,
      width: `${offsetWidth}px`
    }
  } else if (activeIndex >= 0) {
    // 处理移动端可能的延迟渲染问题
    setTimeout(() => {
      if (navItems.value && navItems.value[activeIndex]) {
        const activeItem = navItems.value[activeIndex]
        const { offsetLeft, offsetWidth } = activeItem
        indicatorStyle.value = {
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`
        }
      }
    }, 100)
  }
}

const navigateTo = (path: string, nav: string) => {
  activeNav.value = nav
  router.push(path)
  
  // 在下次DOM更新后移动指示器
  nextTick(() => {
    moveIndicator()
  })
}

// 监听路由变化，更新选中的导航项
watch(() => route.path, (newPath) => {
  updateActiveNav(newPath)
}, { immediate: true })

onMounted(() => {
  // 初始化layui
  if (window.layui) {
    window.layui.use(['element'], function () {
      var element = window.layui.element;
      // 重新渲染元素
      element.render();
    });
  }
  
  // 初始化指示器位置
  moveIndicator()
})
</script>

<template>
  <header class="layui-header app-header">
    <div class="layui-layout-right header-icons">
      <span 
        :ref="(el) => setNavItemRef(el as HTMLElement, 0)"
        class="layui-nav-item" 
        :class="{ 'active': activeNav === 'home' }"
        @click="navigateTo('/', 'home')">
        <i 
          class="layui-icon layui-icon-home icon-button" 
          :title="t('home')">
        </i>
        <span class="nav-text">{{ t('home') }}</span>
      </span>
      <span 
        :ref="(el) => setNavItemRef(el as HTMLElement, 1)"
        class="layui-nav-item" 
        :class="{ 'active': activeNav === 'about' }"
        @click="navigateTo('/about', 'about')">
        <i 
          class="layui-icon layui-icon-about icon-button" 
          :title="t('about')">
        </i>
        <span class="nav-text">{{ t('about') }}</span>
      </span>
      <span 
        :ref="(el) => setNavItemRef(el as HTMLElement, 2)"
        class="layui-nav-item" 
        :class="{ 'active': activeNav === 'settings' }"
        @click="navigateTo('/settings', 'settings')">
        <i class="layui-icon layui-icon-set icon-button" :title="t('settings')"></i>
        <span class="nav-text">{{ t('settings') }}</span>
      </span>
      
      <!-- 滑动指示器 -->
      <div class="slide-indicator" :style="indicatorStyle"></div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 999;
  padding: 0 10px;
  background-color: var(--header-background) !important;
  height: 60px;
}

.header-icons {
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
  justify-content: flex-end;
}

.layui-nav-item {
  display: flex;
  align-items: center;
  padding: 0 10px;
  cursor: pointer;
  position: relative;
  transition: all 0.5s ease;
  height: 100%;
}

.layui-nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.layui-nav-item.active {
  background-color: rgba(0, 0, 0, 0.2);
  font-weight: bold;
}

.icon-button {
  font-size: 20px;
  color: white;
  margin-right: 8px;
}

.nav-text {
  color: white;
  font-size: 16px;
}

/* 滑动指示器 - 先快后慢的动画效果 */
.slide-indicator {
  position: absolute;
  bottom: 0;
  height: 3px;
  background-color: white;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 响应式设计 - 当屏幕较小时只显示图标 */
@media (max-width: 768px) {
  .nav-text {
    display: none;
  }
  
  .layui-nav-item {
    padding: 0 5px;
  }
  
  .icon-button {
    margin-right: 0;
  }
}

/* 超小屏幕设备进一步优化 */
@media (max-width: 480px) {
  .app-header {
    padding: 0 5px;
  }
  
  .layui-nav-item {
    padding: 0 3px;
  }
}

/* 为曲面屏右侧留出安全边距 */
.header-icons::after {
  content: '';
  display: block;
  min-width: 20px; /* 为曲面屏右侧留出空隙 */
}

/* 在超小屏幕上减少右侧空隙 */
@media (max-width: 480px) {
  .header-icons::after {
    min-width: 12px;
  }
}
</style>