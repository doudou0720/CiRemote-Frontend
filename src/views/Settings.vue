<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

// 声明layui的window扩展
declare global {
  interface Window {
    layui: any;
  }
}

const { t, locale } = useI18n()

// 主题设置
const theme = ref('light')
const themes = [
  { value: 'light', label: t('light') },
  { value: 'dark', label: t('dark') }
]

// 语言设置
const currentLanguage = ref(locale.value)
const languages = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' }
]

// 保存状态
const saveStatus = ref({
  language: false,
  theme: false
})

// 当前激活的主设置项
const activeMainSetting = ref('web-settings')

// 当前激活的子设置项
const activeSubSetting = ref('language')

// 子设置项引用
const subSettingRefs = ref<{[key: string]: HTMLElement | null}>({})

// 保存设置到localStorage
const saveSettings = (field: string) => {
  if (window.layui) {
    try {
      const settings = window.layui.data('ciremote_settings', {
        key: 'user_settings'
      }) || {}
      
      settings[field] = field === 'language' ? currentLanguage.value : theme.value
      
      window.layui.data('ciremote_settings', {
        key: 'user_settings',
        value: settings
      })
      
      // 设置保存成功状态
      saveStatus.value[field as keyof typeof saveStatus.value] = true
      setTimeout(() => {
        saveStatus.value[field as keyof typeof saveStatus.value] = false
      }, 2000)
      
      console.log('设置已保存:', field, settings[field])
    } catch (e: any) {
      console.error('保存设置失败:', e)
      // 使用layui弹窗显示错误信息
      window.layui.use('layer', function() {
        var layer = window.layui.layer;
        layer.msg('设置保存失败: ' + (e.message || e.toString()), {
          icon: 2, // 错误图标
          time: 3000 // 3秒后自动关闭
        });
      });
    }
  }
}

// 从localStorage加载设置
const loadSettings = () => {
  if (window.layui) {
    try {
      const settings = window.layui.data('ciremote_settings', {
        key: 'user_settings'
      })
      
      if (settings) {
        if (settings.language) {
          currentLanguage.value = settings.language
          locale.value = settings.language
        }
        
        if (settings.theme) {
          theme.value = settings.theme
        }
      }
      console.log('设置已加载:', settings)
    } catch (e: any) {
      console.error('加载设置失败:', e)
      // 使用layui弹窗显示错误信息
      window.layui.use('layer', function() {
        var layer = window.layui.layer;
        layer.msg('设置加载失败: ' + (e.message || e.toString()), {
          icon: 2, // 错误图标
          time: 3000 // 3秒后自动关闭
        });
      });
    }
  }
}

// 应用主题
const applyTheme = (themeValue: string) => {
  const body = document.body
  body.classList.remove('dark-theme', 'light-theme')
  body.classList.add(`${themeValue}-theme`)
}

// 切换主设置项
const switchMainSetting = (setting: string) => {
  activeMainSetting.value = setting
  // 切换主设置项时，默认选中第一个子设置项
  if (setting === 'web-settings') {
    activeSubSetting.value = 'language'
  } else if (setting === 'device-management') {
    activeSubSetting.value = 'device-list'
  }
}

// 切换子设置项
const switchSubSetting = (setting: string) => {
  activeSubSetting.value = setting
  scrollToSection(setting)
}

// 滚动到指定区域
const scrollToSection = (sectionId: string) => {
  nextTick(() => {
    const element = subSettingRefs.value[sectionId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

// 监听滚动事件，更新当前激活的子设置项
const handleScroll = () => {
  const sections = Object.keys(subSettingRefs.value)
  const container = document.querySelector('.settings-content-container')
  
  if (!container) return
  
  const scrollPosition = container.scrollTop + 100 // 添加偏移量
  
  for (let i = sections.length - 1; i >= 0; i--) {
    const sectionId = sections[i]
    const element = subSettingRefs.value[sectionId]
    
    if (element) {
      const offsetTop = element.offsetTop
      if (scrollPosition >= offsetTop) {
        activeSubSetting.value = sectionId
        break
      }
    }
  }
}

// 监听语言变化
watch(currentLanguage, (newLocale) => {
  locale.value = newLocale
  // 更新主题选项的标签
  themes[0].label = t('light')
  themes[1].label = t('dark')
  // 保存到localStorage
  saveSettings('language')
}, { immediate: true })

// 监听主题变化
watch(theme, (newTheme) => {
  // 应用主题
  applyTheme(newTheme)
  // 保存到localStorage
  saveSettings('theme')
}, { immediate: true })

onMounted(() => {
  // 初始化layui
  if (window.layui) {
    window.layui.use(['element', 'data', 'layer'], function () {
      var element = window.layui.element;
      // 重新渲染元素
      element.render();
    });
    
    // 加载保存的设置
    loadSettings()
  }
  
  // 添加滚动事件监听
  const container = document.querySelector('.settings-content-container')
  if (container) {
    container.addEventListener('scroll', handleScroll)
  }
  
  // 应用当前主题
  applyTheme(theme.value)
})
</script>

<template>
  <div class="layui-layout layui-layout-admin">
    <div class="layui-side layui-bg-black">
      <div class="layui-side-scroll">
        <!-- 左侧导航区域 -->
        <ul class="layui-nav layui-nav-tree" lay-filter="setting-nav">
          <li class="layui-nav-item" :class="{ 'layui-nav-itemed': activeMainSetting === 'web-settings' }">
            <a href="javascript:;" @click="switchMainSetting('web-settings')">{{ t('webSettings') }}</a>
            <transition name="slide-fade" mode="out-in">
              <dl class="layui-nav-child" v-if="activeMainSetting === 'web-settings'" key="web-settings">
                <dd :class="{ 'layui-this': activeSubSetting === 'language' }">
                  <a href="javascript:;" @click="switchSubSetting('language')">{{ t('language') }}</a>
                </dd>
                <dd :class="{ 'layui-this': activeSubSetting === 'theme' }">
                  <a href="javascript:;" @click="switchSubSetting('theme')">{{ t('theme') }}</a>
                </dd>
              </dl>
            </transition>
          </li>
          <li class="layui-nav-item" :class="{ 'layui-nav-itemed': activeMainSetting === 'device-management' }">
            <a href="javascript:;" @click="switchMainSetting('device-management')">{{ t('deviceManagement') }}</a>
            <transition name="slide-fade" mode="out-in">
              <dl class="layui-nav-child" v-if="activeMainSetting === 'device-management'" key="device-management">
                <dd :class="{ 'layui-this': activeSubSetting === 'device-list' }">
                  <a href="javascript:;" @click="switchSubSetting('device-list')">{{ t('deviceList') }}</a>
                </dd>
                <dd :class="{ 'layui-this': activeSubSetting === 'device-config' }">
                  <a href="javascript:;" @click="switchSubSetting('device-config')">{{ t('deviceConfig') }}</a>
                </dd>
              </dl>
            </transition>
          </li>
        </ul>
      </div>
    </div>

    <div class="layui-body">
      <!-- 内容主体区域 -->
      <div class="settings-content">
        <h1>{{ t('settings') }}</h1>
        
        <transition name="fade" mode="out-in">
          <div class="settings-content-container" v-if="activeMainSetting === 'web-settings'" key="web-settings-content">
            <!-- 语言设置部分 -->
            <div ref="el => subSettingRefs['language'] = el" class="settings-section">
              <h2>{{ t('languageSettings') }}</h2>
              <div class="setting-item">
                <label>{{ t('selectLanguage') }}:</label>
                <select v-model="currentLanguage" class="layui-select">
                  <option v-for="lang in languages" :key="lang.value" :value="lang.value">
                    {{ lang.label }}
                  </option>
                </select>
                <i v-if="saveStatus.language" class="layui-icon layui-icon-ok success-icon"></i>
              </div>
            </div>
            
            <!-- 主题设置部分 -->
            <div ref="el => subSettingRefs['theme'] = el" class="settings-section">
              <h2>{{ t('themeSettings') }}</h2>
              <div class="setting-item">
                <label>{{ t('selectTheme') }}:</label>
                <select v-model="theme" class="layui-select">
                  <option v-for="th in themes" :key="th.value" :value="th.value">
                    {{ th.label }}
                  </option>
                </select>
                <i v-if="saveStatus.theme" class="layui-icon layui-icon-ok success-icon"></i>
              </div>
            </div>
          </div>
        </transition>
        
        <transition name="fade" mode="out-in">
          <div class="settings-content-container" v-if="activeMainSetting === 'device-management'" key="device-management-content">
            <!-- 设备列表部分 -->
            <div ref="el => subSettingRefs['device-list'] = el" class="settings-section">
              <h2>{{ t('deviceList') }}</h2>
              <p>这里是设备列表的内容...</p>
              <div class="device-list">
                <div class="device-item" v-for="i in 5" :key="i">
                  <div class="device-name">设备 {{ i }}</div>
                  <div class="device-status">{{ t('online') }}</div>
                </div>
              </div>
            </div>
            
            <!-- 设备配置部分 -->
            <div ref="el => subSettingRefs['device-config'] = el" class="settings-section">
              <h2>{{ t('deviceConfigSettings') }}</h2>
              <p>这里是设备配置的内容...</p>
              <div class="setting-item">
                <label>{{ t('configItem1') }}:</label>
                <input type="text" class="layui-input" :placeholder="t('enterConfig')">
              </div>
              <div class="setting-item">
                <label>{{ t('configItem2') }}:</label>
                <input type="text" class="layui-input" :placeholder="t('enterConfig')">
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 定义主题变量 */
:root {
  --text-color: #333;
  --border-color: #eee;
  --card-background: #fff;
}

.light-theme {
  --text-color: #333;
  --border-color: #eee;
  --card-background: #fff;
}

.dark-theme {
  --text-color: #e2e2e2;
  --border-color: #444;
  --card-background: #1a1a1a;
}

.settings-content {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.settings-content-container {
  flex: 1;
  overflow-y: auto;
  background: var(--card-background);
  border-radius: 4px;
  padding: 20px;
  color: var(--text-color);
}

.settings-section {
  margin-bottom: 30px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section h2 {
  margin-top: 0;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
  color: var(--text-color);
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.setting-item label {
  width: 120px;
  margin-right: 15px;
  color: var(--text-color);
}

.layui-select, .layui-input {
  height: 38px;
  line-height: 38px;
  border: 1px solid var(--border-color);
  border-radius: 2px;
  padding: 0 10px;
  background: var(--card-background);
  color: var(--text-color);
}

.success-icon {
  margin-left: 10px;
  color: #52c41a;
  font-size: 18px;
}

.device-list {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 10px;
}

.device-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid var(--border-color);
}

.device-item:last-child {
  border-bottom: none;
}

.device-name,
.device-status {
  color: var(--text-color);
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滑动淡入淡出动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.layui-layout-admin .layui-side {
  top: 60px; /* 为固定头部留出空间 */
}

.layui-layout-admin .layui-body {
  top: 60px; /* 为固定头部留出空间 */
}
</style>