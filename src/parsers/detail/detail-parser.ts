// 通用详细信息解析器

import { parseStickyHomeworksDataV0, type StickyHomeworksDataV0 } from './detail-v0'

// 支持的版本列表
const SUPPORTED_VERSIONS = [0]

// 定义作业详情数据接口
interface DetailData {
  Description?: string;
  ExportDate: string;
  Homeworks: any[];
  [key: string]: any; // 允许其他属性
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
export const validateDetailData = (data: any): ValidationResult => {
  const errors: string[] = []
  
  // 检查必需字段
  if (!data.ExportDate || typeof data.ExportDate !== 'string') {
    errors.push('Missing or invalid "ExportDate" field')
  }
  
  if (!Array.isArray(data.Homeworks)) {
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
export const parseDetailData = (data: any): DetailData => {
  // 验证数据
  const validation = validateDetailData(data)
  if (!validation.isValid) {
    throw new Error(`Invalid detail data: ${validation.errors.join(', ')}`)
  }
  
  // 解析并返回标准化的数据
  return {
    Description: data.Description,
    ExportDate: data.ExportDate,
    Homeworks: data.Homeworks,
    ...data // 保留其他字段
  }
}
