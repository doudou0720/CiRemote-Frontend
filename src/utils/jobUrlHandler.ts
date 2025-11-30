// 获取存储的GitHub Token
export function getStoredGithubToken(): string | null {
  if (typeof window !== 'undefined' && (window as any).layui) {
    try {
      const settings = (window as any).layui.data('ciremote_settings', {
        key: 'user_settings'
      });
      
      if (settings && settings.githubToken) {
        return settings.githubToken;
      }
    } catch (e) {
      console.error('获取GitHub Token失败:', e);
    }
  }
  
  return null;
}

// 将GitHub API URL转换为Raw URL
export function convertGithubApiUrlToRawUrl(apiUrl: string): string | null {
  try {
    // 解析API URL
    const url = new URL(apiUrl);
    if (url.hostname !== 'api.github.com') {
      return null;
    }
    
    // 提取路径部分
    // 例如: /repos/user/repo/contents/path/to/file
    const pathParts = url.pathname.split('/').filter(part => part);
    
    if (pathParts.length < 4 || pathParts[0] !== 'repos') {
      return null;
    }
    
    const owner = pathParts[1];
    const repo = pathParts[2];
    
    // 获取ref参数（分支或标签）
    const ref = url.searchParams.get('ref') || 'main';
    
    // 构建剩余路径
    const filePath = pathParts.slice(4).join('/');
    
    // 构造Raw URL
    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`;
  } catch (error) {
    console.error('转换GitHub API URL到Raw URL失败:', error);
    return null;
  }
}