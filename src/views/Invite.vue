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

// 声明响应式变量
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const jobData = ref<any>(null)
const originalUrl = ref('')

// 定义作业数据类型
interface JobData {
  name?: string;
  description?: string;
  author?: string;
  last?: string;
  [key: string]: any;
}

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
    
    // 将GitHub仓库URL转换为API URL
    const urlObj = new URL(repoUrl)
    const pathParts = urlObj.pathname.split('/').filter(part => part)
    
    if (pathParts.length < 2) {
      throw new Error('Invalid GitHub repository URL')
    }
    
    const user = pathParts[0]
    const repo = pathParts[1]
    // 保存仓库信息用于错误提示
    const repoInfo = `${user}/${repo}`
    
    // 使用 GitHub API 替代 raw.githubusercontent.com
    let apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/index.json`
    
    // 检查是否有 ref 查询参数（分支名称）
    const urlParams = new URLSearchParams(urlObj.search);
    const branch = urlParams.get('ref');
    const ref = branch || 'main'; // 默认使用main分支
    if (branch) {
      apiUrl += `?ref=${encodeURIComponent(branch)}`;
    }
    
    // 构造对应的raw URL用于fallback
    const rawUrl = `https://raw.githubusercontent.com/${user}/${repo}/${ref}/index.json`;
    
    let response = await fetch(apiUrl)
    let isFallback = false;
    
    // 如果GitHub API返回403，则尝试使用raw URL
    if (response.status === 403) {
      console.log('GitHub API returned 403, trying raw URL as fallback');
      isFallback = true;
      try {
        response = await fetch(rawUrl);
      } catch (fallbackError) {
        // 如果 fallback 请求也失败，抛出原始错误
        throw new Error(`GitHub API returned 403 and fallback request failed: ${fallbackError.message}`);
      }
    }
    
    // 如果返回404，则尝试检查仓库是否存在
    if (response.status === 404) {
      // 检查仓库是否存在
      const repoCheckUrl = `https://api.github.com/repos/${repoInfo}`;
      const repoResponse = await fetch(repoCheckUrl);
      
      if (repoResponse.status === 404) {
        throw new Error(`Repository ${repoInfo} not found`);
      } else if (!repoResponse.ok) {
        throw new Error(`Failed to check repository ${repoInfo}: ${repoResponse.status} ${repoResponse.statusText}`);
      }
      
      // 仓库存在但index.json不存在
      throw new Error(`index.json not found in repository ${repoInfo}`);
    }
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('index.json not found in the repository root')
      }
      throw new Error(`Failed to fetch ${isFallback ? rawUrl : apiUrl}: ${response.status} ${response.statusText}`)
    }
    
    let text = '';
    if (!isFallback) {
      // 解析 GitHub API 响应并获取文件内容
      const responseData = await response.json()
      const content = atob(responseData.content)
      
      // 正确处理UTF-8编码
      const decoder = new TextDecoder('utf-8');
      const encodedBytes = new Uint8Array(content.length);
      for (let i = 0; i < content.length; i++) {
        encodedBytes[i] = content.charCodeAt(i);
      }
      text = decoder.decode(encodedBytes);
    } else {
      // 直接获取文本内容 (fallback情况)
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
      text = decoder.decode(buffer);
    }
    
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
        const error = extractError as Error;
        throw new Error(`JSON解析失败: ${error.message}. 内容预览: "${preview}"`);
      }
    }
  } catch (err: unknown) {
    const error = err as Error;
    throw new Error(`Failed to fetch GitHub index.json: ${error.message}`)
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
    if (window.layui) {
      // 使用layui的数据存储机制
      const storedUrls = window.layui.data('job_invites', {
        key: 'accepted_urls'
      }) || [];
      
      // 确保存储的是数组
      let urlArray: string[] = [];
      if (Array.isArray(storedUrls)) {
        urlArray = storedUrls;
      } else if (typeof storedUrls === 'string') {
        urlArray = [storedUrls];
      }
      
      // 添加新的URL（如果尚未存在）
      if (!urlArray.includes(originalUrl.value)) {
        urlArray.push(originalUrl.value);
        window.layui.data('job_invites', {
          key: 'accepted_urls',
          value: urlArray
        });
      }
    } else {
      // 使用localStorage
      localStorage.setItem('job_invite_url', originalUrl.value);
    }
    
    alert('作业已接受!')
    router.push('/jobs')
  } catch (e) {
    console.error('Error accepting job:', e)
    alert('接受作业时发生错误')
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