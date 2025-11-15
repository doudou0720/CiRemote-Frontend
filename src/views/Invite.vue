<template>
  <div class="invite-container">
    <h1>{{ $t('inviteJob') }}</h1>
    <div v-if="loading" class="loading">
      {{ $t('loading') }}
    </div>
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="retry" class="retry-button">{{ $t('retry') }}</button>
    </div>
    <div v-else-if="jobData" class="job-data">
      <h2>{{ jobData.description || jobData.name || $t('unnamedJob') }}</h2>
      <p v-if="jobData.author || jobData.last" class="job-meta">
        <span v-if="jobData.author">{{ $t('author') }}: {{ jobData.author }}</span>
        <span v-if="jobData.author && jobData.last"> | </span>
        <span v-if="jobData.last">{{ $t('lastUpdated') }}: {{ jobData.last }}</span>
      </p>
      <div class="job-actions">
        <button @click="acceptJob" class="accept-button">{{ $t('accept') }}</button>
        <button @click="rejectJob" class="reject-button">{{ $t('reject') }}</button>
      </div>
      <div class="job-details">
        <h3>{{ $t('jobDetails') }}</h3>
        <pre>{{ JSON.stringify(jobData, null, 2) }}</pre>
      </div>
    </div>
    <div v-else class="no-data">
      {{ $t('noJobData') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseJobIndex, validateJobIndex } from '@/parsers/index/job-index-parser'

// 声明layui的window扩展
declare global {
  interface Window {
    layui: any;
  }
}

// 声明响应式变量
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const jobData = ref<any>(null)
const originalUrl = ref('') // 保存原始URL

// 解码base64字符串
const decodeBase64 = (str: string): string => {
  try {
    return atob(str)
  } catch (e) {
    throw new Error('Invalid base64 encoded URL')
  }
}

// 获取GitHub仓库根目录下的index.json
const fetchGithubIndex = async (repoUrl: string) => {
  try {
    // 检查是否是有效的GitHub URL
    if (!repoUrl.startsWith('https://github.com/')) {
      throw new Error('Invalid GitHub repository URL. Must start with https://github.com/')
    }
    
    // 将GitHub仓库URL转换为原始内容URL
    // 例如: https://github.com/user/repo -> https://raw.githubusercontent.com/user/repo/main/index.json
    const urlObj = new URL(repoUrl)
    const pathParts = urlObj.pathname.split('/').filter(part => part)
    
    if (pathParts.length < 2) {
      throw new Error('Invalid GitHub repository URL')
    }
    
    const user = pathParts[0]
    const repo = pathParts[1]
    const rawUrl = `https://raw.githubusercontent.com/${user}/${repo}/main/index.json`
    
    const response = await fetch(rawUrl)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('index.json not found in the repository root')
      }
      throw new Error(`Failed to fetch ${rawUrl}: ${response.status} ${response.statusText}`)
    }
    
    // 尝试解析响应为JSON，而不严格依赖Content-Type
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      
      // 验证并解析作业索引数据
      const validation = validateJobIndex(data)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }
      
      // 解析为标准化的作业索引对象
      const parsedData = parseJobIndex(data)
      return parsedData
    } catch (jsonError) {
      throw new Error('Returned content is not valid JSON')
    }
  } catch (err: any) {
    throw new Error(`Failed to fetch GitHub index.json: ${err.message}`)
  }
}

// 处理邀请请求
const handleInvite = async () => {
  let url = route.query.url as string
  const method = route.query.method as string
  
  // 保存原始URL用于存储
  originalUrl.value = url;
  
  // 检查必需参数
  if (!url) {
    error.value = 'Missing required parameter: url'
    return
  }
  
  if (!method) {
    error.value = 'Missing required parameter: method'
    return
  }
  
  // 解码base64编码的URL
  try {
    url = decodeBase64(url)
  } catch (e) {
    // 如果解码失败，假设URL未编码
    // 不做任何处理，继续使用原始URL
  }
  
  loading.value = true
  error.value = ''
  
  try {
    if (method === 'github') {
      jobData.value = await fetchGithubIndex(url)
    } else {
      error.value = `Unsupported method: ${method}`
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred while processing the request'
  } finally {
    loading.value = false
  }
}

// 重试函数
const retry = () => {
  handleInvite()
}

// 接受作业
const acceptJob = () => {
  try {
    // 使用layui的LocalStorage方法存储URL
    if (window.layui) {
      // 修复数据存储问题，允许多个作业URL被存储
      let storedUrls = window.layui.data('job_invites', {key: 'accepted_urls'}) || []
      if (!Array.isArray(storedUrls)) {
        storedUrls = [storedUrls].filter(Boolean) // 处理旧格式数据
      }
      storedUrls.push(originalUrl.value)
      window.layui.data('job_invites', {
        key: 'accepted_urls',
        value: storedUrls
      });
      
      console.log('Job URL stored in LocalStorage');
    } else {
      // 如果layui不可用，使用原生LocalStorage
      localStorage.setItem('job_invite_url', originalUrl.value);
      console.log('Job URL stored in native LocalStorage');
    }
    
    router.push('/jobs')
  } catch (e) {
    console.error('Failed to store job URL in LocalStorage:', e);
    alert('Failed to accept job: ' + (e as Error).message);
  }
}

// 拒绝作业
const rejectJob = () => {
  router.push('/jobs')
}

onMounted(() => {
  handleInvite()
})
</script>

<style scoped>
.invite-container {
  padding: 20px;
  margin-top: 60px;
}

.loading, .error, .no-data {
  padding: 20px;
  text-align: center;
}

.error {
  color: red;
}

.job-data {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.job-meta {
  color: #666;
  font-style: italic;
  margin-bottom: 15px;
}

.job-actions {
  margin: 20px 0;
}

.job-actions button {
  margin-right: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.accept-button {
  background-color: #4caf50;
  color: white;
}

.reject-button, .retry-button {
  background-color: #f44336;
  color: white;
}

.job-details h3 {
  margin-top: 20px;
}

.job-details pre {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
}
</style>