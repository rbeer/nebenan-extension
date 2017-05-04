## v0.3.3

- [2565168 - 375cc5a] Add: push status update (#updated - #cached) to popup
  - toggle updates-items on status value update
  - load new notifications/conversations on updates-item click
  - add new listitems after updates-item

- [6a124c2] Refactor: defaulting to rgb() values

## v0.3.2

- [c9e39db] Change: borderless card style / thumbs inset border
- [1ec3939 - e5083f5] Add: nlistitem appear/dismiss animations

## v0.3.1

- [d71995e - 4558f1f] Add: loading-animation
- [2877921] Add: 'active' attribute; color change on status-element when 'active'
- [f5a642f] Remove/Fix: Users from stats (diplay) / select-slider initial position/size

## v0.3.0

#### Added private conversations

- [b9aed21] commit: Change: Use clickables module to hook status elements
- [ad6b1f4] commit: Remove: NListItem.link attribute
- [d9766a0] commit: Add: module:popup/ui/clickables to handle element clicks
- [6c9ade8] commit: Add: APIClient.NUser for user objects; use in NItem, PCItem
- [a7bfcac] commit: Add/Change: pc-listitem styles / remove round corners
- [40f398e] commit: Add: switching panels on status symbol/counter clicks
- [6197b3d] commit: Add: query bgApp for conversations and add to n-list
- [09f300d] commit: Add: PCListItem, being private_conversation NList items
- [cedb234] commit: Add: NSubsets for private_conversations; NSubset.SUBSET_TYPE
- [915e7c5] commit: Add: query API for conversations
- [7ef48db] commit: Refactor: Rename popup/components/ -> popup/custom-elements/

## v0.2.1

- [32ffa36] commit: Meta: Add _YYMMDDhhmm to -dev version strings
- [7f8e67b] commit: Add: Create title for ANSWER notifications from parent's subject
- [d851f37] commit: Refactor: Messaging.Message constructor overload
- [bc7303f] commit: Change: use hoode_message.is_deleted flag
- [2b4ed80] commit: Add: content script to remove unwanted (market) entries

## v0.2.0

- [53a9239]  commit: Fix: bgApp.init
- [c0d2f27]  commit: Add: options dialog
- [6fd4af0]  commit: Add: NList and NListItem web component classes
- [7f7b87f]  commit: Change: Opting for simpler hover card design ...
- [9bec90f]  commit: Add: lodash

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

## v0.1.0

Just sketching, really. :)
