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
          <!-- 按学科分组显示作业 -->
          <div 
            v-for="(homeworkGroup, subject) in groupedHomeworks" 
            :key="subject"
            class="subject-group"
          >
            <h4 class="subject-title">{{ subject }}</h4>
            <div 
              v-for="(homework, index) in homeworkGroup" 
              :key="index"
              class="homework-item"
            >
              <div class="homework-header">
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
            </div>
          </div>
        </div>
        <div v-else class="no-homeworks">
          {{ $t('noHomeworks') }}
        </div>
      </div>
      <!-- 统一显示所有附件，不分学科 -->
      <div v-if="allAttachments && allAttachments.length > 0" class="all-attachments">
        <h3>{{ $t('attachments') }}</h3>
        <ul class="attachment-list">
          <li v-for="attachment in allAttachments" :key="attachment.name">
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
    <div v-else class="no-data">
      {{ $t('noJobData') }}
    </div>
    <div class="actions">
      <button @click="goBack" class="back-button">{{ $t('back') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// 从 '@' 开头的路径导入解析器
import { parseDetailData, validateDetailData } from '@/parsers/detail/detail-parser'

// 定义附件类型
interface Attachment {
  name: string;
  download_url: string;
  [key: string]: any;
}

// 定义作业类型
interface Homework {
  Subject: string;
  Content: string;
  DueTime: string;
  Tags?: string[];
  [key: string]: any;
}

// 定义作业数据类型
interface JobData {
  Description?: string;
  ExportDate: string;
  Homeworks: Homework[];
  [key: string]: any;
}

// 自定义Office文档预览函数
const canPreviewWithOffice = (filename: string): boolean => {
  const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
  return officeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

// 生成Office文档预览链接
const getOfficePreviewUrl = (url: string): string => {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
};

// 过滤XML标签的简单实现
const filterXmlTags = (content: string): string => {
  if (!content) return '';
  let prev;
  let filtered = content;
  do {
    prev = filtered;
    filtered = filtered.replace(/<[^>]*>/g, '');
  } while (filtered !== prev);
  return filtered;
};

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const jobData = ref<JobData | null>(null)
const githubAttachments = ref<Attachment[][]>([])

// 返回上一页
const goBack = () => {
  router.go(-1)
}

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
const getPreviewUrl = (attachment: Attachment) => {
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
    const data = await fetchJobData(decodedUrl)
    jobData.value = data
    
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
        
        // 只请求一次附件，获取作业根目录下的所有文件
        const pathSegments = urlObj.pathname.split('/').filter(part => part)
        if (pathSegments.length >= 3) {
          // 构建作业根目录路径 (去掉最开始的user, repo, branch和最后的index.json)
          const basePath = pathSegments.slice(3, pathSegments.length - 1).join('/')
          
          // 获取一次附件即可
          const attachments = await fetchGithubAttachments(repoUrl, basePath)
          
          // 将附件分配给所有作业（因为它们共享同一目录）
          const attachmentsMap: Attachment[][] = []
          if (jobData.value.Homeworks) {
            jobData.value.Homeworks.forEach((_: any, index: number) => {
              attachmentsMap[index] = attachments
            })
          }
          
          githubAttachments.value = attachmentsMap
        }
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load job detail'
  } finally {
    loading.value = false
  }
}

// 计算按学科分组的作业
const groupedHomeworks = computed(() => {
  if (!jobData.value || !jobData.value.Homeworks) return {}
  
  const groups: { [key: string]: Homework[] } = {}
  jobData.value.Homeworks.forEach(homework => {
    const subject = homework.Subject || 'Unknown Subject'
    if (!groups[subject]) {
      groups[subject] = []
    }
    groups[subject].push(homework)
  })
  
  return groups
})

// 计算所有附件
const allAttachments = computed(() => {
  if (!githubAttachments.value) return []
  
  // 合并所有作业的附件
  const all: Attachment[] = []
  githubAttachments.value.forEach(attachments => {
    attachments.forEach(attachment => {
      // 避免重复添加相同名称的附件
      if (!all.some(a => a.name === attachment.name)) {
        all.push(attachment)
      }
    })
  })
  
  return all
})

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

.subject-group {
  margin-bottom: 20px;
}

.subject-title {
  font-size: 18px;
  color: #2196f3;
  margin: 15px 0 10px 0;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
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

.all-attachments {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #ddd;
}

.all-attachments h3 {
  margin-bottom: 20px;
  color: #333;
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