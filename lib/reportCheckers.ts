import { ReportData } from './pdfTypes'

export type CheckResult = '1' | '0' | ''

export function checkPreMidtermItems(data: ReportData): CheckResult[] {
    return [
        checkGradeLevel(data),
        checkRoom(data),
        checkSemester(data),
        checkAcademicYear(data),
        checkSubject(data),
        checkSubjectCode(data),
        checkLearningArea(data),
        checkCredit(data),
        checkStudyTime(data),
        checkTeacher(data),
        checkAdvisor(data),
        checkKPA(data),
        checkHourCredit(data),
        checkMidtermScore(data),
    ]
}

// ตัวอย่าง logic สำหรับแต่ละรายการ (สามารถปรับแต่งได้ตามเงื่อนไขจริง)
function checkGradeLevel(data: ReportData): CheckResult {
    return data.excelData.data?.home_grade_level ? '1' : '0'
}
function checkRoom(data: ReportData): CheckResult {
    return data.excelData.data?.home_room ? '1' : '0'
}
function checkSemester(data: ReportData): CheckResult {
    return data.excelData.data?.home_semester ? '1' : '0'
}
function checkAcademicYear(data: ReportData): CheckResult {
    return data.excelData.data?.home_academic_year ? '1' : '0'
}
function checkSubject(data: ReportData): CheckResult {
    return data.excelData.data?.home_subject ? '1' : '0'
}
function checkSubjectCode(data: ReportData): CheckResult {
    return data.excelData.data?.home_subject_code ? '1' : '0'
}
function checkLearningArea(data: ReportData): CheckResult {
    return data.excelData.data?.home_learning_area ? '1' : '0'
}
function checkCredit(data: ReportData): CheckResult {
    return typeof data.excelData.data?.home_credit === 'number' ? '1' : '0'
}
function checkStudyTime(data: ReportData): CheckResult {
    return typeof data.excelData.data?.home_study_time === 'number' ? '1' : '0'
}
function checkTeacher(data: ReportData): CheckResult {
    return data.excelData.data?.home_teacher ? '1' : '0'
}
function checkAdvisor(data: ReportData): CheckResult {
    return data.excelData.data?.home_advisor ? '1' : '0'
}
function checkKPA(data: ReportData): CheckResult {
    // ตัวอย่าง: ถ้ามีค่าใน '02_k', '02_p', '02_a' อย่างน้อย 1 ช่อง
    const d = data.excelData.data
    return (d?.['02_k'] || d?.['02_p'] || d?.['02_a']) ? '1' : '0'
}
function checkHourCredit(data: ReportData): CheckResult {
    // ตัวอย่าง: ถ้ามี '03_total_hour' และ 'home_credit'
    const d = data.excelData.data
    return (typeof d?.['03_total_hour'] === 'number' && typeof d?.home_credit === 'number') ? '1' : '0'
}
function checkMidtermScore(data: ReportData): CheckResult {
    // ตัวอย่าง: ถ้ามี '02_midterm'
    return data.excelData.data?.['02_midterm'] ? '1' : '0'
}

// สามารถเพิ่ม checkMidtermItems, checkFinalItems ได้ในไฟล์นี้