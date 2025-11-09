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
      <h2>{{ jobData.name || $t('unnamedJob') }}</h2>
      <p>{{ jobData.description || $t('noDescription') }}</p>
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

// 声明响应式变量
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const jobData = ref<any>(null)

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
    
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Returned content is not valid JSON')
    }
    
    const data = await response.json()
    return data
  } catch (err: any) {
    throw new Error(`Failed to fetch GitHub index.json: ${err.message}`)
  }
}

// 处理邀请请求
const handleInvite = async () => {
  const url = route.query.url as string
  const method = route.query.method as string
  
  // 检查必需参数
  if (!url) {
    error.value = 'Missing required parameter: url'
    return
  }
  
  if (!method) {
    error.value = 'Missing required parameter: method'
    return
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
  alert('Job accepted!') // 这里可以替换为实际的业务逻辑
  router.push('/jobs')
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