import { JsonObject } from '@angular-devkit/core';

export interface CypressBuilderOptions extends JsonObject {
  baseUrl: string;
  configPath: string;
  browser: 'electron' | 'chrome' | 'chromium' | 'canary' | string;
  devServerTarget: string;
  env: Record<string, string>;
  exit: boolean;
  headless: boolean;
  key: string;
  parallel: boolean;
  projectPath: string;
  record: boolean;
  spec: string;
  tsConfig: string;
  watch: boolean;
}
