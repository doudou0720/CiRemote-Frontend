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
      
      <!-- 添加分享链接 -->
      <div class="share-section">
        <p class="share-label">{{ $t('shareLink') }}:</p>
        <div class="share-link-container">
          <input 
            type="text" 
            :value="shareLink" 
            readonly 
            class="share-link-input"
            @focus="onFocus"
          />
          <button @click="copyShareLink" class="copy-button">{{ $t('copy') }}</button>
        </div>
      </div>
      
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
  [key: string]: unknown;
}

// 定义作业类型
interface Homework {
  Subject: string;
  Content: string;
  DueTime: string;
  Tags?: string[];
  [key: string]: unknown;
}

// 定义作业数据类型
interface JobData {
  Description?: string;
  ExportDate: string;
  Homeworks: Homework[];
  [key: string]: unknown;
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
const githubAttachments = ref<Attachment[]>([])

// 计算分享链接
const shareLink = computed(() => {
  const currentRoute = router.resolve({
    path: '/',
    query: {
      jump: route.fullPath
    }
  })
  return `${window.location.origin}${currentRoute.href}`
})

// 复制分享链接
const copyShareLink = () => {
  navigator.clipboard.writeText(shareLink.value)
    .then(() => {
      alert('链接已复制到剪贴板')
    })
    .catch(() => {
      // 降级方案：选择文本
      const input = document.querySelector('.share-link-input') as HTMLInputElement
      if (input) {
        input.select()
        document.execCommand('copy')
        alert('链接已复制到剪贴板')
      }
    })
}

// 处理输入框聚焦事件
const onFocus = (event: FocusEvent) => {
  const target = event.target as HTMLInputElement
  target.select()
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 解码base64字符串
const decodeBase64 = (str: string): string => {
  try {
    return atob(str)
  } catch (_e: unknown) {
    return str // 如果解码失败，返回原始字符串
  }
}

// 格式化导出日期
const formatExportDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (_e: unknown) {
    return dateString;
  }
}

// 格式化截止时间
const formatDueTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (_e: unknown) {
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
    return files.filter((file: { type: string; name: string }) => file.type === 'file' && file.name !== 'index.json')
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Failed to fetch GitHub attachments:', error)
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
  } catch (err: unknown) {
    const error = err as Error;
    throw new Error(`Failed to fetch job data: ${error.message}`)
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
    jobData.value = data as unknown as JobData
    
    // 检查是否是GitHub URL，如果是则获取附件列表
    if (decodedUrl.startsWith('https://raw.githubusercontent.com/')) {
      // 从raw URL解析GitHub仓库信息
      const urlObj = new URL(decodedUrl);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      
      if (pathParts.length >= 4) { // 至少要有 user/repo/branch/path/index.json
        const user = pathParts[0];
        const repo = pathParts[1];
        const branch = pathParts[2];
        // 构建API请求路径（不含index.json）
        const dirPath = pathParts.slice(3, -1).join('/');
        const repoUrl = `https://github.com/${user}/${repo}`;
        
        // 直接调用并赋值给一个临时变量用于后续计算
        const attachments = await fetchGithubAttachments(
          `${repoUrl}?ref=${branch}`, 
          dirPath
        );
        
        // 将附件附加到 jobData 上以便 allAttachments 计算
        (jobData.value as JobData & { _fetchedAttachments?: Attachment[] })._fetchedAttachments = attachments;
      }
    }
  } catch (err: unknown) {
    const e = err as Error;
    error.value = e.message || 'Failed to load job detail'
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
  if (!jobData.value) return [];
  
  const jobWithAttachments = jobData.value as JobData & { _fetchedAttachments?: Attachment[] };
  const attachments = jobWithAttachments._fetchedAttachments || [];
  
  // 去重：避免相同名称的附件重复显示
  const seen = new Set<string>();
  const unique: Attachment[] = [];
  attachments.forEach(att => {
    if (!seen.has(att.name)) {
      seen.add(att.name);
      unique.push(att);
    }
  });
  
  return unique;
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
  display: flex;
  justify-content: center;
}

.back-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.back-button:hover {
  background-color: #0056b3;
}

/* 分享链接样式 */
.share-section {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.share-label {
  margin: 0 0 10px 0;
  font-weight: bold;
  color: #495057;
}

.share-link-container {
  display: flex;
  gap: 10px;
}

.share-link-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.copy-button {
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.copy-button:hover {
  background-color: #218838;
}

@media (max-width: 768px) {
  .share-link-container {
    flex-direction: column;
  }
  
  .copy-button {
    align-self: flex-start;
  }
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
