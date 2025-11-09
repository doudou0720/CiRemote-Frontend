// 通用作业索引解析器

import { parseJobIndexV1, type JobIndexV1 } from './index-v1'

// 支持的版本列表
const SUPPORTED_VERSIONS = [1]

export type JobIndex = JobIndexV1 // 当前只支持V1版本

/**
 * 解析作业索引文件
 * @param data 从index.json解析出的原始数据
 * @returns 标准化的作业索引对象
 * @throws {Error} 当版本不支持或数据格式不正确时抛出错误
 */
export function parseJobIndex(data: any): JobIndex {
  // 检查是否存在版本号
  if (!data.hasOwnProperty('version')) {
    throw new Error('Missing required field: version')
  }
  
  // 检查版本是否受支持
  if (!SUPPORTED_VERSIONS.includes(data.version)) {
    throw new Error(`索引文件版本不支持: ${data.version}。仅支持版本 ${SUPPORTED_VERSIONS.join(', ')}。`)
  }
  
  // 根据版本号选择相应的解析器
  switch (data.version) {
    case 1:
      return parseJobIndexV1(data)
    default:
      throw new Error(`索引文件版本不支持: ${data.version}。仅支持版本 ${SUPPORTED_VERSIONS.join(', ')}。`)
  }
}

/**
 * 验证作业索引对象
 * @param data 待验证的数据
 * @returns 验证结果
 */
export function validateJobIndex(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.hasOwnProperty('version')) {
    errors.push('Missing required field: version')
    return {
      isValid: false,
      errors
    }
  }
  
  if (!SUPPORTED_VERSIONS.includes(data.version)) {
    errors.push(`索引文件版本不支持: ${data.version}。仅支持版本 ${SUPPORTED_VERSIONS.join(', ')}。`)
    return {
      isValid: false,
      errors
    }
  }
  
  // 根据版本号选择相应的验证器
  switch (data.version) {
    case 1:
      // 对于V1版本，直接使用V1验证器
      return { isValid: true, errors: [] }
    default:
      errors.push(`索引文件版本不支持: ${data.version}。仅支持版本 ${SUPPORTED_VERSIONS.join(', ')}。`)
      return {
        isValid: false,
        errors
      }
  }
}