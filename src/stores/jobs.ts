import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { parseJobIndex, validateJobIndex } from '../parsers/index/job-index-parser'

// 定义作业数据类型
export interface JobData {
  url: string
  data: Record<string, unknown>
}

// 定义 store
export const useJobsStore = defineStore('jobs', () => {
  // 状态
  const jobs = ref<JobData[]>([])
  const loading = ref(false)
  const error = ref('')

  // 计算属性
  const jobCount = computed(() => jobs.value.length)
  const hasJobs = computed(() => jobs.value.length > 0)

  // 从 localStorage 加载作业
  const loadJobsFromStorage = () => {
    try {
      if ((window as any).layui) {
        const storedData = (window as any).layui.data('jobs')
        jobs.value = storedData.jobList || []
      } else {
        const storedList = localStorage.getItem('jobList')
        if (storedList) {
          jobs.value = JSON.parse(storedList)
        }
      }
    } catch (e) {
      console.warn('Failed to read job list from storage:', e)
      jobs.value = []
    }
  }

  // 保存作业到 localStorage
  const saveJobsToStorage = () => {
    try {
      if ((window as any).layui) {
        (window as any).layui.data('jobs', {
          key: 'jobList',
          value: jobs.value
        })
      } else {
        localStorage.setItem('jobList', JSON.stringify(jobs.value))
      }
    } catch (e) {
      console.error('Failed to save jobs to storage:', e)
      throw new Error('Failed to save jobs to localStorage')
    }
  }

  // 添加作业
  const addJob = (job: JobData) => {
    const existingIndex = jobs.value.findIndex(item => item.url === job.url)
    if (existingIndex !== -1) {
      // 更新现有作业
      jobs.value[existingIndex] = job
    } else {
      // 添加新作业
      jobs.value.push(job)
    }
    saveJobsToStorage()
  }

  // 移除作业
  const removeJob = (url: string) => {
    jobs.value = jobs.value.filter(job => job.url !== url)
    saveJobsToStorage()
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
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(`Failed to fetch job index: ${error.message}`);
    }
  }

  // 加载作业列表
  const loadJobs = async () => {
    try {
      loading.value = true
      error.value = ''
      
      // 从 localStorage 加载作业
      loadJobsFromStorage()
      
      // 获取每个作业的详细信息
      const jobsWithDetails = await Promise.all(jobs.value.map(async (job) => {
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
      
      jobs.value = jobsWithDetails
    } catch (err: unknown) {
      const e = err as Error;
      error.value = e.message || 'Failed to load jobs'
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    jobs,
    loading,
    error,
    
    // 计算属性
    jobCount,
    hasJobs,
    
    // 方法
    loadJobsFromStorage,
    saveJobsToStorage,
    addJob,
    removeJob,
    fetchJobIndex,
    loadJobs
  }
})