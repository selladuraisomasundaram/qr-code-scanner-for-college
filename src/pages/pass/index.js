import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PassIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home if someone lands on /pass without an ID
    router.replace('/');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-gray-500">Redirecting...</div>
    </div>
  );
}