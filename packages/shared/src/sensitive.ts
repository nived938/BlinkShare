export interface SensitiveDetectionResult {
  hasSensitiveContent: boolean;
  matches: string[];
}

const SENSITIVE_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'Private Key', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'AWS Access Key', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: 'AWS Secret Key', regex: /aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{40}/i },
  { name: 'GitHub Token', regex: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}/ },
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z\\-_]{35}/ },
  { name: 'OpenAI / Claude API Key', regex: /(?:sk-[a-zA-Z0-9]{20,}|sk-ant-[a-zA-Z0-9]{20,})/ },
  { name: 'JWT Token', regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]+/ },
  { name: 'Database Connection String', regex: /(?:postgres|postgresql|mysql|mongodb|redis):\/\/[^\s:]+:[^\s@]+@[^\s/]+/ },
  { name: 'Slack Bot Token', regex: /xoxb-[0-9]{10,13}[a-zA-Z0-9-]+/ },
  { name: 'Stripe API Key', regex: /(?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,99}/ },
  { name: 'Password in config', regex: /(?:password|passwd|pwd|secret)\s*[:=]\s*['"][^\s'"]{6,}['"]/i },
];

export function detectSensitiveContent(text: string): SensitiveDetectionResult {
  if (!text || text.length < 10) {
    return { hasSensitiveContent: false, matches: [] };
  }

  const matches: string[] = [];
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.regex.test(text)) {
      matches.push(pattern.name);
    }
  }

  return {
    hasSensitiveContent: matches.length > 0,
    matches,
  };
}
