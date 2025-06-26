import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            academicYear,
            semester,
            excelData,
            pdfOcrResult
        } = body

        // สร้าง PDF Document
        const doc = new PDFDocument({
            size: 'A4',
            margins: {
                top: 50,
                bottom: 50,
                left: 50,
                right: 50
            }
        })

        // สร้าง buffer สำหรับเก็บ PDF
        const buffers: Buffer[] = []
        doc.on('data', buffers.push.bind(buffers))

        // หัวเอกสาร
        doc.fontSize(20)
            .text('รายงานสรุปผลการตรวจสอบ ปพ.5', {
                align: 'center'
            })
            .moveDown()

        // ข้อมูลทั่วไป
        doc.fontSize(14)
            .text(`ปีการศึกษา: ${academicYear}`, 50, doc.y)
            .text(`ภาคเรียน: ${semester}`, 50, doc.y + 5)
            .moveDown()

        // หากมีข้อมูลจาก PDF OCR
        if (pdfOcrResult) {
            doc.fontSize(16)
                .text('ข้อมูลรายวิชา', { underline: true })
                .moveDown(0.5)

            doc.fontSize(12)
                .text(`รหัสวิชา: ${pdfOcrResult.course_id}`)
                .text(`ชื่อวิชา: ${pdfOcrResult.course_name}`)
                .text(`ระดับชั้น: ${pdfOcrResult.grade_level}`)
                .text(`กลุ่มเรียน: ${pdfOcrResult.section}`)
                .text(`ครูผู้สอน: ${pdfOcrResult.teacher}`)
                .moveDown()

            // ผลการตรวจสอบมาตรฐาน
            doc.fontSize(16)
                .text('ผลการตรวจสอบมาตรฐาน', { underline: true })
                .moveDown(0.5)

            const checkMark = pdfOcrResult.grade_valid ? '✓' : '✗'
            const attitudeCheck = pdfOcrResult.attitude_valid ? '✓' : '✗'
            const readCheck = pdfOcrResult.read_analyze_write_valid ? '✓' : '✗'

            doc.fontSize(12)
                .text(`${checkMark} ผลการเรียน (≥70% ของนักเรียนมีผลมากกว่า 0): ${pdfOcrResult.grade_valid ? 'ผ่าน' : 'ไม่ผ่าน'}`)
                .text(`${attitudeCheck} คุณลักษณะอันพึงประสงค์ (≥80% ของนักเรียนมีผลมากกว่า 0): ${pdfOcrResult.attitude_valid ? 'ผ่าน' : 'ไม่ผ่าน'}`)
                .text(`${readCheck} อ่าน วิเคราะห์ เขียน (≥80% ของนักเรียนมีผลมากกว่า 0): ${pdfOcrResult.read_analyze_write_valid ? 'ผ่าน' : 'ไม่ผ่าน'}`)
                .moveDown()
        }

        // หากมีข้อมูลจาก Excel
        if (excelData && Object.keys(excelData).length > 0) {
            doc.fontSize(16)
                .text('ข้อมูลจากไฟล์ Excel (ชีท "check")', { underline: true })
                .moveDown(0.5)

            doc.fontSize(12)
            Object.entries(excelData).forEach(([key, value]) => {
                doc.text(`${key}: ${value}`)
            })
            doc.moveDown()
        }

        // ส่วนท้าย
        doc.fontSize(10)
            .text(`สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}`, {
                align: 'right'
            })

        // จบการสร้าง PDF
        doc.end()

        // รอให้ PDF สร้างเสร็จ
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
        console.error('PDF generation error:', error)
        return NextResponse.json(
            {
                error: 'Failed to generate PDF',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
