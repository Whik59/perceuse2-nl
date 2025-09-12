import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'PayPal payment not available. Please use Amazon checkout.' },
    { status: 400 }
  );
} 