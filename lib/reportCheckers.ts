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

// ตรวจสอบว่ามีข้อมูลระดับชั้นหรือไม่
function checkGradeLevel(data: ReportData): CheckResult {
    return data.excelData.data?.home_grade_level ? '1' : '0'
}

// ตรวจสอบว่ามีข้อมูลห้องเรียนหรือไม่
function checkRoom(data: ReportData): CheckResult {
    return data.excelData.data?.home_room ? '1' : '0'
}

// ตรวจสอบว่าข้อมูลภาคเรียนในฟอร์ม ตรงกับข้อมูลใน excel หรือไม่
function checkSemester(data: ReportData): CheckResult {
    const formSemester = data.formData.semester
    const excelSemester = data.excelData.data?.home_semester
    if (formSemester == null || excelSemester == null) return '0'
    return String(formSemester) === String(excelSemester) ? '1' : '0'
}

// ตรวจสอบว่าข้อมูลปีการศึกษาในฟอร์ม ตรงกับข้อมูลใน excel หรือไม่
function checkAcademicYear(data: ReportData): CheckResult {
    const formYear = data.formData.academicYear
    const excelYear = data.excelData.data?.home_academic_year
    if (formYear == null || excelYear == null) return '0'
    return String(formYear) === String(excelYear) ? '1' : '0'
}

// ตรวจสอบว่ามีข้อมูลรายวิชาหรือไม่
function checkSubject(data: ReportData): CheckResult {
    return data.excelData.data?.home_subject ? '1' : '0'
}

// ตรวจสอบว่ารหัสวิชาสอดคล้องกับกลุ่มสาระและระดับชั้นหรือไม่
function checkSubjectCode(data: ReportData): CheckResult {
    const code = data.excelData.data?.home_subject_code
    const learningArea = data.excelData.data?.home_learning_area
    const gradeLevel = data.excelData.data?.home_grade_level

    if (!code || typeof code !== 'string' || code.length < 2 || !learningArea || !gradeLevel) return '0'

    // ตรวจสอบกลุ่มสาระจากตัวอักษรตัวแรก
    const areaMap: Record<string, string> = {
        'ว': 'วิทยาศาสตร์และเทคโนโลยี',
        'ค': 'คณิตศาสตร์',
        'ส': 'สังคมศึกษา',
        'อ': 'ภาษาอังกฤษ',
        'ท': 'ภาษาไทย',
        'ศ': 'ศิลปะ',
        'พ': 'สุขศึกษาและพลศึกษา',
        'ง': 'การงานอาชีพ',
        // เพิ่มเติมตามกลุ่มสาระที่ใช้จริง
    }
    const areaFromCode = areaMap[code[0]]
    if (areaFromCode && areaFromCode !== learningArea) return '0'

    // ตรวจสอบช่วงชั้นจากหลักที่ 2
    // 2 = ม.1-ม.3, 3 = ม.4-ม.6
    const levelDigit = code[1]
    if (levelDigit === '2' && !/^ม\.([123])$/.test(gradeLevel)) return '0'
    if (levelDigit === '3' && !/^ม\.([456])$/.test(gradeLevel)) return '0'

    return '1'
}

// ตรวจสอบว่ามีข้อมูลกลุ่มสาระหรือไม่
function checkLearningArea(data: ReportData): CheckResult {
    return data.excelData.data?.home_learning_area ? '1' : '0'
}

// ตรวจสอบว่ามีข้อมูลหน่วยกิตหรือไม่ (ต้องเป็นตัวเลข)
function checkCredit(data: ReportData): CheckResult {
    return typeof data.excelData.data?.home_credit === 'number' ? '1' : '0'
}

// ตรวจสอบว่าข้อมูลเวลาเรียนเป็น 2 เท่าของหน่วยกิตหรือไม่ (และต้องเป็นตัวเลขทั้งคู่)
function checkStudyTime(data: ReportData): CheckResult {
    const studyTime = data.excelData.data?.home_study_time
    const credit = data.excelData.data?.home_credit
    if (typeof studyTime !== 'number' || typeof credit !== 'number') return '0'
    return studyTime === credit * 2 ? '1' : '0'
}

// ตรวจสอบว่ามีข้อมูลครูผู้สอนหรือไม่
function checkTeacher(data: ReportData): CheckResult {
    return data.excelData.data?.home_teacher ? '1' : '0'
}

// ตรวจสอบว่ามีข้อมูลครูที่ปรึกษาหรือไม่
function checkAdvisor(data: ReportData): CheckResult {
    return data.excelData.data?.home_advisor ? '1' : '0'
}

// ตรวจสอบว่ามีข้อมูล KPA (02_k, 02_p, 02_a) อย่างน้อย 1 ช่องหรือไม่
function checkKPA(data: ReportData): CheckResult {
    const d = data.excelData.data
    return (d?.['02_k'] || d?.['02_p'] || d?.['02_a']) ? '1' : '0'
}

// ตรวจสอบว่ามีข้อมูลเวลาเรียนรวมและหน่วยกิตหรือไม่ (ต้องเป็นตัวเลขทั้งคู่)
function checkHourCredit(data: ReportData): CheckResult {
    const d = data.excelData.data
    return (typeof d?.['03_total_hour'] === 'number' && typeof d?.home_credit === 'number') ? '1' : '0'
}

// ตรวจสอบว่ามีข้อมูลคะแนนเต็มก่อนกลางภาค (02_midterm) หรือไม่
function checkMidtermScore(data: ReportData): CheckResult {
    return data.excelData.data?.['02_midterm'] ? '1' : '0'
}

// สามารถเพิ่ม checkMidtermItems, checkFinalItems ได้ในไฟล์นี้