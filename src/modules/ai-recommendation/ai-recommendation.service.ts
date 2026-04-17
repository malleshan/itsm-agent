import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/** Deterministic fallback: role → tools (covers all 9 SaaS services) */
const ROLE_TOOLS: Record<string, string[]> = {
  developer: ['github', 'slack', 'jira'],
  hr: ['slack', 'google', 'microsoft365'],
  testing: ['jira', 'slack', 'zoom'],
  it: ['github', 'slack', 'google', 'servicenow'],
  cybersecurity: ['github', 'jira', 'servicenow'],
  salesforce: ['salesforce', 'slack'],
  manager: ['slack', 'microsoft365', 'zoom'],
  finance: ['sap', 'slack'],
  engineering_lead: ['github', 'slack', 'jira', 'zoom'],
  devops: ['github', 'slack', 'servicenow'],
  support: ['slack', 'servicenow', 'jira'],
  marketing: ['slack', 'microsoft365', 'salesforce'],
  default: ['slack'],
};

export const ALL_TOOLS = [
  'github', 'slack', 'google', 'microsoft365',
  'jira', 'zoom', 'servicenow', 'sap', 'salesforce',
];

@Injectable()
export class AiRecommendationService {
  private readonly logger = new Logger(AiRecommendationService.name);
  private openai: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('openai.apiKey');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI GPT-4o-mini ready for tool recommendations');
    } else {
      this.logger.warn('OPENAI_API_KEY not set — using deterministic role-based fallback');
    }
  }

  /**
   * Returns the list of tools to provision for an employee.
   * 1. Calls GPT-4o-mini if API key is configured.
   * 2. Falls back to deterministic ROLE_TOOLS map.
   * 3. Intersects with enabledTools (tenant whitelist).
   */
  async recommendTools(params: {
    role: string;
    department?: string;
    firstName?: string;
    enabledTools?: string[];
  }): Promise<string[]> {
    const { role, department, firstName, enabledTools = ALL_TOOLS } = params;

    let recommended: string[] = [];

    if (this.openai) {
      try {
        recommended = await this.callOpenAI({ role, department, enabledTools });
        this.logger.log(`AI recommended [${recommended.join(', ')}] for ${firstName ?? role}`);
      } catch (err: any) {
        this.logger.warn(`OpenAI failed (${err.message}) — falling back to rule-based`);
        recommended = this.deterministicTools(role, enabledTools);
      }
    } else {
      recommended = this.deterministicTools(role, enabledTools);
    }

    // Always intersect with tenant-enabled tools
    return recommended.filter((t) => enabledTools.includes(t));
  }

  /** Deterministic fallback — pure role lookup. */
  deterministicTools(role: string, enabledTools: string[] = ALL_TOOLS): string[] {
    const tools = ROLE_TOOLS[role.toLowerCase()] ?? ROLE_TOOLS.default;
    return tools.filter((t) => enabledTools.includes(t));
  }

  private async callOpenAI(params: {
    role: string;
    department?: string;
    enabledTools: string[];
  }): Promise<string[]> {
    const { role, department, enabledTools } = params;

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are an IT provisioning expert. Given an employee's role and department, return a JSON array of tool names to provision. Only pick from the available tools list. Return ONLY a valid JSON array, no explanation.`,
        },
        {
          role: 'user',
          content: `Employee role: "${role}"\nDepartment: "${department ?? 'Unknown'}"\nAvailable tools: ${JSON.stringify(enabledTools)}\n\nWhich tools should be provisioned?`,
        },
      ],
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content?.trim() ?? '[]';
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed)) return this.deterministicTools(role, enabledTools);

    // Validate: only return tools that exist in the available list
    return (parsed as string[]).filter((t) => enabledTools.includes(t));
  }
}
