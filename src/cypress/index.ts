import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  chain,
  mergeWith,
  move,
  url
} from "@angular-devkit/schematics";
import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";
import { Observable, concat, of } from "rxjs";
import { concatMap, map } from "rxjs/operators";

import {
  NodeDependencyType,
  addPackageJsonDependency
} from "../utility/dependencies";
import {
  NodePackage,
  addPropertyToPackageJson,
  getAngularVersion,
  getLatestNodeVersion,
  parseJsonAtPath,
  removePackageJsonDependency
} from "../utility/util";

export default function(_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    _options = { ..._options, __version__: getAngularVersion(tree) };

    return chain([
      updateDependencies(_options),
      removeFiles(_options),
      addCypressFiles(),
      addCypressScriptsToPackageJson()
    ])(tree, _context);
  };
}

function updateDependencies(options: any): Rule {
  let removeDependencies: Observable<Tree>;
  return (tree: Tree, context: SchematicContext): Observable<Tree> => {
    context.logger.debug("Updating dependencies...");
    context.addTask(new NodePackageInstallTask());

    if (options.removeProtractor) {
      removeDependencies = of("protractor").pipe(
        map((packageName: string) => {
          context.logger.debug(`Removing ${packageName} dependency`);

          removePackageJsonDependency(tree, {
            type: NodeDependencyType.Dev,
            name: packageName
          });

          return tree;
        })
      );
    }

    const addDependencies = of("cypress", "@cypress/webpack-preprocessor").pipe(
      concatMap((packageName: string) => getLatestNodeVersion(packageName)),
      map((packageFromRegistry: NodePackage) => {
        const { name, version } = packageFromRegistry;
        context.logger.debug(
          `Adding ${name}:${version} to ${NodeDependencyType.Dev}`
        );

        addPackageJsonDependency(tree, {
          type: NodeDependencyType.Dev,
          name,
          version
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

function removeFiles(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (options.removeProtractor) {
      context.logger.debug("Removing e2e directory");
      tree.delete("./e2e");

      if (tree.exists("./angular.json")) {
        const angularJsonAst = parseJsonAtPath(tree, "./angular.json");
        if (angularJsonAst.value) {
          let val = angularJsonAst.value as any;
          context.logger.debug(
            `Removing ${options.project ||
              val.defaultProject}-e2e from angular.json projects`
          );

          delete val.projects[`${options.project || val.defaultProject}-e2e`];

          return tree.overwrite("./angular.json", JSON.stringify(val, null, 2));
        }
      }

      return tree;
    }
    return tree;
  };
}

function addCypressFiles(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug("Adding cypress files");

    return chain([mergeWith(apply(url("./files"), [move("./")]))])(
      tree,
      context
    );
  };
}

function addCypressScriptsToPackageJson(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // prettier-ignore
    addPropertyToPackageJson(tree, context, 'scripts', {
      "cypress-open": "cypress open",
      "cypress-run": "cypress run"
    });

    return tree;
  };
}
