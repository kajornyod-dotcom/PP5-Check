"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { validateReportData } from "@/lib/pdfGenerator";
import { checkPreMidtermItems, checkMidtermItems, checkFinalItems } from "@/lib/reportCheckers";
import { FaQrcode } from "react-icons/fa";
import { ImSpinner2 } from "react-icons/im";

// ... CheckIcon, CrossIcon, renderResultCell, ResultTable, getPreMidterm, getMidterm, getFinal (copy from page.tsx) ...

const CheckIcon = () => (
    <span style={{ fontSize: "1.5em", fontWeight: "bold", color: "#22c55e" }} role="img" aria-label="ถูก">✅</span>
);
const CrossIcon = () => (
    <span style={{ fontSize: "1.5em", fontWeight: "bold", color: "#ef4444" }} role="img" aria-label="ผิด">❌</span>
);
function renderResultCell(value: string | boolean | number) {
    if (value === true || value === "1" || value === 1)
        return <span className="flex justify-center items-center font-bold bg-green-50 rounded">{<CheckIcon />}</span>;
    if (value === false || value === "0" || value === 0)
        return <span className="flex justify-center items-center font-bold bg-red-50 rounded">{<CrossIcon />}</span>;
    return value?.toString() || "";
}
function ResultTable({ title, headers, items, values, notes }: {
    title: string,
    headers: string[],
    items: string[],
    values: (string | boolean)[],
    notes: (string | undefined)[]
}) {
    const hasRows = items.length > 0 && values.length > 0;
    return (
        <div className="mb-8">
            <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full border border-slate-300 rounded text-sm bg-white mb-4">
                    <thead className="sticky top-0 bg-slate-100 z-10">
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} className="p-2 border-b border-slate-300">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {hasRows ? items.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-slate-50" : ""}>
                                <td className="p-2 border-b border-slate-300 text-center">{idx + 1}</td>
                                <td className="p-2 border-b border-slate-300">{item}</td>
                                <td
                                    className={`p-2 border-b border-slate-300 text-center font-bold
                                        ${(values[idx] === true || values[idx] === "1" || (typeof values[idx] === "number" && values[idx] === 1)) ? "bg-green-50" : ""}
                                        ${(values[idx] === false || values[idx] === "0" || (typeof values[idx] === "number" && values[idx] === 0)) ? "bg-red-50" : ""}
                                    `}
                                >
                                    {renderResultCell(values[idx])}
                                </td>
                                <td
                                    className="p-2 border-b border-slate-300 max-w-xs truncate"
                                    title={notes[idx] || undefined}
                                    tabIndex={0}
                                    aria-label={notes[idx] || ""}
                                >
                                    {notes[idx] || "-"}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={headers.length} className="text-center text-gray-400 py-4">
                                    ไม่มีรายการที่ต้องตรวจสอบในช่วงนี้
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
function getPreMidterm(data: any) {
    const items = [
        "ข้อมูลระดับชั้น (ปก)", "ข้อมูลห้องเรียน (ปก)", "ภาคเรียน (ปก)", "ปีการศึกษา (ปก)",
        "ข้อมูลรายวิชา (ปก)", "รหัสวิชา (ปก)", "ข้อมูลกลุ่มสาระ (ปก)", "หน่วยกิต (ปก)",
        "เวลาเรียน (ปก)", "ครูผู้สอน (ปก)", "ครูที่ปรึกษา (ปก)", "ความถูกต้องของ KPA (02)",
        "เวลาเรียนรวมสอดคล้องกับหน่วยกิต (03)", "คะแนนเต็ม (06)"
    ];
    const results = data?.preMidtermResults || [];
    return { items, values: results.map((r: any) => r.value), notes: results.map((r: any) => r.message) };
}
function getMidterm(data: any) {
    const items = [
        "บันทึกเวลาเรียน (03)", "คะแนนก่อนกลาง (04)", "คะแนนกลางภาค (04)"
    ];
    const results = data?.midtermResults || [];
    return { items, values: results.map((r: any) => r.value), notes: results.map((r: any) => r.message) };
}
function getFinal(data: any) {
    const items = [
        "บันทึกเวลาเรียน (03)", "คะแนนหลังกลางภาค (05)", "คะแนนสอบปลายภาค (05)",
        "ตรวจสอบการให้ระดับผลการเรียน (06)", "คะแนนสมรรถนะ (07)", "คุณลักษณะอันพึงประสงค์ (08)",
        "คะแนนการอ่าน คิดวิเคราะห์และเขียน (09)", "ชื่อวิชาตรงกับ SGS (ปก)", "ครูผู้สอนตรงกับ SGS (ปก)",
        "สรุปผลการประเมินคุณลักษณะอันพึงประสงค์ (ปพ.5 SGS)",
        "สรุปการประเมินการอ่าน คิด วิเคราะห์ และเขียน (ปพ.5 SGS)"
    ];
    const results = data?.finalResults || [];
    return { items, values: results.map((r: any) => r.value), notes: results.map((r: any) => r.message) };
}

export default function VerifyClient() {
    const [uuid, setUuid] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<any>(null);
    const [showScanner, setShowScanner] = useState(false);
    const searchParams = useSearchParams();
    const errorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const uuidFromQuery = searchParams.get("uuid") || "";
        if (uuidFromQuery) {
            setUuid(uuidFromQuery);
            handleVerify(uuidFromQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.focus();
        }
    }, [error]);

    const handleVerify = async (uuidToCheck: string) => {
        setError("");
        setResult(null);
        if (!uuidToCheck.trim()) {
            setError("กรุณากรอก UUID หรือ QR Code");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/verify?uuid=${encodeURIComponent(uuidToCheck.trim())}`);
            if (!res.ok) {
                throw new Error("ไม่พบรายงานสำหรับ UUID นี้ กรุณาตรวจสอบและลองอีกครั้ง");
            }
            const data = await res.json();

            type CheckResult = { value: string | boolean | number, message?: string };
            let preMidtermResults: CheckResult[] = [];
            let midtermResults: CheckResult[] = [];
            let finalResults: CheckResult[] = [];
            if (validateReportData(data.backendResponse)) {
                preMidtermResults = checkPreMidtermItems(data.backendResponse);
                midtermResults = checkMidtermItems(data.backendResponse);
                finalResults = checkFinalItems(data.backendResponse);
            }
            setResult({
                ...data,
                preMidtermResults,
                midtermResults,
                finalResults
            });
        } catch (err: any) {
            setError(err.message || "เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        handleVerify(uuid);
    };

    // Responsive input with QR icon
    return (
        <div className="min-h-screen bg-slate-50 py-8 px-2 sm:px-4 flex flex-col items-center">
            <div className="max-w-3xl w-full bg-white rounded-lg shadow p-4 sm:p-6">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">ตรวจสอบรายงานจาก QR Code</h1>
                <form onSubmit={handleSubmit} className="space-y-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    <div className="relative w-full flex-1">
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-400 outline-none"
                            placeholder="กรอก UUID หรือสแกน QR Code"
                            value={uuid}
                            onChange={e => setUuid(e.target.value)}
                            autoFocus
                            aria-label="กรอก UUID หรือสแกน QR Code"
                        />
                        <FaQrcode
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                            size={22}
                            title="สแกน QR Code"
                            tabIndex={0}
                            aria-label="สแกน QR Code"
                            onClick={() => setShowScanner(true)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="flex items-center justify-center bg-blue-600 text-white py-2 px-6 rounded transition-all duration-150 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-50"
                        disabled={loading}
                        aria-busy={loading}
                    >
                        {loading ? (
                            <>
                                <ImSpinner2 className="animate-spin mr-2" aria-hidden="true" />
                                กำลังตรวจสอบ...
                            </>
                        ) : "ตรวจสอบ"}
                    </button>
                </form>

                {/* Initial welcome message */}
                {!uuid && !result && !loading && !error && (
                    <div className="mt-6 text-center text-gray-600">
                        <p>กรุณากรอก UUID ของรายงาน หรือใช้ปุ่มสแกน QR Code เพื่อเริ่มการตรวจสอบ</p>
                        <p className="mt-2 text-sm text-gray-500">UUID สามารถพบได้ในรายงาน ปพ.5 ที่สร้างขึ้น</p>
                    </div>
                )}

                {/* Error message with ARIA live region */}
                {error && (
                    <div
                        ref={errorRef}
                        className="mt-4 text-red-700 bg-red-100 p-3 rounded text-center font-semibold" // Added bg-red-100, p-3, rounded
                        tabIndex={-1}
                        aria-live="assertive"
                    >
                        {error}
                    </div>
                )}

                {/* Loading indicator */}
                {loading && !result && !error && (
                    <div className="mt-6 text-center text-blue-600 flex items-center justify-center">
                        <ImSpinner2 className="animate-spin mr-2" size={24} aria-hidden="true" />
                        กำลังตรวจสอบข้อมูล...
                    </div>
                )}

                {/* QR Scanner Modal (optional, placeholder for integration) */}
                {showScanner && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowScanner(false)}
                                aria-label="ปิด"
                            >✕</button>
                            <div className="text-center mb-2 font-bold">สแกน QR Code</div>
                            <div className="text-gray-400 text-center py-8">
                                (ฟีเจอร์สแกน QR ยังไม่เปิดใช้งาน)
                            </div>
                        </div>
                    </div>
                )}
                {result && validateReportData(result.backendResponse) ? (
                    <div className="mt-6">
                        {/* Overall Summary */}
                        {(() => {
                            const preMidtermFailed = result.preMidtermResults.filter((r: any) => r.value === false || r.value === "0" || r.value === 0).length;
                            const midtermFailed = result.midtermResults.filter((r: any) => r.value === false || r.value === "0" || r.value === 0).length;
                            const finalFailed = result.finalResults.filter((r: any) => r.value === false || r.value === "0" || r.value === 0).length;
                            const totalFailed = preMidtermFailed + midtermFailed + finalFailed;

                            if (totalFailed === 0) {
                                return (
                                    <div className="mb-6 p-3 bg-green-100 text-green-700 font-semibold text-center rounded">
                                        รายงานนี้ผ่านการตรวจสอบเบื้องต้นทั้งหมด ✅
                                    </div>
                                );
                            } else {
                                return (
                                    <div className="mb-6 p-3 bg-yellow-100 text-yellow-700 font-semibold text-center rounded">
                                        พบรายการที่ตรวจสอบไม่ผ่าน {totalFailed} รายการ กรุณาตรวจสอบรายละเอียดในตารางด้านล่าง ⚠️
                                    </div>
                                );
                            }
                        })()}

                        {/* ส่วนหัวรายงานเหมือน PDF */}
                        <div className="border border-slate-400 rounded mb-6 overflow-x-auto">
                            <div className="flex flex-col md:flex-row">
                                <div className="flex items-center justify-center md:w-1/5 p-4 border-b md:border-b-0 md:border-r border-slate-400 bg-white">
                                    <img src="/logo-ppk-512x512-1.png" alt="โลโก้โรงเรียน" className="h-20 w-20 sm:h-24 sm:w-24 object-contain" />
                                </div>
                                <div className="flex-1 p-4">
                                    <div className="text-lg sm:text-xl font-bold text-center mb-2">รายงานสรุปผลการตรวจสอบ ปพ.5</div>
                                    <div className="text-center text-base sm:text-lg mb-2">
                                        ปีการศึกษา <span className="font-semibold">{result.backendResponse.formData?.academicYear || "-"}</span> ภาคเรียนที่ <span className="font-semibold">{result.backendResponse.formData?.semester || "-"}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-between text-base">
                                        <span>วิชา <span className="font-semibold">{result.backendResponse.excelData?.data?.home_subject_code || "-"}</span> {result.backendResponse.excelData?.data?.home_subject || "-"}</span>
                                        <span>{result.backendResponse.excelData?.data?.home_study_time || "-"} ชั่วโมง/สัปดาห์</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-between text-base mt-1">
                                        <span>ผู้สอน <span className="font-semibold">{result.backendResponse.excelData?.data?.home_teacher || "-"}</span></span>
                                        <span>{result.backendResponse.excelData?.data?.home_credit || "-"} หน่วยกิต</span>
                                    </div>
                                </div>
                            </div>
                            {/* รายการไฟล์ Excel */}
                            <div className="p-4 border-t border-slate-400 bg-slate-50">
                                <div className="font-bold mb-1">รายการไฟล์ Excel:</div>
                                <ol className="list-decimal ml-6">
                                    <li>ชื่อไฟล์: {result.backendResponse.excelData?.fileName || "-"}</li>
                                    <li>ขนาดไฟล์: {result.backendResponse.excelData?.fileSize ? (result.backendResponse.excelData.fileSize / 1024 / 1024).toFixed(2) + " MB" : "-"}</li>
                                    <li>อัปโหลดเมื่อ: {result.backendResponse.excelData?.uploadedAt ? new Date(result.backendResponse.excelData.uploadedAt).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "medium" }) : "-"}</li>
                                </ol>
                            </div>
                        </div>
                        {/* ตารางตรวจสอบ */}
                        <ResultTable
                            title="รายการตรวจก่อนกลางภาค"
                            headers={["ลำดับที่", "รายการ", "ผลการตรวจ", "หมายเหตุ"]}
                            {...getPreMidterm(result)}
                        />
                        <ResultTable
                            title="รายการตรวจกลางภาค"
                            headers={["ลำดับที่", "รายการ", "ผลการตรวจ", "หมายเหตุ"]}
                            {...getMidterm(result)}
                        />
                        <ResultTable
                            title="รายการตรวจปลายภาค"
                            headers={["ลำดับที่", "รายการ", "ผลการตรวจ", "หมายเหตุ"]}
                            {...getFinal(result)}
                        />
                    </div>
                ) : result ? (
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold mb-2">ผลการตรวจสอบ</h2>
                        <pre className="bg-gray-100 rounded p-3 text-sm overflow-x-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
