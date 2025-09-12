import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const categoriesPath = path.join(process.cwd(), 'data', 'categories.json');
    const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
    
    return NextResponse.json(categoriesData);
  } catch (error) {
    console.error('Error loading categories:', error);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
} 