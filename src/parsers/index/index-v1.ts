// 作业索引文件解析器 (版本1)

// 定义作业索引数据接口
interface JobIndexData {
  name: string;
  description: string;
  author: string;
  last: string;
  version: string;
  [key: string]: unknown; // 允许其他属性
}

/**
 * 验证作业索引数据
 * @param data - 要验证的数据
 * @returns 验证结果
 */
export const validateJobIndex = (data: unknown): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // 检查必需字段
  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  const jobData = data as Record<string, unknown>;
  
  if (!jobData.name || typeof jobData.name !== 'string') {
    errors.push('Missing or invalid "name" field')
  }
  
  if (!jobData.description || typeof jobData.description !== 'string') {
    errors.push('Missing or invalid "description" field')
  }
  
  if (!jobData.author || typeof jobData.author !== 'string') {
    errors.push('Missing or invalid "author" field')
  }
  
  if (!jobData.last || typeof jobData.last !== 'string') {
    errors.push('Missing or invalid "last" field')
  }
  
  if (!jobData.version || typeof jobData.version !== 'string') {
    errors.push('Missing or invalid "version" field')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 解析作业索引数据
 * @param data - 要解析的数据
 * @returns 解析后的数据
 */
export const parseJobIndex = (data: unknown): JobIndexData => {
  // 验证数据
  const validation = validateJobIndex(data)
  if (!validation.isValid) {
    throw new Error(`Invalid job index data: ${validation.errors.join(', ')}`)
  }
  
  const jobData = data as Record<string, unknown>;
  
  // 解析并返回标准化的数据
  return {
    name: jobData.name as string,
    description: jobData.description as string,
    author: jobData.author as string,
    last: jobData.last as string,
    version: jobData.version as string,
    ...jobData
  }
}