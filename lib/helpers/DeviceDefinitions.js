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
				const safeName = sanitizeIdPart(switchingValue.name, forbiddenChars);
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

	// Try to parse Unicode-escaped strings
	str = decodeUnicodeString(str);

	// Map known aliases to meaningful strings
	const aliasKey = str.trim();
	if (SWITCHING_VALUE_ALIASES[aliasKey]) {
		str = SWITCHING_VALUE_ALIASES[aliasKey];
	}

	const sanitized = str
		.toLowerCase()
		.replace(/\${|}/g, "") // ${On} → On
		.replace(forbiddenChars, "");

	return sanitized.length > 0 ? sanitized : null;
}

export function decodeUnicodeString(str) {
	if (!str.includes("\\u")) {
		return str;
	}

	try {
		return JSON.parse(`"${String(str).replace(/"/g, '\\"')}"`);
	} catch {
		return str;
	}
}
