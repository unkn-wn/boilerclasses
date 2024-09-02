import { StatusPage } from "@/components/util";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "BoilerClasses - Not Found"
};

export default function Error({ error, reset, }: { error: Error & { digest?: string }, reset: () => void }) {
  return <StatusPage title="404 not found" />;
}