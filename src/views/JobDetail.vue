<template>
  <div class="job-detail-container">
    <h1>{{ $t('jobDetail') }}</h1>
    <div v-if="loading" class="loading">
      {{ $t('loading') }}
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else-if="jobData" class="job-detail">
      <h2>{{ jobData.Description || $t('unnamedJob') }}</h2>
      <p class="export-date">{{ $t('exportDate') }}: {{ formatExportDate(jobData.ExportDate) }}</p>
      <div class="homeworks-list">
        <h3>{{ $t('homeworkList') }}</h3>
        <div v-if="jobData.Homeworks && jobData.Homeworks.length > 0" class="homeworks">
          <div 
            v-for="(homework, index) in jobData.Homeworks" 
            :key="index"
            class="homework-item"
          >
            <div class="homework-header">
              <span class="subject">{{ homework.Subject }}</span>
              <span class="due-time">{{ formatDueTime(homework.DueTime) }}</span>
            </div>
            <div class="homework-content">
              {{ filterXmlTags(homework.Content) }}
            </div>
            <div v-if="homework.Tags && homework.Tags.length > 0" class="homework-tags">
              <span 
                v-for="(tag, tagIndex) in homework.Tags" 
                :key="tagIndex"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
            <!-- 显示附件列表 -->
            <div v-if="githubAttachments[index] && githubAttachments[index].length > 0" class="attachments">
              <h4>{{ $t('attachments') }}</h4>
              <ul class="attachment-list">
                <li v-for="attachment in githubAttachments[index]" :key="attachment.name">
                  <a 
                    :href="getPreviewUrl(attachment)" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {{ attachment.name }}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div v-else class="no-homeworks">
          {{ $t('noHomeworks') }}
        </div>
      </div>
    </div>
    <div v-else class="no-data">
      {{ $t('noJobData') }}
    </div>
    <div class="actions">
      <button @click="goBack" class="back-button">{{ $t('back') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseDetailData, validateDetailData } from '@/parsers/detail/detail-parser'
import { canPreviewWithOffice, getOfficePreviewUrl } from '@/utils/fileexplorer'
import { filterXmlTags } from '@/utils/contentFilter'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const jobData = ref<any>(null)
const githubAttachments = ref<any[]>([])

// 解码base64字符串
const decodeBase64 = (str: string): string => {
  try {
    return atob(str)
  } catch (e) {
    return str // 如果解码失败，返回原始字符串
  }
}

// 格式化导出日期
const formatExportDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

// 格式化截止时间
const formatDueTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

// 获取文件预览URL
const getPreviewUrl = (attachment: any) => {
  if (canPreviewWithOffice(attachment.name)) {
    return getOfficePreviewUrl(attachment.download_url)
  }
  return attachment.download_url
}

// 获取GitHub仓库中的附件列表
const fetchGithubAttachments = async (repoUrl: string, homeworkPath: string) => {
  try {
    // 解析GitHub仓库URL
    const urlObj = new URL(repoUrl)
    const pathParts = urlObj.pathname.split('/').filter(part => part)
    
    if (pathParts.length < 2) {
      throw new Error('Invalid GitHub repository URL')
    }
    
    const user = pathParts[0]
    const repo = pathParts[1]
    
    // 构建API URL来获取目录内容，严格按照GitHub API规范
    // https://docs.github.com/en/rest/repos/contents#get-repository-content
    let apiUrl = `https://api.github.com/repos/${user}/${repo}/contents`
    if (homeworkPath) {
      // 不转义斜杠，直接附加路径
      apiUrl += `/${homeworkPath}`
    }
    
    // 添加ref参数支持（来自查询参数）
    const urlParams = new URLSearchParams(urlObj.search)
    const ref = urlParams.get('ref')
    if (ref) {
      apiUrl += `?ref=${ref}`
    }
    
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch attachments: ${response.status} ${response.statusText}`)
    }
    
    const files = await response.json()
    
    // 过滤掉目录，只保留文件
    return files.filter((file: any) => file.type === 'file' && file.name !== 'index.json')
  } catch (err: any) {
    console.error('Failed to fetch GitHub attachments:', err)
    return []
  }
}

// 获取作业数据
const fetchJobData = async (url: string) => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }
    
    const text = await response.text()
    const data = JSON.parse(text)
    
    // 验证并解析详细信息数据
    const validation = validateDetailData(data)
    if (!validation.isValid) {
      throw new Error(`Invalid detail data: ${validation.errors.join(', ')}`)
    }
    
    return parseDetailData(data)
  } catch (err: any) {
    throw new Error(`Failed to fetch job data: ${err.message}`)
  }
}

// 加载作业详情
const loadJobDetail = async () => {
  const urlParam = route.query.url as string
  
  if (!urlParam) {
    error.value = 'Missing required parameter: url'
    return
  }
  
  loading.value = true
  error.value = ''
  jobData.value = null
  githubAttachments.value = []
  
  try {
    // 解码URL参数
    const decodedUrl = decodeBase64(decodeURIComponent(urlParam))
    
    // 获取作业数据
    jobData.value = await fetchJobData(decodedUrl)
    
    // 检查是否是GitHub URL，如果是则获取附件
    if (decodedUrl.startsWith('https://raw.githubusercontent.com/')) {
      // 从raw URL解析GitHub仓库信息
      const urlObj = new URL(decodedUrl)
      const pathParts = urlObj.pathname.split('/').filter(part => part)
      
      if (pathParts.length >= 3) {
        const user = pathParts[0]
        const repo = pathParts[1]
        // 从路径中提取branch name（第三个路径段）
        const branch = pathParts[2] || 'main'
        // 重构GitHub仓库URL，添加ref参数
        const repoUrl = `https://github.com/${user}/${repo}?ref=${branch}`
        
        // 获取每个作业的附件
        const attachmentsPromises = jobData.value.Homeworks.map(async (_: any, index: number) => {
          // 从原始URL中提取作业路径
          const pathSegments = urlObj.pathname.split('/').filter(part => part)
          if (pathSegments.length >= 4) {
            // 构建作业目录路径 (去掉最开始的user, repo, branch和最后的index.json)
            const basePath = pathSegments.slice(3, pathSegments.length - 1).join('/')
            const homeworkPath = `${basePath}`
            
            // 为每个作业获取附件
            const attachments = await fetchGithubAttachments(repoUrl, homeworkPath)
            return { index, attachments }
          }
          return { index, attachments: [] }
        })
        
        const attachmentsResults = await Promise.all(attachmentsPromises)
        
        // 构建附件映射
        const attachmentsMap: any[] = []
        attachmentsResults.forEach(result => {
          attachmentsMap[result.index] = result.attachments
        })
        
        githubAttachments.value = attachmentsMap
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load job detail'
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

onMounted(() => {
  loadJobDetail()
})
</script>

<style scoped>
.job-detail-container {
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

.job-detail {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.export-date {
  color: #666;
  font-style: italic;
  margin-bottom: 15px;
}

.homeworks-list h3 {
  margin: 20px 0 10px 0;
}

.homeworks {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.homework-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #fafafa;
}

.homework-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: bold;
}

.subject {
  color: #2196f3;
}

.due-time {
  color: #f44336;
}

.homework-content {
  margin-bottom: 10px;
  line-height: 1.5;
}

.homework-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  background-color: #e0e0e0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.no-homeworks {
  padding: 20px;
  text-align: center;
  color: #999;
}

.actions {
  margin-top: 20px;
}

.back-button {
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.attachments {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.attachments h4 {
  margin: 0 0 10px 0;
  color: #666;
}

.attachment-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.attachment-list li {
  margin-bottom: 5px;
}

.attachment-list a {
  color: #2196f3;
  text-decoration: none;
}

.attachment-list a:hover {
  text-decoration: underline;
}
</style>