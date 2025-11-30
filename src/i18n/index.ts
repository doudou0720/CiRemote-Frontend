import { createI18n } from 'vue-i18n'

/**
 * Internationalization (i18n) configuration for the application.
 *
 * Purpose
 * - Centralizes UI strings used across the single-page application (SPA).
 * - Provides English ("en") and Simplified Chinese ("zh") translations with a fallback to English.
 * - Uses the Composition API compatible mode (legacy: false).
 *
 * Structure
 * - locale: "zh" (primary)
 * - fallbackLocale: "en"
 * - messages: an object keyed by locale code containing translation key/value pairs
 *
 * Notable translation keys (non-exhaustive)
 * - Navigation / layout: home, about, settings, back
 * - Job / homework: jobs, inviteJob, unnamedJob, jobDetails, jobDetail, jobContent, noJobData, noJobs, homeworkList, noHomeworks, exportDate
 * - CRUD / actions: save, cancel, delete, edit, add, confirm, close, loading, retry, copy
 * - Status / metadata: author, lastUpdated, attachments, online
 * - Device / web settings: webSettings, deviceManagement, deviceList, deviceConfig, deviceConfigSettings, deviceConfig, configItem1, configItem2, enterConfig
 * - Appearance / locale: language, theme, light, dark, languageSettings, selectLanguage, themeSettings, selectTheme
 * - Sharing: shareLink
 *
 * Remarks and maintenance notes
 * - New keys have been added (see "Notable translation keys"). When introducing new UI text, add a key here and provide translations for all supported locales.
 * - The codebase currently appears to add navigation- and sharing-related keys (e.g., shareLink) without accompanying developer documentation describing:
 *   - The intended SPA navigation pattern (how translated routes / labels should map to router behavior, responsibilities for route translation, canonical route names, and deep-link handling).
 *   - The semantics and security considerations of shareLink (what the link contains, whether it embeds sensitive tokens, expiry behavior, and how it should be generated/consumed).
 * - TODO: Add a short developer doc describing:
 *   1. How to add or change i18n keys and where to update translation files.
 *   2. Conventions for naming keys (e.g., namespace by feature: jobs.*, settings.*, device.*).
 *   3. How route labels are derived from translation keys (if routes are localized) and how to handle fallbacks.
 *   4. Security and UX considerations for shareLink generation and consumption.
 *
 * Guidance for contributors
 * - When adding a new UI string:
 *   1. Choose a clear, namespaced key (e.g., "jobs.createButton" or "device.config.enter").
 *   2. Add the key to every locale in this messages object (even if temporarily using the English text).
 *   3. Update unit / integration tests that assert on rendered text where applicable.
 * - Prefer keeping text keys stable; refactor keys only when necessary and update all usages.
 *
 * Example (usage)
 * - In script setup: const label = i18n.global.t('home');
 * - In templates (Vue): {{ $t('home') }}
 *
 * @remarks
 * This comment documents the i18n configuration and provides maintenance guidance. Keep this documentation in sync with changes to locales, new features (especially shareable links and route localization), and any changes to the i18n library configuration.
 */
const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    // 英语文本
    en: {
      home: 'Home',
      about: 'About',
      settings: 'Settings',
      jobs: 'Jobs',
      inviteJob: 'Invite Job',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      confirm: 'Confirm',
      close: 'Close',
      jobDetail: 'Job Detail',
      jobContent: 'Job Content',
      noJobData: 'No job data available',
      noJobs: 'No jobs available',
      homeworkList: 'Homework List',
      noHomeworks: 'No homeworks available',
      exportDate: 'Export Date',
      dueTime: 'Due Time',
      tags: 'Tags',
      attachments: 'Attachments',
      shareLink: 'Share Link',
      copy: 'Copy',
      back: 'Back',
      accept: 'Accept',
      reject: 'Reject',
      jobDetails: 'Job Details',
      author: 'Author',
      lastUpdated: 'Last Updated',
      unnamedJob: 'Unnamed Job',
      noDescription: 'No description available',
      loading: 'Loading...',
      retry: 'Retry',
      previewOrDownload: 'Preview or Download',
      confirmPreview: 'OK: Preview in browser',
      cancelDownload: 'Cancel: Download file',
      rateLimitExceeded: 'GitHub API rate limit exceeded, please try again later.',
      github: 'GitHub',
      loginWithGitHub: 'Login with GitHub',
      syncWithGitHub: 'Sync with GitHub',
      githubRepository: 'GitHub Repository',
      githubSyncSuccess: 'Successfully synced with GitHub',
      githubSyncFailed: 'Failed to sync with GitHub',
      // 新增的翻译键
      class: 'Class',
      webSettings: 'Web Settings',
      deviceManagement: 'Device Management',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      languageSettings: 'Language Settings',
      selectLanguage: 'Select Language',
      themeSettings: 'Theme Settings',
      selectTheme: 'Select Theme',
      deviceList: 'Device List',
      deviceConfig: 'Device Config',
      deviceConfigSettings: 'Device Configuration Settings',
      configItem1: 'Configuration Item 1',
      configItem2: 'Configuration Item 2',
      enterConfig: 'Enter configuration',
      online: 'Online'
    },
    
    // 中文文本
    zh: {
      home: '首页',
      about: '关于',
      settings: '设置',
      jobs: '作业',
      inviteJob: '邀请作业',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      add: '添加',
      confirm: '确认',
      close: '关闭',
      jobDetail: '作业详情',
      jobContent: '作业内容',
      noJobData: '暂无作业数据',
      noJobs: '暂无作业',
      homeworkList: '作业列表',
      noHomeworks: '暂无作业',
      exportDate: '导出日期',
      dueTime: '截止时间',
      tags: '标签',
      attachments: '附件',
      shareLink: '分享链接',
      copy: '复制',
      back: '返回',
      accept: '接受',
      reject: '拒绝',
      jobDetails: '作业详情',
      author: '作者',
      lastUpdated: '最后更新',
      unnamedJob: '未命名作业',
      noDescription: '暂无描述',
      loading: '加载中...',
      retry: '重试',
      previewOrDownload: '预览或下载',
      confirmPreview: '确定：在浏览器中预览',
      cancelDownload: '取消：下载文件',
      rateLimitExceeded: '已超过GitHub API速率限制，请稍后再试。',
      github: 'GitHub',
      loginWithGitHub: '使用GitHub登录',
      syncWithGitHub: '与GitHub同步',
      githubRepository: 'GitHub仓库',
      githubSyncSuccess: '成功与GitHub同步',
      githubSyncFailed: '与GitHub同步失败',
      // 新增的翻译键
      class: '班级',
      webSettings: '网页设置',
      deviceManagement: '设备管理',
      language: '语言',
      theme: '主题',
      light: '浅色',
      dark: '深色',
      languageSettings: '语言设置',
      selectLanguage: '选择语言',
      themeSettings: '主题设置',
      selectTheme: '选择主题',
      deviceList: '设备列表',
      deviceConfig: '设备配置',
      deviceConfigSettings: '设备配置设置',
      configItem1: '配置项1',
      configItem2: '配置项2',
      enterConfig: '输入配置',
      online: '在线'
    }
  }
})

export default i18n