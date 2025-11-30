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
      
      // 使用TextDecoder正确处理UTF-8编码
      const buffer = await response.arrayBuffer()
      const decoder = new TextDecoder('utf-8')
      const text = decoder.decode(buffer)
      
      const data = JSON.parse(text)
      
      // 验证并解析作业索引数据
      const validation = validateJobIndex(data)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }
      
      return parseJobIndex(data)
    }
    
    // 处理GitHub URL - 使用GitHub API方式获取内容
    const urlObj = new URL(repoUrl);
    const pathParts = urlObj.pathname.split('/').filter(part => part);
    
    if (pathParts.length < 2) {
      throw new Error('Invalid GitHub repository URL');
    }
    
    const user = pathParts[0];
    const repo = pathParts[1];
    let apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/index.json`;
    
    // 检查是否有 ref 查询参数（分支名称）
    const urlParams = new URLSearchParams(urlObj.search);
    const branch = urlParams.get('ref');
    if (branch) {
      apiUrl += `?ref=${encodeURIComponent(branch)}`;
    }
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('index.json not found in the repository root');
      }
      throw new Error(`Failed to fetch ${apiUrl}: ${response.status} ${response.statusText}`);
    }
    
    // 解析 GitHub API 响应并获取文件内容
    const responseData = await response.json();
    // GitHub API 返回的内容是base64编码的，需要解码
    const content = atob(responseData.content);
    
    // 正确处理UTF-8编码
    const decoder = new TextDecoder('utf-8');
    const encodedBytes = new Uint8Array(content.length);
    for (let i = 0; i < content.length; i++) {
      encodedBytes[i] = content.charCodeAt(i);
    }
    const text = decoder.decode(encodedBytes);
    
    const data = JSON.parse(text);
    
    // 验证并解析作业索引数据
    const validation = validateJobIndex(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    
    return parseJobIndex(data);
  } catch (err: any) {
    throw new Error(`Failed to fetch job index: ${err.message}`);
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
      const storedUrl = localStorage.getItem('job_invite_url')
      if (storedUrl) {
        urls = [storedUrl]
      }
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