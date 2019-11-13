import { dirname, join } from "path";

import { Observable, from, noop, of } from "rxjs";
import {
  catchError,
  concatMap,
  map,
  take,
  tap,
  switchMap
} from "rxjs/operators";

import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  scheduleTargetAndForget,
  targetFromTargetString
} from "@angular-devkit/architect";
import {
  JsonObject,
  experimental,
  normalize,
  asWindowsPath
} from "@angular-devkit/core";
import { NodeJsSyncHost } from "@angular-devkit/core/node";
import * as os from "os";
import * as path from "path";

const cypress = require("cypress");

export interface CypressBuilderOptions extends JsonObject {
  baseUrl: string;
  projectPath: string;
  devServerTarget: string;
  headless: boolean;
  exit: boolean;
  parallel: boolean;
  record: boolean;
  key: string;
  tsConfig: string;
  watch: boolean;
  browser: string;
  env: Record<string, string>;
  spec: string;
  copyFiles: string;
}

export default createBuilder<CypressBuilderOptions>(run);

function run(
  options: CypressBuilderOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  options.env = options.env || {};
  if (options.tsConfig) {
    options.env.tsConfig = join(context.workspaceRoot, options.tsConfig);
  }

  const workspace = new experimental.workspace.Workspace(
    normalize(context.workspaceRoot),
    new NodeJsSyncHost()
  );
  return workspace.loadWorkspaceFromHost(normalize("angular.json")).pipe(
    switchMap(() => {
      const project = context?.target?.project;
      const target = workspace.getProjectTargets(project || "");

      // normalizes paths don't work with all native functions
      // as a workaround, you can use the following 2 lines
      const isWin = os.platform() === "win32";
      const workspaceRoot = !isWin
        ? workspace.root
        : asWindowsPath(workspace.root);

      options.projectPath = path.join(
        workspaceRoot,
        target.build.options.outputPath
      );

      return (options.devServerTarget
        ? startDevServer(options.devServerTarget, options.watch, context)
        : of(options.baseUrl)
      ).pipe(
        concatMap((baseUrl: string) => initCypress({ ...options, baseUrl })),
        options.watch ? tap(noop) : take(1),
        catchError(error => {
          context.reportStatus(`Error: ${error.message}`);
          context.logger.error(error.message);
          return of({
            success: false
          });
        })
      );
    })
  );
}

function initCypress({
  projectPath,
  headless,
  exit,
  record,
  key,
  parallel,
  isWatching,
  baseUrl,
  browser,
  env,
  spec
}: CypressBuilderOptions): Observable<BuilderOutput> {
  const projectFolderPath = dirname(projectPath);
  const options: any = {
    project: projectFolderPath
  };

  if (baseUrl) {
    options.config = { baseUrl: baseUrl };
  }

  if (browser) {
    options.browser = browser;
  }

  if (env) {
    options.env = env;
  }
  if (spec) {
    options.spec = spec;
  }

  options.exit = exit;
  options.headed = !headless;
  options.record = record;
  options.key = key;
  options.parallel = parallel;

  return from<any>(
    !isWatching || headless ? cypress.run(options) : cypress.open(options)
  ).pipe(
    map((result: any) => ({
      success: !result.totalFailed && !result.failures
    }))
  );
}

export function startDevServer(
  devServerTarget: string,
  isWatching: boolean,
  context: BuilderContext
): Observable<string> {
  const overrides = {
    watch: isWatching
  };
  return scheduleTargetAndForget(
    context,
    targetFromTargetString(devServerTarget),
    overrides
  ).pipe(
    map((output: any) => {
      if (!output.success && !isWatching) {
        throw new Error("Could not compile application files");
      }
      return output.baseUrl as string;
    })
  );
}
