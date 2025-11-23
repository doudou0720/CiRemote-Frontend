// 通用作业索引解析器

// 定义作业索引数据接口
interface JobIndexData {
    name: string;
    description: string;
    author: string;
    last: string;
    version: string;
    [key: string]: unknown; // 允许其他属性
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
export const validateJobIndex = (data: unknown): ValidationResult => {
    const errors: string[] = []

    // 检查必需字段
    if (!data || typeof data !== 'object') {
        errors.push('Data must be an object');
        return {
            isValid: errors.length === 0,
            errors
        }
    }

    const jobData = data as Record < string,
        unknown > ;

    // 如果缺少name字段，使用description作为name
    if (!jobData.name) {
        if (jobData.description && typeof jobData.description === 'string') {
            // 自动使用description作为name
            jobData.name = jobData.description;
        } else {
            errors.push('Missing "name" field and no suitable fallback available');
        }
    } else if (typeof jobData.name !== 'string') {
        errors.push('Invalid "name" field - must be a string')
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

    // 允许version为数字或字符串，统一转换为字符串
    if (jobData.version === undefined || jobData.version === null) {
        errors.push('Missing "version" field')
    } else if (typeof jobData.version !== 'string' && typeof jobData.version !== 'number') {
        errors.push('Invalid "version" field - must be a string or number')
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

    const jobData = data as Record < string,
        unknown > ;

    // 确保name字段存在
    let name = jobData.name as string;
    if (!name && jobData.description) {
        name = jobData.description as string;
    }

    // 确保version是字符串
    let version = jobData.version;
    if (typeof version === 'number') {
        version = version.toString();
    }

    // 解析并返回标准化的数据
    return {
        name: name,
        description: jobData.description as string,
        author: jobData.author as string,
        last: jobData.last as string,
        version: version as string,
        ...jobData
    }
}