type AutojoyCommand = string;

type AutojoyPayload = unknown;
type AutojoyResult = unknown;

declare global {
  interface Window {
    autojoy: (
      command: AutojoyCommand,
      payload?: AutojoyPayload,
    ) => Promise<AutojoyResult> | boolean | AutojoyResult;
  }
}

export {};
