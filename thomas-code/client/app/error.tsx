"use client"

import { StatusPage } from "@/components/util";

export default function Error({ error, reset, }: { error: Error & { digest?: string }, reset: () => void }) {
  return <StatusPage title="Whoops" >
    <p>Something went wrong...</p>
    <p>Hash: <pre className="bg-slate-800 p-2 inline rounded-lg" >{error.digest == undefined ? "no hash" : error.digest}</pre></p>
  </StatusPage>;
}