"use client";

import { useRouter } from "next/navigation";

export default function PageNotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/planning");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
      <h1 className="text-6xl font-bold text-red-600">404</h1>

      <p className="mt-4 text-lg text-gray-700">
        Page Not Found
      </p>

      <p className="mt-2 text-sm text-gray-500">
        The page you are looking for does not exist.
      </p>

      <button
        type="button"
        onClick={handleGoBack}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Go Back
      </button>
    </div>
  );
}
