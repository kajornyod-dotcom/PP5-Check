import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { GoogleGenerativeAI } from '@google/generative-ai'
import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'

// ฟังก์ชันสำหรับประมวลผล PDF ด้วย Gemini
async function processPdfWithGemini(pdfFile: File) {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured')
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json"
        }
    })

    // แปลง PDF เป็น base64
    const arrayBuffer = await pdfFile.arrayBuffer()
    const base64String = Buffer.from(arrayBuffer).toString('base64')

    const prompt = `
    วิเคราะห์รายงาน SGS (ปพ.5) จากไฟล์ PDF นี้และส่งคืนข้อมูลในรูปแบบ JSON ที่มีโครงสร้างดังนี้:

    {
      "course_id": "รหัสวิชา (string)",
      "course_name": "ชื่อวิชา (string)",
      "academic_year": "ปีการศึกษา พ.ศ. (string)",
      "semester": "เทอม (string)",
      "grade_level": "ระดับชั้น เช่น ม.1 (string)",
      "section": "กลุ่มเรียน (number)",
      "teacher": "ชื่อครูผู้สอน (string)",
      "grade_valid": "มีผลการเรียนมากกว่า 0 อย่างน้อย 70% ของนักเรียน (boolean)",
      "attitude_valid": "ฐานนิยมคุณลักษณะอันพึงประสงค์มากกว่า 0 อย่างน้อย 80% ของนักเรียน (boolean)",
      "read_analyze_write_valid": "ฐานนิยมอ่าน วิเคราะห์ เขียน มากกว่า 0 อย่างน้อย 80% ของนักเรียน (boolean)"
    }

    หากข้อมูลบางอย่างไม่สามารถอ่านได้ ให้ใส่ค่าว่าง ("") สำหรับ string, 0 สำหรับ number หรือ false สำหรับ boolean
    
    ตอบกลับเป็น JSON object เท่านั้น ไม่ต้องมีข้อความอธิบายเพิ่มเติม
    `

    try {
        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64String,
                    mimeType: "application/pdf"
                }
            },
            prompt
        ])

        const response = await result.response
        const text = response.text()

        console.log('Raw Gemini response:', text)

        // ลองแปลง JSON โดยตรงก่อน
        try {
            const jsonResult = JSON.parse(text)

            // ตรวจสอบและแปลงค่าเป็น type ที่ถูกต้อง
            const processedResult = {
                course_id: String(jsonResult.course_id || ""),
                course_name: String(jsonResult.course_name || ""),
                academic_year: String(jsonResult.academic_year || ""),
                semester: String(jsonResult.semester || ""),
                grade_level: String(jsonResult.grade_level || ""),
                section: Number(jsonResult.section) || 0,
                teacher: String(jsonResult.teacher || ""),
                grade_valid: Boolean(jsonResult.grade_valid),
                attitude_valid: Boolean(jsonResult.attitude_valid),
                read_analyze_write_valid: Boolean(jsonResult.read_analyze_write_valid)
            }

            console.log('Processed OCR result:', processedResult)
            return processedResult

        } catch (parseError) {
            console.error('Direct JSON parse failed, trying to extract JSON from response')

            // พยายามแยก JSON จากการตอบกลับ
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const jsonString = jsonMatch[0]
                const extractedJson = JSON.parse(jsonString)

                // ตรวจสอบและแปลงค่าเป็น type ที่ถูกต้อง
                const processedResult = {
                    course_id: String(extractedJson.course_id || ""),
                    course_name: String(extractedJson.course_name || ""),
                    academic_year: String(extractedJson.academic_year || ""),
                    semester: String(extractedJson.semester || ""),
                    grade_level: String(extractedJson.grade_level || ""),
                    section: Number(extractedJson.section) || 0,
                    teacher: String(extractedJson.teacher || ""),
                    grade_valid: Boolean(extractedJson.grade_valid),
                    attitude_valid: Boolean(extractedJson.attitude_valid),
                    read_analyze_write_valid: Boolean(extractedJson.read_analyze_write_valid)
                }

                console.log('Extracted and processed OCR result:', processedResult)
                return processedResult
            } else {
                throw new Error('ไม่สามารถแยก JSON จากการตอบกลับของ Gemini ได้')
            }
        }
    } catch (error) {
        console.error('Error processing PDF with Gemini:', error)
        throw error
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData()
        const academicYear = data.get('academicYear') as string
        const semester = data.get('semester') as string
        const xlsxFile = data.get('file_xlsx') as File
        const pdfFile = data.get('file_pdf') as File | null

        // Validate required fields
        if (!academicYear || !semester || !xlsxFile) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        console.log('=== ข้อมูลที่ได้รับ ===')
        console.log('ปีการศึกษา:', academicYear)
        console.log('ภาคเรียน:', semester)

        // ตรวจสอบว่ามีการส่งไฟล์ Excel มาหรือไม่
        if (xlsxFile) {
            console.log('✅ มีการส่งไฟล์ Excel มา:', xlsxFile.name, `(${(xlsxFile.size / 1024 / 1024).toFixed(2)} MB)`)
        } else {
            console.log('❌ ไม่มีการส่งไฟล์ Excel มา')
        }

        let pdfOcrResult = null
        if (pdfFile) {
            console.log('✅ มีการส่งไฟล์ PDF มา:', pdfFile.name, `(${(pdfFile.size / 1024 / 1024).toFixed(2)} MB)`)

            // ส่ง PDF ไปยัง Gemini สำหรับ OCR
            try {
                console.log('\n=== กำลังประมวลผล PDF ด้วย Gemini ===')
                pdfOcrResult = await processPdfWithGemini(pdfFile)
                console.log('ผลการ OCR จาก PDF:', pdfOcrResult)
            } catch (ocrError) {
                console.error('❌ เกิดข้อผิดพลาดในการประมวลผล PDF:', ocrError)
            }
        } else {
            console.log('ℹ️  ไม่มีการส่งไฟล์ PDF มา (ไม่บังคับ)')
        }

        // อ่านไฟล์ Excel
        const arrayBuffer = await xlsxFile.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })

        console.log('\n=== รายชื่อชีท ===')
        console.log('ชีทที่มี:', workbook.SheetNames)

        let excelData: { [key: string]: any } = {}

        // ตรวจสอบว่ามีชีท "check" หรือไม่
        if (workbook.SheetNames.includes('check')) {
            console.log('\n=== ข้อมูลจากชีท "check" ===')
            const worksheet = workbook.Sheets['check']
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

            // แปลงข้อมูลให้อยู่ในรูป Object
            const convertedData: { [key: string]: any } = {}

            // กรองแถวที่มีข้อมูล (ไม่ใช่แถวว่าง)
            const validRows = jsonData.filter((row: any) =>
                Array.isArray(row) && row.length >= 2 &&
                row[0] !== undefined && row[0] !== '' &&
                row[0] !== 'list' // ข้าม header row
            )

            // แปลงจาก [key, value] เป็น object
            validRows.forEach((row: any) => {
                if (Array.isArray(row) && row.length >= 2) {
                    const key = row[0]
                    const value = row[1]
                    convertedData[key] = value
                }
            })

            console.log(convertedData)
            excelData = convertedData

        } else {
            console.log('\n❌ ไม่พบชีท "check" ในไฟล์ Excel')
            console.log('ชีทที่มี:', workbook.SheetNames)
        }

        // บันทึกข้อมูลลงฐานข้อมูล (ถ้าต้องการ)
        // TODO: บันทึกข้อมูลลง MongoDB ผ่าน Prisma

        // สร้าง PDF รายงาน
        let doc: any
        try {
            doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            })
        } catch (error) {
            console.log('PDFKit initialization error, trying alternative approach:', error)
            // ถ้าเกิดข้อผิดพลาดให้ใช้การตั้งค่าแบบง่าย
            doc = new PDFDocument()
        }

        // กำหนด path ของ font
        const fontPath = path.join(process.cwd(), 'public', 'fonts', 'THSarabun.ttf')
        const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'THSarabun Bold.ttf')

        try {
            // ตรวจสอบว่าไฟล์ font มีอยู่หรือไม่
            if (fs.existsSync(fontPath)) {
                doc.registerFont('THSarabun', fontPath)
                console.log('✅ ลงทะเบียน THSarabun font สำเร็จ')
            }
            if (fs.existsSync(fontBoldPath)) {
                doc.registerFont('THSarabunBold', fontBoldPath)
                console.log('✅ ลงทะเบียน THSarabun Bold font สำเร็จ')
            }
        } catch (fontError) {
            console.error('⚠️ ไม่สามารถลงทะเบียน font ได้:', fontError)
            console.log('ใช้ default font แทน')
        }

        // สร้าง buffer สำหรับเก็บ PDF
        const buffers: Buffer[] = []
        doc.on('data', buffers.push.bind(buffers))        // หัวเอกสาร
        try {
            doc.font('THSarabun')
        } catch (error) {
            console.log('Font setting error, using default font:', error)
            try {
                doc.font('THSarabunBold')
            } catch (fallbackError) {
                console.log('THSarabun font not available, using default')
            }
        }

        doc.fontSize(20)
            .text('รายงานสรุปผลการตรวจสอบ ปพ.5', {
                align: 'center'
            })
            .moveDown()

        // ข้อมูลทั่วไป
        try {
            doc.font('THSarabun')
        } catch (error) {
            console.log('Font setting error for regular text, using default font')
        }

        doc.fontSize(14)
            .text(`ปีการศึกษา: ${academicYear}`, 50, doc.y)
            .text(`ภาคเรียน: ${semester}`, 50, doc.y + 5)
            .moveDown()

        // หากมีข้อมูลจาก PDF OCR
        if (pdfOcrResult) {
            try {
                doc.font('THSarabunBold')
            } catch (error) {
                console.log('Font setting error for section header')
            }

            doc.fontSize(16)
                .text('ข้อมูลรายวิชา', { underline: true })
                .moveDown(0.5)

            try {
                doc.font('THSarabun')
            } catch (error) {
                console.log('Font setting error for content')
            }

            doc.fontSize(12)
                .text(`รหัสวิชา: ${pdfOcrResult.course_id}`)
                .text(`ชื่อวิชา: ${pdfOcrResult.course_name}`)
                .text(`ระดับชั้น: ${pdfOcrResult.grade_level}`)
                .text(`กลุ่มเรียน: ${pdfOcrResult.section}`)
                .text(`ครูผู้สอน: ${pdfOcrResult.teacher}`)
                .moveDown()

            // ผลการตรวจสอบมาตรฐาน
            try {
                doc.font('THSarabunBold')
            } catch (error) {
                console.log('Font setting error for standards header')
            }

            doc.fontSize(16)
                .text('ผลการตรวจสอบมาตรฐาน', { underline: true })
                .moveDown(0.5)

            const checkMark = pdfOcrResult.grade_valid ? '✓' : '✗'
            const attitudeCheck = pdfOcrResult.attitude_valid ? '✓' : '✗'
            const readCheck = pdfOcrResult.read_analyze_write_valid ? '✓' : '✗'

            try {
                doc.font('THSarabun')
            } catch (error) {
                console.log('Font setting error for standards content')
            }

            doc.fontSize(12)
                .text(`${checkMark} ผลการเรียน (≥70% ของนักเรียนมีผลมากกว่า 0): ${pdfOcrResult.grade_valid ? 'ผ่าน' : 'ไม่ผ่าน'}`)
                .text(`${attitudeCheck} คุณลักษณะอันพึงประสงค์ (≥80% ของนักเรียนมีผลมากกว่า 0): ${pdfOcrResult.attitude_valid ? 'ผ่าน' : 'ไม่ผ่าน'}`)
                .text(`${readCheck} อ่าน วิเคราะห์ เขียน (≥80% ของนักเรียนมีผลมากกว่า 0): ${pdfOcrResult.read_analyze_write_valid ? 'ผ่าน' : 'ไม่ผ่าน'}`)
                .moveDown()
        }

        // หากมีข้อมูลจาก Excel
        if (excelData && Object.keys(excelData).length > 0) {
            try {
                doc.font('THSarabunBold')
            } catch (error) {
                console.log('Font setting error for Excel header')
            }

            doc.fontSize(16)
                .text('ข้อมูลจากไฟล์ Excel (ชีท "check")', { underline: true })
                .moveDown(0.5)

            try {
                doc.font('THSarabun')
            } catch (error) {
                console.log('Font setting error for Excel content')
            }

            doc.fontSize(12)
            Object.entries(excelData).forEach(([key, value]) => {
                doc.text(`${key}: ${value}`)
            })
            doc.moveDown()
        }

        // ส่วนท้าย
        try {
            doc.font('THSarabun')
        } catch (error) {
            console.log('Font setting error for footer')
        }

        doc.fontSize(10)
            .text(`สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}`, {
                align: 'right'
            })

        // จบการสร้าง PDF
        doc.end()

        // รอให้ PDF สร้างเสร็จแล้วส่งกลับ
        return new Promise<NextResponse>((resolve) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers)

                resolve(new NextResponse(pdfBuffer, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="report-pp5-${academicYear}-${semester}.pdf"`,
                        'Content-Length': pdfBuffer.length.toString()
                    }
                }))
            })
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
