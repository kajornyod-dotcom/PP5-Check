import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const uuid = req.nextUrl.searchParams.get("uuid");
    if (!uuid) {
        return NextResponse.json({ error: "Missing uuid" }, { status: 400 });
    }

    try {
        const data = await prisma.ppkPp5Submit.findUnique({
            where: { uuid },
        });

        if (!data) {
            return NextResponse.json({ error: "ไม่พบข้อมูลสำหรับ UUID นี้" }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" }, { status: 500 });
    }
}