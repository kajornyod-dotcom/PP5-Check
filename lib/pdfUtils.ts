import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export const wrapTextInCell = (pdf: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number = 5, cellWidth: number = 0, cellHeight: number = 0, isCenterSingleLine: boolean = false, isLeftVerticalCenter: boolean = false) => {
    // ...existing code from pdfGenerator.ts...
    const words = text.split(' ')
    let line = ''
    let currentY = y
    const lines = []
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' '
        const testWidth = pdf.getTextWidth(testLine)
        if (testWidth > maxWidth && line !== '') {
            lines.push(line.trim())
            line = words[i] + ' '
        } else {
            line = testLine
        }
    }
    lines.push(line.trim())
    if (isCenterSingleLine && cellWidth > 0 && cellHeight > 0) {
        const totalTextHeight = lines.length * lineHeight
        const centerX = x - 2 + (cellWidth / 2)
        const startY = (currentY - 3) + (cellHeight - totalTextHeight) / 2 + lineHeight * 0.8
        lines.forEach((lineText, index) => {
            pdf.text(lineText, centerX, startY + (index * lineHeight), { align: 'center' })
        })
    } else if (isLeftVerticalCenter && cellWidth > 0 && cellHeight > 0) {
        const totalTextHeight = lines.length * lineHeight
        const startY = (currentY - 3) + (cellHeight - totalTextHeight) / 2 + lineHeight * 0.7
        lines.forEach((lineText, index) => {
            pdf.text(lineText, x, startY + (index * lineHeight), { align: 'left' })
        })
    } else {
        lines.forEach((lineText, index) => {
            pdf.text(lineText, x, currentY + (index * lineHeight))
        })
    }
    return lines.length * lineHeight
}

export const generateQRCode = async (text: string): Promise<string> => {
    return await QRCode.toDataURL(text, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'M'
    })
}

export const loadThaiFont = async (fontPath: string): Promise<string> => {
    const response = await fetch(fontPath)
    if (!response.ok) throw new Error(`ไม่สามารถโหลดฟอนต์ ${fontPath} ได้`)
    const arrayBuffer = await response.arrayBuffer()
    return btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''))
}

export const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
    const response = await fetch(imagePath)
    if (!response.ok) throw new Error(`ไม่สามารถโหลดรูปภาพ ${imagePath} ได้`)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}
