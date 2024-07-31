import { Loading } from "@/components/util";

export default function LoadingApp() {
  return <div className="h-screen flex item-center justify-center" >
		<Loading label="One moment please..." />
	</div>;
}