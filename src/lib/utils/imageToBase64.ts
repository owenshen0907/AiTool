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