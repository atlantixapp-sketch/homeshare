/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración opcional si la necesitas
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig