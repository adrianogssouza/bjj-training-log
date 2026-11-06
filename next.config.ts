import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // O Histórico virou uma aba de Progresso; links antigos continuam valendo.
      {
        source: "/history",
        destination: "/progresso?aba=historico",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
