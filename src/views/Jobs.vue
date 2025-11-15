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

// 声明layui的window扩展
declare global {
  interface Window {
    layui: any;
  }
}

const router = useRouter()
const loading = ref(false)
const error = ref('')
const jobList = ref<Array<{url: string, data: any}>>([])

// 解码base64字符串
const decodeBase64 = (str: string): string => {
  try {
    return atob(str)
  } catch (e) {
    return str // 如果解码失败，返回原始字符串
  }
}

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

// 加载所有作业
const loadJobs = async () => {
  loading.value = true
  error.value = ''
  jobList.value = []
  
  try {
    let urls: string[] = []
    
    // 从LocalStorage获取URL列表
    if (window.layui) {
      const storedUrls = window.layui.data('job_invites', {
        key: 'accepted_urls'
      });
      
      if (storedUrls) {
        // 处理单个URL或URL数组
        if (Array.isArray(storedUrls)) {
          urls = storedUrls
        } else {
          urls = [storedUrls]
        }
      }
    } else {
      // 使用统一的存储键名和数组格式
      urls = JSON.parse(localStorage.getItem('accepted_urls') || '[]')
    }
    
    // 获取每个URL的作业数据
    const jobs = []
    for (const url of urls) {
      try {
        const decodedUrl = decodeBase64(url)
        const data = await fetchJobIndex(decodedUrl)
        jobs.push({
          url: url,
          data: data
        })
      } catch (err) {
        console.error(`Failed to load job from ${url}:`, err)
      }
    }
    
    jobList.value = jobs
  } catch (err: any) {
    error.value = err.message || 'Failed to load jobs'
  } finally {
    loading.value = false
  }
}

// 导航到作业详情
const navigateToJob = (job: {url: string, data: any}) => {
  const last = job.data.last
  const originalUrl = decodeBase64(job.url)
  
  if (last) {
    // 如果有last字段，基于原始URL构建/data/{last}/index.json路径
    let detailUrl = ''
    
    if (originalUrl.startsWith('https://github.com/')) {
      // 处理GitHub URL
      const urlObj = new URL(originalUrl)
      const pathParts = urlObj.pathname.split('/').filter(part => part)
      
      if (pathParts.length >= 2) {
        const user = pathParts[0]
        const repo = pathParts[1]
        detailUrl = `https://raw.githubusercontent.com/${user}/${repo}/main/data/${last}/index.json`
      }
    } else {
      // 处理普通URL，在原始URL目录下查找/data/{last}/index.json
      try {
        const urlObj = new URL(originalUrl)
        const basePath = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1)
        detailUrl = `${basePath}data/${last}/index.json`
      } catch (e) {
        // 如果URL解析失败，使用相对路径
        detailUrl = `data/${last}/index.json`
      }
    }
    
    router.push(`/jobs/detail?url=${encodeURIComponent(btoa(detailUrl))}`)
  } else {
    // 如果没有last字段，直接访问原始URL
    router.push(`/jobs/detail?url=${encodeURIComponent(job.url)}`)
  }
}

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