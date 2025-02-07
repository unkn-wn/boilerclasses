import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';

export const RouteHistoryContext = createContext([]);

export function RouteHistoryProvider({ children }) {
  const router = useRouter();
  const [routeHistory, setRouteHistory] = useState([]);

  useEffect(() => {
    const handleRouteChange = (url) => {
      setRouteHistory((prev) => [...prev, url]);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  return (
    <RouteHistoryContext.Provider value={{ routeHistory, setRouteHistory }}>
      {children}
    </RouteHistoryContext.Provider>
  );
}

export function useBackOrHome() {
  const router = useRouter();
  const { routeHistory, setRouteHistory } = useContext(RouteHistoryContext);

  return () => {
    if (routeHistory.length > 1) {
      const newHistory = [...routeHistory];
      newHistory.pop(); // remove current route
      const prevRoute = newHistory.pop(); // get previous route
      setRouteHistory(newHistory);
      prevRoute ? router.back() : router.push('/');
    } else {
      router.push('/');
    }
  };
}