function isImageUrl(url: string): boolean {
  // 使用正则表达式检查URL格式
  const urlRegex = /^https?:\/\//
  return urlRegex.test(url)
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function downloadFileByBase64(urlOrFile: string | File) {
  let base64Data: string
  if (isImageUrl(urlOrFile as string)) {
    // 网络图片转base64
    base64Data = await fetchImageAsBase64(urlOrFile as string)
  } else if (urlOrFile instanceof File) {
    // 本地文件转base64
    base64Data = await readFileAsBase64(urlOrFile)
  } else {
    throw new Error('Invalid input. Expected either a URL or a File object.')
  }

  return base64Data
}
