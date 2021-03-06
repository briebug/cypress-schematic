import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
  scheduleTargetAndForget,
  targetFromTargetString,
} from '@angular-devkit/architect';
import { asWindowsPath, experimental, normalize } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import * as os from 'os';
import { dirname, join } from 'path';
import { open, run } from 'cypress';

import { from, noop, Observable, of } from 'rxjs';
import { catchError, concatMap, first, map, switchMap, tap } from 'rxjs/operators';

import { CypressBuilderOptions } from './cypress-builder-options';

export default createBuilder<CypressBuilderOptions>(runCypress);

type CypressOptions = Partial<CypressCommandLine.CypressRunOptions> &
  Partial<CypressCommandLine.CypressOpenOptions>;

function runCypress(
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

  return workspace.loadWorkspaceFromHost(normalize('angular.json')).pipe(
    map(() => os.platform() === 'win32'),
    map((isWin) => (!isWin ? workspace.root : asWindowsPath(workspace.root))),
    map((workspaceRoot) => ({
      ...options,
      projectPath: `${workspaceRoot}/cypress`,
    })),
    switchMap((options) =>
      (!!options.devServerTarget
        ? startDevServer(options.devServerTarget, options.watch, context)
        : of(options.baseUrl)
      ).pipe(
        concatMap((baseUrl: string) => initCypress({ ...options, baseUrl })),
        options.watch ? tap(noop) : first(),
        catchError((error) =>
          of({ success: false }).pipe(
            tap(() => context.reportStatus(`Error: ${error.message}`)),
            tap(() => context.logger.error(error.message))
          )
        )
      )
    )
  );
}

function initCypress(userOptions: CypressBuilderOptions): Observable<BuilderOutput> {
  const projectFolderPath = dirname(userOptions.projectPath);

  const defaultOptions: CypressOptions = {
    project: projectFolderPath,
    browser: 'electron',
    headless: true,
    record: false,
    spec: '',
  };

  const options: CypressOptions = {
    ...defaultOptions,
    ...userOptions,
    headed: !userOptions.headless,
  };

  if (userOptions.configFile === undefined) {
    options.config = {};
  }

  if (userOptions.baseUrl) {
    options.config = { ...options.config, baseUrl: userOptions.baseUrl };
  }

  const { watch, headless } = userOptions;

  return from(watch === false || headless ? run(options) : open(options)).pipe(
    map((result: any) => ({ success: !result.totalFailed && !result.failures }))
  );
}

export function startDevServer(
  devServerTarget: string,
  watch: boolean,
  context: BuilderContext
): Observable<string> {
  const overrides = {
    watch,
  };
  return scheduleTargetAndForget(context, targetFromTargetString(devServerTarget), overrides).pipe(
    map((output: any) => {
      if (!output.success && !watch) {
        throw new Error('Could not compile application files');
      }
      return output.baseUrl as string;
    })
  );
}
