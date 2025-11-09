// 作业索引文件解析器 (版本1)

export interface JobIndexV1 {
  version: number;
  description: string;
  author?: string;
  last?: string;
  [key: string]: any; // 允许其他属性
}

/**
 * 解析作业索引文件 (版本1)
 * @param data 从index.json解析出的原始数据
 * @returns 标准化的作业索引对象
 * @throws {Error} 当数据格式不正确时抛出错误
 */
export function parseJobIndexV1(data: any): JobIndexV1 {
  // 验证必需字段
  if (!data.hasOwnProperty('description')) {
    throw new Error('Missing required field: description')
  }
  
  if (typeof data.description !== 'string') {
    throw new Error('Field "description" must be a string')
  }
  
  // 验证可选字段类型
  if (data.author !== undefined && typeof data.author !== 'string') {
    throw new Error('Field "author" must be a string')
  }
  
  if (data.last !== undefined && typeof data.last !== 'string') {
    throw new Error('Field "last" must be a string')
  }
  
  // 创建标准化的对象
  const jobIndex: JobIndexV1 = {
    version: 1, // 固定为版本1
    description: data.description,
    author: data.author,
    last: data.last
  };
  
  // 复制其他属性
  Object.keys(data).forEach(key => {
    if (!['version', 'description', 'author', 'last'].includes(key)) {
      jobIndex[key] = data[key];
    }
  });
  
  return jobIndex;
}