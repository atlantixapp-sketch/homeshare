import './globals.css'

export const metadata = {
  title: 'HomeShare - Compartir archivos en tu red local',
  description: 'Comparte archivos al instante entre dispositivos en tu misma red WiFi. Sin servidores externos, totalmente privado.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}