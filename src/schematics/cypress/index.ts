import { JsonObject } from '@angular-devkit/core';
import {
  apply,
  chain,
  mergeWith,
  move,
  noop,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { concat, Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';

import { addPackageJsonDependency, NodeDependencyType } from '../utility/dependencies';
import {
  addPropertyToPackageJson,
  getAngularVersion,
  getLatestNodeVersion,
  NodePackage,
  parseJsonAtPath,
  removePackageJsonDependency,
} from '../utility/util';

export default function (_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    _options = { ..._options, __version__: getAngularVersion(tree) };

    return chain([
      updateDependencies(_options),
      _options.removeProtractor ? removeFiles(_options) : noop(),
      addCypressFiles(),
      _options.addCypressTestScripts ? addCypressTestScriptsToPackageJson() : noop(),
      !_options.noBuilder ? modifyAngularJson(_options) : noop(),
    ])(tree, _context);
  };
}

function updateDependencies(options: any): Rule {
  let removeDependencies: Observable<Tree>;
  return (tree: Tree, context: SchematicContext): Observable<Tree> => {
    context.logger.debug('Updating dependencies...');
    context.addTask(new NodePackageInstallTask());

    if (options.removeProtractor) {
      removeDependencies = of('protractor').pipe(
        map((packageName: string) => {
          context.logger.debug(`Removing ${packageName} dependency`);

          removePackageJsonDependency(tree, {
            type: NodeDependencyType.Dev,
            name: packageName,
          });

          return tree;
        })
      );
    }

    const addDependencies = of('cypress', '@cypress/webpack-preprocessor', 'ts-loader').pipe(
      concatMap((packageName: string) => getLatestNodeVersion(packageName)),
      map((packageFromRegistry: NodePackage) => {
        const { name, version } = packageFromRegistry;
        context.logger.debug(`Adding ${name}:${version} to ${NodeDependencyType.Dev}`);

        addPackageJsonDependency(tree, {
          type: NodeDependencyType.Dev,
          name,
          version,
        });

        return tree;
      })
    );

    if (options.removeProtractor) {
      return concat(removeDependencies, addDependencies);
    }
    return concat(addDependencies);
  };
}

function addCypressTestScriptsToPackageJson(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    addPropertyToPackageJson(tree, context, 'scripts', {
      'cy:open': 'cypress open',
      'cy:run': 'cypress run',
    });
  };
}

function removeFiles(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    try {
      context.logger.debug('Removing e2e directory');
      tree.delete('./e2e');
    } catch {}

    if (tree.exists('./angular.json')) {
      const angularJsonVal = getAngularJsonValue(tree);
      const project = getProject(options, angularJsonVal);
      context.logger.debug(`Removing ${project}-e2e from angular.json projects`);

      delete angularJsonVal.projects[`${project}-e2e`];

      return tree.overwrite('./angular.json', JSON.stringify(angularJsonVal, null, 2));
    }
    return tree;
  };
}

function addCypressFiles(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding cypress files');

    return chain([mergeWith(apply(url('./files'), [move('./')]))])(tree, context);
  };
}

function addNewCypressCommands(
  tree: Tree,
  angularJsonVal: any,
  project: string,
  runJson: JsonObject,
  openJson: JsonObject,
  removeProtractor: boolean
) {
  const projectArchitectJson = angularJsonVal['projects'][project]['architect'];

  projectArchitectJson['cypress-run'] = runJson;
  projectArchitectJson['cypress-open'] = openJson;

  if (removeProtractor) {
    projectArchitectJson['e2e'] = openJson;
  }

  return tree.overwrite('./angular.json', JSON.stringify(angularJsonVal, null, 2));
}

function getAngularJsonValue(tree: Tree) {
  const angularJsonAst = parseJsonAtPath(tree, './angular.json');
  return angularJsonAst.value as any;
}

function getProject(options: any, angularJsonValue: any) {
  return options.project || angularJsonValue.defaultProject;
}

function modifyAngularJson(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (tree.exists('./angular.json')) {
      const angularJsonVal = getAngularJsonValue(tree);
      const project = getProject(options, angularJsonVal);

      const cypressRunJson = {
        builder: '@briebug/cypress-schematic:cypress',
        options: {
          devServerTarget: `${project}:serve`,
        },
        configurations: {
          production: {
            devServerTarget: `${project}:serve:production`,
          },
        },
      };

      const cypressOpenJson = {
        builder: '@briebug/cypress-schematic:cypress',
        options: {
          devServerTarget: `${project}:serve`,
          watch: true,
          headless: false,
        },
        configurations: {
          production: {
            devServerTarget: `${project}:serve:production`,
          },
        },
      };

      if (options.removeProtractor) {
        context.logger.debug(`Replacing e2e command with cypress-run in angular.json`);
        removeE2ELinting(tree, angularJsonVal, project);
      }

      context.logger.debug(`Adding cypress/tsconfig.json to angular.json-tslint config`);

      addCypressTsConfig(tree, angularJsonVal, project);

      context.logger.debug(`Adding cypress-run and cypress-open commands in angular.json`);

      addNewCypressCommands(
        tree,
        angularJsonVal,
        project,
        cypressRunJson,
        cypressOpenJson,
        options.removeProtractor
      );
    } else {
      throw new SchematicsException('angular.json not found');
    }

    return tree;
  };
}

export const addCypressTsConfig = (tree: Tree, angularJsonVal: any, project: string) => {
  const projectLintOptionsJson =
    angularJsonVal['projects'][project]['architect']['lint']['options'];

  projectLintOptionsJson['tsConfig'].push('cypress/tsconfig.json');

  return tree.overwrite('./angular.json', JSON.stringify(angularJsonVal, null, 2));
};

export const removeE2ELinting = (tree: Tree, angularJsonVal: any, project: string) => {
  let projectLintOptionsJson = angularJsonVal['projects'][project]['architect']['lint']['options'];
  let filteredTsConfigPaths;

  if (Array.isArray(projectLintOptionsJson['tsConfig'])) {
    filteredTsConfigPaths = projectLintOptionsJson['tsConfig'].filter((path: string) => {
      const pathIncludesE2e = path.includes('e2e');
      return !pathIncludesE2e && path;
    });
  } else {
    filteredTsConfigPaths = !projectLintOptionsJson['tsConfig'].includes('e2e')
      ? projectLintOptionsJson['tsConfig']
      : '';
  }

  projectLintOptionsJson['tsConfig'] = filteredTsConfigPaths;

  return tree.overwrite('./angular.json', JSON.stringify(angularJsonVal, null, 2));
};
