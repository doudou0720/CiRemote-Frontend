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

// 定义类型
interface JobData {
  name?: string;
  description?: string;
  author?: string;
  last?: string;
  [key: string]: unknown;
}

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
const jobData = ref<JobData | null>(null)
const originalUrl = ref('') // 保存原始URL

// 解码base64字符串
const decodeBase64 = (str: string): string => {
  try {
    return atob(str)
  } catch (_e: unknown) {
    throw new Error('Invalid base64 encoded URL')
  }
}

// 获取GitHub仓库根目录下的index.json
const fetchGithubIndex = async (repoUrl: string): Promise<JobData> => {
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
      // 尝试直接解析
      const data = JSON.parse(text)
      
      // 验证并解析作业索引数据
      const validation = validateJobIndex(data)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }
      
      // 解析为标准化的作业索引对象
      const parsedData = parseJobIndex(data)
      return parsedData
    } catch (_jsonError: unknown) {
      try {
        // 尝试提取第一个 { 到最后一个 } 之间的内容
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        
        if (start === -1 || end === -1 || start >= end) {
          throw new Error('No JSON object boundaries found')
        }
        
        const jsonText = text.substring(start, end + 1)
        console.log('Extracted JSON text:', jsonText)
        
        // 尝试解析提取的内容
        const data = JSON.parse(jsonText)
        
        // 验证并解析作业索引数据
        const validation = validateJobIndex(data)
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '))
        }
        
        // 解析为标准化的作业索引对象
        const parsedData = parseJobIndex(data)
        return parsedData
      } catch (extractError: unknown) {
        // 显示更详细的错误信息，包括HTTP状态和实际内容
        const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
        throw new Error(`Returned content is not valid JSON. Server returned: ${response.status} ${response.statusText}. Content preview: "${preview}". Extraction also failed: ${(extractError as Error).message}`)
      }
    }
  } catch (err: unknown) {
    const error = err as Error;
    throw new Error(`Failed to fetch GitHub index.json: ${error.message}`)
  }
}

// 加载作业数据
const loadJobData = async () => {
  try {
    loading.value = true
    error.value = ''
    jobData.value = null
    
    // 从查询参数获取URL
    const urlParam = route.query.url as string
    if (!urlParam) {
      throw new Error('Missing required parameter: url')
    }
    
    // 保存原始URL
    originalUrl.value = urlParam
    
    // 解码URL参数
    const decodedUrl = decodeBase64(decodeURIComponent(urlParam))
    
    // 获取作业索引数据
    const data = await fetchGithubIndex(decodedUrl)
    jobData.value = data
  } catch (err: unknown) {
    const e = err as Error;
    error.value = e.message || 'Failed to load job data'
  } finally {
    loading.value = false
  }
}

// 重试函数
const retry = () => {
  loadJobData()
}

// 接受作业
const acceptJob = async () => {
  if (!jobData.value) return
  
  try {
    // 保存作业数据到localStorage
    const jobListKey = 'jobList'
    let jobList: Array<{url: string, data: JobData}> = []
    
    // 尝试从localStorage读取现有的作业列表
    try {
      if (window.layui) {
        const storedData = window.layui.data('jobs')
        jobList = storedData[jobListKey] || []
      } else {
        const storedList = localStorage.getItem(jobListKey)
        if (storedList) {
          jobList = JSON.parse(storedList)
        }
      }
    } catch (e) {
      console.warn('Failed to read job list from storage:', e)
    }
    
    // 检查是否已存在相同的URL
    const exists = jobList.some(job => job.url === originalUrl.value)
    if (!exists) {
      // 添加新作业到列表
      jobList.push({
        url: originalUrl.value,
        data: jobData.value
      })
      
      // 保存更新后的作业列表
      try {
        if (window.layui) {
          window.layui.data('jobs', {
            key: jobListKey,
            value: jobList
          })
        } else {
          localStorage.setItem(jobListKey, JSON.stringify(jobList))
        }
      } catch (e) {
        console.error('Failed to save job list:', e)
        throw new Error('Failed to save job to localStorage')
      }
    }
    
    // 跳转到作业列表页面
    router.push('/jobs')
  } catch (err: unknown) {
    const e = err as Error;
    error.value = e.message || 'Failed to accept job'
  }
}

// 拒绝作业
const rejectJob = () => {
  // 清除作业数据并返回上一页
  jobData.value = null
  router.go(-1)
}

// 生命周期钩子
onMounted(() => {
  loadJobData()
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