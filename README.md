# Cypress Angular Schematic

[![npm (scoped)](https://img.shields.io/npm/v/@briebug/cypress-schematic.svg)](https://www.npmjs.com/package/@briebug/cypress-schematic)
![Downloads](https://img.shields.io/npm/dm/@briebug/cypress-schematic.svg)

Add [Cypress](https://cypress.io) to an Angular CLI project

This schematic will:

- install Cypress, it's dependencies, and new scripts
- add necessary files for Cypress to work with Angular & Typescript
- prompt for removal of Protractor files and configuration

## Usage 🚀

Run as one command in an Angular CLI app directory. Note this will add the schematic as a dependency to your project.

```shell
ng add @briebug/cypress-schematic
```

#### Options

| Option                | Description                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| addCypressTestScripts | This will add Cypress `open` and `run` command scripts to your `package.json`. Include `--addCypressTestScripts` in your `ng add` command.                                                                  |
| noBuilder             | This will skip the builder addition, leaving the `angular.json` file unmodified and requiring you to run Cypress from the command line or through your IDE. Include `--noBuilder` in your `ng add` command. |

## Issues

Issues with this schematic can be filed [here](https://github.com/briebug/cypress-schematic/issues/new/choose).

## Thank You 🙏

Thanks to Kevin Schuchard for setting up the Schematic Sandbox, and writing the [Jest schematic](https://github.com/briebug/jest-schematic) which inspired this schematic.

> More info on this sandbox approach is detailed in this blog post [kevinschuchard.com/blog/2018-11-20-schematic-sandbox/](https://www.kevinschuchard.com/blog/2018-11-20-schematic-sandbox/)

Also, thank you to Zahid Mahmood for writing [this blog post](https://www.technouz.com/4830/getting-started-with-cypress-to-e2e-test-angular-apps/) detailing setting up cypress in an Angular project.

## Development 🛠

### Getting started

⚙ [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) are required for the scripts. Make sure it's installed on your machine.

⬇ **Install** the dependencies for the schematic and the sandbox application

```bash
npm i && cd sandbox && npm i && cd ..
```

🖇 **Link** the schematic in the sandbox to run locally

```bash
npm run link:schematic
```

🏃 **Run** the schematic

```bash
npm run build:clean:launch
```

## E2E testing

Execute the schematic against the sandbox. Then run linting, unit & e2e tests and a prod build in the sandbox.

```bash
npm run test
```

## Unit Testing

Run the unit tests using Jasmine as a runner and test framework.

```bash
npm run test:unit
```

## Reset the sandbox

Running the schematic locally makes file system changes. The sandbox is version controlled so that viewing a diff of the changes is trivial. After the schematic has run locally, reset the sandbox with the following.

```bash
npm run clean
```
