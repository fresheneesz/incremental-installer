
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
).done() // ensures that any error from the returned future are thrown
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

## Steps

1. **Write the installer** - Create a node.js script that uses 'incremental-installer' with a single element inside 'installFunctions' containing anything that fulfils your current needs.
2. **Update the installer** - When you need to add more to the installation, add another function to the end of the `installFunctions` list.
  * Running the installer will skip over the already-ran functions and only run the new one(s)

## Node API

```javascript
var install = require('incremental-installer')
```

`install(stateFileInfo, installFunctions)` - runs install-functions that have not yet run on. Returns a future that resolves when the last function in `installFunctions` finishes and resolves.

 * `stateFilePath` - can be either:
   * The (string) full path to the state-file location.
   * An object with the properties:
      * curState - a number representing the current state
      * writeState(state) - a function that writes the state to some kind of storage
 * `installFunctions` - A list of tasks to run in order.
   * Each element (task) in the array can either be:
     * A function. In this case, the function is run if state >= the number of function-tasks that preceded it (ie if you have 2 function-tasks, then 1 object-task, then another 2 function-tasks, the task with index 1 will be run if the state is 1 or less and the task with index 3 will be run if the state is 2 or less).
       * In maintaining this installer script, it is important that the order of function-tasks remains the same. If the order is changed, the next time the installer is run on a partially installed machine, already-ran functions may run, and necessary functions may not run.
       * If a function returns a future (*see [async-future](https://github.com/fresheneesz/asyncFuture)*), the next function will wait until that future resolves before running the next function.
       * It is *not* safe to insert a new function-tasks anywhere but at the end of the list. This is because the installation state of the machine is recorded as the number of functions run. If new function-tasks
     * An object. The object's `check` function will be run on every install (regardless of state), and if it returns `Future(true)`the `install` function will be run.
       * It *is* safe to insert a new object-task in the middle of an installation procedure, because this task doesn't change the 'state' of the installation.
       * The object should have the following properties:
         * `check()` - A function that returns Future(true) (*see [async-future](https://github.com/fresheneesz/asyncFuture)*) if the `install` function of the object should be run.
         * `install()` - A function.
           * If the function returns a future (*see [async-future](https://github.com/fresheneesz/asyncFuture)*), the next function will wait until that future resolves before running the next function.

`makeInstaller.run(command, printToConsole, options)` - runs a system command, displays the output on the console, and returns when the command is done. Throws an exception if the command returns an exit code other than `0`.
 * `command` - a string of the command to run
 * `printToConsole` - *(Optional- default true)* If true, output is displayed to the console. If false, its not.
 * `options` - has only one option at the moment: `unref`, which causes the current process to not wait for the child process to finish before exiting

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
* Think of how the install state can be made to work even when two people each add a step at the same time
   * You could probably just use a hash of the function passed to the step (make sure the hash result is unique, then use it)

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

* 1.1.0 - Adding the ability to use arbitrary functions to read and write state
* 1.0.0 - BREAKING CHANGE - making it so that object-tasks can be inserted anywhere in the task list without compromising state.
* 0.1.0 - adding unref option to run
* 0.0.3 - fixing state saving in error conditions and updating async-future
* 0.0.1 - first!

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT