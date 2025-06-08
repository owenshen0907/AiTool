// File: src/lib/utils/imageToBase64.ts

// 浏览器端：将 File 转为 Base64 Data URL
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const res = reader.result
            if (typeof res === 'string') resolve(res)
            else reject(new Error('FileReader result not string'))
        }
        reader.onerror = err => reject(err)
        reader.readAsDataURL(file)
    })
}

// 新增：将远程图片 URL 转为 Base64，内部复用 fileToBase64
export async function urlToBase64(url: string): Promise<string> {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        // FileReader.readAsDataURL 也接受 Blob，因此直接复用原函数
        return fileToBase64(blob as unknown as File);
    } catch {
        return url; // 失败时返回原 URL
    }
}