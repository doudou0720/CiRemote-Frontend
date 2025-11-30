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
      <div class="job-detail-header">
        <h2>{{ jobData.Description || $t('unnamedJob') }}</h2>
        <button @click="scrollToShareSectionAndShow" class="share-toggle-button" :title="$t('shareLink')">
          <i class="layui-icon layui-icon-share"></i>
        </button>
      </div>
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
                  v-for="tag in homework.Tags" 
                  :key="tag"
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
      
      <!-- 附件列表 -->
      <div v-if="allAttachments.length > 0" class="attachments-section">
        <h3>{{ $t('attachments') }}</h3>
        <ul class="attachment-list">
          <li v-for="attachment in allAttachments" :key="attachment.name">
            <a 
              href="javascript:void(0)"
              @click="handleAttachmentClick(attachment)"
              :title="attachment.name"
            >
              {{ attachment.name }}
            </a>
          </li>
        </ul>
      </div>
      
      <!-- 添加分享链接 -->
      <div v-if="showShareSection" id="share-section" class="share-section">
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
      
    </div>
    <div v-else class="no-data">
      {{ $t('noJobData') }}
    </div>
    
    <!-- 添加返回按钮 -->
    <div class="actions">
      <button @click="goBack" class="back-button">{{ $t('back') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { parseDetailData, validateDetailData } from '@/parsers/detail/detail-parser'
import { canPreviewWithOffice, getOfficePreviewUrl } from '@/utils/fileexplorer'
import { filterXmlTags } from '@/utils/contentFilter'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const jobData = ref<any>(null)
const githubAttachments = ref<any[]>([])
const showShareSection = ref(false)

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


// 计算属性：按学科分组的作业
const groupedHomeworks = computed(() => {
  if (!jobData.value || !jobData.value.Homeworks) return {};
  
  const groups: Record<string, Homework[]> = {};
  jobData.value.Homeworks.forEach((homework: Homework) => {
    const subject = homework.Subject || 'Unknown Subject';
    if (!groups[subject]) {
      groups[subject] = [];
    }
    groups[subject].push(homework);
  });
  
  return groups;
});

// 计算属性：所有附件列表（去重）
const allAttachments = computed(() => {
  if (!githubAttachments.value) {
    return [];
  }

  // 合并所有附件并去重
  const all: Attachment[] = [];
  const seen = new Set<string>();
  
  githubAttachments.value.forEach(attachments => {
    attachments.forEach((attachment: Attachment) => {
      if (!seen.has(attachment.name)) {
        seen.add(attachment.name);
        all.push(attachment);
      }
    });
  });

  return all;
});

// 解码base64字符串
const decodeBase64 = (str: string): string => {
  try {
    return atob(str)
  } catch (_e) {
    return str // 如果解码失败，返回原始字符串
  }
}

// 格式化导出日期
const formatExportDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (_e) {
    return dateString;
  }
}

// 格式化截止时间
const formatDueTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (_e) {
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
    
    // 准备请求选项
    const fetchOptions: RequestInit = {}
    
    // 如果有存储的GitHub Token，则添加Authorization头部
    const { getStoredGithubToken } = await import('@/utils/jobUrlHandler')
    const token = getStoredGithubToken()
    if (token) {
      fetchOptions.headers = {
        'Authorization': `token ${token}`,
        'User-Agent': 'CiRemote-Frontend'
      }
    }
    
    const response = await fetch(apiUrl, fetchOptions)
    // 特别处理403速率限制错误
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.')
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch attachments: ${response.status} ${response.statusText}`)
    }
    
    const files = await response.json()
    
    // 过滤掉目录，只保留文件
    return files.filter((file: any) => file.type === 'file' && file.name !== 'index.json')
  } catch (err: any) {
    console.error('Failed to fetch GitHub attachments:', err)
    // 显示更友好的错误消息
    if (err.message.includes('rate limit')) {
      alert(t('rateLimitExceeded'));
    }
    return []
  }
}

// 获取作业数据
const fetchJobData = async (url: string) => {
  try {
    let finalUrl = url;
    let isGithubApi = false;
    let originalRawUrl = ''; // 保存原始raw URL用于fallback
    let repoInfo = ''; // 保存仓库信息用于错误提示
    
    // 检查是否是GitHub仓库URL，如果是则转换为API URL
    if (url.startsWith('https://github.com/')) {
      try {
        // 将GitHub仓库URL转换为API URL
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(part => part)
        
        if (pathParts.length < 2) {
          throw new Error('Invalid GitHub repository URL')
        }
        
        const user = pathParts[0]
        const repo = pathParts[1]
        let apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/index.json`
        
        // 保存仓库信息用于错误提示
        repoInfo = `${user}/${repo}`
        
        // 检查是否有 ref 查询参数（分支名称）
        const urlParams = new URLSearchParams(urlObj.search);
        const branch = urlParams.get('ref');
        const ref = branch || 'main'; // 默认使用main分支
        if (branch) {
          apiUrl += `?ref=${encodeURIComponent(branch)}`;
        }
        
        // 构造对应的raw URL用于fallback
        originalRawUrl = `https://raw.githubusercontent.com/${user}/${repo}/${ref}/index.json`;
        
        finalUrl = apiUrl;
        isGithubApi = true;
      } catch (urlError: any) {
        throw new Error(`Invalid URL format: ${urlError.message}`);
      }
    }
    
    // 检查是否是raw.githubusercontent.com URL，如果是则转换为API URL
    if (url.startsWith('https://raw.githubusercontent.com/')) {
      originalRawUrl = url; // 保存原始raw URL用于fallback
      
      try {
        // 将raw URL转换为API URL
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(part => part);
        
        if (pathParts.length < 3) {
          throw new Error('Invalid raw GitHub URL');
        }
        
        const user = pathParts[0];
        const repo = pathParts[1];
        const ref = pathParts[2]; // 分支名
        const filePath = pathParts.slice(3).join('/'); // 文件路径
        
        // 保存仓库信息用于错误提示
        repoInfo = `${user}/${repo}`
        
        let apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${filePath}`;
        apiUrl += `?ref=${ref}`;
        
        finalUrl = apiUrl;
        isGithubApi = true;
      } catch (urlError: any) {
        throw new Error(`Invalid raw URL format: ${urlError.message}`);
      }
    }
    
    // 准备请求选项
    const fetchOptions: RequestInit = {};
    
    // 如果是GitHub API请求且有存储的Token，则添加Authorization头部
    if (isGithubApi) {
      const { getStoredGithubToken } = await import('@/utils/jobUrlHandler');
      const token = getStoredGithubToken();
      if (token) {
        fetchOptions.headers = {
          'Authorization': `token ${token}`,
          'User-Agent': 'CiRemote-Frontend'
        };
      }
    }
    
    let response = await fetch(finalUrl, fetchOptions);
    let isFallback = false;
    
    // 如果GitHub API返回403，则尝试使用raw URL
    if (isGithubApi && response.status === 403 && originalRawUrl) {
      console.log('GitHub API returned 403, trying raw URL as fallback');
      isFallback = true;
      try {
        response = await fetch(originalRawUrl);
      } catch (fallbackError) {
        // 如果 fallback 请求也失败，抛出原始错误
        let errorMessage = 'Unknown error';
        if (fallbackError instanceof Error) {
          errorMessage = fallbackError.message;
        }
        throw new Error(`GitHub API returned 403 and fallback request failed: ${errorMessage}`);
      }
    }
    
    // 如果是GitHub API请求且返回404，则尝试检查仓库是否存在
    if (isGithubApi && response.status === 404 && repoInfo) {
      // 检查仓库是否存在
      const repoCheckUrl = `https://api.github.com/repos/${repoInfo}`;
      const repoResponse = await fetch(repoCheckUrl, fetchOptions);
      
      if (repoResponse.status === 404) {
        throw new Error(`Repository ${repoInfo} not found`);
      } else if (!repoResponse.ok) {
        throw new Error(`Failed to check repository ${repoInfo}: ${repoResponse.status} ${repoResponse.statusText}`);
      }
      
      // 仓库存在但index.json不存在
      throw new Error(`index.json not found in repository ${repoInfo}`);
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${isFallback ? originalRawUrl : finalUrl}: ${response.status} ${response.statusText}`);
    }
    
    let text = '';
    if (isGithubApi && !isFallback) {
      // 解析 GitHub API 响应并获取文件内容
      const responseData = await response.json();
      // GitHub API 返回的内容是base64编码的，需要解码
      const content = atob(responseData.content);
      
      // 处理可能的编码问题
      const decoder = new TextDecoder('utf-8');
      const encodedBytes = new Uint8Array(content.length);
      for (let i = 0; i < content.length; i++) {
        encodedBytes[i] = content.charCodeAt(i);
      }
      text = decoder.decode(encodedBytes);
    } else {
      // 直接获取文本内容 (包括fallback情况)
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
      text = decoder.decode(buffer);
    }
    
    const data = JSON.parse(text);
    
    // 验证并解析详细信息数据
    const validation = validateDetailData(data);
    if (!validation.isValid) {
      throw new Error(`Invalid detail data: ${validation.errors.join(', ')}`);
    }
    
    return parseDetailData(data);
  } catch (err: any) {
    // 显示更详细的错误信息，包括HTTP状态和实际内容
    throw new Error(`获取作业数据失败: ${err.message}`);
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
    // 解码URL参数（可能需要多次解码）
    let decodedUrl = '';
    try {
      // 首次解码
      decodedUrl = atob(decodeURIComponent(urlParam))
      console.log('First decoded URL:', decodedUrl);
      
      // 检查是否还需要进一步解码（如果解码后仍然是Base64格式）
      if (decodedUrl.startsWith('http') === false) {
        try {
          // 尝试再次解码
          const doubleDecoded = atob(decodedUrl);
          // 如果成功且是有效的URL，则使用双重解码的结果
          if (doubleDecoded.startsWith('http')) {
            decodedUrl = doubleDecoded;
            console.log('Double decoded URL:', decodedUrl);
          }
        } catch (_e) {
          // 如果再次解码失败，就使用第一次解码的结果
          console.log('Single decoding was correct');
        }
      }
    } catch (decodeError: any) {
      throw new Error(`Failed to decode URL parameter: ${decodeError.message}`);
    }
    
    // 验证URL是否有效
    try {
      new URL(decodedUrl);
    } catch (urlError) {
      throw new Error(`Invalid URL format: ${urlError.message}`);
    }
    
    // 获取作业数据
    const data = await fetchJobData(decodedUrl)
    jobData.value = data
    
    // 检查是否是GitHub URL，如果是则获取附件
    if (decodedUrl.startsWith('https://raw.githubusercontent.com/') || 
        decodedUrl.startsWith('https://github.com/') ||
        decodedUrl.includes('api.github.com')) {
      
      let user, repo, branch = 'main';
      let repoUrl = '';
      
      if (decodedUrl.startsWith('https://raw.githubusercontent.com/')) {
        // 从raw URL解析GitHub仓库信息
        const urlObj = new URL(decodedUrl)
        const pathParts = urlObj.pathname.split('/').filter(part => part)
        
        if (pathParts.length >= 3) {
          user = pathParts[0]
          repo = pathParts[1]
          branch = pathParts[2] || 'main'
          repoUrl = `https://github.com/${user}/${repo}?ref=${branch}`
        }
      } else if (decodedUrl.includes('api.github.com')) {
        // 处理 GitHub API URL
        const urlObj = new URL(decodedUrl)
        const pathParts = urlObj.pathname.split('/').filter(part => part)
        
        if (pathParts.length >= 5) { // /repos/{owner}/{repo}/contents/{path}
          user = pathParts[1]
          repo = pathParts[2]
          // 对于 API 请求，默认使用 main 分支，但检查查询参数
          const urlParams = new URLSearchParams(urlObj.search)
          branch = urlParams.get('ref') || 'main'
          repoUrl = `https://github.com/${user}/${repo}?ref=${branch}`
        }
      } else if (decodedUrl.startsWith('https://github.com/')) {
        // 处理标准GitHub仓库URL
        const urlObj = new URL(decodedUrl)
        const pathParts = urlObj.pathname.split('/').filter(part => part)
        
        if (pathParts.length >= 2) {
          user = pathParts[0]
          repo = pathParts[1]
          const urlParams = new URLSearchParams(urlObj.search)
          branch = urlParams.get('ref') || 'main'
          repoUrl = `https://github.com/${user}/${repo}?ref=${branch}`
        }
      }
      
      if (user && repo && repoUrl) {
        // 获取作业详情文件所在的目录路径
        try {
          // 解析当前index.json文件的路径
          const urlObj = new URL(decodedUrl);
          let basePath = '';
          
          if (decodedUrl.includes('api.github.com')) {
            // 对于API URL，需要特殊处理
            const pathParts = urlObj.pathname.split('/').filter(part => part);
            if (pathParts.length >= 5) { // /repos/{owner}/{repo}/contents/{path}
              // 提取文件路径部分
              const filePathParts = pathParts.slice(4); // 跳过 repos/{owner}/{repo}/contents
              if (filePathParts.length > 0) {
                // 移除最后的index.json部分
                filePathParts.pop();
                basePath = filePathParts.join('/');
              }
            }
          } else if (decodedUrl.startsWith('https://raw.githubusercontent.com/')) {
            // 对于raw URL，路径是完整的
            const pathParts = urlObj.pathname.split('/').filter(part => part);
            if (pathParts.length > 3) { // 至少要有 user/repo/branch/
              // 移除最后的index.json部分
              pathParts.pop();
              basePath = pathParts.slice(3).join('/'); // 跳过 user/repo/branch 部分
            }
          } else if (decodedUrl.startsWith('https://github.com/')) {
            // 对于GitHub URL，我们已经转换为带ref参数的URL
            // 从原始URL中提取路径信息
            const originalUrlObj = new URL(decodedUrl.split('?')[0]);
            const pathParts = originalUrlObj.pathname.split('/').filter(part => part);
            if (pathParts.length > 2) { // 至少要有 user/repo/
              // 移除最后的index.json部分（如果有）
              if (pathParts[pathParts.length-1] === 'index.json') {
                pathParts.pop();
              }
              basePath = pathParts.slice(2).join('/');
            }
          }
          
          // 构造正确的仓库URL用于获取附件
          let attachmentsRepoUrl = `https://github.com/${user}/${repo}`;
          const originalUrlObj = new URL(decodedUrl);
          const urlParams = new URLSearchParams(originalUrlObj.search);
          const ref = urlParams.get('ref') || 'main';
          attachmentsRepoUrl += `?ref=${ref}`;
          
          // 获取同目录下的所有文件（除了index.json）
          const attachments = await fetchGithubAttachments(attachmentsRepoUrl, basePath);
          // 为所有作业使用相同的附件列表
          githubAttachments.value = jobData.value.Homeworks.map(() => attachments);
        } catch (_pathError) {
          console.error('Error parsing file path:', _pathError);
          // 出错时回退到原来的方法
          const attachmentsPromises = jobData.value.Homeworks.map(async (homework: Homework, index: number) => {
            // 构建作业目录路径，使用Subject作为目录名
            const subject = homework.Subject || `homework_${index}`;
            const homeworkPath = `data/${subject}`;
            return await fetchGithubAttachments(repoUrl, homeworkPath);
          });
          
          githubAttachments.value = await Promise.all(attachmentsPromises);
        }
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load job detail'
  } finally {
    loading.value = false
  }
}

// 计算分享链接（改为邀请链接）
const shareLink = computed(() => {
  // 获取当前作业的原始URL（从路由参数中）
  const jobUrl = route.query.url as string || '';
  
  // 构造邀请链接，使用Base64编码URL
  const decodedUrl = decodeBase64(decodeURIComponent(jobUrl));
  const encodedUrl = encodeURIComponent(btoa(decodedUrl));
  
  const inviteRoute = router.resolve({
    path: '/jobs/invite',
    query: {
      url: encodedUrl // 传递Base64编码后的URL作为参数
    }
  });
  
  return `${window.location.origin}${inviteRoute.href}`;
});

// 滚动到分享链接区域并显示它
const scrollToShareSectionAndShow = () => {
  showShareSection.value = true;
  setTimeout(() => {
    const shareSection = document.getElementById('share-section');
    if (shareSection) {
      shareSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
}

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

// 处理附件点击事件
const handleAttachmentClick = (attachment: Attachment) => {
  // 检查是否可以预览
  if (canPreviewWithOffice(attachment.name)) {
    // 使用 layui 的 layer.confirm 替代原生 confirm
    const layui = (window as any).layui;
    if (layui && typeof layui.use === 'function') {
      layui.use('layer', () => {
        const layer = layui.layer;
        
        layer.confirm(`${t('previewOrDownload')} "${attachment.name}"?`, {
          title: t('previewTitle'),
          btn: [t('preview'), t('download')], // 按钮文字
          icon: 3, // 问号图标
          skin: 'layui-layer-molv' // 墨绿主题
        }, 
        () => { // 点击预览
          const previewUrl = getPreviewUrl(attachment);
          layer.open({
            type: 1,
            title: `${t('previewing')} "${attachment.name}"`,
            area: ['80%', '80%'],
            content: `<iframe src="${previewUrl}" style="width:100%;height:100%;border:none;"></iframe>`,
            btn: [t('download')],
            yes: function(index: number) {
              window.open(attachment.download_url, '_blank');
              layer.close(index);
            }
          });
        }, 
        () => { // 点击下载或者关闭
          window.open(attachment.download_url, '_blank');
        });
      });
    } else {
      // 如果layui不可用，使用原生confirm作为备选方案
      const choice = confirm(`${t('previewOrDownload')} "${attachment.name}"? \n${t('confirmPreview')} \n${t('cancelDownload')}`);
      if (choice) {
        // 用户选择预览
        window.open(getPreviewUrl(attachment), '_blank');
      } else {
        // 用户选择下载
        window.open(attachment.download_url, '_blank');
      }
    }
  } else {
    // 直接下载
    window.open(attachment.download_url, '_blank');
  }
};

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

.job-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.share-toggle-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
  color: #666;
}

.share-toggle-button:hover {
  color: #333;
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
  justify-content: flex-start; /* Align with content flow */
  gap: 10px; /* Consistent spacing */
}

.back-button {
  padding: 10px 20px;
  background-color: #28a745; /* Consistent with copy button */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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
