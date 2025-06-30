"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyPage() {
    const [uuid, setUuid] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<any>(null);

    const searchParams = useSearchParams();

    // อ่าน uuid จาก query string และตรวจสอบอัตโนมัติ
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
            setResult(data);
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
            <div className="max-w-lg w-full bg-white rounded-lg shadow p-6">
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
                {result && (
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold mb-2">ผลการตรวจสอบ</h2>
                        <pre className="bg-gray-100 rounded p-3 text-sm overflow-x-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
