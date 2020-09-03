import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

const NUMBER_OF_SCAFFOLDED_FILES = 38;

describe('@briebug/cypress-schematic', async () => {
  it('works', async () => {
    async function getWorkspaceTree(appName = 'bar') {
      const ngRunner = new SchematicTestRunner('@schematics/angular', '');

      const workspaceOptions = {
        name: 'workspace',
        newProjectRoot: 'projects',
        version: '6.0.0',
        defaultProject: appName,
      };

      const appOptions = {
        name: appName,
        inlineTemplate: false,
        routing: false,
        skipTests: false,
        skipPackageJson: false,
      };

      let appTree = await ngRunner.runSchematicAsync('workspace', workspaceOptions).toPromise();
      appTree = await ngRunner.runSchematicAsync('application', appOptions, appTree).toPromise();

      return appTree;
    }

    const runner = new SchematicTestRunner(
      '@briebug/cypress-schematic',
      require.resolve('../collection.json')
    );
    const tree = await runner.runSchematicAsync('ng-add', {}, await getWorkspaceTree()).toPromise();
    expect(tree.files.length).toEqual(NUMBER_OF_SCAFFOLDED_FILES);
  });
});
