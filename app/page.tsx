'use client'

import { useState, useRef, DragEvent } from 'react'
import Image from 'next/image'

export default function Home() {
  const [academicYear, setAcademicYear] = useState('')
  const [semester, setSemester] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isPdfDragOver, setIsPdfDragOver] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [panelContent, setPanelContent] = useState({
    type: 'info' as 'info' | 'error' | 'warning' | 'success',
    title: 'คำแนะนำการใช้งาน',
    messages: [
      'เลือกปีการศึกษาและภาคเรียนที่ต้องการ',
      'อัปโหลดไฟล์ Excel (.xlsx) ที่มีข้อมูล ปพ.5',
      'อัปโหลดรายงาน ปพ.5 จาก SGS (.pdf) - ไม่บังคับ',
      'ไฟล์ต้องมีขนาดไม่เกิน 10MB',
      'กดปุ่ม "ส่งข้อมูลเพื่อตรวจสอบ" เมื่อพร้อม'
    ]
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Generate academic years (10 years back from current year in Buddhist Era)
  const currentYear = new Date().getFullYear()
  const currentBuddhistYear = currentYear + 543
  const academicYears = Array.from({ length: 10 }, (_, i) => currentBuddhistYear - i)

  const updatePanelContent = (type: 'info' | 'error' | 'warning' | 'success', title: string, messages: string[]) => {
    setPanelContent({ type, title, messages })
  }

  const handleFileChange = async (selectedFile: File | null) => {
    setError('')
    setSuccess(false)
    setIsUploading(false)  // Reset uploading state

    if (!selectedFile) {
      setFile(null)
      return
    }

    // Reset panel to info state when starting new file selection
    if (panelContent.type === 'success') {
      updatePanelContent('info', 'คำแนะนำการใช้งาน', [
        'เลือกปีการศึกษาและภาคเรียนที่ต้องการ',
        'อัปโหลดไฟล์ Excel (.xlsx) ที่มีข้อมูล ปพ.5',
        'อัปโหลดรายงาน ปพ.5 จาก SGS (.pdf) - ไม่บังคับ',
        'ไฟล์ต้องมีขนาดไม่เกิน 10MB',
        'กดปุ่ม "ส่งข้อมูลเพื่อตรวจสอบ" เมื่อพร้อม'
      ])
    }

    setIsUploading(true)

    // Simulate file validation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check file type
    if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
      !selectedFile.name.toLowerCase().endsWith('.xlsx')) {
      setError('กรุณาเลือกไฟล์ .xlsx เท่านั้น')
      updatePanelContent('error', 'ข้อผิดพลาดในการเลือกไฟล์', [
        'ไฟล์ที่เลือกไม่ใช่ไฟล์ Excel (.xlsx)',
        'กรุณาเลือกไฟล์ที่มีนามสกุล .xlsx เท่านั้น',
        'ตรวจสอบให้แน่ใจว่าไฟล์เป็น Excel ที่บันทึกในรูปแบบ .xlsx'
      ])
      setFile(null)
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)')
      updatePanelContent('error', 'ไฟล์มีขนาดใหญ่เกินไป', [
        `ขนาดไฟล์ปัจจุบัน: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        'ขนาดสูงสุดที่อนุญาต: 10 MB',
        'กรุณาลดขนาดไฟล์หรือเลือกไฟล์อื่น'
      ])
      setFile(null)
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setFile(selectedFile)
    setIsUploading(false)
    setSuccess(true)
    updatePanelContent('success', 'ไฟล์ถูกเลือกเรียบร้อยแล้ว', [
      `ชื่อไฟล์: ${selectedFile.name}`,
      `ขนาดไฟล์: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
      'ไฟล์พร้อมสำหรับการส่งข้อมูล',
      'กรอกปีการศึกษาและภาคเรียน แล้วกดส่งข้อมูล'
    ])

    // Auto-hide success message
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFile = e.dataTransfer.files[0]
    handleFileChange(droppedFile)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handlePdfBrowseClick = () => {
    pdfInputRef.current?.click()
  }

  const handlePdfFileChange = async (selectedFile: File | null) => {
    setError('')
    setSuccess(false)

    if (!selectedFile) {
      setPdfFile(null)
      return
    }

    // Reset panel to info state when starting new file selection
    if (panelContent.type === 'success') {
      updatePanelContent('info', 'คำแนะนำการใช้งาน', [
        'เลือกปีการศึกษาและภาคเรียนที่ต้องการ',
        'อัปโหลดไฟล์ Excel (.xlsx) ที่มีข้อมูล ปพ.5',
        'อัปโหลดรายงาน ปพ.5 จาก SGS (.pdf) - ไม่บังคับ',
        'ไฟล์ต้องมีขนาดไม่เกิน 10MB',
        'กดปุ่ม "ส่งข้อมูลเพื่อตรวจสอบ" เมื่อพร้อม'
      ])
    }

    // Check file type
    if (selectedFile.type !== 'application/pdf' &&
      !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('กรุณาเลือกไฟล์ .pdf เท่านั้น')
      updatePanelContent('error', 'ข้อผิดพลาดในการเลือกไฟล์ PDF', [
        'ไฟล์ที่เลือกไม่ใช่ไฟล์ PDF (.pdf)',
        'กรุณาเลือกไฟล์ที่มีนามสกุล .pdf เท่านั้น',
        'ตรวจสอบให้แน่ใจว่าไฟล์เป็น PDF'
      ])
      setPdfFile(null)
      if (pdfInputRef.current) {
        pdfInputRef.current.value = ''
      }
      return
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('ไฟล์ PDF มีขนาดใหญ่เกินไป (สูงสุด 10MB)')
      updatePanelContent('error', 'ไฟล์ PDF มีขนาดใหญ่เกินไป', [
        `ขนาดไฟล์ปัจจุบัน: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        'ขนาดสูงสุดที่อนุญาต: 10 MB',
        'กรุณาลดขนาดไฟล์หรือเลือกไฟล์อื่น'
      ])
      setPdfFile(null)
      if (pdfInputRef.current) {
        pdfInputRef.current.value = ''
      }
      return
    }

    setPdfFile(selectedFile)
    updatePanelContent('success', 'ไฟล์ PDF ถูกเลือกเรียบร้อยแล้ว', [
      `ชื่อไฟล์: ${selectedFile.name}`,
      `ขนาดไฟล์: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
      'ไฟล์รายงาน SGS พร้อมสำหรับการส่งข้อมูล'
    ])
  }

  const handlePdfDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsPdfDragOver(true)
  }

  const handlePdfDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsPdfDragOver(false)
  }

  const handlePdfDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsPdfDragOver(false)

    const droppedFile = e.dataTransfer.files[0]
    handlePdfFileChange(droppedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!academicYear || !semester || !file) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      updatePanelContent('error', 'ข้อมูลไม่ครบถ้วน', [
        'กรุณาเลือกปีการศึกษา',
        'กรุณาเลือกภาคเรียน',
        'กรุณาเลือกไฟล์ Excel (.xlsx)',
        'ตรวจสอบข้อมูลและลองอีกครั้ง'
      ])
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('academicYear', academicYear)
      formData.append('semester', semester)
      formData.append('file_xlsx', file)

      if (pdfFile) {
        formData.append('file_pdf', pdfFile)
      }

      const backendUrl = '/api/upload'

      updatePanelContent('info', 'กำลังประมวลผล...', [
        'กำลังส่งไฟล์ไปยังเซิร์ฟเวอร์',
        'กำลังอ่านข้อมูลจากไฟล์ Excel',
        pdfFile ? 'กำลังประมวลผล PDF ด้วย Gemini AI' : '',
        'กำลังสร้างรายงาน PDF...'
      ].filter(Boolean))

      // Send POST request to local API
      const response = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      // ตรวจสอบว่า response เป็น PDF หรือไม่
      const contentType = response.headers.get('content-type')

      if (contentType === 'application/pdf') {
        // ดาวน์โหลด PDF
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-pp5-${academicYear}-${semester}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        console.log('PDF downloaded successfully')
      } else {
        // กรณีที่ได้ JSON response (สำหรับ fallback)
        const result = await response.json()
        console.log('Upload successful:', result)
      }

      // Reset form on success
      setAcademicYear('')
      setSemester('')
      setFile(null)
      setPdfFile(null)
      setSuccess(true)
      setIsUploading(false)  // Reset uploading state

      // Clear file input values
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      if (pdfInputRef.current) {
        pdfInputRef.current.value = ''
      }

      // Show success message in panel
      updatePanelContent('success', 'ส่งข้อมูลสำเร็จ!', [
        'ข้อมูลถูกส่งไปยังเซิร์ฟเวอร์เรียบร้อยแล้ว',
        'รายงาน PDF ได้ถูกดาวน์โหลดแล้ว',
        'คุณสามารถส่งไฟล์ใหม่ได้อีกครั้ง'
      ])

      // Reset panel content to initial state after 10 seconds
      setTimeout(() => {
        setSuccess(false)  // Reset success state
        updatePanelContent('info', 'คำแนะนำการใช้งาน', [
          'เลือกปีการศึกษาและภาคเรียนที่ต้องการ',
          'อัปโหลดไฟล์ Excel (.xlsx) ที่มีข้อมูล ปพ.5',
          'อัปโหลดรายงาน ปพ.5 จาก SGS (.pdf) - ไม่บังคับ',
          'ไฟล์ต้องมีขนาดไม่เกิน 10MB',
          'กดปุ่ม "ส่งข้อมูลเพื่อตรวจสอบ" เมื่อพร้อม'
        ])
      }, 10000) // เพิ่มเวลาเป็น 10 วินาที เพื่อให้ผู้ใช้ได้เห็นผลลัพธ์

      updatePanelContent('success', 'ส่งข้อมูลสำเร็จ!', [
        'ไฟล์ ปพ.5 ถูกส่งเรียบร้อยแล้ว',
        'ระบบกำลังประมวลผลข้อมูล',
        'ผลการตรวจสอบจะปรากฏในภายหลัง',
        'ขอบคุณที่ใช้บริการ'
      ])

      // Show success message
      setTimeout(() => setSuccess(false), 5000)

    } catch (error) {
      console.error('Upload error:', error)

      let errorTitle = 'เกิดข้อผิดพลาดในการส่งข้อมูล'
      let errorMessages: string[] = []

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorTitle = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
        errorMessages = [
          'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
          'ตรวจสอบว่าเซิร์ฟเวอร์กำลังทำงาน',
          'ติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่'
        ]
      } else if (error instanceof Error) {
        errorMessages = [
          `สาเหตุ: ${error.message}`,
          'ตรวจสอบข้อมูลที่กรอกให้ถูกต้อง',
          'ตรวจสอบขนาดไฟล์ไม่เกิน 10MB',
          'ลองส่งข้อมูลอีกครั้งในภายหลัง'
        ]
      } else {
        errorMessages = [
          'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
          'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
          'ลองส่งข้อมูลอีกครั้งในภายหลัง',
          'ติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่'
        ]
      }

      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล'
      setError(`ข้อผิดพลาด: ${errorMessage}`)
      updatePanelContent('error', errorTitle, errorMessages)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 lg:items-center lg:min-h-[calc(100vh-5rem)]">

          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-4">
                <Image
                  src="/logo-ppk-512x512-1.png"
                  alt="Logo"
                  width={64}
                  height={64}
                  className="mr-3"
                />
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    ระบบตรวจสอบ ปพ.5
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    อัปโหลดและตรวจสอบข้อมูลรายงานผลการเรียน
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Academic Year and Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-1">
                    ปีการศึกษา *
                  </label>
                  <select
                    id="academicYear"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="">เลือกปีการศึกษา</option>
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                    ภาคเรียน *
                  </label>
                  <select
                    id="semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  >
                    <option value="">เลือกภาคเรียน</option>
                    <option value="1">ภาคเรียนที่ 1</option>
                    <option value="2">ภาคเรียนที่ 2</option>
                  </select>
                </div>
              </div>

              {/* Excel File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ไฟล์ Excel (.xlsx) *
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver
                      ? 'border-blue-400 bg-blue-50'
                      : file
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                  />

                  {isUploading ? (
                    <div className="space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-600">กำลังตรวจสอบไฟล์...</p>
                    </div>
                  ) : file ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-green-700">{file.name}</p>
                      <p className="text-xs text-green-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={handleBrowseClick}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        เปลี่ยนไฟล์
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div>
                        <button
                          type="button"
                          onClick={handleBrowseClick}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          คลิกเพื่อเลือกไฟล์
                        </button>
                        <p className="text-xs text-gray-500 mt-1">หรือลากไฟล์มาวางที่นี่</p>
                      </div>
                      <p className="text-xs text-gray-400">รองรับไฟล์ .xlsx ขนาดไม่เกิน 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PDF File Upload (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รายงาน SGS (.pdf) - ไม่บังคับ
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isPdfDragOver
                      ? 'border-orange-400 bg-orange-50'
                      : pdfFile
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  onDragOver={handlePdfDragOver}
                  onDragLeave={handlePdfDragLeave}
                  onDrop={handlePdfDrop}
                >
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handlePdfFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                  />

                  {pdfFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-green-700">{pdfFile.name}</p>
                      <p className="text-xs text-green-600">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={handlePdfBrowseClick}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        เปลี่ยนไฟล์
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <button
                          type="button"
                          onClick={handlePdfBrowseClick}
                          className="text-sm font-medium text-orange-600 hover:text-orange-700"
                        >
                          คลิกเพื่อเลือกไฟล์ PDF
                        </button>
                        <p className="text-xs text-gray-500 mt-1">หรือลากไฟล์มาวางที่นี่</p>
                      </div>
                      <p className="text-xs text-gray-400">รองรับไฟล์ .pdf ขนาดไม่เกิน 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="ml-2 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !academicYear || !semester || !file}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${isLoading || !academicYear || !semester || !file
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    กำลังประมวลผล...
                  </div>
                ) : (
                  'ส่งข้อมูลเพื่อสร้างรายงาน PDF'
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Information Panel */}
          <div className="lg:pl-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Panel Header */}
              <div className={`px-6 py-4 ${panelContent.type === 'error' ? 'bg-red-50 border-b border-red-200' :
                  panelContent.type === 'warning' ? 'bg-yellow-50 border-b border-yellow-200' :
                    panelContent.type === 'success' ? 'bg-green-50 border-b border-green-200' :
                      'bg-blue-50 border-b border-blue-200'
                }`}>
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${panelContent.type === 'error' ? 'bg-red-100' :
                      panelContent.type === 'warning' ? 'bg-yellow-100' :
                        panelContent.type === 'success' ? 'bg-green-100' :
                          'bg-blue-100'
                    }`}>
                    {panelContent.type === 'error' && (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {panelContent.type === 'warning' && (
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                    {panelContent.type === 'success' && (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {panelContent.type === 'info' && (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <h3 className={`ml-3 font-semibold ${panelContent.type === 'error' ? 'text-red-800' :
                    panelContent.type === 'warning' ? 'text-yellow-800' :
                      panelContent.type === 'success' ? 'text-green-800' :
                        'text-blue-800'
                    }`}>
                    {panelContent.title}
                  </h3>
                </div>
              </div>

              {/* Panel Content */}
              <div className="p-6">
                {/* Panel Messages */}
                <div className="space-y-2">
                  {panelContent.messages.map((message, index) => (
                    <div key={index} className={`flex items-start space-x-2 text-sm ${panelContent.type === 'error' ? 'text-red-700' :
                      panelContent.type === 'warning' ? 'text-yellow-700' :
                        panelContent.type === 'success' ? 'text-green-700' :
                          'text-blue-700'
                      }`}>
                      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current mt-2"></div>
                      <span>{message}</span>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                {panelContent.type === 'info' && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="text-xs text-blue-600 font-medium mb-2">การตรวจสอบไฟล์</div>
                    <div className="space-y-1 text-xs text-blue-700">
                      <div>✓ ไฟล์ Excel: .xlsx เท่านั้น</div>
                      <div>✓ ไฟล์ PDF: .pdf เท่านั้น</div>
                      <div>✓ ขนาดไฟล์: สูงสุด 10 MB</div>
                      <div>✓ เนื้อหา: ข้อมูล ปพ.5 และรายงาน SGS</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
