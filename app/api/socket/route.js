import { NextResponse } from 'next/server'

// Esta ruta solo para mantener la compatibilidad
export async function GET() {
  return NextResponse.json({ 
    status: 'Socket server running',
    message: 'Los sockets se manejan a través del servidor HTTP'
  })
}