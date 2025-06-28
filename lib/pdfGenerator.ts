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

        // เพิ่มหัวข้อ "รายการตรวจก่อนกลางภาค" ด้านบนตารางรายการตรวจ
        setFont('bold')
        pdf.setFontSize(14)
        const titleX = pageWidth / 2 // กึ่งกลางหน้ากระดาษ
        const titleY = yPosition + 3 // เพิ่มระยะห่าง 3mm
        pdf.text('รายการตรวจก่อนกลางภาค', titleX, titleY, { align: 'center' })
        yPosition += 10 // เพิ่มระยะห่างหลังหัวข้อ

        // สร้างตาราง 19 แถว 4 คอลลัมน์
        const tableStartX2 = margins.left
        const tableStartY2 = yPosition // เริ่มตารางใหม่ หลังจากข้อมูลไฟล์
        const tableWidth2 = pageWidth - margins.left - margins.right
        // const tableHeight2 = 19 * 8 // 19 แถว x 8mm ต่อแถว = 152mm // Comment out or remove this line
        const col1Width2 = tableWidth2 * 0.1  // คอลลัมน์ 1: 10%
        const col2Width2 = tableWidth2 * 0.4  // คอลลัมน์ 2: 40%
        const col3Width2 = tableWidth2 * 0.1  // คอลลัมน์ 3: 30%
        const col4Width2 = tableWidth2 * 0.4  // คอลลัมน์ 4: 20%
        const cellHeight2 = 8 // ความสูงแต่ละแถว 8mm

        // เฉพาะหน้าแรก: แสดงเฉพาะรายการที่ต้องการเท่านั้น
        const tableData = [
            'ปกหน้า (ปก)',
            'รายการประเมินคุณลักษณะอันพึงประสงค์',
            'รายการประเมินการอ่าน คิด วิเคราะห์',
            'การให้ระดับผลการเรียน',
            'หน่วยการเรียนรู้ ตัวชี้วัดและผลการเรียนรู้ (01,02)'
        ]

        const tableHeight2 = (tableData.length + 1) * cellHeight2 // Calculate height based on data rows + header

        // วาดพื้นหลังตาราง
        pdf.setFillColor(250, 250, 250) // สีเทาอ่อนมาก
        pdf.rect(tableStartX2, tableStartY2, tableWidth2, tableHeight2, 'F')

        // วาดเส้นขอบตาราง
        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(0.1)

        // วาดเส้นแนวนอน (สำหรับ header + data rows)
        for (let i = 0; i <= tableData.length + 1; i++) { // Loop based on data length + header + bottom border
            const y = tableStartY2 + (i * cellHeight2)
            // วาดเส้นแนวนอนเต็มความกว้างทุกเส้น
            pdf.line(tableStartX2, y, tableStartX2 + tableWidth2, y)
        }

        // วาดเส้นแนวตั้ง (5 เส้น สำหรับ 4 คอลัมน์)
        const colPositions = [
            tableStartX2,
            tableStartX2 + col1Width2,
            tableStartX2 + col1Width2 + col2Width2,
            tableStartX2 + col1Width2 + col2Width2 + col3Width2,
            tableStartX2 + tableWidth2
        ]

        colPositions.forEach(x => {
            pdf.line(x, tableStartY2, x, tableStartY2 + tableHeight2)
        })

        // เพิ่มหัวตาราง - ใช้ wrapTextInCell เพื่อจัดการข้อความยาว
        setFont('bold')
        pdf.setFontSize(12)

        const headerTexts = ['ครั้งที่', 'รายการ', 'ผลการตรวจ', 'หมายเหตุ']
        const headerWidths = [col1Width2, col2Width2, col3Width2, col4Width2]
        const headerPositions = [
            tableStartX2,
            tableStartX2 + col1Width2,
            tableStartX2 + col1Width2 + col2Width2,
            tableStartX2 + col1Width2 + col2Width2 + col3Width2
        ]

        // วาดหัวข้อตารางแต่ละคอลัมน์
        headerTexts.forEach((headerText, index) => {
            const maxHeaderWidth = headerWidths[index] - 4 // ลบ margin ซ้าย-ขวา

            // สำหรับ "ผลการตรวจสอบ" ให้ใช้ความกว้างแคบลงเพื่อบังคับให้แบ่งเป็น 2 บรรทัด
            let adjustedMaxWidth = maxHeaderWidth
            if (headerText === 'ผลการตรวจ') {
                adjustedMaxWidth = maxHeaderWidth * 0.6 // ลดความกว้างลง 40% เพื่อบังคับให้แบ่งบรรทัด
            }

            wrapTextInCell(
                pdf,
                headerText,
                headerPositions[index] + 2, // เพิ่ม margin ซ้าย
                tableStartY2 + 3, // เริ่มต้นข้อความที่ด้านบนของเซลล์
                adjustedMaxWidth,
                4, // line height เล็กลงสำหรับหัวข้อ
                headerWidths[index],
                cellHeight2,
                true, // จัดกึ่งกลางสำหรับบรรทัดเดียว (ใช้สำหรับทุกหัวข้อ)
                false // ไม่ใช้การจัดชิดซ้าย-กึ่งกลางแนวตั้ง
            )
        })

        // เพิ่มข้อมูลในตาราง (แถวที่ 2-19)
        setFont('normal')
        pdf.setFontSize(12) // ลดขนาดฟอนต์เล็กลงเพื่อให้พอดีกับการ wrap

        // สร้างตารางตรวจสอบหน้าแรก (เฉพาะรายการที่ต้องการ)
        for (let i = 0; i < tableData.length; i++) {
            const rowY = tableStartY2 + ((i + 1) * cellHeight2) + 3 // เริ่มต้นข้อความที่ด้านบนของเซลล์

            // คอลลัมน์ที่ 1: หมายเลขลำดับ (จัดกึ่งกลาง)
            const sequenceNumber = (i + 1).toString()
            wrapTextInCell(
                pdf,
                sequenceNumber,
                tableStartX2 + 2,
                rowY,
                col1Width2 - 4,
                4,
                col1Width2,
                cellHeight2,
                true, // จัดกึ่งกลางทั้งแนวตั้งและแนวนอน
                false
            )

            // คอลลัมน์ที่ 2: รายการ - ใช้ฟังก์ชัน wrapTextInCell ที่ปรับปรุงแล้ว
            const maxTextWidth = col2Width2 - 6 // ลบ margin ซ้าย-ขวา
            wrapTextInCell(
                pdf,
                tableData[i],
                tableStartX2 + col1Width2 + 3,
                rowY,
                maxTextWidth,
                4,
                col2Width2,
                cellHeight2,
                false, // ไม่ใช้การจัดกึ่งกลางสำหรับบรรทัดเดียว
                true   // ใช้การจัดชิดซ้ายและกึ่งกลางแนวตั้ง
            )

            // ผลการตรวจสอบ (ว่าง) - จัดกึ่งกลางเสมอ
            // หมายเหตุ (ว่าง) - จัดกึ่งกลางเสมอ
        }

        // อัพเดท yPosition สำหรับเนื้อหาต่อไป
        yPosition = tableStartY2 + tableHeight2 + 10

        // ========== สร้างหน้าที่ 2 ==========
        pdf.addPage()

        // Render header และรายการไฟล์ Excel สำหรับหน้าที่ 2
        yPosition = await renderHeaderTableAndFileInfo(pdf, data, hasThaiFont, margins)

        // เพิ่มหัวข้อ "รายการตรวจก่อนกลางภาค" ด้านบนตารางรายการตรวจหน้าที่ 2
        setFont('bold')
        pdf.setFontSize(14)
        const titleX2 = pageWidth / 2 // กึ่งกลางหน้ากระดาษ
        const titleY2 = yPosition + 3 // เพิ่มระยะห่าง 3mm
        pdf.text('รายการตรวจกลางภาค', titleX2, titleY2, { align: 'center' })
        yPosition += 10 // เพิ่มระยะห่างหลังหัวข้อ

        // สร้างตาราง 19 แถว 4 คอลลัมน์ สำหรับหน้าที่ 2
        const tableStartX3 = margins.left
        const tableStartY3 = yPosition // เริ่มตารางใหม่ หลังจากข้อมูลไฟล์
        const tableWidth3 = pageWidth - margins.left - margins.right
        // const tableHeight3 = 19 * 8 // 19 แถว x 8mm ต่อแถว = 152mm // Comment out or remove this line
        const col1Width3 = tableWidth3 * 0.1  // คอลลัมน์ 1: 10%
        const col2Width3 = tableWidth3 * 0.4  // คอลลัมน์ 2: 40%
        const col3Width3 = tableWidth3 * 0.1  // คอลลัมน์ 3: 30%
        const col4Width3 = tableWidth3 * 0.4  // คอลลัมน์ 4: 20%
        const cellHeight3 = 8 // ความสูงแต่ละแถว 8mm

        // รายการสำหรับหน้าที่ 2 (รายการที่ 8-18)
        const tableDataPage2 = [
            'บันทึกเวลาเรียน (03 (1))',
            'คะแนนก่อนกลางและคะแนนกลางภาค (04)',
            'การสรุปผลปกหน้า (ปก)',
            'บันทึกเวลาเรียน (03 (2))',
            'คะแนนหลังกลางภาค (05)',
            'คะแนนสอบปลายภาค (05)',
            'ตรวจสอบการให้ระดับผลการเรียน (06)',
            'คะแนนสมรรถนะ (07)',
            'คะคุณลักษณะอันพึงประสงค์ (08)',
            'คะแนนการอ่าน คิดวิเคราะห์และเขียน (09)',
            'สรุปผลการประเมินคุณลักษณะอันพึงประสงค์ (ปพ.5 SGS)',
            'สรุปการประเมินการอ่าน คิด วิเคราะห์ และเขียน (ปพ.5 SGS)'
        ]

        const tableHeight3 = (tableDataPage2.length + 1) * cellHeight3 // Calculate height based on data rows + header

        // วาดพื้นหลังตาราง
        pdf.setFillColor(250, 250, 250) // สีเทาอ่อนมาก
        pdf.rect(tableStartX3, tableStartY3, tableWidth3, tableHeight3, 'F')

        // วาดเส้นขอบตาราง
        pdf.setDrawColor(0, 0, 0)
        pdf.setLineWidth(0.1)

        // วาดเส้นแนวนอน (สำหรับ header + data rows)
        for (let i = 0; i <= tableDataPage2.length + 1; i++) { // Loop based on data length + header + bottom border
            const y = tableStartY3 + (i * cellHeight3)
            // วาดเส้นแนวนอนเต็มความกว้างทุกเส้น
            pdf.line(tableStartX3, y, tableStartX3 + tableWidth3, y)
        }

        // วาดเส้นแนวตั้ง (5 เส้น สำหรับ 4 คอลัมน์)
        const colPositions2 = [
            tableStartX3,
            tableStartX3 + col1Width3,
            tableStartX3 + col1Width3 + col2Width3,
            tableStartX3 + col1Width3 + col2Width3 + col3Width3,
            tableStartX3 + tableWidth3
        ]

        colPositions2.forEach(x => {
            pdf.line(x, tableStartY3, x, tableStartY3 + tableHeight3)
        })

        // เพิ่มหัวตาราง - ใช้ wrapTextInCell เพื่อจัดการข้อความยาว
        setFont('bold')
        pdf.setFontSize(12)

        const headerTexts2 = ['ครั้งที่', 'รายการ', 'ผลการตรวจ', 'หมายเหตุ']
        const headerWidths2 = [col1Width3, col2Width3, col3Width3, col4Width3]
        const headerPositions2 = [
            tableStartX3,
            tableStartX3 + col1Width3,
            tableStartX3 + col1Width3 + col2Width3,
            tableStartX3 + col1Width3 + col2Width3 + col3Width3
        ]

        // วาดหัวข้อตารางแต่ละคอลัมน์
        headerTexts2.forEach((headerText, index) => {
            const maxHeaderWidth = headerWidths2[index] - 4 // ลบ margin ซ้าย-ขวา

            // สำหรับ "ผลการตรวจสอบ" ให้ใช้ความกว้างแคบลงเพื่อบังคับให้แบ่งเป็น 2 บรรทัด
            let adjustedMaxWidth = maxHeaderWidth
            if (headerText === 'ผลการตรวจ') {
                adjustedMaxWidth = maxHeaderWidth * 0.6 // ลดความกว้างลง 40% เพื่อบังคับให้แบ่งบรรทัด
            }

            wrapTextInCell(
                pdf,
                headerText,
                headerPositions2[index] + 2, // เพิ่ม margin ซ้าย
                tableStartY3 + 3, // เริ่มต้นข้อความที่ด้านบนของเซลล์
                adjustedMaxWidth,
                4, // line height เล็กลงสำหรับหัวข้อ
                headerWidths2[index],
                cellHeight3,
                true, // จัดกึ่งกลางสำหรับบรรทัดเดียว (ใช้สำหรับทุกหัวข้อ)
                false // ไม่ใช้การจัดชิดซ้าย-กึ่งกลางแนวตั้ง
            )
        })

        // เพิ่มข้อมูลในตาราง (แถวที่ 2-12 สำหรับรายการที่ 8-18)
        setFont('normal')
        pdf.setFontSize(12)

        for (let i = 0; i < tableDataPage2.length; i++) {
            const rowY = tableStartY3 + ((i + 1) * cellHeight3) + 3 // เริ่มต้นข้อความที่ด้านบนของเซลล์

            // คอลลัมน์ที่ 1: หมายเลขลำดับ (จัดกึ่งกลาง) - เริ่มต้นจาก 8
            const sequenceNumber = (i + 8).toString()
            wrapTextInCell(
                pdf,
                sequenceNumber,
                tableStartX3 + 2,
                rowY,
                col1Width3 - 4,
                4,
                col1Width3,
                cellHeight3,
                true, // จัดกึ่งกลางทั้งแนวตั้งและแนวนอน
                false
            )

            // คอลลัมน์ที่ 2: รายการ - ใช้ฟังก์ชัน wrapTextInCell ที่ปรับปรุงแล้ว
            const maxTextWidth = col2Width3 - 6 // ลบ margin ซ้าย-ขวา
            wrapTextInCell(
                pdf,
                tableDataPage2[i],
                tableStartX3 + col1Width3 + 3,
                rowY,
                maxTextWidth,
                4,
                col2Width3,
                cellHeight3,
                false, // ไม่ใช้การจัดกึ่งกลางสำหรับบรรทัดเดียว
                true   // ใช้การจัดชิดซ้ายและกึ่งกลางแนวตั้ง
            )

            // ผลการตรวจสอบ (ว่าง) - จัดกึ่งกลางเสมอ
            // หมายเหตุ (ว่าง) - จัดกึ่งกลางเสมอ
        }

        // อัพเดท yPosition สำหรับเนื้อหาต่อไป
        yPosition = tableStartY3 + tableHeight3 + 10

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
