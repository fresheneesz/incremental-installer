
`incremental-installer`
=====

A module that helps create scripts that install non-npm dependencies for a project. Allows for smoothly and incrementally adding dependencies during development.

During development, multiple engineers on a project will need to add dependencies and configuration for the project - things like database schema changes, version upgrades, and additions to the technology stack. This library helps you create scripts that can be run quickly on every pull from the repository to ensure all the correct configuration is in place. The installers created with this will be idempotent - meaning you can run them multiple times without duplicate installation happening. The installer will only install pieces that have not yet been installed.

This way, engineers can easily be sure they have the correct setup, automatically.

What is it good for?
==============
* absolutely nothing!
* Wait actually, its good for creating installers for one-time dependencies of a project (databases, caching systems, encryption packages, etc),
* installers for automatically setting up and configuring development environments (git, nano, adding package repositories, configuring test users or test data, etc), for example installing on vagrant virtual machines,
* or setting up shared environments (creating users, creating directory structures, setting up groups and permissions, etc)


Example
=======

```javascript
var install = require('incremental-installer')
var run = install.run
var Future = install.Future

install('install.state', [
        function(args) { // runs first, only if the state is 0
            run('yum install -y nano')
        },
        function(args) { // runs second, only if the state is less than 1
			run('yum install -y locate')
        },
        {  install: function(args) { // runs third, only if the 'check' function returns true
              run('yum install -y git')
           },
           check: function(args) { // checks to see if the install function of this object should be run
              if(isGitInstalled()) {
                  return Future(false)
              } else {
                  return Future(false)
              }
           }
        }
    ]
)
 ```

Requirements
===========

* Just requires node.js to be installed

Install
=======

```
npm install incremental-installer
```

#Usage

```javascript
var install = require('incremental-installer')
```

`install([stateFilePath,] installFunctions)` - runs install-functions that have not yet run on. Returns a future that resolves when the last function in `installFunctions` finishes and resolves.

 * `stateFilePath` - (*Optional*) The path of the file where the state file will be stored
   * The full path to the state-file location will be created if it doesn't already exist.
 * `installFunctions` - A list of functions to run in order. In maintaining this installer script, it is important that the order of these functions remains the same, and new functions are only added at the end. This is because the installation state of the machine is recorded as the number of functions run. If the order is changed, the next time the installer is run on a partially installed machine, already-ran functions may run, and necessary functions may not run.
   * Each element in the array can either be:
     * A function. In this case, the function is run if the stateFile contains a number greater-than-or-equal-to the index of the element.
       * If a function returns a future (*see [async-future](https://github.com/fresheneesz/asyncFuture)*), the next function will wait until that future resolves before running the next function.
     * An object with the following properties:
       * `install()` - A function.
         * If the function returns a future (*see [async-future](https://github.com/fresheneesz/asyncFuture)*), the next function will wait until that future resolves before running the next function.
       * `check()` - A function that returns Future(true) (*see [async-future](https://github.com/fresheneesz/asyncFuture)*) if the `install` function of the object should be run.

`makeInstaller.run(command, printToConsole)` - runs a system command, displays the output on the console, and returns when the command is done. Throws an exception if the command returns an exit code other than `0`.
 * `command` - a string of the command to run
 * `printToConsole` - *(Optional- default true)* If true, output is displayed to the console. If false, its not.

`makeInstaller.Future` - a reference to [async-future](https://github.com/fresheneesz/asyncFuture) for convenience (e.g. to use in `options.scripts[n].check` above)

Recommendations
======

## Fibers/future

I recommend using node-fibers for concurrency. This library uses [async-future](https://github.com/fresheneesz/asyncFuture) because requiring multiple versions of node-fibers isn't safe (causes bugs).

## incremental-installer-maker

[incremental-installer-maker](https://github.com/fresheneesz/incremental-installer-maker) is an extension of this idea that allows you to create a stand-alone script that packages any number of dependencies, and automatically installs node.js if it isn't currently installed on the machine. In the future, that related project will  use incremental-installer to do what it does. But if you want something that will build a stand-alone installer, [incremental-installer-maker](https://github.com/fresheneesz/incremental-installer-maker) is for you.

Todo
====
* Provide a way to more conveniently use node-fibers/futures

How to Contribute!
============

Anything helps:

* Creating issues (aka tickets/bugs/etc). Please feel free to use issues to report bugs, request features, and discuss changes
* Updating the documentation: ie this readme file. Be bold! Help create amazing documentation!
* Submitting pull requests.

How to submit pull requests:

1. Please create an issue and get my input before spending too much time creating a feature. Work with me to ensure your feature or addition is optimal and fits with the purpose of the project.
2. Fork the repository
3. clone your forked repo onto your machine and run `npm install` at its root
4. If you're gonna work on multiple separate things, its best to create a separate branch for each of them
5. edit!
6. If it's a code change, please add to the unit tests (at test/protoTest.js) to verify that your change
7. When you're done, run the unit tests and ensure they all pass
8. Commit and push your changes
9. Submit a pull request: https://help.github.com/articles/creating-a-pull-request


Change Log
=========

* 0.0.3 - fixing state saving in error conditions and updating async-future
* 0.0.1 - first!

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT