declare global {
  interface Window {
    autojoy: (command: string, payload?: any) => Promise<any> | boolean;
  }
}
export {};
