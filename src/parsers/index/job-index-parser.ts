// 通用作业索引解析器

// 定义作业索引数据接口
interface JobIndexData {
  name: string;
  description: string;
  author: string;
  last: string;
  version: string;
  [key: string]: any; // 允许其他属性
}

// 定义验证结果接口
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 验证作业索引数据
 * @param data - 要验证的数据
 * @returns 验证结果
 */
export const validateJobIndex = (data: any): ValidationResult => {
  const errors: string[] = []
  
  // 检查必需字段
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Missing or invalid "name" field')
  }
  
  if (!data.description || typeof data.description !== 'string') {
    errors.push('Missing or invalid "description" field')
  }
  
  if (!data.author || typeof data.author !== 'string') {
    errors.push('Missing or invalid "author" field')
  }
  
  if (!data.last || typeof data.last !== 'string') {
    errors.push('Missing or invalid "last" field')
  }
  
  if (!data.version || typeof data.version !== 'string') {
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
export const parseJobIndex = (data: any): JobIndexData => {
  // 验证数据
  const validation = validateJobIndex(data)
  if (!validation.isValid) {
    throw new Error(`Invalid job index data: ${validation.errors.join(', ')}`)
  }
  
  // 解析并返回标准化的数据
  return {
    name: data.name,
    description: data.description,
    author: data.author,
    last: data.last,
    version: data.version,
    ...data // 保留其他字段
  }
}