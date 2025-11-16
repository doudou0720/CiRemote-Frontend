/**
 * 文件预览工具函数
 */

/**
 * 检查文件是否可以通过Office Online预览
 * @param fileName 文件名
 * @returns 如果可以通过Office Online预览则返回true，否则返回false
 */
export function canPreviewWithOffice(fileName: string): boolean {
  const officeExtensions = [
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.odt', '.ods', '.odp', '.rtf', '.csv'
  ];
  
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return officeExtensions.includes(ext);
}

/**
 * 生成Office Online预览URL
 * @param fileUrl 文件的URL
 * @returns Office Online预览URL
 */
export function getOfficePreviewUrl(fileUrl: string): string {
  return `http://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
}

/**
 * 根据文件扩展名判断文件类型
 * @param fileName 文件名
 * @returns 文件类型
 */
export function getFileType(fileName: string): string {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const textExtensions = ['.txt', '.md', '.log'];
  const pdfExtensions = ['.pdf'];
  
  if (imageExtensions.includes(ext)) {
    return 'image';
  } else if (textExtensions.includes(ext)) {
    return 'text';
  } else if (pdfExtensions.includes(ext)) {
    return 'pdf';
  } else if (canPreviewWithOffice(fileName)) {
    return 'office';
  } else {
    return 'unknown';
  }
}