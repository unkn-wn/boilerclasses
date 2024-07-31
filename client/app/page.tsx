import { App } from "./app";
import { getInfo } from "./server";

export default async function Main() {
	const info = await getInfo();
	return <App info={info} />;
}
