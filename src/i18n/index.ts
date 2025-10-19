import { createI18n } from 'vue-i18n'

// 定义语言包
const messages = {
  zh: {
    home: '首页',
    about: '关于',
    settings: '设置',
    class: '高二(X)班',
    // 设置页面相关
    webSettings: '网页端设置',
    deviceManagement: '设备管理',
    language: '语言',
    theme: '主题',
    languageSettings: '语言设置',
    themeSettings: '主题设置',
    selectLanguage: '选择语言',
    selectTheme: '选择主题',
    light: '明亮',
    dark: '暗黑',
    deviceList: '设备列表',
    deviceConfig: '设备配置',
    deviceConfigSettings: '设备配置',
    configItem1: '配置项 1',
    configItem2: '配置项 2',
    enterConfig: '请输入配置',
    online: '在线'
  },
  en: {
    home: 'Home',
    about: 'About',
    settings: 'Settings',
    class: 'Class G2(X)',
    // Settings page related
    webSettings: 'Web Settings',
    deviceManagement: 'Device Management',
    language: 'Language',
    theme: 'Theme',
    languageSettings: 'Language Settings',
    themeSettings: 'Theme Settings',
    selectLanguage: 'Select Language',
    selectTheme: 'Select Theme',
    light: 'Light',
    dark: 'Dark',
    deviceList: 'Device List',
    deviceConfig: 'Device Configuration',
    deviceConfigSettings: 'Device Config',
    configItem1: 'Config Item 1',
    configItem2: 'Config Item 2',
    enterConfig: 'Please enter configuration',
    online: 'Online'
  }
}

// 创建i18n实例，使用Composition API模式
const i18n = createI18n({
  legacy: false, // 使用Composition API模式
  locale: 'zh', // 默认语言
  fallbackLocale: 'en', // 回退语言
  messages,
})

export default i18n