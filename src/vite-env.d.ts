/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    VITE_OPENWEATHER_API_KEY: string;
    VITE_NEWS_API_KEY: string;
  }
}

declare interface ImportMeta {
  readonly env: NodeJS.ProcessEnv;
}
