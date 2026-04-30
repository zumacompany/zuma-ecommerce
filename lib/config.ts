// Application configuration
// These values can be moved to environment variables in production

export const APP_CONFIG = {
    // Regional settings
    DEFAULT_COUNTRY: 'Moçambique',
    DEFAULT_COUNTRY_CODE: 'MZ',
    DEFAULT_PHONE_PREFIX: '+258',

    // Currency
    DEFAULT_CURRENCY: 'MZN',
    DEFAULT_LOCALE: 'pt-MZ',

    // Validation
    MIN_PHONE_DIGITS: 9,
    MAX_PHONE_DIGITS: 15,

    // Features (toggle these to enable/disable features)
    FEATURES: {
        MULTI_COUNTRY_SUPPORT: false, // Set to true when ready to support multiple countries
        AUTO_FULFILL: false, // Auto-fulfillment of digital codes
    }
} as const

export type AppConfig = typeof APP_CONFIG
