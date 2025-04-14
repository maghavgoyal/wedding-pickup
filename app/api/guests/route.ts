import { NextResponse } from 'next/server';
import { fetchAndProcessGuests } from '@/lib/guest-parser';

export async function GET() {
  try {
    const sheetId = '1c7TjxEb4MDpj07lyVCh03yqYqLxlHHgBmnBgKXAyGbw';
    const guests = await fetchAndProcessGuests(sheetId);
    return NextResponse.json(guests);
  } catch (error) {
    console.error('Error fetching guests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guests data' },
      { status: 500 }
    );
  }
} 