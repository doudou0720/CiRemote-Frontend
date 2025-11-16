/**
 * 内容过滤工具函数
 */

/**
 * 过滤内容中的XML标签，特别是FlowDocument等标签
 * @param content 原始内容
 * @returns 过滤后的纯文本内容
 */
export function filterXmlTags(content: string): string {
  if (!content) return content;
  
  // 检查是否包含XML标签的特征
  if (content.includes('<') && content.includes('>')) {
    // 特殊处理FlowDocument标签
    if (content.includes('<FlowDocument')) {
      // 尝试提取xml:lang属性中的中文内容
      const runMatch = content.match(/<Run[^>]*xml:lang="zh-cn"[^>]*>([^<]+)<\/Run>/i);
      if (runMatch && runMatch[1]) {
        return runMatch[1].trim();
      }
      
      // 如果没有找到特定的Run标签，尝试提取所有Run标签的内容
      const runMatches = content.match(/<Run[^>]*>([^<]+)<\/Run>/gi);
      if (runMatches && runMatches.length > 0) {
        return runMatches.map(match => {
          const textMatch = match.match(/<Run[^>]*>([^<]+)<\/Run>/i);
          return textMatch ? textMatch[1].trim() : '';
        }).filter(text => text.length > 0).join(' ');
      }
    }
    
    // 通用XML标签过滤
    // 使用DOM解析方法更安全地移除标签
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      return doc.body.textContent || doc.body.innerText || content;
    } catch (e) {
      // 如果DOM解析失败，使用正则表达式作为备选方案
      // Apply repeated replacement to fully remove fragmented or nested tags
      let filtered = content;
      let previous;
      do {
        previous = filtered;
        filtered = filtered.replace(/<[^>]*>/g, '');
      } while (filtered !== previous);
      return filtered.trim();
    }
  }
  
  // 如果不包含XML标签，直接返回原内容
  return content;
}