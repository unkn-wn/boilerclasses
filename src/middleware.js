// middleware.js

import { NextResponse } from 'next/server';

// RegExp for public files
const PUBLIC_FILE = /\.(.*)$/; // Files

// Define allowed subdomains
const ALLOWED_SUBDOMAINS = ['schedule'];

// CORS headers, allow only subdomains
const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
for (const subdomain of ALLOWED_SUBDOMAINS) {
  corsHeaders[`Access-Control-Allow-Origin`] = `https://${subdomain}.boilerclasses.com`;
  corsHeaders[`Access-Control-Allow-Origin`] = `http://${subdomain}.localhost:3000`;
}


// Middleware function
export async function middleware(req) {
  // Clone the URL
  const url = req.nextUrl.clone();

  // Skip public files
  if (PUBLIC_FILE.test(url.pathname) || url.pathname.includes('_next')) return;

  const host = req.headers.get('host');
  const subdomain = getValidSubdomain(host);
  if (subdomain) {
    // Subdomain available, rewriting: ${url.pathname} to /${subdomain}${url.pathname}
    url.pathname = `/${subdomain}${url.pathname}`;
  }

  // Create a response with CORS headers
  const response = NextResponse.rewrite(url);
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

const getValidSubdomain = (host) => {
  let subdomain = null;
  if (!host && typeof window !== 'undefined') {
    // On client side, get the host from window
    host = window.location.host;
  }
  if (host && host.includes('.')) {
    const candidate = host.split('.')[0];
    if (candidate && !candidate.includes('localhost') && ALLOWED_SUBDOMAINS.includes(candidate)) {
      // Valid candidate
      subdomain = candidate;
    }
  }
  return subdomain;
};