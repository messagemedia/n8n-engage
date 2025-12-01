/**
 * Custom country code mappings for ISO 3166-1 standard
 */

/**
 * Country code mapping: Alpha-2 code to { alpha3: Alpha-3 code, name: Country name }
 */
const COUNTRY_DATA: Record<string, { alpha3: string; name: string }> = {
	// North America
	US: { alpha3: 'USA', name: 'United States of America' },
	CA: { alpha3: 'CAN', name: 'Canada' },
	MX: { alpha3: 'MEX', name: 'Mexico' },

	// South America
	BR: { alpha3: 'BRA', name: 'Brazil' },
	AR: { alpha3: 'ARG', name: 'Argentina' },
	CL: { alpha3: 'CHL', name: 'Chile' },
	CO: { alpha3: 'COL', name: 'Colombia' },
	PE: { alpha3: 'PER', name: 'Peru' },
	VE: { alpha3: 'VEN', name: 'Venezuela' },

	// Europe
	GB: { alpha3: 'GBR', name: 'United Kingdom' },
	DE: { alpha3: 'DEU', name: 'Germany' },
	FR: { alpha3: 'FRA', name: 'France' },
	IT: { alpha3: 'ITA', name: 'Italy' },
	ES: { alpha3: 'ESP', name: 'Spain' },
	NL: { alpha3: 'NLD', name: 'Netherlands' },
	SE: { alpha3: 'SWE', name: 'Sweden' },
	NO: { alpha3: 'NOR', name: 'Norway' },
	DK: { alpha3: 'DNK', name: 'Denmark' },
	FI: { alpha3: 'FIN', name: 'Finland' },
	PL: { alpha3: 'POL', name: 'Poland' },
	BE: { alpha3: 'BEL', name: 'Belgium' },
	AT: { alpha3: 'AUT', name: 'Austria' },
	CH: { alpha3: 'CHE', name: 'Switzerland' },
	PT: { alpha3: 'PRT', name: 'Portugal' },
	GR: { alpha3: 'GRC', name: 'Greece' },
	CZ: { alpha3: 'CZE', name: 'Czech Republic' },
	RO: { alpha3: 'ROU', name: 'Romania' },
	IE: { alpha3: 'IRL', name: 'Ireland' },
	HU: { alpha3: 'HUN', name: 'Hungary' },

	// Asia
	CN: { alpha3: 'CHN', name: 'China' },
	IN: { alpha3: 'IND', name: 'India' },
	JP: { alpha3: 'JPN', name: 'Japan' },
	KR: { alpha3: 'KOR', name: 'South Korea' },
	SG: { alpha3: 'SGP', name: 'Singapore' },
	HK: { alpha3: 'HKG', name: 'Hong Kong' },
	TW: { alpha3: 'TWN', name: 'Taiwan' },
	TH: { alpha3: 'THA', name: 'Thailand' },
	MY: { alpha3: 'MYS', name: 'Malaysia' },
	ID: { alpha3: 'IDN', name: 'Indonesia' },
	PH: { alpha3: 'PHL', name: 'Philippines' },
	VN: { alpha3: 'VNM', name: 'Vietnam' },
	PK: { alpha3: 'PAK', name: 'Pakistan' },
	BD: { alpha3: 'BGD', name: 'Bangladesh' },
	IL: { alpha3: 'ISR', name: 'Israel' },
	AE: { alpha3: 'ARE', name: 'United Arab Emirates' },
	SA: { alpha3: 'SAU', name: 'Saudi Arabia' },
	TR: { alpha3: 'TUR', name: 'Turkey' },

	// Oceania
	AU: { alpha3: 'AUS', name: 'Australia' },
	NZ: { alpha3: 'NZL', name: 'New Zealand' },

	// Africa
	ZA: { alpha3: 'ZAF', name: 'South Africa' },
	NG: { alpha3: 'NGA', name: 'Nigeria' },
	EG: { alpha3: 'EGY', name: 'Egypt' },
	KE: { alpha3: 'KEN', name: 'Kenya' },
	MA: { alpha3: 'MAR', name: 'Morocco' },
	GH: { alpha3: 'GHA', name: 'Ghana' },
	ET: { alpha3: 'ETH', name: 'Ethiopia' },
	TZ: { alpha3: 'TZA', name: 'Tanzania' },
	UG: { alpha3: 'UGA', name: 'Uganda' },

	// Additional European countries
	RU: { alpha3: 'RUS', name: 'Russia' },
	UA: { alpha3: 'UKR', name: 'Ukraine' },
	BG: { alpha3: 'BGR', name: 'Bulgaria' },
	HR: { alpha3: 'HRV', name: 'Croatia' },
	SK: { alpha3: 'SVK', name: 'Slovakia' },
	SI: { alpha3: 'SVN', name: 'Slovenia' },
	LT: { alpha3: 'LTU', name: 'Lithuania' },
	LV: { alpha3: 'LVA', name: 'Latvia' },
	EE: { alpha3: 'EST', name: 'Estonia' },
	RS: { alpha3: 'SRB', name: 'Serbia' },

	// Middle East
	JO: { alpha3: 'JOR', name: 'Jordan' },
	LB: { alpha3: 'LBN', name: 'Lebanon' },
	KW: { alpha3: 'KWT', name: 'Kuwait' },
	QA: { alpha3: 'QAT', name: 'Qatar' },
	OM: { alpha3: 'OMN', name: 'Oman' },
	BH: { alpha3: 'BHR', name: 'Bahrain' },

	// Caribbean & Central America
	JM: { alpha3: 'JAM', name: 'Jamaica' },
	TT: { alpha3: 'TTO', name: 'Trinidad and Tobago' },
	BB: { alpha3: 'BRB', name: 'Barbados' },
	CR: { alpha3: 'CRI', name: 'Costa Rica' },
	PA: { alpha3: 'PAN', name: 'Panama' },
	GT: { alpha3: 'GTM', name: 'Guatemala' },
	DO: { alpha3: 'DOM', name: 'Dominican Republic' },
	CU: { alpha3: 'CUB', name: 'Cuba' },

	// Additional Asian countries
	LK: { alpha3: 'LKA', name: 'Sri Lanka' },
	NP: { alpha3: 'NPL', name: 'Nepal' },
	MM: { alpha3: 'MMR', name: 'Myanmar' },
	KH: { alpha3: 'KHM', name: 'Cambodia' },
	LA: { alpha3: 'LAO', name: 'Laos' },
	MN: { alpha3: 'MNG', name: 'Mongolia' },

	// Pacific Islands
	FJ: { alpha3: 'FJI', name: 'Fiji' },
	PG: { alpha3: 'PNG', name: 'Papua New Guinea' },

	// Additional African countries
	DZ: { alpha3: 'DZA', name: 'Algeria' },
	TN: { alpha3: 'TUN', name: 'Tunisia' },
	LY: { alpha3: 'LBY', name: 'Libya' },
	SN: { alpha3: 'SEN', name: 'Senegal' },
	CI: { alpha3: 'CIV', name: "Côte d'Ivoire" },
	CM: { alpha3: 'CMR', name: 'Cameroon' },
	ZW: { alpha3: 'ZWE', name: 'Zimbabwe' },
	BW: { alpha3: 'BWA', name: 'Botswana' },
	NA: { alpha3: 'NAM', name: 'Namibia' },
	MU: { alpha3: 'MUS', name: 'Mauritius' },

	// Nordic & Baltic
	IS: { alpha3: 'ISL', name: 'Iceland' },
	LU: { alpha3: 'LUX', name: 'Luxembourg' },
	MT: { alpha3: 'MLT', name: 'Malta' },
	CY: { alpha3: 'CYP', name: 'Cyprus' },

	// Western Balkans
	AL: { alpha3: 'ALB', name: 'Albania' },
	BA: { alpha3: 'BIH', name: 'Bosnia and Herzegovina' },
	MK: { alpha3: 'MKD', name: 'North Macedonia' },
	ME: { alpha3: 'MNE', name: 'Montenegro' },
	XK: { alpha3: 'XKX', name: 'Kosovo' },

	// Central Asia
	KZ: { alpha3: 'KAZ', name: 'Kazakhstan' },
	UZ: { alpha3: 'UZB', name: 'Uzbekistan' },
	KG: { alpha3: 'KGZ', name: 'Kyrgyzstan' },
	TJ: { alpha3: 'TJK', name: 'Tajikistan' },
	TM: { alpha3: 'TKM', name: 'Turkmenistan' },

	// South Asia
	AF: { alpha3: 'AFG', name: 'Afghanistan' },
	BT: { alpha3: 'BTN', name: 'Bhutan' },
	MV: { alpha3: 'MDV', name: 'Maldives' },

	// Additional countries
	BY: { alpha3: 'BLR', name: 'Belarus' },
	MD: { alpha3: 'MDA', name: 'Moldova' },
	GE: { alpha3: 'GEO', name: 'Georgia' },
	AM: { alpha3: 'ARM', name: 'Armenia' },
	AZ: { alpha3: 'AZE', name: 'Azerbaijan' },
	IQ: { alpha3: 'IRQ', name: 'Iraq' },
	IR: { alpha3: 'IRN', name: 'Iran' },
	SY: { alpha3: 'SYR', name: 'Syria' },
	YE: { alpha3: 'YEM', name: 'Yemen' },
};

/**
 * Reverse mapping: Alpha-3 code to Alpha-2 code
 */
const ALPHA3_TO_ALPHA2: Record<string, string> = Object.entries(COUNTRY_DATA).reduce(
	(acc, [alpha2, { alpha3 }]) => {
		acc[alpha3] = alpha2;
		return acc;
	},
	{} as Record<string, string>
);

/**
 * Convert ISO 3166-1 alpha-2 country code to alpha-3 format
 *
 * @param alpha2 - Two-letter country code (e.g., 'US', 'GB', 'AU')
 * @returns Three-letter country code (e.g., 'USA', 'GBR', 'AUS') or undefined if not found
 *
 * @example
 * alpha2ToAlpha3('US') // 'USA'
 * alpha2ToAlpha3('GB') // 'GBR'
 * alpha2ToAlpha3('XX') // undefined
 */
export function alpha2ToAlpha3(alpha2: string): string | undefined {
	const upperCode = alpha2?.toUpperCase();
	return COUNTRY_DATA[upperCode]?.alpha3;
}

/**
 * Convert ISO 3166-1 alpha-3 country code to alpha-2 format
 *
 * @param alpha3 - Three-letter country code (e.g., 'USA', 'GBR', 'AUS')
 * @returns Two-letter country code (e.g., 'US', 'GB', 'AU') or undefined if not found
 *
 * @example
 * alpha3ToAlpha2('USA') // 'US'
 * alpha3ToAlpha2('GBR') // 'GB'
 * alpha3ToAlpha2('XXX') // undefined
 */
export function alpha3ToAlpha2(alpha3: string): string | undefined {
	const upperCode = alpha3?.toUpperCase();
	return ALPHA3_TO_ALPHA2[upperCode];
}

/**
 * Get the official country name for a given alpha-2 code
 *
 * @param alpha2 - Two-letter country code (e.g., 'US', 'GB', 'AU')
 * @returns Country name or undefined if not found
 *
 * @example
 * getCountryName('US') // 'United States of America'
 * getCountryName('GB') // 'United Kingdom'
 * getCountryName('XX') // undefined
 */
export function getCountryName(alpha2: string): string | undefined {
	const upperCode = alpha2?.toUpperCase();
	return COUNTRY_DATA[upperCode]?.name;
}

/**
 * Check if a country code is valid (alpha-2 format)
 *
 * @param code - Country code to validate
 * @returns true if the code is a valid alpha-2 country code
 *
 * @example
 * isValidCountryCode('US') // true
 * isValidCountryCode('XX') // false
 */
export function isValidCountryCode(code: string): boolean {
	const upperCode = code?.toUpperCase();
	return upperCode in COUNTRY_DATA;
}

/**
 * Get all country names mapped by alpha-2 code
 * Compatible with i18n-iso-countries getNames() API
 *
 * @returns Object mapping alpha-2 codes to country names
 *
 * @example
 * const names = getNames();
 * names['US'] // 'United States of America'
 * names['GB'] // 'United Kingdom'
 */
export function getNames(): Record<string, string> {
	return Object.entries(COUNTRY_DATA).reduce(
		(acc, [alpha2, { name }]) => {
			acc[alpha2] = name;
			return acc;
		},
		{} as Record<string, string>
	);
}

/**
 * Get all country codes (alpha-2)
 *
 * @returns Array of all supported alpha-2 country codes
 */
export function getAllCountryCodes(): string[] {
	return Object.keys(COUNTRY_DATA);
}
