import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
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
      loading: 'Loading...',
      unnamedJob: 'Unnamed Job',
      noDescription: 'No description provided',
      noJobData: 'No job data available',
      retry: 'Retry',
      accept: 'Accept',
      reject: 'Reject',
      jobDetails: 'Job Details'
    },
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
      loading: '加载中...',
      unnamedJob: '未命名作业',
      noDescription: '暂无描述',
      noJobData: '暂无作业数据',
      retry: '重试',
      accept: '接受',
      reject: '拒绝',
      jobDetails: '作业详情'
    }
  }
})

export default i18n