// StickyHomeworks JSON格式解析器 (版本0)

import { filterXmlTags } from '@/utils/contentFilter';

export interface Homework {
  Content: string;
  Subject: string;
  DueTime: string;
  Tags?: string[];
}

export interface StickyHomeworksDataV0 {
  Version: number;
  Description: string;
  ExportDate: string;
  Homeworks: Homework[];
}

/**
 * 解析StickyHomeworks JSON数据 (版本0)
 * @param data 从JSON文件解析出的原始数据
 * @returns 标准化的StickyHomeworks数据对象
 * @throws {Error} 当数据格式不正确时抛出错误
 */
export function parseStickyHomeworksDataV0(data: unknown): StickyHomeworksDataV0 {
  // 验证必需字段
  if (!data || typeof data !== 'object') {
    throw new Error('Data must be an object');
  }

  const obj = data as Record<string, unknown>;
  
  if (!obj.hasOwnProperty('Version')) {
    throw new Error('Missing required field: Version');
  }
  
  if (typeof obj.Version !== 'number') {
    throw new Error('Field "Version" must be a number');
  }
  
  if (obj.Version !== 0) {
    throw new Error(`Unsupported version: ${obj.Version}. Only version 0 is supported.`);
  }
  
  if (!obj.hasOwnProperty('Description')) {
    throw new Error('Missing required field: Description');
  }
  
  if (typeof obj.Description !== 'string') {
    throw new Error('Field "Description" must be a string');
  }
  
  if (!obj.hasOwnProperty('ExportDate')) {
    throw new Error('Missing required field: ExportDate');
  }
  
  if (typeof obj.ExportDate !== 'string') {
    throw new Error('Field "ExportDate" must be a string');
  }
  
  if (!obj.hasOwnProperty('Homeworks')) {
    throw new Error('Missing required field: Homeworks');
  }
  
  if (!Array.isArray(obj.Homeworks)) {
    throw new Error('Field "Homeworks" must be an array');
  }
  
  // 验证每个作业项
  for (let i = 0; i < obj.Homeworks.length; i++) {
    const homework = obj.Homeworks[i];
    
    if (!homework.hasOwnProperty('Content')) {
      throw new Error(`Homework item ${i} is missing required field: Content`);
    }
    
    if (typeof homework.Content !== 'string') {
      throw new Error(`Homework item ${i} field "Content" must be a string`);
    }
    
    if (!homework.hasOwnProperty('Subject')) {
      throw new Error(`Homework item ${i} is missing required field: Subject`);
    }
    
    if (typeof homework.Subject !== 'string') {
      throw new Error(`Homework item ${i} field "Subject" must be a string`);
    }
    
    if (!homework.hasOwnProperty('DueTime')) {
      throw new Error(`Homework item ${i} is missing required field: DueTime`);
    }
    
    if (typeof homework.DueTime !== 'string') {
      throw new Error(`Homework item ${i} field "DueTime" must be a string`);
    }
    
    if (homework.Tags !== undefined && !Array.isArray(homework.Tags)) {
      throw new Error(`Homework item ${i} field "Tags" must be an array`);
    }
    
    if (homework.Tags) {
      for (let j = 0; j < homework.Tags.length; j++) {
        if (typeof homework.Tags[j] !== 'string') {
          throw new Error(`Homework item ${i} Tags[${j}] must be a string`);
        }
      }
    }
  }
  
  // 创建标准化的对象
  const stickyHomeworksData: StickyHomeworksDataV0 = {
    Version: obj.Version,
    Description: obj.Description,
    ExportDate: obj.ExportDate,
    Homeworks: (obj.Homeworks as unknown[]).map((homeworkItem) => {
      const homework = homeworkItem as Record<string, unknown>;
      return {
        Content: filterXmlTags(homework.Content as string),
        Subject: homework.Subject as string,
        DueTime: homework.DueTime as string,
        Tags: homework.Tags as string[] | undefined
      }
    })
  };
  
  return stickyHomeworksData;
}

// 定义作业详情数据接口
interface DetailData {
  Description?: string;
  ExportDate: string;
  Homeworks: unknown[];
  [key: string]: unknown; // 允许其他属性
}

/**
 * 验证作业详情数据
 * @param data - 要验证的数据
 * @returns 验证结果
 */
export const validateDetailData = (data: unknown): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  const detailData = data as Record<string, unknown>;
  
  // 检查必需字段
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
