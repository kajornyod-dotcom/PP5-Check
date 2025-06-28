import jsPDF from 'jspdf'
import QRCode from 'qrcode'

// ฟังก์ชันสำหรับ wrap text ในเซลล์ตาราง
const wrapTextInCell = (pdf: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number = 5, cellWidth: number = 0, cellHeight: number = 0, isCenterSingleLine: boolean = false, isLeftVerticalCenter: boolean = false) => {
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

    // วาดข้อความทีละบรรทัด
    if (isCenterSingleLine && cellWidth > 0 && cellHeight > 0) {
        // จัดกึ่งกลางทั้งแนวตั้งและแนวนอน
        const totalTextHeight = lines.length * lineHeight
        const centerX = x - 2 + (cellWidth / 2) // ปรับ x กลับไปที่ตำแหน่งเริ่มต้นของเซลล์
        const startY = (currentY - 3) + (cellHeight - totalTextHeight) / 2 + lineHeight * 0.8 // จัดกึ่งกลางแนวตั้ง

        lines.forEach((lineText, index) => {
            pdf.text(lineText, centerX, startY + (index * lineHeight), { align: 'center' })
        })
    } else if (isLeftVerticalCenter && cellWidth > 0 && cellHeight > 0) {
        // จัดชิดซ้ายและกึ่งกลางแนวตั้ง
        const totalTextHeight = lines.length * lineHeight
        const startY = (currentY - 3) + (cellHeight - totalTextHeight) / 2 + lineHeight * 0.7 // ปรับตำแหน่งเริ่มต้นให้อยู่กึ่งกลางแนวตั้ง

        lines.forEach((lineText, index) => {
            pdf.text(lineText, x, startY + (index * lineHeight), { align: 'left' })
        })
    } else {
        // ใช้การวาดแบบปกติ (หลายบรรทัดหรือไม่ต้องการจัดกึ่งกลาง)
        lines.forEach((lineText, index) => {
            pdf.text(lineText, x, currentY + (index * lineHeight))
        })
    }

    return lines.length * lineHeight // คืนค่าความสูงที่ใช้
}

// ฟังก์ชันสำหรับสร้าง QR Code
const generateQRCode = async (text: string): Promise<string> => {
    try {
        const qrCodeDataURL = await QRCode.toDataURL(text, {
            width: 200, // เพิ่มขนาดเพื่อความชัดเจน
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M' // ระดับการแก้ไขข้อผิดพลาดปานกลาง
        })
        return qrCodeDataURL
    } catch (error) {
        console.error('ข้อผิดพลาดในการสร้าง QR Code:', error)
        throw error
    }
}

// ฟังก์ชันสำหรับ render ตารางส่วนหัวและรายการไฟล์ Excel ในทุกหน้า
const renderHeaderTableAndFileInfo = async (pdf: jsPDF, data: ReportData, hasThaiFont: boolean, margins: any) => {
    const setFont = (style: 'normal' | 'bold' = 'normal') => {
        pdf.setFont(hasThaiFont ? 'THSarabun' : 'helvetica', style)
    }

    const pageWidth = pdf.internal.pageSize.getWidth()
    const tableStartX = margins.left
    const tableStartY = margins.top
    const tableWidth = pageWidth - margins.left - margins.right
    const tableHeight = 40

    // กำหนดความกว้างแต่ละคอลัมน์
    const col1Width = tableWidth * 0.2
    const col2Width = tableWidth * 0.6
    const col3Width = tableWidth * 0.2
    const cellHeight = tableHeight / 4

    // วาดกรอบตาราง
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.2)

    // เพิ่ม background สีเทาให้ตาราง
    pdf.setFillColor(240, 240, 240)
    pdf.rect(tableStartX, tableStartY, tableWidth, tableHeight, 'F')

    // วาดเส้นแนวนอน
    for (let i = 0; i <= 4; i++) {
        const y = tableStartY + (i * cellHeight)
        if (i === 0 || i === 4) {
            pdf.line(tableStartX, y, tableStartX + tableWidth, y)
        } else {
            pdf.line(tableStartX + col1Width, y, tableStartX + tableWidth, y)
        }
    }

    // วาดเส้นแนวตั้ง
    pdf.line(tableStartX, tableStartY, tableStartX, tableStartY + tableHeight)
    const col1EndX = tableStartX + col1Width
    pdf.line(col1EndX, tableStartY, col1EndX, tableStartY + tableHeight)
    const col2EndX = tableStartX + col1Width + col2Width
    pdf.line(col2EndX, tableStartY + (2 * cellHeight), col2EndX, tableStartY + tableHeight)
    const tableEndX = tableStartX + tableWidth
    pdf.line(tableEndX, tableStartY, tableEndX, tableStartY + tableHeight)

    // เพิ่มโลโก้
    try {
        const logoResponse = await fetch('/logo-ppk-512x512-1.png')
        if (logoResponse.ok) {
            const logoArrayBuffer = await logoResponse.arrayBuffer()
            const logoBase64 = btoa(
                new Uint8Array(logoArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            )
            const logoDataURL = `data:image/png;base64,${logoBase64}`

            const logoSize = 25
            const logoX = tableStartX + (col1Width - logoSize) / 2
            const logoY = tableStartY + (tableHeight - logoSize) / 2

            pdf.addImage(logoDataURL, 'PNG', logoX, logoY, logoSize, logoSize)
        }
    } catch (logoError) {
        console.warn('⚠️ ข้อผิดพลาดในการโหลดโลโก้:', logoError)
    }

    // เพิ่มข้อความรายงาน
    setFont('bold')
    pdf.setFontSize(16)
    const mergedCellStartX = tableStartX + col1Width
    const mergedCellWidth = col2Width + col3Width
    const textX = mergedCellStartX + (mergedCellWidth / 2)
    const textY = tableStartY + (cellHeight / 2) + 3
    pdf.text('รายงานสรุปผลการตรวจสอบ ปพ.5', textX, textY, { align: 'center' })

    // ปีการศึกษาและภาคเรียน
    setFont('normal')
    pdf.setFontSize(16)
    const mergedCell22StartX = tableStartX + col1Width
    const mergedCell22Width = col2Width + col3Width
    const cell22CenterX = mergedCell22StartX + (mergedCell22Width / 2)
    const cell22Y = tableStartY + cellHeight + (cellHeight / 2) + 2

    const academicYear = data.excelData.data?.home_academic_year || data.formData.academicYear || 'ไม่มีข้อมูล'
    const semester = data.excelData.data?.home_semester || data.formData.semester || 'ไม่มีข้อมูล'

    pdf.text(`ปีการศึกษา ${academicYear} ภาคเรียนที่ ${semester}`, cell22CenterX, cell22Y, { align: 'center' })

    // วิชา รหัสวิชา และชื่อวิชา
    setFont('normal')
    pdf.setFontSize(14)
    const cell32X = tableStartX + col1Width + 5
    const cell32Y = tableStartY + (2 * cellHeight) + (cellHeight / 2) + 2

    const subjectCode = data.excelData.data?.home_subject_code || 'ไม่มีข้อมูล'
    const subject = data.excelData.data?.home_subject || 'ไม่มีข้อมูล'

    pdf.text(`วิชา ${subjectCode} ${subject}`, cell32X, cell32Y)

    // จำนวนชั่วโมงเรียนต่อสัปดาห์
    const cell33X = tableStartX + col1Width + col2Width + 5
    const cell33Y = tableStartY + (2 * cellHeight) + (cellHeight / 2) + 2

    const studyTime = data.excelData.data?.home_study_time || 'ไม่มีข้อมูล'

    pdf.text(`${studyTime} ชั่วโมง/สัปดาห์`, cell33X, cell33Y)

    // ผู้สอน
    const cell42X = tableStartX + col1Width + 5
    const cell42Y = tableStartY + (3 * cellHeight) + (cellHeight / 2) + 2

    const teacher = data.excelData.data?.home_teacher || 'ไม่มีข้อมูล'

    pdf.text(`ผู้สอน ${teacher}`, cell42X, cell42Y)

    // จำนวนหน่วยกิต
    const cell43X = tableStartX + col1Width + col2Width + 5
    const cell43Y = tableStartY + (3 * cellHeight) + (cellHeight / 2) + 2

    const credit = data.excelData.data?.home_credit || 'ไม่มีข้อมูล'

    pdf.text(`${credit} หน่วยกิต`, cell43X, cell43Y)

    // รายการไฟล์ Excel
    const contentStartY = tableStartY + tableHeight + 8
    let yPosition = contentStartY

    if (data.excelData.fileName || data.excelData.fileSize || data.excelData.uploadedAt) {
        setFont('bold')
        pdf.setFontSize(12)
        pdf.text('รายการไฟล์ Excel:', margins.left, yPosition)
        yPosition += 5

        setFont('normal')
        pdf.setFontSize(11)

        if (data.excelData.fileName) {
            pdf.text(`1. ชื่อไฟล์: ${data.excelData.fileName}`, margins.left + 5, yPosition)
            yPosition += 5
        }

        if (data.excelData.fileSize) {
            const fileSizeInKB = (data.excelData.fileSize / 1024).toFixed(2)
            const fileSizeInMB = (data.excelData.fileSize / (1024 * 1024)).toFixed(2)
            const displayFileSize = data.excelData.fileSize < 1024 * 1024
                ? `${fileSizeInKB} KB`
                : `${fileSizeInMB} MB`
            pdf.text(`2. ขนาดไฟล์: ${displayFileSize}`, margins.left + 5, yPosition)
            yPosition += 5
        }

        if (data.excelData.uploadedAt) {
            const uploadDate = new Date(data.excelData.uploadedAt).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
            pdf.text(`3. อัพโหลดเมื่อ: ${uploadDate}`, margins.left + 5, yPosition)
            yPosition += 5
        }
    }

    return yPosition // คืนค่าตำแหน่ง Y สำหรับเนื้อหาต่อไป
}

// ฟังก์ชันสำหรับเพิ่ม QR Code ในทุกหน้าของ PDF
const addQRCodeToAllPages = async (pdf: jsPDF, uuid: string): Promise<void> => {
    try {
        console.log('🔍 กำลังสร้าง QR Code สำหรับ UUID:', uuid)

        // สร้าง QR Code จาก UUID
        const qrCodeDataURL = await generateQRCode(uuid)

        // ได้จำนวนหน้าทั้งหมด
        const totalPages = (pdf as any).internal.pages.length - 1 // หักหน้าแรกที่เป็น template

        // วนลูปเพิ่ม QR Code ในทุกหน้า
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            pdf.setPage(pageNum)

            // ได้ขนาดหน้ากระดาษ A4 (210 x 297 mm)
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()

            // กำหนดขนาดและตำแหน่งของ QR Code
            const qrSize = 25 // ขนาด QR Code (mm)
            const qrX = pageWidth - qrSize - 10 // 10mm จากขอบขวา
            const qrY = pageHeight - qrSize - 10 // 10mm จากขอบล่าง

            // เพิ่ม QR Code ลงใน PDF
            pdf.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize)

            // เพิ่มข้อความ UUID ด้านล่าง QR Code และจัดกึ่งกลาง (ทุกหน้า)
            pdf.setFont('helvetica') // ใช้ฟอนต์ที่รองรับภาษาอังกฤษสำหรับ UUID
            pdf.setFontSize(5)
            const textY = qrY + qrSize + 3 // วางข้อความด้านล่าง QR Code 3mm
            const centerX = qrX + (qrSize / 2) // จุดกึ่งกลางของ QR Code
            pdf.text(uuid, centerX, textY, { align: 'center' })
        }

        console.log(`✅ เพิ่ม QR Code ลงใน PDF สำเร็จ (${totalPages} หน้า)`)

    } catch (qrError) {
        console.warn('⚠️ ไม่สามารถสร้าง QR Code ได้:', qrError)

        // ถ้าสร้าง QR Code ไม่ได้ ให้แสดง UUID เป็นข้อความในหน้าแรกแทน
        pdf.setPage(1)
        pdf.setFont('helvetica')
        pdf.setFontSize(8)
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        pdf.text('UUID:', pageWidth - 60, pageHeight - 15)
        pdf.text(uuid, pageWidth - 60, pageHeight - 10)
    }
}

// ฟังก์ชันสำหรับโหลดฟอนต์ TH Sarabun
const loadThaiFont = async (fontPath: string): Promise<string> => {
    try {
        const response = await fetch(fontPath)
        if (!response.ok) {
            throw new Error(`ไม่สามารถโหลดฟอนต์ ${fontPath} ได้`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const base64String = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
        return base64String
    } catch (error) {
        console.error('ข้อผิดพลาดในการโหลดฟอนต์:', error)
        throw error
    }
}

// Type definitions สำหรับข้อมูลที่ backend ส่งกลับ
interface FormData {
    academicYear: string
    semester: string
    submittedAt: string
    timestamp: string
}

interface ExcelData {
    hasData: boolean
    sheetName?: string
    data?: { [key: string]: any }
    totalFields?: number
    message?: string
    // ข้อมูลไฟล์ Excel (เพิ่ม)
    fileName?: string
    fileSize?: number
    uploadedAt?: string
}

interface GeminiOcrData {
    course_id: string
    course_name: string
    academic_year: string
    semester: string
    grade_level: string
    section: number
    teacher: string
    grade_valid: boolean
    attitude_valid: boolean
    read_analyze_write_valid: boolean
}

interface GeminiOcrResult {
    hasData: boolean
    data?: GeminiOcrData
    processedAt?: string
    message?: string
}

interface Summary {
    success: boolean
    message: string
    hasExcelData: boolean
    hasPdfData: boolean
    totalDataSources: number
}

interface DatabaseInfo {
    recordId: string
    uuid: string
    savedAt: string
}

interface ReportData {
    formData: FormData
    excelData: ExcelData
    geminiOcrResult: GeminiOcrResult
    summary: Summary
    database?: DatabaseInfo
}

/**
 * ฟังก์ชันสำหรับสร้าง PDF รายงาน ปพ.5 จากข้อมูลที่ backend ส่งกลับ
 * จะเปิด PDF ในแทบใหม่ และถ้าไม่สามารถเปิดได้จะดาวน์โหลดอัตโนมัติ
 * @param data ข้อมูลที่ได้รับจาก backend API
 */
export const generatePDF = async (data: ReportData): Promise<void> => {
    try {
        const pdf = new jsPDF()

        // โหลดและเพิ่มฟอนต์ TH Sarabun
        let hasThaiFont = false
        try {
            // โหลดฟอนต์ปกติ
            const fontBase64 = await loadThaiFont('/fonts/THSarabun.ttf')
            pdf.addFileToVFS('THSarabun.ttf', fontBase64)
            pdf.addFont('THSarabun.ttf', 'THSarabun', 'normal')
            hasThaiFont = true

            // พยายามโหลดฟอนต์หนัก
            try {
                const fontBoldBase64 = await loadThaiFont('/fonts/THSarabun Bold.ttf')
                pdf.addFileToVFS('THSarabun-Bold.ttf', fontBoldBase64)
                pdf.addFont('THSarabun-Bold.ttf', 'THSarabun', 'bold')
                console.log('✅ โหลดฟอนต์ TH Sarabun (ปกติและหนัก) สำเร็จ')
            } catch (boldFontError) {
                console.warn('⚠️ ไม่สามารถโหลดฟอนต์หนักได้ - ใช้ฟอนต์ปกติแทน:', boldFontError)
            }

            pdf.setFont('THSarabun')
        } catch (fontError) {
            console.warn('⚠️ ไม่สามารถโหลดฟอนต์ TH Sarabun ได้ - ใช้ฟอนต์เริ่มต้น:', fontError)
            pdf.setFont('helvetica')
        }

        // ฟังก์ชันช่วยในการตั้งค่าฟอนต์
        const setFont = (style: 'normal' | 'bold' = 'normal') => {
            pdf.setFont(hasThaiFont ? 'THSarabun' : 'helvetica', style)
        }

        // กำหนดขอบกระดาษทั้ง 4 ด้าน (หน่วย: mm)
        const margins = {
            top: 10,
            right: 15,
            bottom: 15,
            left: 15
        }

        // ใช้ฟังก์ชัน renderHeaderTableAndFileInfo สำหรับหน้าแรก
        let yPosition = await renderHeaderTableAndFileInfo(pdf, data, hasThaiFont, margins)
        const pageWidth = pdf.internal.pageSize.getWidth()
        // ======= หน้า 1 =======
        setFont('bold')
        pdf.setFontSize(14)
        pdf.text('รายการตรวจก่อนกลางภาค', pageWidth / 2, yPosition + 3, { align: 'center' })
        yPosition += 10
        yPosition = drawTable(
            pdf,
            margins.left,
            yPosition,
            pageWidth - margins.left - margins.right,
            8,
            ['ลำดับที่', 'รายการ', 'ผลการตรวจ', 'หมายเหตุ'],
            [
                'ปกหน้า (ปก)',
                'รายการประเมินคุณลักษณะอันพึงประสงค์',
                'รายการประเมินการอ่าน คิด วิเคราะห์',
                'การให้ระดับผลการเรียน',
                'หน่วยการเรียนรู้ ตัวชี้วัดและผลการเรียนรู้ (01,02)'
            ],
            setFont
        )
        renderSignatureSection(pdf, margins.left, yPosition, pageWidth, hasThaiFont)
        // ======= หน้า 2 =======
        pdf.addPage()
        yPosition = await renderHeaderTableAndFileInfo(pdf, data, hasThaiFont, margins)
        setFont('bold')
        pdf.setFontSize(14)
        pdf.text('รายการตรวจกลางภาค', pageWidth / 2, yPosition + 3, { align: 'center' })
        yPosition += 10
        yPosition = drawTable(
            pdf,
            margins.left,
            yPosition,
            pageWidth - margins.left - margins.right,
            8,
            ['ลำดับที่', 'รายการ', 'ผลการตรวจ', 'หมายเหตุ'],
            [
                'บันทึกเวลาเรียน (03 (1))',
                'คะแนนก่อนกลางและคะแนนกลางภาค (04)'
            ],
            setFont
        )
        renderSignatureSection(pdf, margins.left, yPosition, pageWidth, hasThaiFont)
        // ======= หน้า 3 =======
        pdf.addPage()
        yPosition = await renderHeaderTableAndFileInfo(pdf, data, hasThaiFont, margins)
        setFont('bold')
        pdf.setFontSize(14)
        pdf.text('รายการตรวจปลายภาค', pageWidth / 2, yPosition + 3, { align: 'center' })
        yPosition += 10
        yPosition = drawTable(
            pdf,
            margins.left,
            yPosition,
            pageWidth - margins.left - margins.right,
            8,
            ['ลำดับที่', 'รายการ', 'ผลการตรวจ', 'หมายเหตุ'],
            [
                'บันทึกเวลาเรียน (03)',
                'คะแนนหลังกลางภาค (05)',
                'คะแนนสอบปลายภาค (05)',
                'ตรวจสอบการให้ระดับผลการเรียน (06)',
                'คะแนนสมรรถนะ (07)',
                'คะคุณลักษณะอันพึงประสงค์ (08)',
                'คะแนนการอ่าน คิดวิเคราะห์และเขียน (09)',
                'สรุปผลการประเมินคุณลักษณะอันพึงประสงค์ (ปพ.5 SGS)',
                'สรุปการประเมินการอ่าน คิด วิเคราะห์ และเขียน (ปพ.5 SGS)'
            ],
            setFont
        )
        renderSignatureSection(pdf, margins.left, yPosition, pageWidth, hasThaiFont)

        // สร้างและเพิ่ม QR Code ลงในทุกหน้า PDF (ถ้ามี UUID)
        if (data.database?.uuid) {
            try {
                console.log('🔍 กำลังเพิ่ม QR Code ลงในทุกหน้า PDF สำหรับ UUID:', data.database.uuid)
                await addQRCodeToAllPages(pdf, data.database.uuid)
                console.log('✅ เพิ่ม QR Code ลงในทุกหน้า PDF สำเร็จ')

            } catch (qrError) {
                console.warn('⚠️ ไม่สามารถสร้าง QR Code ได้:', qrError)

                // ถ้าสร้าง QR Code ไม่ได้ ให้แสดง UUID เป็นข้อความที่หน้าสุดท้ายแทน
                const totalPages = pdf.getNumberOfPages()
                pdf.setPage(totalPages)
                setFont('normal')
                pdf.setFontSize(8)
                const pageWidth = pdf.internal.pageSize.getWidth()
                const pageHeight = pdf.internal.pageSize.getHeight()
                pdf.text('UUID:', pageWidth - 60, pageHeight - 15)
                pdf.text(data.database.uuid, pageWidth - 60, pageHeight - 10)
            }
        }

        // เพิ่มตารางหัวรายงานและรายการไฟล์ Excel ลงในทุกหน้า (ยกเว้นหน้าแรกที่มีอยู่แล้ว)
        try {
            await addHeaderToAllPages(pdf, data, hasThaiFont, margins)
        } catch (headerError) {
            console.warn('⚠️ ไม่สามารถเพิ่มตารางหัวรายงานในทุกหน้าได้:', headerError)
        }        // สร้างชื่อไฟล์
        const filename = `report-pp5-${data.formData.academicYear}-${data.formData.semester}-${Date.now()}.pdf`

        // สร้าง Blob จาก PDF และเปิดในแทบใหม่
        const pdfBlob = pdf.output('blob')
        const pdfUrl = URL.createObjectURL(pdfBlob)

        // เปิด PDF ในแทบใหม่
        const newWindow = window.open(pdfUrl, '_blank')

        if (newWindow) {
            // ตั้งชื่อหน้าต่างใหม่
            newWindow.document.title = filename

            // ล้าง URL เมื่อหน้าต่างถูกปิด (เพื่อประหยัด memory)
            newWindow.addEventListener('beforeunload', () => {
                URL.revokeObjectURL(pdfUrl)
            })

            console.log('✅ PDF สร้างและเปิดในแทบใหม่สำเร็จ:', filename)
        } else {
            // Fallback: ดาวน์โหลดถ้าไม่สามารถเปิดแทบใหม่ได้ (popup blocked) - ใช้ jsPDF save
            console.warn('⚠️ ไม่สามารถเปิดแทบใหม่ได้ (อาจถูก popup blocker บล็อก) - ดาวน์โหลดลงเครื่องแทน')
            pdf.save(filename)
            URL.revokeObjectURL(pdfUrl)
            console.log('✅ PDF ดาวน์โหลดสำเร็จ (fallback):', filename)
        }

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการสร้าง PDF:', error)
        throw new Error('ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่อีกครั้ง')
    }
}

/**
 * ฟังก์ชันช่วยในการตรวจสอบโครงสร้างข้อมูล
 * @param data ข้อมูลที่ต้องการตรวจสอบ
 * @returns true หากข้อมูลมีโครงสร้างที่ถูกต้อง
 */
export const validateReportData = (data: any): data is ReportData => {
    return (
        data &&
        typeof data === 'object' &&
        data.formData &&
        data.excelData &&
        data.geminiOcrResult &&
        data.summary &&
        typeof data.formData.academicYear === 'string' &&
        typeof data.formData.semester === 'string' &&
        typeof data.formData.timestamp === 'string'
    )
}

// ฟังก์ชันสำหรับเพิ่มตารางหัวรายงานและรายการไฟล์ Excel ในทุกหน้าของ PDF
const addHeaderToAllPages = async (pdf: jsPDF, data: ReportData, hasThaiFont: boolean, margins: any): Promise<void> => {
    try {
        console.log('🔍 กำลังเพิ่มตารางหัวรายงานและรายการไฟล์ Excel ลงในทุกหน้า PDF')

        // ได้จำนวนหน้าทั้งหมด
        const totalPages = (pdf as any).internal.pages.length - 1 // หักหน้าแรกที่เป็น template

        // วนลูปเพิ่มตารางหัวใน Página 3 เป็นต้นไป (หน้าแรกและหน้าที่ 2 มีการ render ไว้แล้วใน generatePDF)
        for (let pageNum = 3; pageNum <= totalPages; pageNum++) {
            console.log(`🔍 กำลังเพิ่มตารางหัวรายงานในหน้า ${pageNum}`)

            // ไปที่หน้าที่ต้องการ
            pdf.setPage(pageNum)

            // เรียกใช้ฟังก์ชัน render header สำหรับหน้านี้
            await renderHeaderTableAndFileInfo(pdf, data, hasThaiFont, margins)
        }

        console.log('✅ เพิ่มตารางหัวรายงานและรายการไฟล์ Excel ลงในทุกหน้า PDF สำเร็จ')

    } catch (error) {
        console.warn('⚠️ ไม่สามารถเพิ่มตารางหัวรายงานในทุกหน้าได้:', error)
        throw error
    }
}

// ====== Helper: Draw Table (Refactored) ======
const drawTable = (
    pdf: jsPDF,
    startX: number,
    startY: number,
    tableWidth: number,
    cellHeight: number,
    headers: string[],
    data: string[],
    setFont: (style?: 'normal' | 'bold') => void
) => {
    const colPercents = [0.1, 0.4, 0.1, 0.4]
    const colWidths = colPercents.map(p => tableWidth * p)
    const colPositions = colWidths.reduce((acc, w, i) => {
        acc.push((acc[i - 1] || startX) + (i > 0 ? colWidths[i - 1] : 0))
        return acc
    }, [] as number[])
    colPositions.push(startX + tableWidth)
    const tableHeight = (data.length + 1) * cellHeight

    pdf.setFillColor(250, 250, 250)
    pdf.rect(startX, startY, tableWidth, tableHeight, 'F')
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.1)
    for (let i = 0; i <= data.length + 1; i++) {
        const y = startY + (i * cellHeight)
        pdf.line(startX, y, startX + tableWidth, y)
    }
    colPositions.forEach(x => {
        pdf.line(x, startY, x, startY + tableHeight)
    })
    setFont('bold')
    pdf.setFontSize(12)
    headers.forEach((headerText, idx) => {
        let maxHeaderWidth = colWidths[idx] - 4
        if (headerText === 'ผลการตรวจ') maxHeaderWidth *= 0.6
        wrapTextInCell(
            pdf,
            headerText,
            colPositions[idx] + 2,
            startY + 3,
            maxHeaderWidth,
            4,
            colWidths[idx],
            cellHeight,
            true,
            false
        )
    })
    setFont('normal')
    pdf.setFontSize(12)
    for (let i = 0; i < data.length; i++) {
        const rowY = startY + ((i + 1) * cellHeight) + 3
        wrapTextInCell(
            pdf,
            (i + 1).toString(),
            startX + 2,
            rowY,
            colWidths[0] - 4,
            4,
            colWidths[0],
            cellHeight,
            true,
            false
        )
        wrapTextInCell(
            pdf,
            data[i],
            startX + colWidths[0] + 3,
            rowY,
            colWidths[1] - 6,
            4,
            colWidths[1],
            cellHeight,
            false,
            true
        )
    }
    return startY + tableHeight + 10
}

// ========== Object เก็บชื่อผู้ลงนาม (dummy) ========== //
const signatureNames = {
    registrar: 'นายสมชาย ใจดี',
    academicHead: 'นางสาวพรทิพย์ เก่งงาน',
    director: 'นายประเสริฐ ผู้อำนวยการ'
}

/**
 * ฟังก์ชันสำหรับวาดลายเซ็นต์ 3 คน (ไม่มีเส้นตาราง)
 * @param pdf jsPDF instance
 * @param x จุดเริ่มต้นแนวนอน (เช่น margins.left)
 * @param y จุดเริ่มต้นแนวตั้ง (หลังตาราง)
 * @param pageWidth ความกว้างหน้ากระดาษ
 * @param hasThaiFont ใช้ฟอนต์ไทยหรือไม่
 */
const renderSignatureSection = (
    pdf: jsPDF,
    x: number,
    y: number,
    pageWidth: number,
    hasThaiFont: boolean
) => {
    const setFont = (style: 'normal' | 'bold' = 'normal') => {
        pdf.setFont(hasThaiFont ? 'THSarabun' : 'helvetica', style)
    }
    setFont('normal')
    pdf.setFontSize(14)

    // ข้อมูลผู้เซ็นต์
    const signers = [
        { label: 'นายทะเบียน', name: signatureNames.registrar },
        { label: 'หัวหน้าวิชาการ', name: signatureNames.academicHead },
        { label: 'ผู้อำนวยการโรงเรียน', name: signatureNames.director }
    ]

    // กำหนดขนาดพื้นที่สำหรับแต่ละช่อง (ไม่มีเส้นตาราง)
    const tableWidth = pageWidth - x * 2
    const colWidth = tableWidth / 3
    const startY = y + 5 // เริ่มต้นวาดลายเซ็นต์ 5mm หลังจากจุดเริ่มต้นแนวตั้ง

    // วาดข้อความในแต่ละช่อง (จัดกึ่งกลางแนวตั้งและแนวฮอน)
    signers.forEach((signer, idx) => {
        const colX = x + idx * colWidth
        const centerX = colX + colWidth / 2
        let textY = startY + 10
        pdf.text('ลงชื่อ....................................................', centerX, textY, { align: 'center' })
        textY += 8
        pdf.text(`(${signer.name})`, centerX, textY, { align: 'center' })
        textY += 8
        pdf.text(signer.label, centerX, textY, { align: 'center' })
    })
}
