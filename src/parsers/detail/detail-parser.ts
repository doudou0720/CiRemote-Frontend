// 通用详细信息解析器

// 定义作业详情数据接口
interface DetailData {
  Description?: string;
  ExportDate: string;
  Homeworks: unknown[];
  [key: string]: unknown; // 允许其他属性
}

// 定义验证结果接口
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 验证作业详情数据
 * @param data - 要验证的数据
 * @returns 验证结果
 */
export const validateDetailData = (data: unknown): ValidationResult => {
  const errors: string[] = []
  
  // 检查必需字段
  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object')
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  const detailData = data as Record<string, unknown>;
  
  if (!detailData.ExportDate || typeof detailData.ExportDate !== 'string') {
    errors.push('Missing or invalid "ExportDate" field')
  }
  
  if (!Array.isArray(detailData.Homeworks)) {
    errors.push('Missing or invalid "Homeworks" field - must be an array')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 解析作业详情数据
 * @param data - 要解析的数据
 * @returns 解析后的数据
 */
export const parseDetailData = (data: unknown): DetailData => {
  // 验证数据
  const validation = validateDetailData(data)
  if (!validation.isValid) {
    throw new Error(`Invalid detail data: ${validation.errors.join(', ')}`)
  }
  
  const detailData = data as Record<string, unknown>;
  
  return {
    Description: detailData.Description as string | undefined,
    ExportDate: detailData.ExportDate as string,
    Homeworks: detailData.Homeworks as unknown[],
    ...detailData
  }
}