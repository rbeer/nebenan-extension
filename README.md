## v0.1.1

#### Introduced requirejs to popup/* scripts
- [fcf62b0] commit: Add: requirejs for popup
- [420dc86] commit: Chore: Move rjs configs into own dir (/.rjs/)

#### Overhauled messaging between bg/app and popup/app

- [901abaf] commit: Add/Change: error message handling in popup/app, ...
- [d320a7f] commit: Add: intersect handlers, use bgApp.getStats to serve 'setStats' data
- [5a82961] commit: Refactor: send stats via Messaging
- [641c374] commit: Add: Messaging, Messaging.Message

#### Handle popup DOM elements in popup/ui
- [40ca3c1] commit: Add: module:popup/ui

#### Added lodash library generation (see /.lodash.json)
- [e961f67] commit: Meta: Finish lodash library generation/inclusion
- [9bec90f] commit: Add: lodash
- [32b9812] commit: Add: generate docs in `dev` task and `$ gulp build --with-docs`

