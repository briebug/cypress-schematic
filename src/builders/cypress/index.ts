import * as os from "os";
import { dirname, join } from "path";

import { Observable, from, noop, of } from "rxjs";
import {
  catchError,
  concatMap,
  map,
  switchMap,
  take,
  tap
} from "rxjs/operators";

import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  scheduleTargetAndForget,
  targetFromTargetString
} from "@angular-devkit/architect";
import { asWindowsPath, experimental, normalize } from "@angular-devkit/core";
import { NodeJsSyncHost } from "@angular-devkit/core/node";

import { CypressBuilderOptions } from "./cypress-builder-options";

const cypress = require("cypress");

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
      // normalized paths don't work with all native functions
      // as a workaround, you can use the following 2 lines
      const isWin = os.platform() === "win32";
      const workspaceRoot = !isWin
        ? workspace.root
        : asWindowsPath(workspace.root);

      options.projectPath = `${workspaceRoot}/cypress`;

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
  baseUrl,
  browser,
  env,
  exit,
  headless,
  key,
  watch,
  parallel,
  projectPath,
  record,
  spec
}: CypressBuilderOptions): Observable<BuilderOutput> {
  const projectFolderPath = dirname(projectPath);

  const options: any = {
    project: projectFolderPath
  };

  options.browser = browser ? browser : "electron";
  options.config = baseUrl ? { baseUrl } : {};
  options.env = env ? env : null;
  options.exit = exit || true;
  options.headed = !headless;
  options.key = key;
  options.parallel = parallel;
  options.record = record || false;
  options.spec = spec ? spec : "";

  return from<any>(
    !watch || headless ? cypress.run(options) : cypress.open(options)
  ).pipe(
    map((result: any) => ({
      success: !result.totalFailed && !result.failures
    }))
  );
}

export function startDevServer(
  devServerTarget: string,
  watch: boolean,
  context: BuilderContext
): Observable<string> {
  const overrides = {
    watch
  };
  return scheduleTargetAndForget(
    context,
    targetFromTargetString(devServerTarget),
    overrides
  ).pipe(
    map((output: any) => {
      if (!output.success && !watch) {
        throw new Error("Could not compile application files");
      }
      return output.baseUrl as string;
    })
  );
}
