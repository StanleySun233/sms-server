declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      NEXT_PUBLIC_API_URL?: string;
    };
  }
}

export {};
