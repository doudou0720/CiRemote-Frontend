// StickyHomeworks JSON格式解析器 (版本0)

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
export function parseStickyHomeworksDataV0(data: any): StickyHomeworksDataV0 {
  // 验证必需字段
  if (!data.hasOwnProperty('Version')) {
    throw new Error('Missing required field: Version');
  }
  
  if (typeof data.Version !== 'number') {
    throw new Error('Field "Version" must be a number');
  }
  
  if (data.Version !== 0) {
    throw new Error(`Unsupported version: ${data.Version}. Only version 0 is supported.`);
  }
  
  if (!data.hasOwnProperty('Description')) {
    throw new Error('Missing required field: Description');
  }
  
  if (typeof data.Description !== 'string') {
    throw new Error('Field "Description" must be a string');
  }
  
  if (!data.hasOwnProperty('ExportDate')) {
    throw new Error('Missing required field: ExportDate');
  }
  
  if (typeof data.ExportDate !== 'string') {
    throw new Error('Field "ExportDate" must be a string');
  }
  
  if (!data.hasOwnProperty('Homeworks')) {
    throw new Error('Missing required field: Homeworks');
  }
  
  if (!Array.isArray(data.Homeworks)) {
    throw new Error('Field "Homeworks" must be an array');
  }
  
  // 验证每个作业项
  for (let i = 0; i < data.Homeworks.length; i++) {
    const homework = data.Homeworks[i];
    
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
    Version: data.Version,
    Description: data.Description,
    ExportDate: data.ExportDate,
    Homeworks: data.Homeworks.map((homework: any) => ({
      Content: homework.Content,
      Subject: homework.Subject,
      DueTime: homework.DueTime,
      Tags: homework.Tags
    }))
  };
  
  return stickyHomeworksData;
}