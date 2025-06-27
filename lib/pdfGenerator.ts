import jsPDF from 'jspdf'

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

interface ReportData {
    formData: FormData
    excelData: ExcelData
    geminiOcrResult: GeminiOcrResult
    summary: Summary
}

/**
 * ฟังก์ชันสำหรับสร้าง PDF รายงาน ปพ.5 จากข้อมูลที่ backend ส่งกลับ
 * จะเปิด PDF ในแทบใหม่ และถ้าไม่สามารถเปิดได้จะดาวน์โหลดอัตโนมัติ
 * @param data ข้อมูลที่ได้รับจาก backend API
 */
export const generatePDF = (data: ReportData): void => {
    try {
        const pdf = new jsPDF()

        // ตั้งค่า font (ใช้ default font ของ jsPDF สำหรับภาษาอังกฤษ)
        pdf.setFont('helvetica')

        // หัวเอกสาร
        pdf.setFontSize(20)
        pdf.text('รายงานสรุปผลการตรวจสอบ ปพ.5', 105, 30, { align: 'center' })

        // ข้อมูลทั่วไป
        pdf.setFontSize(14)
        pdf.text(`ปีการศึกษา: ${data.formData.academicYear}`, 20, 50)
        pdf.text(`ภาคเรียน: ${data.formData.semester}`, 20, 65)

        let yPosition = 85

        // ข้อมูลจาก PDF OCR (Gemini)
        if (data.geminiOcrResult.hasData && data.geminiOcrResult.data) {
            const ocrData = data.geminiOcrResult.data

            pdf.setFontSize(16)
            pdf.text('ข้อมูลรายวิชา (จาก PDF)', 20, yPosition)
            yPosition += 15

            pdf.setFontSize(12)
            pdf.text(`รหัสวิชา: ${ocrData.course_id || 'ไม่มีข้อมูล'}`, 20, yPosition)
            yPosition += 10
            pdf.text(`ชื่อวิชา: ${ocrData.course_name || 'ไม่มีข้อมูล'}`, 20, yPosition)
            yPosition += 10
            pdf.text(`ปีการศึกษา: ${ocrData.academic_year || 'ไม่มีข้อมูล'}`, 20, yPosition)
            yPosition += 10
            pdf.text(`เทอม: ${ocrData.semester || 'ไม่มีข้อมูล'}`, 20, yPosition)
            yPosition += 10
            pdf.text(`ระดับชั้น: ${ocrData.grade_level || 'ไม่มีข้อมูล'}`, 20, yPosition)
            yPosition += 10
            pdf.text(`กลุ่มเรียน: ${ocrData.section || 'ไม่มีข้อมูล'}`, 20, yPosition)
            yPosition += 10
            pdf.text(`ครูผู้สอน: ${ocrData.teacher || 'ไม่มีข้อมูล'}`, 20, yPosition)
            yPosition += 20

            // ผลการตรวจสอบมาตรฐาน
            pdf.setFontSize(16)
            pdf.text('ผลการตรวจสอบมาตรฐาน', 20, yPosition)
            yPosition += 15

            pdf.setFontSize(12)
            const gradeCheck = ocrData.grade_valid ? '✓' : '✗'
            const attitudeCheck = ocrData.attitude_valid ? '✓' : '✗'
            const readCheck = ocrData.read_analyze_write_valid ? '✓' : '✗'

            pdf.text(`${gradeCheck} ผลการเรียน (≥70%): ${ocrData.grade_valid ? 'ผ่าน' : 'ไม่ผ่าน'}`, 20, yPosition)
            yPosition += 10
            pdf.text(`${attitudeCheck} คุณลักษณะอันพึงประสงค์ (≥80%): ${ocrData.attitude_valid ? 'ผ่าน' : 'ไม่ผ่าน'}`, 20, yPosition)
            yPosition += 10
            pdf.text(`${readCheck} อ่าน วิเคราะห์ เขียน (≥80%): ${ocrData.read_analyze_write_valid ? 'ผ่าน' : 'ไม่ผ่าน'}`, 20, yPosition)
            yPosition += 20
        } else {
            pdf.setFontSize(14)
            pdf.text('ข้อมูลจาก PDF: ไม่มีข้อมูลหรือไม่สามารถประมวลผลได้', 20, yPosition)
            yPosition += 20
        }

        // ข้อมูลจาก Excel
        if (data.excelData.hasData && data.excelData.data) {
            pdf.setFontSize(16)
            pdf.text(`ข้อมูลจากไฟล์ Excel (ชีท "${data.excelData.sheetName}")`, 20, yPosition)
            yPosition += 15

            pdf.setFontSize(12)
            Object.entries(data.excelData.data).forEach(([key, value]) => {
                // เช็คว่าเกินหน้า ต้องเพิ่มหน้าใหม่หรือไม่
                if (yPosition > 270) {
                    pdf.addPage()
                    yPosition = 20
                }

                // แปลงค่า value ให้เป็น string
                const displayValue = value !== null && value !== undefined ? String(value) : 'ไม่มีข้อมูล'
                pdf.text(`${key}: ${displayValue}`, 20, yPosition)
                yPosition += 8
            })
            yPosition += 15
        } else {
            pdf.setFontSize(14)
            pdf.text('ข้อมูลจาก Excel: ไม่มีข้อมูลในชีท "check" หรือไม่สามารถอ่านได้', 20, yPosition)
            yPosition += 20
        }

        // สรุปผลการประมวลผล
        if (yPosition > 250) {
            pdf.addPage()
            yPosition = 20
        }

        pdf.setFontSize(16)
        pdf.text('สรุปผลการประมวลผล', 20, yPosition)
        yPosition += 15

        pdf.setFontSize(12)
        pdf.text(`สถานะ: ${data.summary.success ? 'สำเร็จ' : 'ล้มเหลว'}`, 20, yPosition)
        yPosition += 10
        pdf.text(`จำนวนแหล่งข้อมูล: ${data.summary.totalDataSources} แหล่ง`, 20, yPosition)
        yPosition += 10
        pdf.text(`มีข้อมูล Excel: ${data.summary.hasExcelData ? 'มี' : 'ไม่มี'}`, 20, yPosition)
        yPosition += 10
        pdf.text(`มีข้อมูล PDF: ${data.summary.hasPdfData ? 'มี' : 'ไม่มี'}`, 20, yPosition)
        yPosition += 20

        // ส่วนท้าย
        pdf.setFontSize(10)
        pdf.text(`สร้างเมื่อ: ${data.formData.timestamp}`, 20, yPosition)
        pdf.text(`ประมวลผลเมื่อ: ${data.formData.submittedAt}`, 20, yPosition + 10)        // สร้างชื่อไฟล์
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
