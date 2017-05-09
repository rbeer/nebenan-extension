
# Message handlers by receiver

## bg/app

### getStats

Gets status data.

#### Payload

None

### getNotifications

Gets notification data.

#### Payload

Type: **Object**

| Name | Type | Description |
| ------------- | ------------- | ------------- |
| type | String | One of `init`, `update`; defaults to `init` behavior |
| n | Number | Number of notifications to receive (capped at 20) |
| lower | Number | Only get notifications older than this timestamp's value |

### getConversations

Gets conversation data.

#### Payload

None


## popup/app

### setStatus

Answer to bg/app:getStatus

#### Payload

Type: **Object**

| Name | Type | Description |
| ------------- | ------------- | ------------- |
| messages | Number | Number of new/unread private messages |
| notifications | Number | Number of new/unread notifications |

### updateStatus

Push message from bg/app, whenever new notifications
arrive and popup is open

#### Payload

| Name | Type | Description |
| ------------- | ------------- | ------------- |
| messages | Number | Number of new/unread private messages |
| notifications | Number | Number of new/unread notifications |

### addNotifications

Answer to bg/app:getNotifications

#### Payload

Type: **Array.<APIClient.NItem>**

### addConversations

Answer to bg/app:getNotifications

#### Payload

Type: **Array.<APIClient.PCItem>**
