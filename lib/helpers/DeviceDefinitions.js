"use strict";

const SWITCHING_VALUE_ALIASES = {
	"<>": "toggle",
};

export function normalizeDeviceDefinition(definition, forbiddenChars) {
	if (!definition?.deviceType) {
		return null;
	}

	const deviceType = definition.deviceType;

	const normalized = {
		...definition,
		deviceType: {
			...deviceType,
		},
	};

	// --- switchingValues ---
	if (Array.isArray(deviceType.switchingValues)) {
		normalized.deviceType.switchingValues = deviceType.switchingValues
			.map(switchingValue => {
				const safeName = sanitizeIdPart(switchingValue.name ?? switchingValue.value, forbiddenChars);
				if (!safeName) {
					return null;
				}

				return {
					...switchingValue,
					name: safeName,
				};
			})
			.filter(Boolean);
	}

	// --- enum textOptions ---
	if (Array.isArray(deviceType.textOptions)) {
		normalized.deviceType.textOptions = deviceType.textOptions
			.map(opt => {
				const safeName = sanitizeIdPart(opt.name ?? opt.value, forbiddenChars);
				if (!safeName) {
					return null;
				}

				return {
					...opt,
					name: safeName,
				};
			})
			.filter(Boolean);
	}

	return normalized;
}

export function sanitizeIdPart(value, forbiddenChars) {
	if (value === undefined || value === null) {
		return null;
	}

	let str = String(value);

	// Alias BEFORE decode
	const preAlias = str.trim();
	if (SWITCHING_VALUE_ALIASES[preAlias]) {
		str = SWITCHING_VALUE_ALIASES[preAlias];
	}

	// Decode Unicode-escaped strings \uXXXX
	str = decodeUnicodeString(str);

	// Alias AFTER decode
	const postAlias = str.trim();
	if (SWITCHING_VALUE_ALIASES[postAlias]) {
		str = SWITCHING_VALUE_ALIASES[postAlias];
	}

	const sanitized = str
		.toLowerCase()
		.replace(/\${|}/g, "") // ${On} → On
		.replace(forbiddenChars, "");

	return sanitized.length > 0 ? sanitized : null;
}

export function decodeUnicodeString(str) {
	if (typeof str !== "string") {
		return str;
	}

	// Nothing to decode
	if (!str.includes("\\u")) {
		return str;
	}

	// Replace literal \uXXXX sequences with real Unicode characters
	return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}
