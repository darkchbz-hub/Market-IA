const DEFAULT_POSTAL_RULE = {
  pattern: /^.{3,12}$/,
  example: "codigo postal local"
};

const POSTAL_RULES = {
  AD: { pattern: /^AD\d{3}$/i, example: "AD500" },
  AL: { pattern: /^\d{4}$/, example: "1001" },
  AG: { pattern: /^.{3,12}$/, example: "codigo local" },
  AR: { pattern: /^[A-Z]?\d{4}[A-Z]{0,3}$/i, example: "C1000ABC" },
  AT: { pattern: /^\d{4}$/, example: "1010" },
  BA: { pattern: /^\d{5}$/, example: "71000" },
  BB: { pattern: /^BB\d{5}$/i, example: "BB11000" },
  BE: { pattern: /^\d{4}$/, example: "1000" },
  BG: { pattern: /^\d{4}$/, example: "1000" },
  BO: { pattern: /^\d{4,8}$/, example: "0000" },
  BR: { pattern: /^\d{5}-?\d{3}$/, example: "22000-000" },
  BS: { pattern: /^.{3,12}$/, example: "codigo local" },
  BY: { pattern: /^\d{6}$/, example: "220000" },
  BZ: { pattern: /^.{3,12}$/, example: "codigo local" },
  CA: { pattern: /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/i, example: "K1A 0B1" },
  CH: { pattern: /^\d{4}$/, example: "8001" },
  CL: { pattern: /^\d{7}$/, example: "8320000" },
  CO: { pattern: /^\d{6}$/, example: "110111" },
  CR: { pattern: /^\d{5}$/, example: "10101" },
  CU: { pattern: /^\d{5}$/, example: "10100" },
  CY: { pattern: /^\d{4}$/, example: "1010" },
  CZ: { pattern: /^\d{3}\s?\d{2}$/, example: "110 00" },
  DE: { pattern: /^\d{5}$/, example: "10115" },
  DK: { pattern: /^\d{4}$/, example: "1000" },
  DM: { pattern: /^.{3,12}$/, example: "codigo local" },
  DO: { pattern: /^\d{5}$/, example: "10101" },
  EC: { pattern: /^\d{6}$/, example: "170150" },
  EE: { pattern: /^\d{5}$/, example: "10111" },
  ES: { pattern: /^\d{5}$/, example: "28001" },
  FI: { pattern: /^\d{5}$/, example: "00100" },
  FR: { pattern: /^\d{5}$/, example: "75001" },
  GB: { pattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, example: "SW1A 1AA" },
  GD: { pattern: /^.{3,12}$/, example: "codigo local" },
  GR: { pattern: /^\d{3}\s?\d{2}$/, example: "105 58" },
  GT: { pattern: /^\d{5}$/, example: "01001" },
  GY: { pattern: /^.{3,12}$/, example: "codigo local" },
  HN: { pattern: /^\d{5}$/, example: "11101" },
  HR: { pattern: /^\d{5}$/, example: "10000" },
  HT: { pattern: /^\d{4}$/, example: "6110" },
  HU: { pattern: /^\d{4}$/, example: "1051" },
  IE: { pattern: /^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/i, example: "D02 X285" },
  IS: { pattern: /^\d{3}$/, example: "101" },
  IT: { pattern: /^\d{5}$/, example: "00118" },
  JM: { pattern: /^.{3,12}$/, example: "codigo local" },
  KN: { pattern: /^.{3,12}$/, example: "codigo local" },
  LC: { pattern: /^LC\d{2}\s?\d{3}$/i, example: "LC01 101" },
  LT: { pattern: /^(LT-?)?\d{5}$/i, example: "LT-01100" },
  LU: { pattern: /^\d{4}$/, example: "1111" },
  LV: { pattern: /^(LV-?)?\d{4}$/i, example: "LV-1050" },
  MD: { pattern: /^(MD-?)?\d{4}$/i, example: "MD-2001" },
  ME: { pattern: /^\d{5}$/, example: "81000" },
  MK: { pattern: /^\d{4}$/, example: "1000" },
  MT: { pattern: /^[A-Z]{3}\s?\d{4}$/i, example: "VLT 1117" },
  MX: { pattern: /^\d{5}$/, example: "22000" },
  NI: { pattern: /^\d{5}$/, example: "11001" },
  NL: { pattern: /^\d{4}\s?[A-Z]{2}$/i, example: "1011 AB" },
  NO: { pattern: /^\d{4}$/, example: "0150" },
  PA: { pattern: /^\d{4,6}$/, example: "0801" },
  PE: { pattern: /^\d{5}$/, example: "15001" },
  PL: { pattern: /^\d{2}-?\d{3}$/, example: "00-001" },
  PT: { pattern: /^\d{4}-?\d{3}$/, example: "1000-001" },
  PY: { pattern: /^\d{4}$/, example: "1209" },
  RO: { pattern: /^\d{6}$/, example: "010011" },
  RS: { pattern: /^\d{5}$/, example: "11000" },
  RU: { pattern: /^\d{6}$/, example: "101000" },
  SE: { pattern: /^\d{3}\s?\d{2}$/, example: "111 20" },
  SI: { pattern: /^\d{4}$/, example: "1000" },
  SK: { pattern: /^\d{3}\s?\d{2}$/, example: "811 01" },
  SR: { pattern: /^.{3,12}$/, example: "codigo local" },
  SV: { pattern: /^\d{4}$/, example: "01101" },
  TT: { pattern: /^\d{6}$/, example: "120110" },
  TR: { pattern: /^\d{5}$/, example: "34000" },
  UA: { pattern: /^\d{5}$/, example: "01001" },
  US: { pattern: /^\d{5}(-\d{4})?$/, example: "90210" },
  UY: { pattern: /^\d{5}$/, example: "11100" },
  VC: { pattern: /^VC\d{4}$/i, example: "VC0100" },
  VE: { pattern: /^\d{4}$/, example: "1010" }
};

export function getPostalRule(countryCode) {
  return POSTAL_RULES[String(countryCode || "").toUpperCase()] || DEFAULT_POSTAL_RULE;
}

export function isPostalCodeFormatValid(countryCode, postalCode) {
  const value = String(postalCode || "").trim();
  return getPostalRule(countryCode).pattern.test(value);
}

export function postalCodeExample(countryCode) {
  return getPostalRule(countryCode).example;
}
