/**
 * Custom phone number validation and formatting utilities
 * Replaces google-libphonenumber dependency with self-contained implementation
 */

/**
 * Phone number parsing result
 */
export interface PhoneNumber {
	/** Country calling code (e.g., '1' for US/CA, '44' for UK, '61' for AU) */
	countryCode: string;
	/** National number without country code */
	nationalNumber: string;
	/** Whether the phone number is valid */
	isValid: boolean;
	/** Phone number in E.164 format (e.g., '+14155552671') */
	e164Format?: string;
}

/**
 * Country calling codes mapping (ISO 3166-1 alpha-2 to calling code)
 * Covers the most commonly used countries
 */
const COUNTRY_CALLING_CODES: Record<string, string> = {
	// North America
	US: '1',
	CA: '1',
	MX: '52',

	// South America
	BR: '55',
	AR: '54',
	CL: '56',
	CO: '57',
	PE: '51',
	VE: '58',

	// Europe
	GB: '44',
	DE: '49',
	FR: '33',
	IT: '39',
	ES: '34',
	NL: '31',
	SE: '46',
	NO: '47',
	DK: '45',
	FI: '358',
	PL: '48',
	BE: '32',
	AT: '43',
	CH: '41',
	PT: '351',
	GR: '30',
	CZ: '420',
	RO: '40',
	IE: '353',
	HU: '36',

	// Asia
	CN: '86',
	IN: '91',
	JP: '81',
	KR: '82',
	SG: '65',
	HK: '852',
	TW: '886',
	TH: '66',
	MY: '60',
	ID: '62',
	PH: '63',
	VN: '84',
	PK: '92',
	BD: '880',
	IL: '972',
	AE: '971',
	SA: '966',
	TR: '90',

	// Oceania
	AU: '61',
	NZ: '64',

	// Africa
	ZA: '27',
	NG: '234',
	EG: '20',
	KE: '254',
	MA: '212',
	GH: '233',
	ET: '251',
	TZ: '255',
	UG: '256',

	// Additional European countries
	RU: '7',
	UA: '380',
	BG: '359',
	HR: '385',
	SK: '421',
	SI: '386',
	LT: '370',
	LV: '371',
	EE: '372',
	RS: '381',

	// Middle East
	JO: '962',
	LB: '961',
	KW: '965',
	QA: '974',
	OM: '968',
	BH: '973',

	// Caribbean & Central America
	JM: '1',
	TT: '1',
	BB: '1',
	CR: '506',
	PA: '507',
	GT: '502',
	DO: '1',
	CU: '53',

	// Additional Asian countries
	LK: '94',
	NP: '977',
	MM: '95',
	KH: '855',
	LA: '856',
	MN: '976',

	// Pacific Islands
	FJ: '679',
	PG: '675',

	// Additional African countries
	DZ: '213',
	TN: '216',
	LY: '218',
	SN: '221',
	CI: '225',
	CM: '237',
	ZW: '263',
	BW: '267',
	NA: '264',
	MU: '230',

	// Nordic & Baltic
	IS: '354',
	LU: '352',
	MT: '356',
	CY: '357',

	// Western Balkans
	AL: '355',
	BA: '387',
	MK: '389',
	ME: '382',
	XK: '383',

	// Central Asia
	KZ: '7',
	UZ: '998',
	KG: '996',
	TJ: '992',
	TM: '993',

	// South Asia
	AF: '93',
	BT: '975',
	MV: '960',

	// Additional countries
	BY: '375',
	MD: '373',
	GE: '995',
	AM: '374',
	AZ: '994',
	IQ: '964',
	IR: '98',
	SY: '963',
	YE: '967',
};

/**
 * Get country calling code for a given country code
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB', 'AU')
 * @returns Country calling code (e.g., '1', '44', '61') or undefined if not found
 */
export function getCountryCallingCode(countryCode: string): string | undefined {
	const upperCode = countryCode?.toUpperCase();
	return COUNTRY_CALLING_CODES[upperCode];
}

/**
 * Extract and normalize phone number digits
 * Removes all non-digit characters except leading +
 *
 * @param phoneNumber - Phone number in any format
 * @returns Normalized phone number with only digits (and optional leading +)
 */
function normalizeDigits(phoneNumber: string): string {
	if (!phoneNumber) return '';

	// Keep the leading + if present, remove all other non-digits
	const hasPlus = phoneNumber.trim().startsWith('+');
	const digits = phoneNumber.replace(/\D/g, '');

	return hasPlus ? `+${digits}` : digits;
}

/**
 * Parse a phone number and extract its components
 *
 * @param phoneNumber - Phone number to parse (with or without country code)
 * @param defaultCountryCode - Default country code to use if not in international format (e.g., 'US', 'AU')
 * @returns Parsed phone number components
 *
 * @example
 * parsePhoneNumber('+14155552671') // { countryCode: '1', nationalNumber: '4155552671', isValid: true, e164Format: '+14155552671' }
 * parsePhoneNumber('4155552671', 'US') // { countryCode: '1', nationalNumber: '4155552671', isValid: true, e164Format: '+14155552671' }
 * parsePhoneNumber('0437536808', 'AU') // { countryCode: '61', nationalNumber: '437536808', isValid: true, e164Format: '+61437536808' }
 */
export function parsePhoneNumber(phoneNumber: string, defaultCountryCode?: string): PhoneNumber {
	const normalized = normalizeDigits(phoneNumber);

	if (!normalized) {
		return {
			countryCode: '',
			nationalNumber: '',
			isValid: false,
		};
	}

	let countryCode = '';
	let nationalNumber = '';

	// Check if number starts with + (international format)
	if (normalized.startsWith('+')) {
		// Extract country code from international format
		const digitsOnly = normalized.substring(1);

		// Try to match country codes (1-3 digits)
		// Try 3 digits first, then 2, then 1
		for (let i = 3; i >= 1; i--) {
			const potentialCode = digitsOnly.substring(0, i);
			const potentialNational = digitsOnly.substring(i);

			// Check if this is a valid country code
			const isValidCode = Object.values(COUNTRY_CALLING_CODES).includes(potentialCode);

			if (isValidCode && potentialNational.length >= 4) {
				countryCode = potentialCode;
				nationalNumber = potentialNational;
				break;
			}
		}

		// If we couldn't match a known code, use the first 1-3 digits as country code
		if (!countryCode) {
			if (digitsOnly.length > 3) {
				countryCode = digitsOnly.substring(0, Math.min(3, digitsOnly.length - 4));
				nationalNumber = digitsOnly.substring(countryCode.length);
			} else {
				nationalNumber = digitsOnly;
			}
		}
	} else {
		// Local format - need country code
		if (!defaultCountryCode) {
			return {
				countryCode: '',
				nationalNumber: normalized,
				isValid: false,
			};
		}

		const callingCode = getCountryCallingCode(defaultCountryCode);
		if (!callingCode) {
			return {
				countryCode: '',
				nationalNumber: normalized,
				isValid: false,
			};
		}

		countryCode = callingCode;
		// Remove leading 0 if present (common in many countries)
		nationalNumber = normalized.startsWith('0') ? normalized.substring(1) : normalized;
	}

	// Validate: phone numbers should be 7-15 digits total (country code + national number)
	const totalDigits = countryCode.length + nationalNumber.length;
	const isValid = totalDigits >= 7 && totalDigits <= 15 && nationalNumber.length >= 4;

	const e164Format = isValid ? `+${countryCode}${nationalNumber}` : undefined;

	return {
		countryCode,
		nationalNumber,
		isValid,
		e164Format,
	};
}

/**
 * Format a phone number to E.164 format (+[country code][national number])
 *
 * @param phoneNumber - Phone number to format
 * @param defaultCountryCode - Default country code if not in international format
 * @returns E.164 formatted phone number or null if invalid
 *
 * @example
 * formatToE164('+1 415 555 2671') // '+14155552671'
 * formatToE164('415-555-2671', 'US') // '+14155552671'
 * formatToE164('0437 536 808', 'AU') // '+61437536808'
 */
export function formatToE164(phoneNumber: string, defaultCountryCode?: string): string | null {
	const parsed = parsePhoneNumber(phoneNumber, defaultCountryCode);
	return parsed.e164Format || null;
}

/**
 * Check if a phone number is valid
 *
 * @param phoneNumber - Phone number to validate
 * @returns true if the phone number is valid
 *
 * @example
 * isValidPhoneNumber('+14155552671') // true
 * isValidPhoneNumber('123') // false
 * isValidPhoneNumber('') // false
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
	const normalized = normalizeDigits(phoneNumber);
	if (!normalized) return false;

	// If starts with +, try to parse as international
	if (normalized.startsWith('+')) {
		const parsed = parsePhoneNumber(phoneNumber);
		return parsed.isValid;
	}

	// Local format without country code - check if it has reasonable length
	const digitsOnly = normalized.replace(/\D/g, '');
	return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

/**
 * Format a phone number in international format for display
 * E.g., +1 415 555 2671
 *
 * @param phoneNumber - Phone number to format
 * @returns Formatted phone number for display
 *
 * @example
 * formatInternational('+14155552671') // '+1 4155552671'
 * formatInternational('+61437536808') // '+61 437536808'
 */
export function formatInternational(phoneNumber: string): string {
	const normalized = normalizeDigits(phoneNumber);
	if (!normalized) return phoneNumber;

	const parsed = parsePhoneNumber(phoneNumber);
	if (!parsed.isValid || !parsed.e164Format) {
		return phoneNumber;
	}

	// Format as +[country code] [national number]
	return `+${parsed.countryCode} ${parsed.nationalNumber}`;
}

/**
 * Parse phone number and validate it
 * Mimics google-libphonenumber's parseAndKeepRawInput behavior
 *
 * @param phoneNumber - Phone number to parse
 * @param defaultCountryCode - Default country code
 * @returns Parsed phone number object
 */
export function parseAndKeepRawInput(phoneNumber: string, defaultCountryCode?: string): PhoneNumber {
	return parsePhoneNumber(phoneNumber, defaultCountryCode);
}

/**
 * Check if a parsed phone number is valid
 * Mimics google-libphonenumber's isValidNumber behavior
 *
 * @param phoneNumber - Parsed phone number object
 * @returns true if valid
 */
export function isValidNumber(phoneNumber: PhoneNumber): boolean {
	return phoneNumber.isValid;
}

/**
 * Format a parsed phone number to E.164
 * Mimics google-libphonenumber's format behavior
 *
 * @param phoneNumber - Parsed phone number object
 * @returns E.164 formatted phone number
 */
export function format(phoneNumber: PhoneNumber): string {
	return phoneNumber.e164Format || '';
}
