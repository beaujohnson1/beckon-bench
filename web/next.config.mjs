/** @type {import('next').NextConfig} */
export default {
  output: 'export',           // static, like site/build.mjs — any static host works
  trailingSlash: true,        // /vote/ → vote/index.html so plain file servers resolve
  images: { unoptimized: true },
};
