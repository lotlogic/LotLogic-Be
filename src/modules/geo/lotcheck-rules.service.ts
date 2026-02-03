import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

type RuleValue =
  | {
      kind: 'numeric';
      raw: string;
      operator: NumericOperator;
      value: number;
    }
  | { kind: 'boolean'; raw: string; value: boolean }
  | { kind: 'text'; raw: string };

type NumericOperator = '>=' | '<=' | '>' | '<' | '=';

export type LotCheckRuleMatch = {
  zone: string;
  pathway: string;
  parameter: string;
  units: string;
  confidence: string;
  sourceCitation: string;
  notes: string;
  explanation: string;
  explanationResolved: string;
  current: RuleValue;
  draft: RuleValue;
  evaluation: {
    currentMeetsRule: boolean | null;
    draftMeetsRule: boolean | null;
  };
};

type RawCsvRow = Record<string, string>;

@Injectable()
export class LotCheckRulesService {
  private readonly logger = new Logger(LotCheckRulesService.name);
  private rulesCache: RawCsvRow[] | null = null;

  private getCsvPathCandidates(): string[] {
    const configured = process.env.LOT_CHECK_RULES_CSV_PATH?.trim();
    const defaultPath = path.join(
      process.cwd(),
      'data',
      '2. LotCheck - Reference Data - Rules v3.csv',
    );

    if (!configured) return [defaultPath];

    const resolved = path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);

    if (resolved === defaultPath) return [defaultPath];
    return [resolved, defaultPath];
  }

  private loadRules(): RawCsvRow[] {
    if (this.rulesCache) return this.rulesCache;

    const candidates = this.getCsvPathCandidates();
    let csvPath: string | null = null;

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        csvPath = candidate;
        break;
      }
    }

    if (!csvPath) {
      this.logger.warn(`Rules CSV not found at ${candidates.join(' or ')}; returning no rules`);
      this.rulesCache = [];
      return this.rulesCache;
    }

    if (candidates.length > 1 && csvPath !== candidates[0]) {
      this.logger.warn(`Rules CSV not found at ${candidates[0]}; using ${csvPath}`);
    }

    const csv = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      trim: true,
    }) as RawCsvRow[];

    this.rulesCache = records;
    this.logger.log(`Loaded ${records.length} rules from ${csvPath}`);
    return records;
  }

  private parseRuleValue(raw: string): RuleValue {
    const normalized = (raw ?? '').trim();
    if (!normalized) return { kind: 'text', raw: '' };

    const boolMatch = normalized.match(/^\s*"?\s*(true|false)\b/i);
    if (boolMatch) {
      return {
        kind: 'boolean',
        raw: normalized,
        value: boolMatch[1].toLowerCase() === 'true',
      };
    }

    const numericMatch = normalized.match(/^\s*(>=|<=|>|<|=)\s*([0-9]+(?:\.[0-9]+)?)/);
    if (numericMatch) {
      const operator = numericMatch[1] as NumericOperator;
      return {
        kind: 'numeric',
        raw: normalized,
        operator,
        value: Number(numericMatch[2]),
      };
    }

    return { kind: 'text', raw: normalized };
  }

  private compareNumeric(operator: NumericOperator, a: number, b: number): boolean {
    switch (operator) {
      case '>=':
        return a >= b;
      case '<=':
        return a <= b;
      case '>':
        return a > b;
      case '<':
        return a < b;
      case '=':
        return a === b;
      default:
        return false;
    }
  }

  private resolveExplanation(explanation: string, blockAreaSqm: number | null): string {
    if (blockAreaSqm === null) return explanation;
    return explanation.replace(/\bX\b(?=\s*(m²|m2|sqm)\b)/g, String(blockAreaSqm));
  }

  private normalizeExplanation(explanation: string, parameterKey: string): string {
    if (parameterKey !== 'allowed_boolean') return '';
    const normalized = (explanation ?? '').trim();
    if (!normalized) return '';
    if (/^(blank|n\/a|na|none)$/i.test(normalized)) return '';
    return normalized;
  }

  /**
   * Best-effort extraction when zoning layer is unavailable.
   * Example: "RZ1: SUBURBAN; NUZ3: ..." -> "RZ1"
   */
  extractZoneCodeFromBlockLandUsePolicyZones(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const first = value
      .split(/[\n;]+/)
      .map((s) => s.trim())
      .find(Boolean);
    if (!first) return null;
    const code = first.split(':')[0]?.trim();
    return code ? code.toUpperCase() : null;
  }

  getRulesForZone(params: {
    zoneCode: string;
    blockAreaSqm: number | null;
  }): LotCheckRuleMatch[] {
    const { zoneCode, blockAreaSqm } = params;
    const normalizedZone = zoneCode.trim().toUpperCase();
    if (!normalizedZone) return [];

    const rules = this.loadRules();
    const zoneRules = rules.filter(
      (r) => (r['Zone'] ?? '').trim().toUpperCase() === normalizedZone,
    );

    return zoneRules.map((row) => {
      const parameter = (row['Parameter'] ?? '').trim();
      const parameterKey = parameter.toLowerCase();
      const explanationRaw = row['User-Facing Explanation (Plain English for Reports)'] ?? '';
      const explanation = this.normalizeExplanation(explanationRaw, parameterKey);
      const explanationResolved = this.resolveExplanation(explanation, blockAreaSqm);

      const current = this.parseRuleValue(row['Current Value/Operator'] ?? '');
      const draft = this.parseRuleValue(row['Draft DPA-04 Value/Operator'] ?? '');

      const evaluate = (value: RuleValue): boolean | null => {
        if (parameterKey === 'min_block_area_m2' && value.kind === 'numeric' && blockAreaSqm !== null) {
          return this.compareNumeric(value.operator, blockAreaSqm, value.value);
        }
        if (parameterKey === 'allowed_boolean' && value.kind === 'boolean') {
          return value.value;
        }
        return null;
      };

      return {
        zone: (row['Zone'] ?? '').trim(),
        pathway: (row['Pathway'] ?? '').trim(),
        parameter,
        units: (row['Units'] ?? '').trim(),
        confidence: (row['Confidence'] ?? '').trim(),
        sourceCitation: (row['Source Citation'] ?? '').trim(),
        notes: (row['Notes/Disclaimers'] ?? '').trim(),
        explanation,
        explanationResolved,
        current,
        draft,
        evaluation: {
          currentMeetsRule: evaluate(current),
          draftMeetsRule: evaluate(draft),
        },
      };
    });
  }
}
