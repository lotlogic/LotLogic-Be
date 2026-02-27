import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as proj4 from 'proj4';
import { calculateDistance, calculateArea, getWidthHeight } from '@/helper/turf';

interface ImportDxfOptions {
  zoning?: string;
  lotType?: string | null;
  blockKeyPrefix?: string;
  blockNumber?: number | null;
  sectionNumber?: number | null;
  address?: string | null;
  district?: string | null;
  division?: string | null;
  lifecycleStage?: string | null;
  layer?: string;
  minArea?: number;
  dropLargest?: boolean;
  sourceSrid?: number;
  targetSrid?: number;
}

interface ParsedPolyline {
  layer: string | null;
  flags: number | null;
  vertices: [number, number][];
}

interface LotPolygon {
  layer: string | null;
  ring: [number, number][];
  areaSqm: number;
}

const DEFAULT_SOURCE_SRID = 28355; // GDA94 / MGA zone 55 (matches sample DXF coords)
const DEFAULT_TARGET_SRID = 4326; // WGS84 (matches existing geo queries)
const LARGE_POLYLINE_RATIO = 5;
const MIN_AREA_DEFAULT = 1;
const EDGE_KEY_DECIMALS = 6;

function ensureProj4Defs(srid: number) {
  if (srid === 28355) {
    proj4.defs(
      'EPSG:28355',
      '+proj=utm +zone=55 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    );
  }
  if (srid === 28356) {
    proj4.defs(
      'EPSG:28356',
      '+proj=utm +zone=56 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    );
  }
}

function parseDxfLwPolylines(text: string): ParsedPolyline[] {
  const lines = text.split(/\r?\n/);
  const polylines: ParsedPolyline[] = [];

  let inEntities = false;
  let awaitingSectionName = false;
  let current: ParsedPolyline | null = null;
  let xs: number[] = [];
  let ys: number[] = [];

  function finalizeCurrent() {
    if (!current) return;
    const len = Math.min(xs.length, ys.length);
    current.vertices = [];
    for (let i = 0; i < len; i += 1) {
      current.vertices.push([xs[i], ys[i]]);
    }
    if (current.vertices.length > 0) {
      polylines.push(current);
    }
    current = null;
    xs = [];
    ys = [];
  }

  for (let i = 0; i < lines.length - 1; i += 2) {
    const codeRaw = lines[i];
    const value = lines[i + 1] ?? '';
    const code = parseInt(codeRaw.trim(), 10);
    if (Number.isNaN(code)) {
      // Re-sync by stepping back one line to avoid drifting on malformed lines.
      i -= 1;
      continue;
    }

    if (code === 0 && value.trim() === 'SECTION') {
      awaitingSectionName = true;
      continue;
    }

    if (code === 2 && awaitingSectionName) {
      inEntities = value.trim() === 'ENTITIES';
      awaitingSectionName = false;
      continue;
    }

    if (code === 0 && value.trim() === 'ENDSEC') {
      inEntities = false;
      awaitingSectionName = false;
      finalizeCurrent();
      continue;
    }

    if (!inEntities) {
      continue;
    }

    if (code === 0) {
      finalizeCurrent();
      if (value.trim() === 'LWPOLYLINE') {
        current = { layer: null, flags: null, vertices: [] };
      } else {
        current = null;
      }
      continue;
    }

    if (!current) {
      continue;
    }

    if (code === 8) {
      current.layer = value.trim();
    } else if (code === 70) {
      const flags = parseInt(value.trim(), 10);
      current.flags = Number.isNaN(flags) ? null : flags;
    } else if (code === 10) {
      const x = Number(value);
      if (!Number.isNaN(x)) {
        xs.push(x);
      }
    } else if (code === 20) {
      const y = Number(value);
      if (!Number.isNaN(y)) {
        ys.push(y);
      }
    }
  }

  finalizeCurrent();
  return polylines;
}

function isClosed(flags: number | null, ring: [number, number][], tolerance = 1e-6) {
  if (!ring.length) return false;
  if (flags !== null && (flags & 1) === 1) {
    return true;
  }
  const [x1, y1] = ring[0];
  const [x2, y2] = ring[ring.length - 1];
  return Math.hypot(x1 - x2, y1 - y2) <= tolerance;
}

function closeRing(ring: [number, number][]) {
  if (ring.length < 3) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

function polygonArea(ring: [number, number][]) {
  if (ring.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function planarDistance(a: [number, number], b: [number, number]) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.hypot(dx, dy);
}

function planarWidthHeight(ring: [number, number][]) {
  if (!ring.length) {
    return { width: 0, height: 0 };
  }
  let minX = ring[0][0];
  let maxX = ring[0][0];
  let minY = ring[0][1];
  let maxY = ring[0][1];
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return {
    width: maxX - minX,
    height: maxY - minY,
  };
}

function coordinateKey(
  point: [number, number],
  decimals = EDGE_KEY_DECIMALS,
) {
  return `${point[0].toFixed(decimals)},${point[1].toFixed(decimals)}`;
}

function edgeKey(a: [number, number], b: [number, number]) {
  const aKey = coordinateKey(a);
  const bKey = coordinateKey(b);
  return aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
}

function buildEdgeUsageMap(lots: LotPolygon[]) {
  const usage = new Map<string, number>();
  for (const lot of lots) {
    for (let i = 0; i < lot.ring.length - 1; i += 1) {
      const key = edgeKey(lot.ring[i], lot.ring[i + 1]);
      usage.set(key, (usage.get(key) ?? 0) + 1);
    }
  }
  return usage;
}

function edgeLength(
  a: [number, number],
  b: [number, number],
  isGeographic: boolean,
) {
  return isGeographic ? calculateDistance(a, b) : planarDistance(a, b);
}

function pickFrontageEdgeIndex(
  ring: [number, number][],
  edgeUsageMap: Map<string, number>,
  isGeographic: boolean,
) {
  let selectedIndex: number | null = null;
  let selectedLength = -Infinity;

  for (let i = 0; i < ring.length - 1; i += 1) {
    const key = edgeKey(ring[i], ring[i + 1]);
    if ((edgeUsageMap.get(key) ?? 0) !== 1) {
      continue;
    }
    const length = edgeLength(ring[i], ring[i + 1], isGeographic);
    if (length > selectedLength) {
      selectedLength = length;
      selectedIndex = i;
    }
  }

  if (selectedIndex !== null) {
    return selectedIndex;
  }

  for (let i = 0; i < ring.length - 1; i += 1) {
    const length = edgeLength(ring[i], ring[i + 1], isGeographic);
    if (length > selectedLength) {
      selectedLength = length;
      selectedIndex = i;
    }
  }

  return selectedIndex;
}

function toLineStringWkt(a: [number, number], b: [number, number]) {
  return `LINESTRING(${a[0]} ${a[1]}, ${b[0]} ${b[1]})`;
}

function extractLots(
  polylines: ParsedPolyline[],
  options: Pick<ImportDxfOptions, 'layer' | 'minArea' | 'dropLargest'> & {
    isGeographic?: boolean;
  },
) {
  const minArea = options.minArea ?? MIN_AREA_DEFAULT;
  const isGeographic = options.isGeographic ?? false;

  const candidates: LotPolygon[] = polylines
    .filter((polyline) => (options.layer ? polyline.layer === options.layer : true))
    .map((polyline) => {
      const ring = polyline.vertices;
      if (!isClosed(polyline.flags, ring)) {
        return null;
      }
      const closed = closeRing(ring);
      const areaSqm = isGeographic
        ? calculateArea(closed)
        : Number(polygonArea(closed).toFixed(2));
      if (areaSqm <= minArea) {
        return null;
      }
      return {
        layer: polyline.layer,
        ring: closed,
        areaSqm,
      };
    })
    .filter((polyline): polyline is LotPolygon => Boolean(polyline));

  if (!candidates.length) {
    return { lots: [], boundary: null };
  }

  const sorted = [...candidates].sort((a, b) => b.areaSqm - a.areaSqm);
  let boundary: LotPolygon | null = null;

  if (options.dropLargest ?? true) {
    const largest = sorted[0];
    const second = sorted[1];
    if (!second || largest.areaSqm / second.areaSqm >= LARGE_POLYLINE_RATIO) {
      boundary = largest;
      sorted.shift();
    }
  }

  return { lots: sorted, boundary };
}

function parseNumber(value: string | undefined) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseBoolean(value: string | undefined, defaultValue: boolean) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return value === 'true' || value === '1' || value.toLowerCase() === 'yes';
}

@Injectable()
export class AdminLotImportService {
  constructor(private prisma: PrismaService) {}

  async importDxfLots(
    estateId: bigint,
    text: string,
    options: ImportDxfOptions,
  ) {
    const polylines = parseDxfLwPolylines(text);
    const sourceSrid = options.sourceSrid ?? DEFAULT_SOURCE_SRID;
    const targetSrid = options.targetSrid ?? DEFAULT_TARGET_SRID;
    const isGeographic = sourceSrid === 4326;
    const { lots, boundary } = extractLots(polylines, {
      layer: options.layer,
      minArea: options.minArea,
      dropLargest: options.dropLargest,
      isGeographic,
    });

    if (!lots.length) {
      throw new BadRequestException('No closed lot polylines found in DXF.');
    }

    const shouldTransform = sourceSrid !== targetSrid;
    const edgeUsageMap = buildEdgeUsageMap(lots);

    if (shouldTransform) {
      ensureProj4Defs(sourceSrid);
      ensureProj4Defs(targetSrid);
    }

    const blockKeyPrefix =
      options.blockKeyPrefix ?? `EST-${estateId.toString()}-LOT-`;
    const startingBlockNumber =
      options.blockNumber === null || options.blockNumber === undefined
        ? null
        : Math.trunc(options.blockNumber);

    const createdLots: { id: string; blockKey: string; areaSqm: number }[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (let index = 0; index < lots.length; index += 1) {
        const lot = lots[index];
        const blockKey = `${blockKeyPrefix}${index + 1}`;

        const ringSource = lot.ring;
        const ringTarget = shouldTransform
          ? ringSource.map(([x, y]) => {
              const [lng, lat] = proj4(
                `EPSG:${sourceSrid}`,
                `EPSG:${targetSrid}`,
                [x, y],
              );
              return [lng, lat] as [number, number];
            })
          : ringSource;

        const areaSqm = lot.areaSqm;
        const frontageEdgeIndex = pickFrontageEdgeIndex(
          ringSource,
          edgeUsageMap,
          isGeographic,
        );
        const frontageM =
          frontageEdgeIndex === null
            ? null
            : Number(
                edgeLength(
                  ringSource[frontageEdgeIndex],
                  ringSource[frontageEdgeIndex + 1],
                  isGeographic,
                ).toFixed(2),
              );
        const frontageWkt =
          frontageEdgeIndex === null
            ? null
            : toLineStringWkt(
                ringTarget[frontageEdgeIndex],
                ringTarget[frontageEdgeIndex + 1],
              );

        const sideLengths: Record<string, number>[] = [];
        for (let i = 0; i < ringSource.length - 1; i += 1) {
          const dist = isGeographic
            ? calculateDistance(ringSource[i], ringSource[i + 1])
            : Number(planarDistance(ringSource[i], ringSource[i + 1]).toFixed(2));
          sideLengths.push({ [`s${i + 1}`]: Number(dist.toFixed(2)) });
        }

        const { width, height } = isGeographic
          ? getWidthHeight(ringSource)
          : (() => {
              const planar = planarWidthHeight(ringSource);
              return {
                width: Number(planar.width.toFixed(2)),
                height: Number(planar.height.toFixed(2)),
              };
            })();

        const geometry = {
          type: 'Polygon',
          coordinates: [ringTarget],
        };

        const geojson = {
          properties: sideLengths,
          width: Number(width.toFixed(2)),
          depth: Number(height.toFixed(2)),
          sourceLayer: lot.layer,
          sourceSrid,
        };

        const created = await tx.lot.create({
          data: {
            blockKey,
            blockNumber:
              startingBlockNumber === null
                ? null
                : startingBlockNumber + index,
            sectionNumber: options.sectionNumber ?? null,
            areaSqm,
            zoning: options.zoning ?? '',
            lotType: options.lotType ?? null,
            address: options.address ?? null,
            district: options.district ?? null,
            division: options.division ?? null,
            lifecycleStage: options.lifecycleStage ?? null,
            geojson,
            estateId,
            overlays: [],
            frontageM,
          },
          select: { id: true },
        });

        if (frontageWkt) {
          await tx.$executeRaw`
            UPDATE lot
            SET geometry = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), ${targetSrid}::integer),
                "frontageCoordinate" = ST_SetSRID(ST_GeomFromText(${frontageWkt}), ${targetSrid}::integer)
            WHERE id = ${created.id}
          `;
        } else {
          await tx.$executeRaw`
            UPDATE lot
            SET geometry = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), ${targetSrid}::integer)
            WHERE id = ${created.id}
          `;
        }

        createdLots.push({
          id: created.id.toString(),
          blockKey,
          areaSqm,
        });
      }
    });

    return {
      estateId: estateId.toString(),
      created: createdLots.length,
      blockKeyPrefix,
      sourceSrid,
      targetSrid,
      boundary: boundary
        ? {
            areaSqm: boundary.areaSqm,
            layer: boundary.layer,
          }
        : null,
      lots: createdLots,
    };
  }

  parseOptions(body: Record<string, string | undefined>): ImportDxfOptions {
    return {
      zoning: body.zoning,
      lotType: body.lotType ?? null,
      blockKeyPrefix: body.blockKeyPrefix,
      blockNumber: parseNumber(body.blockNumber) ?? null,
      sectionNumber: parseNumber(body.sectionNumber) ?? null,
      address: body.address ?? null,
      district: body.district ?? null,
      division: body.division ?? null,
      lifecycleStage: body.lifecycleStage ?? null,
      layer: body.layer,
      minArea: parseNumber(body.minArea),
      dropLargest: parseBoolean(body.dropLargest, true),
      sourceSrid: parseNumber(body.sourceSrid),
      targetSrid: parseNumber(body.targetSrid),
    };
  }
}
