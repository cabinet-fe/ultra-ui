import { BuildConfig } from "./types.js";

//#region src/build/build.d.ts
declare function buildLib(config: BuildConfig): Promise<{
  success: boolean;
  duration: number;
  error?: undefined;
} | {
  success: boolean;
  duration: number;
  error: Error;
}>;
//#endregion
export { buildLib };
//# sourceMappingURL=build.d.ts.map