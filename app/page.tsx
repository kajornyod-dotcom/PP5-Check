'use client'

import { useState, useRef, DragEvent } from 'react'
import Image from 'next/image'

export default function Home() {
  const [academicYear, setAcademicYear] = useState('')
  const [semester, setSemester] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate academic years (10 years back from current year in Buddhist Era)
  const currentYear = new Date().getFullYear()
  const currentBuddhistYear = currentYear + 543
  const academicYears = Array.from({ length: 10 }, (_, i) => currentBuddhistYear - i)

  const handleFileChange = async (selectedFile: File | null) => {
    setError('')
    setSuccess(false)
    
    if (!selectedFile) {
      setFile(null)
      return
    }

    setIsUploading(true)

    // Simulate file validation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check file type
    if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
        !selectedFile.name.toLowerCase().endsWith('.xlsx')) {
      setError('กรุณาเลือกไฟล์ .xlsx เท่านั้น')
      setFile(null)
      setIsUploading(false)
      return
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)')
      setFile(null)
      setIsUploading(false)
      return
    }

    setFile(selectedFile)
    setIsUploading(false)
    setSuccess(true)
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!academicYear || !semester || !file) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Here you would typically send the data to your backend
      console.log({
        academicYear,
        semester,
        file: file.name
      })
      
      // Reset form on success
      setAcademicYear('')
      setSemester('')
      setFile(null)
      setSuccess(true)
      
      // Show success message
      setTimeout(() => setSuccess(false), 5000)
      
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองอีกครั้ง')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="flex justify-center mb-3">
            <div className="p-1.5 bg-white rounded-xl shadow-md">
              <Image
                src="/logo-ppk-512x512-1.png"
                alt="PPK Logo"
                width={50}
                height={50}
                priority
                className="rounded-lg"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            ส่งไฟล์ ปพ.5
          </h1>
          <p className="text-slate-600">อัปโหลดไฟล์เพื่อตรวจสอบข้อมูล</p>
          <div className="w-16 h-1 bg-blue-500 mx-auto mt-2 rounded-full"></div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Academic Year Selection */}
            <div className="space-y-2">
              <label htmlFor="academicYear" className="block text-sm font-semibold text-slate-700 mb-1.5">
                ปีการศึกษา
              </label>
              <div className="relative">
                <select
                  id="academicYear"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-700 font-medium appearance-none cursor-pointer"
                  required
                >
                  <option value="">เลือกปีการศึกษา</option>
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Semester Selection */}
            <div className="space-y-2">
              <label htmlFor="semester" className="block text-sm font-semibold text-slate-700 mb-1.5">
                ภาคเรียน
              </label>
              <div className="relative">
                <select
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-700 font-medium appearance-none cursor-pointer"
                  required
                >
                  <option value="">เลือกภาคเรียน</option>
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                  <option value="3">ภาคเรียนที่ 3</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                ไฟล์ ปพ.5 (.xlsx)
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : file
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-300 bg-slate-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !file && !isUploading && handleBrowseClick()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  accept=".xlsx"
                  className="hidden"
                />
                
                {isUploading ? (
                  <div className="text-blue-600">
                    <div className="inline-flex items-center justify-center w-11 h-11 bg-blue-100 rounded-full mb-2.5">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <p className="font-semibold">กำลังตรวจสอบไฟล์...</p>
                  </div>
                ) : file ? (
                  <div className="text-green-700">
                    <div className="inline-flex items-center justify-center w-11 h-11 bg-green-100 rounded-full mb-2.5">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="font-semibold mb-1">{file.name}</p>
                    <p className="text-sm text-slate-500 mb-2.5">ขนาด: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        setError('')
                        setSuccess(false)
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      ลบไฟล์
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-600">
                    <div className="inline-flex items-center justify-center w-11 h-11 bg-slate-100 rounded-full mb-2.5">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="font-semibold mb-1.5">ลากไฟล์มาวางที่นี่</p>
                    <p className="text-sm mb-2.5">หรือ</p>
                    <div className="inline-flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-semibold">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8l-8-8-8 8" />
                      </svg>
                      เลือกไฟล์จากเครื่อง
                    </div>
                    <p className="text-xs text-slate-400 mt-2.5">รองรับเฉพาะไฟล์ .xlsx (สูงสุด 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="flex items-center space-x-3 text-green-700 bg-green-50 border border-green-200 rounded-lg p-2.5">
                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">ส่งข้อมูลเรียบร้อยแล้ว!</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-3 text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className={`w-full py-2.5 px-6 rounded-lg font-semibold ${
                isLoading || isUploading
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>กำลังส่งข้อมูล...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>ส่งข้อมูลเพื่อตรวจสอบ</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-slate-500 text-sm">
          <p>โรงเรียนโพนงามพิทยานุกูล</p>
        </div>
      </div>
    </div>
  )
}
