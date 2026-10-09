const RULES = {
  name: {
    pattern: /^[A-Za-z]+(?: [A-Za-z]+)*$/,
    message: "Use letters and single spaces between names.",
  },
  password: {
    pattern: /^(?=.*[A-Za-z])(?=.*[0-9]).+$/,
    message: "Include at least one letter and one number.",
  },
  mobile: {
    pattern: /^[0-9]{10}$/,
    message: "Enter exactly 10 digits.",
  },
  username: {
    pattern:
      /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]*[^A-Za-z0-9\s][A-Za-z0-9]*$/,
    message:
      "Include letters, numbers and exactly one special character; no spaces.",
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Enter a valid email address.",
  },
};

export function validate(fieldName, value) {
  if (!value.trim()) {
    return "This field is required.";
  }

  const rule = RULES[fieldName];
  return !rule || rule.pattern.test(value) ? "" : rule.message;
}
