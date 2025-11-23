<template>
  <div class="jobs-container">
    <h1>{{ $t('jobs') }}</h1>
    
    <div v-if="loading" class="loading">
      {{ $t('loading') }}
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="loadJobs" class="retry-button">{{ $t('retry') }}</button>
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
          @click="handleJobClick(job)"
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
  data: Record<string, unknown>;
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
      try {
        const data = JSON.parse(text)
        
        // 验证并解析作业索引数据
        const validation = validateJobIndex(data)
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '))
        }
        
        return parseJobIndex(data)
      } catch (parseError: unknown) {
        const error = parseError as Error;
        // 显示更详细的错误信息，包括HTTP状态和实际内容
        const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
        throw new Error(`Returned content is not valid JSON. Server returned: ${response.status} ${response.statusText}. Content preview: "${preview}". Parse error: ${error.message}`)
      }
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
  } catch (err: unknown) {
    const error = err as Error;
    throw new Error(`Failed to fetch job index: ${error.message}`)
  }
}

// 处理作业点击事件
const handleJobClick = async (job: JobData) => {
  // 显示加载状态
  loading.value = true;
  try {
    await navigateToJob(job);
  } finally {
    // 恢复加载状态
    loading.value = false;
  }
};

// 导航到作业详情页
const navigateToJob = async (job: JobData) => {
  try {
    // 先获取作业索引数据以确保有last字段
    const jobIndexData = await fetchJobIndex(job.url);
    
    // 检查是否有last字段
    const last = jobIndexData.last;
    const originalUrl = job.url;
    
    let detailUrl = '';
    
    if (last) {
      // 如果有last字段，基于原始URL构建/data/{last}/index.json路径
      if (originalUrl.startsWith('https://github.com/')) {
        // 处理GitHub URL
        const urlObj = new URL(originalUrl);
        const pathParts = urlObj.pathname.split('/').filter(part => part);
        
        if (pathParts.length >= 2) {
          const user = pathParts[0];
          const repo = pathParts[1];
          detailUrl = `https://raw.githubusercontent.com/${user}/${repo}/main/data/${last}/index.json`;
        }
      } else {
        // 处理普通URL，在原始URL目录下查找/data/{last}/index.json
        try {
          const urlObj = new URL(originalUrl);
          const basePath = urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
          detailUrl = `${basePath}data/${last}/index.json`;
        } catch (_e) {
          // 如果URL解析失败，使用相对路径
          detailUrl = `data/${last}/index.json`;
        }
      }
    } else {
      // 如果没有last字段，直接使用原始URL
      detailUrl = originalUrl;
    }
    
    // 编码URL参数
    const encodedUrl = encodeURIComponent(btoa(detailUrl));
    // 使用完整的路径而不是相对路径
    router.push({
      path: '/jobs/detail',
      query: { url: encodedUrl }
    });
  } catch (err: unknown) {
    const e = err as Error;
    console.error('Failed to navigate to job detail:', e);
    // 如果获取索引数据失败，仍然尝试跳转到原始URL
    const encodedUrl = encodeURIComponent(btoa(job.url));
    router.push({
      path: '/jobs/detail',
      query: { url: encodedUrl }
    });
  }
};

// 加载作业列表
const loadJobs = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // 尝试从localStorage读取作业列表
    let storedJobs: JobData[] = []
    
    try {
      if ((window as any).layui) {
        const storedData = (window as any).layui.data('jobs')
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
  } catch (err: unknown) {
    const e = err as Error;
    error.value = e.message || 'Failed to load jobs'
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