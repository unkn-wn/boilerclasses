// middleware.js

import { NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

const ALLOWED_SUBDOMAINS = ['schedule'];

export function middleware(req) {
  const url = req.nextUrl.clone();

  // Skip middleware for public files, _next, and API routes
  if (
    PUBLIC_FILE.test(url.pathname) ||
    url.pathname.includes('_next') ||
    url.pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const host = req.headers.get('host');
  const subdomain = getValidSubdomain(host);

  if (subdomain) {
    url.pathname = `/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

const getValidSubdomain = (host) => {
  let subdomain = null;
  if (!host && typeof window !== 'undefined') {
    host = window.location.host;
  }
  if (host && host.includes('.')) {
    const parts = host.split('.');
    const candidate = parts[0];
    if (candidate && !candidate.includes('localhost') && 
        (ALLOWED_SUBDOMAINS.includes(candidate) || parts.length > 2)) {
      // Valid candidate (either in ALLOWED_SUBDOMAINS or has more than 2 parts)
      subdomain = candidate;
    }
  }
  return subdomain;
};
