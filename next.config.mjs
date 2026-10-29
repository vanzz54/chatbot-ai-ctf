/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js App Router route handler (/api/chat) membaca body request
  // secara streaming, jadi tidak ada batas bodyParser seperti Pages Router.
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
