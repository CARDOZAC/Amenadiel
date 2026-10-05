/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permitir acceso desde otros dispositivos en la red local
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Aumentar límite para subida de fotos
    },
  },
  // Configuración de imágenes para Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zzgcuxrfiqmzckiujhcf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
