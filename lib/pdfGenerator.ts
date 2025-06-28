import jsPDF from 'jspdf'
import QRCode from 'qrcode'

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

            // เพิ่มข้อความ UUID ด้านล่าง QR Code และจัดกึ่งกลาง (เฉพาะหน้าแรก)
            if (pageNum === 1) {
                pdf.setFont('helvetica') // ใช้ฟอนต์ที่รองรับภาษาอังกฤษสำหรับ UUID
                pdf.setFontSize(5)
                const textY = qrY + qrSize + 3 // วางข้อความด้านล่าง QR Code 3mm
                const centerX = qrX + (qrSize / 2) // จุดกึ่งกลางของ QR Code
                pdf.text(uuid, centerX, textY, { align: 'center' })
            }
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

        // สร้างตารางส่วนหัว 4 แถว 3 คอลลัมน์
        const pageWidth = pdf.internal.pageSize.getWidth()
        const tableStartX = margins.left
        const tableStartY = margins.top
        const tableWidth = pageWidth - margins.left - margins.right // ความกว้างตารางพอดีกับขอบ
        const tableHeight = 40 // เพิ่มความสูงตารางเป็น 40mm

        // กำหนดความกว้างแต่ละคอลลัมน์ (10%, 80%, 10%)
        const col1Width = tableWidth * 0.2  // คอลลัมน์ 1: 10%
        const col2Width = tableWidth * 0.6  // คอลลัมน์ 2: 80%
        const col3Width = tableWidth * 0.2  // คอลลัมน์ 3: 10%
        const cellHeight = tableHeight / 4 // แบ่งเป็น 4 แถวเท่า ๆ กัน

        // วาดกรอบตาราง
        pdf.setDrawColor(0, 0, 0) // สีดำ
        pdf.setLineWidth(0.2) // ลดความหนาของเส้นเป็น 0.2mm

        // วาดเส้นแนวนอน (5 เส้น สำหรับ 4 แถว) - ไม่วาดในคอลลัมน์ที่ 1 ที่ผสานแล้ว
        for (let i = 0; i <= 4; i++) {
            const y = tableStartY + (i * cellHeight)
            // เส้นบนและล่างสุดวาดเต็มความกว้าง
            if (i === 0 || i === 4) {
                pdf.line(tableStartX, y, tableStartX + tableWidth, y)
            } else {
                // เส้นกลางวาดเฉพาะในคอลลัมน์ 2-3 (ข้ามคอลลัมน์ที่ 1)
                pdf.line(tableStartX + col1Width, y, tableStartX + tableWidth, y)
            }
        }

        // วาดเส้นแนวตั้ง (ปรับเพื่อผสานเซลล์คอลลัมน์ที่ 1 ทั้งหมด 4 แถว)
        // เส้นแนวตั้งซ้ายสุด
        pdf.line(tableStartX, tableStartY, tableStartX, tableStartY + tableHeight)

        // เส้นแนวตั้งที่แบ่งคอลลัมน์ 1 และ 2-3 (ยาวเต็มความสูง)
        const col1EndX = tableStartX + col1Width
        pdf.line(col1EndX, tableStartY, col1EndX, tableStartY + tableHeight)

        // เส้นแนวตั้งที่แบ่งคอลลัมน์ 2 และ 3 (ยาวเฉพาะแถว 3-4, ไม่วาดในแถวที่ 1 และ 2)
        const col2EndX = tableStartX + col1Width + col2Width
        pdf.line(col2EndX, tableStartY + (2 * cellHeight), col2EndX, tableStartY + tableHeight)

        // เส้นแนวตั้งขวาสุด
        const tableEndX = tableStartX + tableWidth
        pdf.line(tableEndX, tableStartY, tableEndX, tableStartY + tableHeight)

        // เพิ่มโลโก้ในคอลลัมน์ที่ 1 (ผสานทั้ง 4 แถว)
        try {
            const logoResponse = await fetch('/logo-ppk-512x512-1.png')
            if (logoResponse.ok) {
                const logoArrayBuffer = await logoResponse.arrayBuffer()
                const logoBase64 = btoa(
                    new Uint8Array(logoArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                )
                const logoDataURL = `data:image/png;base64,${logoBase64}`

                // คำนวณตำแหน่งกึ่งกลางของคอลลัมน์ที่ 1 ที่ผสานทั้ง 4 แถว
                const logoSize = 25 // ขนาดโลโก้ 25mm (เพิ่มขนาดเนื่องจากพื้นที่ใหญ่ขึ้น)
                const logoX = tableStartX + (col1Width - logoSize) / 2 // จัดกึ่งกลางในคอลลัมน์ที่ 1
                const logoY = tableStartY + (tableHeight - logoSize) / 2 // จัดกึ่งกลางในความสูงทั้งหมด

                pdf.addImage(logoDataURL, 'PNG', logoX, logoY, logoSize, logoSize)
                console.log('✅ เพิ่มโลโก้ในคอลลัมน์ที่ 1 (ผสาน 4 แถว) สำเร็จ')
            } else {
                console.warn('⚠️ ไม่สามารถโหลดโลโก้ได้')
            }
        } catch (logoError) {
            console.warn('⚠️ ข้อผิดพลาดในการโหลดโลโก้:', logoError)
        }

        // เพิ่มข้อความรายงานในเซลล์ที่ผสาน (1,2+1,3) - แถวแรก คอลลัมน์ที่ 2-3
        setFont('bold')
        pdf.setFontSize(16)
        const mergedCellStartX = tableStartX + col1Width // เริ่มต้นของเซลล์ที่ผสาน
        const mergedCellWidth = col2Width + col3Width // ความกว้างของเซลล์ที่ผสาน (คอลลัมน์ 2+3)
        const textX = mergedCellStartX + (mergedCellWidth / 2) // กึ่งกลางของเซลล์ที่ผสาน
        const textY = tableStartY + (cellHeight / 2) + 3 // กึ่งกลางของแถวแรก (เพิ่ม 3 เพื่อปรับตำแหน่งให้ดี)
        pdf.text('รายงานสรุปผลการตรวจสอบ ปพ.5', textX, textY, { align: 'center' })        // เพิ่มข้อความในเซลล์ที่ 2,2+2,3 - ปีการศึกษาและภาคเรียน
        setFont('normal')
        pdf.setFontSize(16)
        const mergedCell22StartX = tableStartX + col1Width // เริ่มต้นของเซลล์ที่ผสาน (คอลลัมน์ 2+3)
        const mergedCell22Width = col2Width + col3Width // ความกว้างของเซลล์ที่ผสาน
        const cell22CenterX = mergedCell22StartX + (mergedCell22Width / 2) // จัดกึ่งกลางของเซลล์ที่ผสาน
        const cell22Y = tableStartY + cellHeight + (cellHeight / 2) + 2 // แถวที่ 2 + กึ่งกลางเซลล์

        // ใช้ข้อมูลจาก Excel หรือใช้ข้อมูลจาก formData เป็น fallback
        const academicYear = data.excelData.data?.home_academic_year || data.formData.academicYear || 'ไม่มีข้อมูล'
        const semester = data.excelData.data?.home_semester || data.formData.semester || 'ไม่มีข้อมูล'

        pdf.text(`ปีการศึกษา ${academicYear} ภาคเรียนที่ ${semester}`, cell22CenterX, cell22Y, { align: 'center' })

        // เพิ่มข้อความในเซลล์ที่ 3,2 - วิชา รหัสวิชา และชื่อวิชา
        setFont('normal')
        pdf.setFontSize(14)
        const cell32X = tableStartX + col1Width + 5 // เริ่มต้นคอลลัมน์ที่ 2 + margin 5mm
        const cell32Y = tableStartY + (2 * cellHeight) + (cellHeight / 2) + 2 // แถวที่ 3 + กึ่งกลางเซลล์

        // ใช้ข้อมูลจาก Excel
        const subjectCode = data.excelData.data?.home_subject_code || 'ไม่มีข้อมูล'
        const subject = data.excelData.data?.home_subject || 'ไม่มีข้อมูล'

        pdf.text(`วิชา ${subjectCode} ${subject}`, cell32X, cell32Y)

        // เพิ่มข้อความในเซลล์ที่ 3,3 - จำนวนชั่วโมงเรียนต่อสัปดาห์
        setFont('normal')
        pdf.setFontSize(14)
        const cell33X = tableStartX + col1Width + col2Width + 5 // เริ่มต้นคอลลัมน์ที่ 3 + margin 5mm
        const cell33Y = tableStartY + (2 * cellHeight) + (cellHeight / 2) + 2 // แถวที่ 3 + กึ่งกลางเซลล์

        // ใช้ข้อมูลจาก Excel
        const studyTime = data.excelData.data?.home_study_time || 'ไม่มีข้อมูล'

        pdf.text(`${studyTime} ชั่วโมง/สัปดาห์`, cell33X, cell33Y)

        // เพิ่มข้อความในเซลล์ที่ 4,2 - ผู้สอน
        setFont('normal')
        pdf.setFontSize(14)
        const cell42X = tableStartX + col1Width + 5 // เริ่มต้นคอลลัมน์ที่ 2 + margin 5mm
        const cell42Y = tableStartY + (3 * cellHeight) + (cellHeight / 2) + 2 // แถวที่ 4 + กึ่งกลางเซลล์

        // ใช้ข้อมูลจาก Excel
        const teacher = data.excelData.data?.home_teacher || 'ไม่มีข้อมูล'

        pdf.text(`ผู้สอน ${teacher}`, cell42X, cell42Y)

        // เพิ่มข้อความในเซลล์ที่ 4,3 - จำนวนหน่วยกิต
        setFont('normal')
        pdf.setFontSize(14)
        const cell43X = tableStartX + col1Width + col2Width + 5 // เริ่มต้นคอลลัมน์ที่ 3 + margin 5mm
        const cell43Y = tableStartY + (3 * cellHeight) + (cellHeight / 2) + 2 // แถวที่ 4 + กึ่งกลางเซลล์

        // ใช้ข้อมูลจาก Excel
        const credit = data.excelData.data?.home_credit || 'ไม่มีข้อมูล'

        pdf.text(`${credit} หน่วยกิต`, cell43X, cell43Y)

        // ข้อมูลทั่วไป (ปรับตำแหน่งให้อยู่ใต้ตาราง)
        setFont('normal')
        pdf.setFontSize(14)
        const contentStartY = tableStartY + tableHeight + 8 // เริ่มเนื้อหา 10mm ใต้ตาราง (ตารางสูง 80mm แล้ว)
        let yPosition = contentStartY // เริ่มเนื้อหาหลัก

        // รายการไฟล์ Excel (ถ้ามีข้อมูล)
        if (data.excelData.fileName || data.excelData.fileSize || data.excelData.uploadedAt) {
            setFont('bold')
            pdf.setFontSize(12)
            pdf.text('รายการไฟล์ Excel:', margins.left, yPosition)
            yPosition += 5

            setFont('normal')
            pdf.setFontSize(11)

            // ชื่อไฟล์
            if (data.excelData.fileName) {
                pdf.text(`1. ชื่อไฟล์: ${data.excelData.fileName}`, margins.left + 5, yPosition)
                yPosition += 5
            }

            // ขนาดไฟล์
            if (data.excelData.fileSize) {
                const fileSizeInKB = (data.excelData.fileSize / 1024).toFixed(2)
                const fileSizeInMB = (data.excelData.fileSize / (1024 * 1024)).toFixed(2)
                const displayFileSize = data.excelData.fileSize < 1024 * 1024
                    ? `${fileSizeInKB} KB`
                    : `${fileSizeInMB} MB`
                pdf.text(`2. ขนาดไฟล์: ${displayFileSize}`, margins.left + 5, yPosition)
                yPosition += 5
            }

            // วันที่อัพโหลด
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

            yPosition += 10 // เพิ่มระยะห่าง
        }

        // ข้อมูลจาก PDF OCR (Gemini)
        // if (data.geminiOcrResult.hasData && data.geminiOcrResult.data) {
        //     const ocrData = data.geminiOcrResult.data

        //     setFont('bold')
        //     pdf.setFontSize(16)
        //     pdf.text('ข้อมูลรายวิชา (จาก PDF)', margins.left, yPosition)
        //     yPosition += 15

        //     setFont('normal')
        //     pdf.setFontSize(12)
        //     pdf.text(`รหัสวิชา: ${ocrData.course_id || 'ไม่มีข้อมูล'}`, margins.left, yPosition)
        //     yPosition += 10
        //     pdf.text(`ชื่อวิชา: ${ocrData.course_name || 'ไม่มีข้อมูล'}`, margins.left, yPosition)
        //     yPosition += 10
        //     pdf.text(`ปีการศึกษา: ${ocrData.academic_year || 'ไม่มีข้อมูล'}`, margins.left, yPosition)
        //     yPosition += 10
        //     pdf.text(`เทอม: ${ocrData.semester || 'ไม่มีข้อมูล'}`, margins.left, yPosition)
        //     yPosition += 10
        //     pdf.text(`ระดับชั้น: ${ocrData.grade_level || 'ไม่มีข้อมูล'}`, margins.left, yPosition)
        //     yPosition += 10
        //     pdf.text(`กลุ่มเรียน: ${ocrData.section || 'ไม่มีข้อมูล'}`, margins.left, yPosition)
        //     yPosition += 10
        //     pdf.text(`ครูผู้สอน: ${ocrData.teacher || 'ไม่มีข้อมูล'}`, margins.left, yPosition)
        //     yPosition += 20

        //     // ผลการตรวจสอบมาตรฐาน
        //     setFont('bold')
        //     pdf.setFontSize(16)
        //     pdf.text('ผลการตรวจสอบมาตรฐาน', margins.left, yPosition)
        //     yPosition += 15

        //     setFont('normal')
        //     pdf.setFontSize(12)
        //     const gradeCheck = ocrData.grade_valid ? '✓' : '✗'
        //     const attitudeCheck = ocrData.attitude_valid ? '✓' : '✗'
        //     const readCheck = ocrData.read_analyze_write_valid ? '✓' : '✗'

        //     pdf.text(`${gradeCheck} ผลการเรียน (≥70%): ${ocrData.grade_valid ? 'ผ่าน' : 'ไม่ผ่าน'}`, margins.left, yPosition)
        //     yPosition += 10
        //     pdf.text(`${attitudeCheck} คุณลักษณะอันพึงประสงค์ (≥80%): ${ocrData.attitude_valid ? 'ผ่าน' : 'ไม่ผ่าน'}`, margins.left, yPosition)
        //     yPosition += 10
        //     pdf.text(`${readCheck} อ่าน วิเคราะห์ เขียน (≥80%): ${ocrData.read_analyze_write_valid ? 'ผ่าน' : 'ไม่ผ่าน'}`, margins.left, yPosition)
        //     yPosition += 20
        // } else {
        //     setFont('normal')
        //     pdf.setFontSize(14)
        //     pdf.text('ข้อมูลจาก PDF: ไม่มีข้อมูลหรือไม่สามารถประมวลผลได้', margins.left, yPosition)
        //     yPosition += 20
        // }

        // ข้อมูลจาก Excel
        if (data.excelData.hasData && data.excelData.data) {
            setFont('bold')
            pdf.setFontSize(16)
            pdf.text(`ข้อมูลจากไฟล์ Excel (ชีท "${data.excelData.sheetName}")`, margins.left, yPosition)
            yPosition += 15

            setFont('normal')
            pdf.setFontSize(12)
            Object.entries(data.excelData.data).forEach(([key, value]) => {
                // เช็คว่าเกินหน้า ต้องเพิ่มหน้าใหม่หรือไม่
                if (yPosition > 270) {
                    pdf.addPage()
                    yPosition = margins.top + 10
                }

                // แปลงค่า value ให้เป็น string
                const displayValue = value !== null && value !== undefined ? String(value) : 'ไม่มีข้อมูล'
                pdf.text(`${key}: ${displayValue}`, margins.left, yPosition)
                yPosition += 8
            })
            yPosition += 15
        } else {
            setFont('normal')
            pdf.setFontSize(14)
            pdf.text('ข้อมูลจาก Excel: ไม่มีข้อมูลในชีท "check" หรือไม่สามารถอ่านได้', margins.left, yPosition)
            yPosition += 20
        }

        // สรุปผลการประมวลผล
        if (yPosition > 250) {
            pdf.addPage()
            yPosition = margins.top + 10
        }

        setFont('bold')
        pdf.setFontSize(16)
        pdf.text('สรุปผลการประมวลผล', margins.left, yPosition)
        yPosition += 15

        setFont('normal')
        pdf.setFontSize(12)
        pdf.text(`สถานะ: ${data.summary.success ? 'สำเร็จ' : 'ล้มเหลว'}`, margins.left, yPosition)
        yPosition += 10
        pdf.text(`จำนวนแหล่งข้อมูล: ${data.summary.totalDataSources} แหล่ง`, margins.left, yPosition)
        yPosition += 10
        pdf.text(`มีข้อมูล Excel: ${data.summary.hasExcelData ? 'มี' : 'ไม่มี'}`, margins.left, yPosition)
        yPosition += 10
        pdf.text(`มีข้อมูล PDF: ${data.summary.hasPdfData ? 'มี' : 'ไม่มี'}`, margins.left, yPosition)
        yPosition += 20

        // แสดงข้อมูลครูที่รับผิดชอบ (จาก Excel home_teacher)
        if (data.excelData.hasData && data.excelData.data?.home_teacher) {
            setFont('bold')
            pdf.setFontSize(14)
            pdf.text('ข้อมูลผู้รับผิดชอบ', margins.left, yPosition)
            yPosition += 12

            setFont('normal')
            pdf.setFontSize(12)
            pdf.text(`ครูที่รับผิดชอบ: ${data.excelData.data.home_teacher}`, margins.left, yPosition)
            yPosition += 20
        }

        // ข้อมูลฐานข้อมูล (ถ้ามี)
        if (data.database) {
            setFont('bold')
            pdf.setFontSize(14)
            pdf.text('ข้อมูลการบันทึก', margins.left, yPosition)
            yPosition += 12

            setFont('normal')
            pdf.setFontSize(10)
            pdf.text(`Record ID: ${data.database.recordId}`, margins.left, yPosition)
            yPosition += 8
            pdf.text(`UUID: ${data.database.uuid}`, margins.left, yPosition)
            yPosition += 8
            pdf.text(`บันทึกเมื่อ: ${new Date(data.database.savedAt).toLocaleString('th-TH')}`, margins.left, yPosition)
            yPosition += 15
        }

        // ส่วนท้าย
        setFont('normal')
        pdf.setFontSize(10)
        pdf.text(`สร้างเมื่อ: ${data.formData.timestamp}`, margins.left, yPosition)
        pdf.text(`ประมวลผลเมื่อ: ${data.formData.submittedAt}`, margins.left, yPosition + 10)

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
            // Fallback: ดาวน์โหลดถ้าไม่สามารถเปิดแทบใหม่ได้ (popup blocked)
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
