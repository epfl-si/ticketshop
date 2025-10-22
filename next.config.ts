import type { NextConfig } from "next";
import nextIntl from "next-intl/plugin";

const withNextIntl = nextIntl();

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
	output: "standalone",
	outputFileTracingRoot: __dirname,
	async rewrites() {
		return [
			{
				source: "/cgi-bin/artifactServer",
				destination: "/api/artifactServer",
			},
		];
	},
};

export default withNextIntl(nextConfig);
