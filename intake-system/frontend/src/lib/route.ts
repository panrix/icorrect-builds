import { useEffect, useState } from 'react';

interface LocationState {
  pathname: string;
}

function readLocation(): LocationState {
  return { pathname: window.location.pathname || '/' };
}

export function navigate(pathname: string) {
  window.history.pushState({}, '', pathname);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>(() => readLocation());

  useEffect(() => {
    const onPopState = () => setLocation(readLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return location;
}
