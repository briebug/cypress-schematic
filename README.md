# Cypress Angular Schematic

[![npm (scoped)](https://img.shields.io/npm/v/@briebug/cypress-schematic.svg)](https://www.npmjs.com/package/@briebug/cypress-schematic)
![Downloads](https://img.shields.io/npm/dm/@briebug/cypress-schematic.svg)

<p align="center">
  <img alt="Cypress Schematic Logo" src="/cypress-schematic-logo.png" width=300 />
</p>

Add [Cypress](https://cypress.io) to an Angular CLI project

This schematic will:

- install Cypress, its dependencies, and new scripts
- add necessary files for Cypress to work with Angular & Typescript
- prompt for removal of Protractor files and configuration

## Usage 🚀

Run as one command in an Angular CLI app directory. Note this will add the schematic as a dependency to your project.

```shell
ng add @briebug/cypress-schematic
```

With the custom builder installed, you can run cypress with the following commands:

```shell script
ng e2e
```

```shell script
ng run {your-project-name}:cypress-open
```

These two commands do the same thing. They will launch the (Electron) Cypress Test Runner in watch mode.

```shell script
ng run {your-project-name}:cypress-run
```

This command will open the (Electron) Cypress Test Runner and run your tests one time, with output to your terminal.

#### Options

| Option                | Description                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| addCypressTestScripts | This will add Cypress `open` and `run` command scripts to your `package.json`. Include `--addCypressTestScripts` in your `ng add` command.                                                                  |
| noBuilder             | This will skip the builder addition, leaving the `angular.json` file unmodified and requiring you to run Cypress from the command line or through your IDE. Include `--noBuilder` in your `ng add` command. |

## Issues

Issues with this schematic can be filed [here](https://github.com/briebug/cypress-schematic/issues/new/choose).

If you want to contribute (or have contributed in the past), feel free to add yourself to the list of contributors in the `package.json` before you open a PR!

## Development 🛠

### Getting started

⚙ [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) are required for the scripts. Make sure it's installed on your machine.

⬇ **Install** the dependencies for the schematic and the sandbox application

```bash
npm i && cd sandbox && npm i && cd ..
```

🖇 **Link** the schematic in the sandbox to run locally

```bash
npm run link:sandbox
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
