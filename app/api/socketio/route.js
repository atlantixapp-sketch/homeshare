import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    status: 'Socket.io endpoint',
    message: 'Este endpoint es para el cliente Socket.io'
  })
}