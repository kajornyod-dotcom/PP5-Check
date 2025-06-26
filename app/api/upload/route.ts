import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

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
        console.log('ไฟล์ Excel:', xlsxFile.name, `(${(xlsxFile.size / 1024 / 1024).toFixed(2)} MB)`)
        if (pdfFile) {
            console.log('ไฟล์ PDF:', pdfFile.name, `(${(pdfFile.size / 1024 / 1024).toFixed(2)} MB)`)
        }

        // อ่านไฟล์ Excel
        const arrayBuffer = await xlsxFile.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })

        console.log('\n=== รายชื่อชีท ===')
        console.log('ชีทที่มี:', workbook.SheetNames)

        // ตรวจสอบว่ามีชีท "check" หรือไม่
        if (workbook.SheetNames.includes('check')) {
            console.log('\n=== ข้อมูลจากชีท "check" ===')
            const worksheet = workbook.Sheets['check']
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

            console.log('จำนวนแถว:', jsonData.length)
            console.log('ข้อมูลดิบจากชีท "check":')
            console.log(JSON.stringify(jsonData, null, 2))

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

        
            // แสดงข้อมูลแต่ละแถวแยกกัน
            console.log('\n=== รายละเอียดแต่ละแถว ===')
            validRows.forEach((row: any, index: number) => {
                if (Array.isArray(row) && row.length >= 2) {
                    console.log(`แถว ${index + 1}:`, `${row[0]} = ${row[1]}`)
                }
            })

    
        } else {
            console.log('\n❌ ไม่พบชีท "check" ในไฟล์ Excel')
            console.log('ชีทที่มี:', workbook.SheetNames)
        }

        // บันทึกข้อมูลลงฐานข้อมูล (ถ้าต้องการ)
        // TODO: บันทึกข้อมูลลง MongoDB ผ่าน Prisma

        return NextResponse.json({
            success: true,
            message: 'ประมวลผลไฟล์สำเร็จ',
            data: {
                academicYear,
                semester,
                fileName: xlsxFile.name,
                fileSize: xlsxFile.size,
                pdfFileName: pdfFile?.name || null,
                sheetsFound: workbook.SheetNames,
                hasCheckSheet: workbook.SheetNames.includes('check')
            }
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
