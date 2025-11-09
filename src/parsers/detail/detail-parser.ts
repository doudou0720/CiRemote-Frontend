// 通用详细信息解析器

import { parseStickyHomeworksDataV0, type StickyHomeworksDataV0 } from './detail-v0'

// 支持的版本列表
const SUPPORTED_VERSIONS = [0]

export type DetailData = StickyHomeworksDataV0 // 当前只支持V0版本

/**
 * 解析详细信息文件
 * @param data 从detail.json解析出的原始数据
 * @returns 标准化的详细信息对象
 * @throws {Error} 当版本不支持或数据格式不正确时抛出错误
 */
export function parseDetailData(data: any): DetailData {
  // 检查是否存在版本号
  if (!data.hasOwnProperty('Version')) {
    throw new Error('Missing required field: Version')
  }
  
  // 检查版本是否受支持
  if (!SUPPORTED_VERSIONS.includes(data.Version)) {
    throw new Error(`详细信息文件版本不支持: ${data.Version}。仅支持版本 ${SUPPORTED_VERSIONS.join(', ')}。`)
  }
  
  // 根据版本号选择相应的解析器
  switch (data.Version) {
    case 0:
      return parseStickyHomeworksDataV0(data)
    default:
      throw new Error(`详细信息文件版本不支持: ${data.Version}。仅支持版本 ${SUPPORTED_VERSIONS.join(', ')}。`)
  }
}

/**
 * 验证详细信息对象
 * @param data 待验证的数据
 * @returns 验证结果
 */
export function validateDetailData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.hasOwnProperty('Version')) {
    errors.push('Missing required field: Version')
    return {
      isValid: false,
      errors
    }
  }
  
  if (!SUPPORTED_VERSIONS.includes(data.Version)) {
    errors.push(`详细信息文件版本不支持: ${data.Version}。仅支持版本 ${SUPPORTED_VERSIONS.join(', ')}。`)
    return {
      isValid: false,
      errors
    }
  }
  
  // 根据版本号选择相应的验证器
  switch (data.Version) {
    case 0:
      // 对于V0版本，直接使用V0验证器
      return { isValid: true, errors: [] }
    default:
      errors.push(`详细信息文件版本不支持: ${data.Version}。仅支持版本 ${SUPPORTED_VERSIONS.join(', ')}。`)
      return {
        isValid: false,
        errors
      }
  }
}