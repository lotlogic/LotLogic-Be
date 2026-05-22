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

export type LotCheckPathwayCardStatus =
  | 'possible'
  | 'review'
  | 'not_available';

export type LotCheckPathwayCard = {
  zone: string;
  pathwayKey: string;
  title: string;
  technicalLabel: string;
  status: LotCheckPathwayCardStatus;
  body: string;
  source: string;
  notes: string;
  logicNotes: string;
  maxGfaSqm: number | null;
  alternativePathwayKey: string | null;
  alternativeMinBlockSqm: number | null;
};

type RawCsvRow = Record<string, string>;

type PathwayContentRow = {
  zone: string;
  pathwayKey: string;
  title: string;
  technicalLabel: string;
  possibleCopy: string;
  reviewCopy: string;
  notAvailableCopy: string;
  source: string;
  notes: string;
  sortIndex: number;
};

type PathwayLogicRow = {
  zone: string;
  pathwayKey: string;
  alwaysStatus: LotCheckPathwayCardStatus | null;
  greenMinBlockSqm: number | null;
  amberMinBlockSqm: number | null;
  maxGfaSqm: number | null;
  alternativePathwayKey: string | null;
  alternativeMinBlockSqm: number | null;
  logicNotes: string;
};

@Injectable()
export class LotCheckRulesService {
  private readonly logger = new Logger(LotCheckRulesService.name);
  private legacyRulesCache: RawCsvRow[] | null = null;
  private pathwayContentCache: PathwayContentRow[] | null = null;
  private pathwayLogicCache: PathwayLogicRow[] | null = null;

  private getCsvPathCandidates(
    configuredPath: string | undefined,
    defaultFilename: string,
  ): string[] {
    const configured = configuredPath?.trim();
    const defaultPath = path.join(
      process.cwd(),
      'data',
      defaultFilename,
    );

    if (!configured) return [defaultPath];

    const resolved = path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);

    if (resolved === defaultPath) return [defaultPath];
    return [resolved, defaultPath];
  }

  private loadCsv(candidates: string[], label: string): RawCsvRow[] {
    let csvPath: string | null = null;

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        csvPath = candidate;
        break;
      }
    }

    if (!csvPath) {
      this.logger.warn(
        `${label} CSV not found at ${candidates.join(' or ')}; returning no rows`,
      );
      return [];
    }

    if (candidates.length > 1 && csvPath !== candidates[0]) {
      this.logger.warn(`${label} CSV not found at ${candidates[0]}; using ${csvPath}`);
    }

    const csv = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csv, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      trim: true,
    }) as RawCsvRow[];

    this.logger.log(`Loaded ${records.length} ${label.toLowerCase()} rows from ${csvPath}`);
    return records;
  }

  private getLegacyRulesCsvPathCandidates(): string[] {
    return this.getCsvPathCandidates(
      process.env.LOT_CHECK_RULES_CSV_PATH,
      '2. LotCheck - Reference Data - Rules v3.csv',
    );
  }

  private getPathwayContentCsvPathCandidates(): string[] {
    return this.getCsvPathCandidates(
      process.env.LOT_CHECK_PATHWAY_CONTENT_CSV_PATH,
      '2. LotCheck - Reference Data - Pathway Content v1.csv',
    );
  }

  private getPathwayLogicCsvPathCandidates(): string[] {
    return this.getCsvPathCandidates(
      process.env.LOT_CHECK_PATHWAY_LOGIC_CSV_PATH,
      '2. LotCheck - Reference Data - Pathway Logic v1.csv',
    );
  }

  private loadLegacyRules(): RawCsvRow[] {
    if (this.legacyRulesCache) return this.legacyRulesCache;
    this.legacyRulesCache = this.loadCsv(
      this.getLegacyRulesCsvPathCandidates(),
      'Legacy rules',
    );
    return this.legacyRulesCache;
  }

  private normalizeZoneCode(value: string | null | undefined): string {
    return (value ?? '').trim().toUpperCase();
  }

  private normalizePathwayKey(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }

  private normalizeCopyText(value: string | null | undefined): string {
    return (value ?? '')
      .replace(/\r\n?/g, '\n')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .replace(/[ \t]{2,}/g, ' ');
  }

  private parseNullableNumber(raw: string | null | undefined): number | null {
    const normalized = (raw ?? '').trim();
    if (!normalized) return null;

    const value = Number(normalized.replace(/,/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  private parsePathwayCardStatus(
    value: string | null | undefined,
  ): LotCheckPathwayCardStatus | null {
    const normalized = (value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

    if (!normalized) return null;
    if (normalized === 'possible') return 'possible';
    if (normalized === 'review' || normalized === 'needs_review') return 'review';
    if (
      normalized === 'not_available' ||
      normalized === 'unavailable' ||
      normalized === 'notavailable'
    ) {
      return 'not_available';
    }

    return null;
  }

  private loadPathwayContentRows(): PathwayContentRow[] {
    if (this.pathwayContentCache) return this.pathwayContentCache;

    const records = this.loadCsv(
      this.getPathwayContentCsvPathCandidates(),
      'Pathway content',
    );

    this.pathwayContentCache = records.map((row, index) => ({
      zone: this.normalizeZoneCode(row['Zone']),
      pathwayKey: this.normalizePathwayKey(row['Pathway key']),
      title: (row['Card title'] ?? '').trim(),
      technicalLabel: (row['Technical label'] ?? '').trim(),
      possibleCopy: this.normalizeCopyText(row['Possible copy']),
      reviewCopy: this.normalizeCopyText(row['Review copy']),
      notAvailableCopy: this.normalizeCopyText(row['Not available copy']),
      source: (row['Source'] ?? '').trim(),
      notes: (row['Notes'] ?? '').trim(),
      sortIndex: index,
    }));

    return this.pathwayContentCache;
  }

  private loadPathwayLogicRows(): PathwayLogicRow[] {
    if (this.pathwayLogicCache) return this.pathwayLogicCache;

    const records = this.loadCsv(
      this.getPathwayLogicCsvPathCandidates(),
      'Pathway logic',
    );

    this.pathwayLogicCache = records.map((row) => ({
      zone: this.normalizeZoneCode(row['Zone']),
      pathwayKey: this.normalizePathwayKey(row['Pathway key']),
      alwaysStatus: this.parsePathwayCardStatus(row['Always status']),
      greenMinBlockSqm: this.parseNullableNumber(row['Green min block m2']),
      amberMinBlockSqm: this.parseNullableNumber(row['Amber min block m2']),
      maxGfaSqm: this.parseNullableNumber(row['Max gfa m2']),
      alternativePathwayKey: this.normalizePathwayKey(
        row['Alternative pathway key'],
      ) || null,
      alternativeMinBlockSqm: this.parseNullableNumber(
        row['Alternative min block m2'],
      ),
      logicNotes: (row['Logic notes'] ?? '').trim(),
    }));

    return this.pathwayLogicCache;
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
    const normalizedZone = this.normalizeZoneCode(zoneCode);
    if (!normalizedZone) return [];

    const rules = this.loadLegacyRules();
    const zoneRules = rules.filter(
      (r) => this.normalizeZoneCode(r['Zone']) === normalizedZone,
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

  private resolvePathwayStatus(
    logic: PathwayLogicRow | null,
    blockAreaSqm: number | null,
  ): LotCheckPathwayCardStatus {
    if (logic?.alwaysStatus) return logic.alwaysStatus;

    const greenMinBlockSqm = logic?.greenMinBlockSqm ?? null;
    const amberMinBlockSqm = logic?.amberMinBlockSqm ?? null;

    if (blockAreaSqm !== null) {
      if (greenMinBlockSqm !== null && blockAreaSqm >= greenMinBlockSqm) {
        return 'possible';
      }

      if (amberMinBlockSqm !== null && blockAreaSqm >= amberMinBlockSqm) {
        return 'review';
      }

      if (greenMinBlockSqm !== null || amberMinBlockSqm !== null) {
        return 'not_available';
      }
    }

    return 'review';
  }

  private interpolateCardCopy(
    copy: string,
    blockAreaSqm: number | null,
  ): string {
    if (!copy || blockAreaSqm === null) return copy;

    return copy.replace(
      /\[block_size\]/gi,
      blockAreaSqm.toLocaleString('en-AU'),
    );
  }

  private selectCardBody(
    content: PathwayContentRow,
    status: LotCheckPathwayCardStatus,
    blockAreaSqm: number | null,
  ): string {
    const rawBody =
      status === 'possible'
        ? content.possibleCopy || content.reviewCopy || content.notAvailableCopy
        : status === 'review'
          ? content.reviewCopy ||
            content.possibleCopy ||
            content.notAvailableCopy
          : content.notAvailableCopy ||
            content.reviewCopy ||
            content.possibleCopy;

    return this.interpolateCardCopy(rawBody, blockAreaSqm);
  }

  getPathwayCardsForZone(params: {
    zoneCode: string;
    blockAreaSqm: number | null;
  }): LotCheckPathwayCard[] {
    const { zoneCode, blockAreaSqm } = params;
    const normalizedZone = this.normalizeZoneCode(zoneCode);
    if (!normalizedZone) return [];

    const contentRows = this.loadPathwayContentRows().filter(
      (row) => row.zone === normalizedZone,
    );
    if (!contentRows.length) return [];

    const logicByKey = new Map(
      this.loadPathwayLogicRows()
        .filter((row) => row.zone === normalizedZone)
        .map((row) => [`${row.zone}|${row.pathwayKey}`, row]),
    );

    return contentRows
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map((content) => {
        const lookupKey = `${content.zone}|${content.pathwayKey}`;
        const logic = logicByKey.get(lookupKey) ?? null;
        if (!logic) {
          this.logger.warn(
            `Missing pathway logic row for ${content.zone} / ${content.pathwayKey}`,
          );
        }

        const status = this.resolvePathwayStatus(logic, blockAreaSqm);

        return {
          zone: content.zone,
          pathwayKey: content.pathwayKey,
          title: content.title,
          technicalLabel: content.technicalLabel,
          status,
          body: this.selectCardBody(content, status, blockAreaSqm),
          source: content.source,
          notes: content.notes,
          logicNotes: logic?.logicNotes ?? '',
          maxGfaSqm: logic?.maxGfaSqm ?? null,
          alternativePathwayKey: logic?.alternativePathwayKey ?? null,
          alternativeMinBlockSqm: logic?.alternativeMinBlockSqm ?? null,
        };
      });
  }
}
