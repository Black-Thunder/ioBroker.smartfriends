"use strict";

/**
 * Response codes returned by the SmartFriends gateway.
 */
const ResponseCodes = Object.freeze({
	/**
	 * Command failed.
	 * Additional information may be available in response.errorCode.
	 */
	ERROR: -1,

	/**
	 * Command completed successfully.
	 */
	SUCCESS: 1,

	/**
	 * Asynchronous device update.
	 */
	UPDATE: 2,

	/**
	 * New compatibility configuration.
	 * Currently ignored by the adapter.
	 */
	NEW_COMPATIBILITY_CONFIGURATION: 4,

	/**
	 * Gateway notification / warning.
	 *
	 * A special case is a parallel login using the same credentials,
	 * which causes the current connection to be terminated.
	 */
	NOTIFICATION: 5,

	/**
	 * New license information.
	 * Currently ignored by the adapter.
	 */
	NEW_LICENSE: 7,

	/**
	 * Empty message received after a disconnect caused by response code 5.
	 * Currently ignored by the adapter.
	 */
	DISCONNECT_FINISHED: 8,

	/**
	 * Module information.
	 * Currently ignored by the adapter.
	 */
	SHOW_MODULE_INFO: 15,

	/**
	 * SmartFriends Box cannot connect to the RemoteHome server.
	 * Currently ignored by the adapter.
	 */
	REMOTE_HOME_CONNECTION_FAILED: 16,

	/**
	 * Login process finished.
	 * Empty informational message after successful login.
	 */
	LOGIN_FINISHED: 20,

	/**
	 * TLS/SSL connection to the gateway was closed.
	 */
	TLS_CONNECTION_CLOSED: 84,

	/**
	 * Host not found.
	 * Currently ignored by the adapter.
	 */
	HOST_NOT_FOUND: 85,

	/**
	 * Connection refused.
	 *
	 * The origin of this message is currently unclear and it is
	 * ignored because it does not appear to have negative effects.
	 */
	CONNECTION_REFUSED: 86,

	/**
	 * Empty informational message after successful login.
	 * Currently ignored by the adapter.
	 */
	LOGIN_FINISHED_ALT: 87,

	/**
	 * Connection to the gateway timed out.
	 */
	CONNECTION_TIMEOUT: 91,

	/**
	 * Connection timed out.
	 * Currently ignored by the adapter.
	 */
	CONNECTION_TIMEOUT_INFO: 203,
});

/**
 * Error codes contained in responses with responseCode === ResponseCodes.ERROR.
 */
const ErrorCodes = Object.freeze({
	/**
	 * Username or password is invalid.
	 *
	 * response.remainingBlockDuration may indicate how long
	 * further login attempts are blocked.
	 */
	INVALID_CREDENTIALS: 50,

	/**
	 * Login parameters were rejected by the gateway.
	 *
	 * According to current adapter behaviour this is commonly caused
	 * by an invalid CSymbol or another connection parameter.
	 */
	INVALID_CONNECTION_PARAMETERS: 70,
});

/**
 * Errors for which reconnecting automatically is pointless because
 * the configured parameters need to be changed first.
 */
const NonRetryableErrorCodes = new Set([ErrorCodes.INVALID_CREDENTIALS, ErrorCodes.INVALID_CONNECTION_PARAMETERS]);

module.exports = {
	ResponseCodes,
	ErrorCodes,
	NonRetryableErrorCodes,
};
