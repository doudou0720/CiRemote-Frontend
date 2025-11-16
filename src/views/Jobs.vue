<template>
  <div class="jobs-container">
    <h1>{{ $t('jobs') }}</h1>
    <div v-if="loading" class="loading">
      {{ $t('loading') }}
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else>
      <div v-if="jobList.length === 0" class="no-jobs">
        {{ $t('noJobs') }}
      </div>
      <div v-else class="job-list">
        <div 
          v-for="job in jobList" 
          :key="job.url"
          class="job-item"
          @click="navigateToJob(job)"
        >
          <h3>{{ job.data.description || $t('unnamedJob') }}</h3>
          <p v-if="job.data.author || job.data.last" class="job-meta">
            <span v-if="job.data.author">{{ $t('author') }}: {{ job.data.author }}</span>
            <span v-if="job.data.author && job.data.last"> | </span>
            <span v-if="job.data.last">{{ $t('lastUpdated') }}: {{ job.data.last }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { parseJobIndex, validateJobIndex } from '@/parsers/index/job-index-parser'

// 定义类型
interface JobData {
  url: string;
  data: any;
}

// 声明layui的window扩展
declare global {
  interface Window {
    layui: any;
  }
}

const router = useRouter()
const loading = ref(false)
const error = ref('')
const jobList = ref<JobData[]>([])

// 获取作业索引数据
const fetchJobIndex = async (repoUrl: string) => {
  try {
    // 检查是否是有效的GitHub URL
    if (!repoUrl.startsWith('https://github.com/')) {
      // 如果不是GitHub URL，假设它是一个直接的JSON文件URL
      const response = await fetch(repoUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${repoUrl}: ${response.status} ${response.statusText}`)
      }
      
      const text = await response.text()
      const data = JSON.parse(text)
      
      // 验证并解析作业索引数据
      const validation = validateJobIndex(data)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }
      
      return parseJobIndex(data)
    }
    
    // 处理GitHub URL
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
    
    const text = await response.text()
    const data = JSON.parse(text)
    
    // 验证并解析作业索引数据
    const validation = validateJobIndex(data)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    
    return parseJobIndex(data)
  } catch (err: any) {
    throw new Error(`Failed to fetch job index: ${err.message}`)
  }
}

// 导航到作业详情页
const navigateToJob = (job: JobData) => {
  // 编码URL参数
  const encodedUrl = encodeURIComponent(btoa(job.url))
  router.push(`/jobs/detail?url=${encodedUrl}`)
}

// 加载作业列表
const loadJobs = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // 尝试从localStorage读取作业列表
    let storedJobs: JobData[] = []
    
    try {
      if (window.layui) {
        const storedData = window.layui.data('jobs')
        storedJobs = storedData.jobList || []
      } else {
        const storedList = localStorage.getItem('jobList')
        if (storedList) {
          storedJobs = JSON.parse(storedList)
        }
      }
    } catch (e) {
      console.warn('Failed to read job list from storage:', e)
    }
    
    // 获取每个作业的详细信息
    const jobsWithDetails = await Promise.all(storedJobs.map(async (job) => {
      try {
        const data = await fetchJobIndex(job.url)
        return {
          url: job.url,
          data
        }
      } catch (err) {
        console.error(`Failed to fetch job data for ${job.url}:`, err)
        // 返回原始数据
        return job
      }
    }))
    
    jobList.value = jobsWithDetails
  } catch (err: any) {
    error.value = err.message || 'Failed to load jobs'
  } finally {
    loading.value = false
  }
}

// 生命周期钩子
onMounted(() => {
  loadJobs()
})
</script>

<style scoped>
.jobs-container {
  padding: 20px;
  margin-top: 60px;
}

.loading, .error, .no-jobs {
  padding: 20px;
  text-align: center;
}

.error {
  color: red;
}

.job-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.job-item {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.job-item:hover {
  border-color: #4caf50;
}

.job-meta {
  color: #666;
  font-style: italic;
  margin: 5px 0 0 0;
}
</style>