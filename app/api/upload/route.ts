import { NextRequest, NextResponse } from 'next/server'

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

        // Get backend URL from environment variable
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

        if (!backendUrl) {
            return NextResponse.json(
                { error: 'Backend URL not configured' },
                { status: 500 }
            )
        }

        // Create FormData to send to backend
        const formData = new FormData()
        formData.append('academicYear', academicYear)
        formData.append('semester', semester)
        formData.append('file_xlsx', xlsxFile)
        if (pdfFile) {
            formData.append('file_pdf', pdfFile)
        }

        // Send data to backend
        const response = await fetch(backendUrl, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log(result)

        return NextResponse.json({
            success: true,
            message: 'Data sent to backend successfully',
            data: result
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
