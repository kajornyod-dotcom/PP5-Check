"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { validateReportData } from "@/lib/pdfGenerator";
import { checkPreMidtermItems, checkMidtermItems, checkFinalItems } from "@/lib/reportCheckers";

// ===== Helper สำหรับแปลงค่าผลการตรวจสอบเป็นไอคอน =====
const CheckIcon = () => (
    <span style={{ fontSize: "1.5em" }} role="img" aria-label="ถูก">✅</span>
);
const CrossIcon = () => (
    <span style={{ fontSize: "1.5em" }} role="img" aria-label="ผิด">❌</span>
);

function renderResultCell(value: string | boolean | number) {
    if (value === true || value === "1" || value === 1) return <CheckIcon />;
    if (value === false || value === "0" || value === 0) return <CrossIcon />;
    return value?.toString() || "";
}

// ===== ตารางแต่ละช่วง =====
function ResultTable({ title, headers, items, values, notes }: {
    title: string,
    headers: string[],
    items: string[],
    values: (string | boolean)[],
    notes: (string | undefined)[]
}) {
    return (
        <div className="mb-8">
            <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
            <table className="w-full border border-slate-300 rounded text-sm bg-white mb-4">
                <thead>
                    <tr className="bg-slate-100">
                        {headers.map((h, i) => (
                            <th key={i} className="p-2 border-b border-slate-300">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-slate-50" : ""}>
                            <td className="p-2 border-b border-slate-300 text-center">{idx + 1}</td>
                            <td className="p-2 border-b border-slate-300">{item}</td>
                            <td className="p-2 border-b border-slate-300 text-center">{renderResultCell(values[idx])}</td>
                            <td className="p-2 border-b border-slate-300">{notes[idx] || ""}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ===== Logic ตรวจสอบแต่ละช่วง (เหมือนใน pdfGenerator.ts) =====
function getPreMidterm(data: any) {
    // ตัวอย่างรายการ (ควรดึงจาก checkPreMidtermItems จริง)
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

export default function VerifyPage() {
    const [uuid, setUuid] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<any>(null);

    const searchParams = useSearchParams();

    useEffect(() => {
        const uuidFromQuery = searchParams.get("uuid") || "";
        if (uuidFromQuery) {
            setUuid(uuidFromQuery);
            handleVerify(uuidFromQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

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
                throw new Error("ไม่พบข้อมูลหรือเกิดข้อผิดพลาด");
            }
            const data = await res.json();

            // กำหนด type ให้กับตัวแปรผลการตรวจสอบ
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

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 flex flex-col items-center">
            <div className="max-w-3xl w-full bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold mb-4 text-center">ตรวจสอบรายงานจาก QR Code</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        placeholder="กรอก UUID หรือสแกน QR Code"
                        value={uuid}
                        onChange={e => setUuid(e.target.value)}
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? "กำลังตรวจสอบ..." : "ตรวจสอบ"}
                    </button>
                </form>
                {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
                {result && validateReportData(result.backendResponse) ? (
                    <div className="mt-6">
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
