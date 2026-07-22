/**
 * Generic validator utility functions.
 * Merged from Backend B's registration and login logic.
 */

/**
 * Validates a user's name.
 * - Minimum 2 characters
 * - Only letters and spaces
 * - No consecutive spaces
 *
 * @param {string} name - Name to validate
 * @returns {{isValid: boolean, message?: string}} Validation result
 */
const validateName = (name) => {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return { isValid: false, message: "Name is required" };
  }
  if (trimmed.length < 2) {
    return { isValid: false, message: "Name must be at least 2 characters" };
  }
  if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
    return { isValid: false, message: "Name must contain only letters" };
  }
  if (/\s{2,}/.test(trimmed)) {
    return { isValid: false, message: "Multiple spaces are not allowed in name" };
  }
  return { isValid: true };
};

/**
 * Validates an email address and checks against the domain whitelist if enabled.
 *
 * @param {string} email - Email to validate
 * @returns {{isValid: boolean, message?: string}} Validation result
 */
const validateEmail = (email) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) {
    return { isValid: false, message: "Email is required" };
  }

  // Basic email pattern check matching B's validator (.com or .in)
  const emailPattern = /^[^\s@]+@[^\s@]+\.(com|in)$/;
  if (!emailPattern.test(cleanEmail)) {
    return { isValid: false, message: "Enter valid email" };
  }

  // Optional domain whitelist check configured via environment variables
  const whitelistEnabled = process.env.EMAIL_DOMAIN_WHITELIST_ENABLED === "true";
  if (whitelistEnabled) {
    const whitelistStr = process.env.EMAIL_DOMAIN_WHITELIST || "gmail.com,yahoo.com,outlook.com,hotmail.com,live.com,thestackly.com";
    const allowedDomains = whitelistStr.split(",").map(d => d.trim().toLowerCase());
    const domain = cleanEmail.split("@")[1];
    if (!allowedDomains.includes(domain)) {
      return {
        isValid: false,
        message: `Only emails from the following domains are allowed: ${allowedDomains.join(", ")}`,
      };
    }
  }

  return { isValid: true };
};

/**
 * Validates a mobile number.
 * - Country code pattern: + followed by 6 to 15 digits
 * - Rejects same digits (e.g. +919999999999)
 * - Rejects repeating pairs (e.g. +912222222222)
 *
 * @param {string} mobile - Mobile number to validate
 * @returns {{isValid: boolean, message?: string}} Validation result
 */
const validatePhone = (mobile) => {
  const cleanMobile = (mobile || "").trim();
  if (!cleanMobile) {
    return { isValid: false, message: "Mobile number is required" };
  }

  // Validate format (country code followed by 6-15 digits)
  if (!/^\+\d{6,15}$/.test(cleanMobile)) {
    return { isValid: false, message: "Enter valid mobile number" };
  }

  const digitsOnly = cleanMobile.replace(/\D/g, "");

  // Reject consecutive identical digits (e.g. 0000000000)
  if (/^(\d)\1+$/.test(digitsOnly)) {
    return { isValid: false, message: "Enter valid mobile number" };
  }

  // Reject repeated pairs (e.g. 1212121212)
  const repeatedPairPattern = /^(\d{2})\1{4}$/;
  if (repeatedPairPattern.test(digitsOnly)) {
    return { isValid: false, message: "Pair of Numbers Not Allowed" };
  }

  return { isValid: true };
};

/**
 * Validates a password's strength and format.
 * - Minimum 8 characters
 * - No spaces
 * - At least one uppercase letter, one lowercase letter, one number, and one special character
 *
 * @param {string} password - Password to validate
 * @returns {{isValid: boolean, message?: string}} Validation result
 */
const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: "Password is required" };
  }
  if (/\s/.test(password)) {
    return { isValid: false, message: "Password should not contain spaces" };
  }
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters" };
  }

  // Password pattern: uppercase, lowercase, number, special character
  const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordPattern.test(password)) {
    return {
      isValid: false,
      message: "Password must contain 8 characters, uppercase, lowercase, number and special character",
    };
  }

  return { isValid: true };
};

module.exports = {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
};
