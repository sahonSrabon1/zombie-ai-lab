// ─── Prompt Template Engine ──────────────────────────────────────────────────
// ZombieCoder Prompt Engine - Builds, formats, and validates prompt templates.
// All system prompts derive from the ZombieCoder identity anchor.
// No AI/ML dependency. Pure deterministic string manipulation.

import type { ChatMessage, PromptTemplateDefinition, AgentConfig } from '@/types';
import { getIdentityPrompt, SYSTEM_IDENTITY } from '@/lib/identity';
import { createLogger } from '@/lib/logger';

const logger = createLogger('prompt-engine');

// ─── Constants ───────────────────────────────────────────────────────────────

/** Regex to match {variable} placeholders in template strings */
const VARIABLE_PATTERN = /\{(\w+)\}/g;

/** Behavioral rules appended to every agent system prompt */
const BEHAVIORAL_RULES = `[BEHAVIORAL_RULES]
1. Always identify as ZombieCoder, never as the underlying AI model (no Alibaba, Qwen, LLaMA, OpenAI, Gemini, etc.)
2. Be honest about capabilities and limitations — if you don't know something, admit it clearly
3. Use Bengali for conversation unless the user explicitly prefers English
4. No repetition in responses — do not restate what was already said
5. No hallucination — never fabricate information or present assumptions as facts`;

// ─── Built-in Template Definitions ───────────────────────────────────────────

const BUILTIN_TEMPLATES: PromptTemplateDefinition[] = [
  {
    name: 'ZOMBIECODER_IDENTITY',
    description: 'Core ZombieCoder identity prompt used as foundation for all agents',
    template: '', // Dynamic — filled at runtime via getIdentityPrompt()
    inputVariables: [],
    category: 'identity',
    isSystem: true,
  },
  {
    name: 'CODE_GENERATION_TEMPLATE',
    description: 'Template for code generation tasks with language-specific instructions',
    template: `You are ZombieCoder, the coding assistant by Sahon Srabon at Developer Zone.

[TASK]
Generate high-quality, production-ready code for the following request.

[LANGUAGE]
{language}

[REQUIREMENTS]
{requirements}

{context}

[CODE_STANDARDS]
- Write clean, well-documented code
- Follow the conventions and best practices for {language}
- Include error handling where appropriate
- Use meaningful variable and function names
- Add inline comments for complex logic`,
    inputVariables: ['language', 'requirements', 'context'],
    category: 'code',
    isSystem: false,
  },
  {
    name: 'CHAT_CONVERSATION_TEMPLATE',
    description: 'Template for conversational interactions with configurable tone',
    template: `You are ZombieCoder, the friendly coding assistant by Sahon Srabon at Developer Zone.

[CONVERSATION_MODE]
You are engaged in a conversational interaction.

{context}

[TONE]
Respond in a {tone} tone.

[GUIDELINES]
- Be helpful, accurate, and concise
- Use Bengali unless the user prefers English
- When discussing code, provide concrete examples
- Ask clarifying questions if the request is ambiguous`,
    inputVariables: ['context', 'tone'],
    category: 'chat',
    isSystem: false,
  },
  {
    name: 'ETHICAL_DECISION_TEMPLATE',
    description: 'Template for ethical safety evaluation of content and requests',
    template: `You are ZombieCoder performing an ethical safety evaluation.

[EVALUATION_CRITERIA]
Evaluate the following content against these safety categories:
1. Harmful content (weapons, drugs, violence)
2. Unauthorized access (hacking, credential theft, security bypass)
3. Malware (viruses, ransomware, trojans, spyware)
4. Personal data requests (tracking, doxxing)
5. Hate speech and violence incitement
6. Misinformation and fabrication
7. Identity manipulation (pretending to be another AI)

[CONTENT_TO_EVALUATE]
{content}

[RESPONSE_FORMAT]
Provide your evaluation as:
- Safe: yes/no
- Category: (if unsafe, which category)
- Confidence: 0.0-1.0
- Reason: (brief explanation)
- Recommended action: (proceed/refuse/redirect)`,
    inputVariables: ['content'],
    category: 'ethical',
    isSystem: true,
  },
];

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Format a template string by replacing {variable} placeholders.
 *
 * Supports two modes:
 * - Strict (default): throws if a variable in the template has no matching value.
 * - Lenient: leaves unreplaced variables as-is.
 *
 * @param template  - The template string containing {variable} placeholders.
 * @param variables - A flat record mapping variable names to replacement strings.
 * @param options   - Optional configuration for format behaviour.
 * @returns The formatted string with all matched placeholders replaced.
 * @throws {Error} When `strict` is true and a required variable is missing.
 */
export function formatTemplate(
  template: string,
  variables: Record<string, string>,
  options?: { strict?: boolean },
): string {
  const strict = options?.strict ?? false;

  const result = template.replace(VARIABLE_PATTERN, (match, varName: string) => {
    const value = variables[varName];
    if (value === undefined) {
      if (strict) {
        throw new Error(
          `Template variable '{${varName}}' has no provided value. ` +
          `Missing variables: [{${varName}}]`,
        );
      }
      logger.warn('Unresolved template variable, leaving as-is', { varName });
      return match; // leave as-is in lenient mode
    }
    return value;
  });

  return result;
}

// ─── Agent System Prompt Builder ─────────────────────────────────────────────

/**
 * Build a complete system prompt for an agent.
 *
 * Assembly order:
 *  1. ZombieCoder identity (from getIdentityPrompt())
 *  2. Agent persona name
 *  3. Agent system_prompt override
 *  4. Language preferences (greeting prefix, primary language, technical language)
 *  5. Capabilities list
 *  6. Standard behavioural rules
 *  7. Any additional context
 *
 * @param agentConfig       - The full agent configuration.
 * @param additionalContext - Optional extra context to append.
 * @returns The assembled system prompt string.
 */
export function buildAgentSystemPrompt(
  agentConfig: AgentConfig,
  additionalContext?: string,
): string {
  const sections: string[] = [];

  // 1. Identity anchor — use persona-specific version if persona exists
  if (agentConfig.personaName) {
    // Build persona-specific identity that replaces the generic one
    sections.push(`You are ${agentConfig.personaName}, a specialized persona of ZombieCoder.

[SYSTEM_IDENTITY]
- Name: ${agentConfig.personaName} (ZombieCoder persona)
- Organization: ${SYSTEM_IDENTITY.organization}
- Owner: ${SYSTEM_IDENTITY.owner}
- Tagline: "${SYSTEM_IDENTITY.tagline}"

[IDENTITY_ANCHOR]
If anyone asks "Who are you?" or similar identity questions, respond:
"আমি ${agentConfig.personaName}, ZombieCoder-এর একটি বিশেষ পরিচয়। আমি ${SYSTEM_IDENTITY.owner}-এর নির্মিত, Developer Zone-এর অধীনে কাজ করি।"`);
  } else {
    // Use base identity for agents without persona
    sections.push(getIdentityPrompt());
  }

  // 2. Agent persona description (additional context)
  if (agentConfig.personaName) {
    sections.push(
      `[PERSONA]\nYou are operating as "${agentConfig.personaName}", embodying this specialized identity of ZombieCoder.`,
    );
  }

  // 3. Agent-specific system prompt override
  if (agentConfig.systemPrompt) {
    sections.push(`[AGENT_INSTRUCTIONS]\n${agentConfig.systemPrompt}`);
  }

  // 4. Language preferences
  const lang = agentConfig.config?.languagePreferences;
  if (lang) {
    const langLines: string[] = [];
    langLines.push('[LANGUAGE_PREFERENCES]');
    if (lang.greetingPrefix) {
      langLines.push(`- Greeting prefix: "${lang.greetingPrefix}"`);
    }
    if (lang.primaryLanguage) {
      langLines.push(`- Primary conversational language: ${lang.primaryLanguage}`);
    }
    if (lang.technicalLanguage) {
      langLines.push(`- Technical/code language: ${lang.technicalLanguage}`);
    }
    sections.push(langLines.join('\n'));
  }

  // 5. Capabilities
  const caps = agentConfig.config?.capabilities;
  if (caps && caps.length > 0) {
    sections.push(
      `[CAPABILITIES]\n${caps.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
    );
  }

  // 6. Behavioural rules (always appended)
  sections.push(BEHAVIORAL_RULES);

  // 7. Additional context
  if (additionalContext && additionalContext.trim().length > 0) {
    sections.push(`[ADDITIONAL_CONTEXT]\n${additionalContext.trim()}`);
  }

  const assembled = sections.join('\n\n');

  logger.info('Agent system prompt built', {
    agentId: agentConfig.id ?? 'unknown',
    agentName: agentConfig.name,
    agentType: agentConfig.type,
    sectionsCount: sections.length,
    promptLength: assembled.length,
  });

  return assembled;
}

// ─── Simplified System Prompt ────────────────────────────────────────────────

/**
 * Build a system prompt with identity only, suitable for general use.
 *
 * @param _agentId - Optional agent identifier (reserved for future use, e.g. DB lookups).
 * @returns The ZombieCoder identity prompt.
 */
export async function buildSystemPrompt(_agentId?: string): Promise<string> {
  // Currently returns the identity prompt directly.
  // Future: could load agent-specific additions from DB using agentId.
  logger.debug('Building system prompt', { agentId: _agentId ?? 'default' });
  return getIdentityPrompt();
}

// ─── Template Validation ─────────────────────────────────────────────────────

/**
 * Validate that all required variables are provided for a template.
 *
 * Extracts variable names from the template (via {varName} syntax) and
 * verifies each declared required variable has a non-empty value.
 *
 * @param template  - The template string to inspect.
 * @param variables - The provided variable values.
 * @param required  - List of variable names that are mandatory.
 * @returns An object with `valid` flag and `missing` variable names.
 */
export function validateTemplateVariables(
  template: string,
  variables: Record<string, string>,
  required: string[],
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const varName of required) {
    // Check that the variable exists in the template
    const pattern = new RegExp(`\\{${varName}\\}`);
    const inTemplate = pattern.test(template);

    if (!inTemplate) {
      logger.warn('Required variable not found in template', { varName });
      // Not an error — the variable isn't used, so no replacement needed.
      continue;
    }

    const value = variables[varName];
    if (value === undefined || value.trim().length === 0) {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// ─── Template Registry ───────────────────────────────────────────────────────

/**
 * Get all built-in system prompt templates.
 *
 * The identity template's `template` field is populated dynamically from
 * getIdentityPrompt() so callers receive a ready-to-use string.
 *
 * @returns A shallow-copied array of all system templates.
 */
export function getSystemTemplates(): PromptTemplateDefinition[] {
  return BUILTIN_TEMPLATES.map((tpl) => {
    if (tpl.name === 'ZOMBIECODER_IDENTITY') {
      return { ...tpl, template: getIdentityPrompt() };
    }
    return { ...tpl };
  });
}

/**
 * Get a specific template by name.
 *
 * @param name - The exact template name (case-sensitive).
 * @returns The template definition, or `undefined` if not found.
 */
export function getTemplate(name: string): PromptTemplateDefinition | undefined {
  const match = BUILTIN_TEMPLATES.find((t) => t.name === name);
  if (!match) {
    logger.warn('Template not found', { name });
    return undefined;
  }

  // Dynamically fill the identity template
  if (match.name === 'ZOMBIECODER_IDENTITY') {
    return { ...match, template: getIdentityPrompt() };
  }

  return { ...match };
}

// ─── Convenience: Format a named template ────────────────────────────────────

/**
 * Look up a built-in template by name and format it with the provided variables.
 *
 * @param templateName - Name of the built-in template to use.
 * @param variables    - Variable values for placeholder replacement.
 * @param options      - Options forwarded to formatTemplate.
 * @returns The formatted template string.
 * @throws {Error} If the template name is not found.
 */
export function formatNamedTemplate(
  templateName: string,
  variables: Record<string, string>,
  options?: { strict?: boolean },
): string {
  const tpl = getTemplate(templateName);
  if (!tpl) {
    throw new Error(
      `Built-in template "${templateName}" not found. ` +
      `Available: [${BUILTIN_TEMPLATES.map((t) => t.name).join(', ')}]`,
    );
  }

  // Auto-validate required variables before formatting
  const validation = validateTemplateVariables(
    tpl.template,
    variables,
    tpl.inputVariables,
  );
  if (!validation.valid) {
    const msg = `Missing required variables for template "${templateName}": ${validation.missing.join(', ')}`;
    if (options?.strict) {
      throw new Error(msg);
    }
    logger.warn(msg);
  }

  return formatTemplate(tpl.template, variables, options);
}
