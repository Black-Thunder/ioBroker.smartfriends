# SmartFriends - User guide

## Prerequisites

In order to use this adapter, there are a few things you have to prepare in advance:

* ...

### Supported devices
...

## Configuration

![Adapter settings](img/adapter_settings.png)

Here you can configure your adapter instance. Mandatory for the adapter to work are your SmartFriends credentials (username and password) and the IP address of your gateway.
...

## Objects

After successful start of the adapter instance (X) your devices are queried from the gateway. For each device (Y) there will be a separate node.

### smartfriends.X.info

| id | read | write | comment |
|--- | :---: | :---: |--- |
| connection | X | - | Indicates the connection to the Gateway |

### smartfriends.X.gateway

| id | read | write | comment |
|--- | :---: | :---: |--- |
| ... | X | - | ... |

### smartfriends.X.device.Y.info

| id | read | write | comment |
|--- | :---: | :---: |--- |
| .... | X | - | ... |

### smartfriends.X.device.Y.control

| id | read | write | comment |
|--- | :---: | :---: |--- |
| .... | X | - | ... |