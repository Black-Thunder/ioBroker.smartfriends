# SmartFriends - User guide

## Prerequisites

To use this adapter correctly, the following preparations must be made:

- Gateway set up and IP address known
- (Recommended) Create a dedicated user for the adapter to avoid conflicts
- All devices to be controlled registered and configured on the gateway

### Supported devices

The adapter automatically creates the appropriate states based on the data reported by the gateway.
In principle, all device types should be supported.

If any states are missing or incorrect, please open an issue and include a full debug log.

## Configuration

![Adapter settings](img/adapter_settings.png)

### Connection details

Here, you can configure the specific adapter instance. The login credentials (username and password) and the IP address of the SmartFriend gateway are required for proper functionality.

### Advanced options

These settings usually do not need to be changed as long as a SmartFriendsBox is used. If using another compatible gateway, the parameters must be adjusted accordingly. Open the SmartFriends app and follow these steps:

![Finding gateway parameters - Step 1](img/find_gateway_parameters_1.png)
![Finding gateway parameters - Step 2](img/find_gateway_parameters_2.png)

Additionally, ignoring SSL errors can be enabled here. This should only be used in exceptional cases, e.g., for certificate errors.

## Objects

Once the adapter instance (X) is successfully (=green) started, devices and data from the gateway are retrieved.
For each supported device (Y), a separate object node is created. On the top level, all related functions are grouped under a master ID. Below that, child devices (Z1...N) are created per function.

### smartfriends.X.info

| id         | read | write | comment                                 |
| ---------- | :--: | :---: | --------------------------------------- |
| connection |  X   |   -   | Indicates the connection to the Gateway |

### smartfriends.X.gateway

| ID           | read | write | comment                         |
| ------------ | :--: | :---: | ------------------------------- |
| hardwareName |  X   |   -   | Name of the used gateway        |
| macAddress   |  X   |   -   | MAC address of the used gateway |

### smartfriends.X.device.Y.Z1...N.info

| ID          | read | write | comment                         |
| ----------- | :--: | :---: | ------------------------------- |
| designation |  X   |   -   | Device designation              |
| deviceName  |  X   |   -   | User-defined name of the device |
| typeClient  |  X   |   -   | Device type                     |

### smartfriends.X.device.Y.Z1...N.control

These states depend on the device type.

#### Control states (boolean)

| ID     | readable | writable | Note                    |
| ------ | :------: | :------: | ----------------------- |
| on     |    -     |    X     | Turn device on          |
| off    |    -     |    X     | Turn device off         |
| stop   |    -     |    X     | Stop the device         |
| up     |    -     |    X     | Move device up          |
| down   |    -     |    X     | Move device down        |
| toggle |    -     |    X     | Invert the device state |

#### Control states (number)

| ID       | readable | writable | Note                                |
| -------- | :------: | :------: | ----------------------------------- |
| position |    X     |    X     | Move device to position N (0...100) |
