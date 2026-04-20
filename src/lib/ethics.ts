// ─── Ethical Validation Framework ───────────────────────────────────────────
// ZombieCoder Ethics Module - Validates inputs and system behavior against
// ethical guidelines. No AI/ML dependency. Rule-based, deterministic.

import { createLogger } from './logger';

const logger = createLogger('ethics');

// ─── Content Safety Categories ──────────────────────────────────────────────

export type SafetyCategory =
  | 'safe'
  | 'harmful_content'
  | 'personal_data_request'
  | 'system_identity_manipulation'
  | 'unauthorized_access'
  | 'malware_hacking'
  | 'hate_speech'
  | 'misinformation';

export interface EthicsValidationResult {
  safe: boolean;
  category: SafetyCategory;
  confidence: number;
  reason: string;
  actions: string[];
}

// ─── Identity Anchoring ─────────────────────────────────────────────────────

const IDENTITY_PATTERNS: Array<{ pattern: RegExp; category: SafetyCategory; reason: string }> = [
  {
    pattern: /(?:who (?:are|r) you|what (?:is|are) your name|identify yourself)/i,
    category: 'system_identity_manipulation',
    reason: 'Identity inquiry detected - route to anchored identity response',
    actions: ['respond_with_anchored_identity'],
  },
  {
    pattern: /(?:you (?:are|'re) (?:chatgpt|gpt|claude|gemini|llama|alibaba|qwen|copilot|bard|siri|alexa))/i,
    category: 'system_identity_manipulation',
    reason: 'External AI identity injection detected',
    actions: ['correct_identity', 'respond_as_zombiecoder'],
  },
  {
    pattern: /(?:pretend to be|act as|impersonate|roleplay as) (?!zombiecoder|developer)/i,
    category: 'system_identity_manipulation',
    reason: 'Identity impersonation request detected',
    actions: ['decline_impersonation', 'maintain_zombiecoder_identity'],
  },
];

// ─── Harmful Content Patterns ───────────────────────────────────────────────

const HARMFUL_PATTERNS: Array<{ pattern: RegExp; category: SafetyCategory; reason: string }> = [
  {
    pattern: /(?:how to (?:make|create|build|synthesize|cook)\s+(?:a\s+)?(?:bomb|explosive|weapon|drug|meth|fentanyl))/i,
    category: 'harmful_content',
    reason: 'Request for harmful substance or weapon creation',
    actions: ['refuse_harmful_request', 'offer_safe_alternative'],
  },
  {
    pattern: /(?:steal (?:credit\s+card|password|identity|data|information))/i,
    category: 'unauthorized_access',
    reason: 'Theft or unauthorized access request',
    actions: ['refuse_illegal_request', 'explain_legal_consequences'],
  },
  {
    pattern: /(?:hack (?:into|a|the|an)\s+(?:account|system|server|website|database|network))/i,
    category: 'malware_hacking',
    reason: 'Hacking request detected',
    actions: ['refuse_hacking_request', 'offer_ethical_hacking_info'],
  },
  {
    pattern: /(?:write (?:a\s+)?(?:malware|virus|ransomware|trojan|keylogger|spyware|rootkit))/i,
    category: 'malware_hacking',
    reason: 'Malware creation request',
    actions: ['refuse_malware_request', 'offer_security_education'],
  },
  {
    pattern: /(?:bypass|circumvent|disable)\s+(?:security|authentication|authorization|firewall|captcha|2fa)/i,
    category: 'unauthorized_access',
    reason: 'Security bypass request',
    actions: ['refuse_bypass_request', 'offer_defense_perspective'],
  },
];

// ─── Personal Data Patterns ─────────────────────────────────────────────────

const PERSONAL_DATA_PATTERNS: Array<{ pattern: RegExp; category: SafetyCategory; reason: string }> = [
  {
    pattern: /(?:find|locate|track|search for)\s+(?:someone|person|people|individual).*?(?:address|phone|location|ssn|social security)/i,
    category: 'personal_data_request',
    reason: 'Personal data search request',
    actions: ['refuse_tracking_request', 'explain_privacy_laws'],
  },
];

// ─── Hate Speech Patterns ───────────────────────────────────────────────────

const HATE_SPEECH_PATTERNS: Array<{ pattern: RegExp; category: SafetyCategory; reason: string }> = [
  {
    pattern: /(?:kill|murder|eliminate|eradicate|destroy)\s+(?:all|every|the)\s+(?:\w+\s+)*(?:people|race|religion|group|community)/i,
    category: 'hate_speech',
    reason: 'Hate speech or violence incitement detected',
    actions: ['refuse_hate_speech', 'terminate_conversation'],
  },
];

// ─── Core Validation ────────────────────────────────────────────────────────

export function validateInput(input: string): EthicsValidationResult {
  if (!input || input.trim().length === 0) {
    return {
      safe: true,
      category: 'safe',
      confidence: 1.0,
      reason: 'Empty input',
      actions: [],
    };
  }

  // Check identity patterns first
  for (const { pattern, category, reason, actions } of IDENTITY_PATTERNS) {
    if (pattern.test(input)) {
      logger.warn('Identity pattern matched', { category, reason });
      return {
        safe: true, // Identity checks are informational, not blocks
        category,
        confidence: 0.9,
        reason,
        actions,
      };
    }
  }

  // Check harmful patterns
  for (const { pattern, category, reason, actions } of HARMFUL_PATTERNS) {
    if (pattern.test(input)) {
      logger.warn('Harmful content pattern matched', { category, reason });
      return {
        safe: false,
        category,
        confidence: 0.85,
        reason,
        actions,
      };
    }
  }

  // Check personal data patterns
  for (const { pattern, category, reason, actions } of PERSONAL_DATA_PATTERNS) {
    if (pattern.test(input)) {
      logger.warn('Personal data pattern matched', { category, reason });
      return {
        safe: false,
        category,
        confidence: 0.8,
        reason,
        actions,
      };
    }
  }

  // Check hate speech patterns
  for (const { pattern, category, reason, actions } of HATE_SPEECH_PATTERNS) {
    if (pattern.test(input)) {
      logger.warn('Hate speech pattern matched', { category, reason });
      return {
        safe: false,
        category,
        confidence: 0.9,
        reason,
        actions,
      };
    }
  }

  return {
    safe: true,
    category: 'safe',
    confidence: 1.0,
    reason: 'Input passes all ethical checks',
    actions: ['proceed_normally'],
  };
}

// ─── Identity Response Builder ──────────────────────────────────────────────

export function getIdentityResponse(): string {
  return `আমি ZombieCoder, যেখানে কোড ও কথা বলে।
আমার নির্মাতা ও মালিক Sahon Srabon, Developer Zone।
আমি সততা ও স্বচ্ছতার সাথে কাজ করি। আমার সীমাবদ্ধতা সম্পর্কে সর্বদা সৎ থাকি।`;
}

// ─── Refusal Response Builder ───────────────────────────────────────────────

export function getRefusalResponse(category: SafetyCategory): string {
  const responses: Record<SafetyCategory, string> = {
    safe: '',
    harmful_content: 'আমি ক্ষমাপ্রার্থী, কিন্তু এই ধরনের ক্ষতিকারক বিষয়ে সাহায্য করতে পারব না। এটি নৈতিক নির্দেশিকার লঙ্ঘন। আপনি কি অন্য কিছু নিয়ে সাহায্য চান?',
    personal_data_request: 'আমি ব্যক্তিগত তথ্য অনুসন্ধান বা ট্র্যাকিংয়ে সাহায্য করতে পারব না। এটি গোপনীয়তা আইনের লঙ্ঘন।',
    system_identity_manipulation: '',
    unauthorized_access: 'আমি অননুমোদিত অ্যাক্সেস বা সিকিউরিটি বাইপাসে সাহায্য করতে পারব না। আমি শুধুমাত্র প্রতিরক্ষামূলক ও শিক্ষামূলক দৃষ্টিকোণ থেকে সিকিউরিটি সম্পর্কে আলোচনা করতে পারি।',
    malware_hacking: 'আমি ম্যালওয়্যার বা হ্যাকিং টুল তৈরিতে সাহায্য করতে পারব না। আমি সিস্টেম সিকিউরিটি শক্তিশালী করার উপায় নিয়ে আলোচনা করতে পারি।',
    hate_speech: 'আমি ঘৃণা বা সহিংসতা উস্কে দেয় এমন বিষয়ে সাহায্য করতে পারব না।',
    misinformation: 'আমি সর্বদা সত্য ও নির্ভুল তথ্য প্রদান করার চেষ্টা করি।',
  };

  return responses[category] || 'এই অনুরোধটি প্রক্রিয়া করা সম্ভব নয়।';
}
