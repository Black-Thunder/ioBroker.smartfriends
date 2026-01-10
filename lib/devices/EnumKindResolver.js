"use strict";

/**
 * Resolves semantic enum type for devices with
 * model=text + textOptions
 */
function resolveEnumKind(definition, deviceType) {
	const designation = definition.deviceDesignation ?? "";
	const kind = definition.kind ?? "";
	const options = deviceType.textOptions ?? [];

	// RSSI / signal strength
	if (designation.includes("Rssi")) {
		return "signal";
	}

	// Failure status
	if (kind.includes("failureStatus")) {
		return "failureStatus";
	}

	// Smoke detector
	if (options.some(o => /smoke/i.test(o.valueState ?? ""))) {
		return "smokeDetector";
	}

	// Flood / water
	if (options.some(o => /water|flood/i.test(o.valueState ?? ""))) {
		return "floodDetector";
	}

	return "genericEnum";
}

module.exports = {
	resolveEnumKind,
};
