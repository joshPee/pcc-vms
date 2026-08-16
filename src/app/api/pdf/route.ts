import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Path to your PDF file - you can change this to your actual PDF
    const pdfPath = join(process.cwd(), 'public', 'qcc-info.pdf');
    
    // Read the PDF file
    const pdfBuffer = await readFile(pdfPath);
    
    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="qcc-info.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(
      { error: 'PDF file not found' },
      { status: 404 }
    );
  }
}
