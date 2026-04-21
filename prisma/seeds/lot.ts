import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as turf from '@turf/turf';
import {
  calculateArea,
  calculateDistance,
  findClosestRoad,
  findFrontSideByRoad,
  getWidthHeight,
} from '../../src/helper/turf';

const prisma = new PrismaClient();

type Coordinate = [number, number];
type Edge = [Coordinate, Coordinate];

type SeedLotFeature = {
  geo_type: 'lot' | string;
  blockKey: string;
  blockNumber: number | null;
  sectionNumber: number | null;
  zoning: string;
  address: string | null;
  district: string | null;
  division: string | null;
  lifecycleArea?: string | null;
  estateId?: string | null;
  geometry: { coordinates: Coordinate[][] };
};

type LotSeedPayload = {
  blockKey: string;
  blockNumber: number | null;
  sectionNumber: number | null;
  areaSqm: number;
  zoning: string;
  address: string | null;
  district: string | null;
  division: string | null;
  lifecycleStage: string | null | undefined;
  estateId: string | null | undefined;
  geojson: Record<string, unknown>;
  geometry: string;
  frontageCoordinate: string | null;
};

const EDGE_DECIMALS = 8;
const POINT_EPSILON = 1e-9;

const pointsEqual = (a: Coordinate, b: Coordinate) =>
  Math.abs(a[0] - b[0]) <= POINT_EPSILON &&
  Math.abs(a[1] - b[1]) <= POINT_EPSILON;

const normalizeRing = (coordinates: Coordinate[]) => {
  const ring = coordinates.map(
    (point) => [Number(point[0]), Number(point[1])] as Coordinate,
  );

  if (ring.length < 2) {
    return ring;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!pointsEqual(first, last)) {
    ring.push(first);
  }

  return ring;
};

const getEdges = (ring: Coordinate[]) => {
  const edges: Edge[] = [];
  for (let i = 0; i < ring.length - 1; i += 1) {
    const start = ring[i];
    const end = ring[i + 1];
    if (!pointsEqual(start, end)) {
      edges.push([start, end]);
    }
  }
  return edges;
};

const coordinateKey = (coordinate: Coordinate) =>
  `${coordinate[0].toFixed(EDGE_DECIMALS)},${coordinate[1].toFixed(EDGE_DECIMALS)}`;

const edgeKey = (edge: Edge) => {
  const a = coordinateKey(edge[0]);
  const b = coordinateKey(edge[1]);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
};

const buildEdgeUsageMap = (lotFeatures: SeedLotFeature[]) => {
  const usage = new Map<string, number>();
  for (const lot of lotFeatures) {
    const ring = normalizeRing(lot.geometry.coordinates[0] ?? []);
    for (const edge of getEdges(ring)) {
      const key = edgeKey(edge);
      usage.set(key, (usage.get(key) ?? 0) + 1);
    }
  }
  return usage;
};

const chooseLongestEdge = (edges: Edge[]) => {
  let selected: Edge | null = null;
  let maxLength = -Infinity;
  for (const edge of edges) {
    const length = calculateDistance(edge[0], edge[1]);
    if (length > maxLength) {
      maxLength = length;
      selected = edge;
    }
  }
  return selected;
};

const distanceFromEdgeToRoad = (edge: Edge, road: Coordinate[]) => {
  if (!road.length) {
    return Infinity;
  }
  const roadLine = turf.lineString(road);
  const midpoint = turf.midpoint(turf.point(edge[0]), turf.point(edge[1]));
  const nearestPoint = turf.nearestPointOnLine(roadLine, midpoint);
  return turf.distance(midpoint, nearestPoint, { units: 'meters' });
};

const chooseEdgeClosestToRoad = (edges: Edge[], road: Coordinate[]) => {
  let selected: Edge | null = null;
  let minDistance = Infinity;
  for (const edge of edges) {
    const distance = distanceFromEdgeToRoad(edge, road);
    if (distance < minDistance) {
      minDistance = distance;
      selected = edge;
    }
  }
  return selected;
};

const edgeToLineString = (edge: Edge) =>
  `LINESTRING(${edge[0][0]} ${edge[0][1]}, ${edge[1][0]} ${edge[1][1]})`;

async function main() {
  const filePath = path.join(
    __dirname,
    '../../src/data/hamiltonRiseMitchell.json',
  );
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lots = JSON.parse(fileContent) as { features: SeedLotFeature[] };
  const lotFeatures = lots.features.filter(
    (feature) => feature.geo_type === 'lot',
  );
  const edgeUsageMap = buildEdgeUsageMap(lotFeatures);

  const geoData = await prisma.geoData.findMany({
    where: {
      geoType: {
        in: ['Road'],
      },
    },
  });

  const roads = geoData.map((data) => {
    const coordinates: Coordinate[] = [];
    const arrayData = data.coordinates.split(',');
    for (let coor = 0; coor < arrayData.length; coor += 2) {
      coordinates.push([Number(arrayData[coor]), Number(arrayData[coor + 1])]);
    }
    return coordinates;
  });

  for (const lot of lotFeatures) {
    const coordinates = normalizeRing(lot.geometry.coordinates[0] ?? []);
    const lotEdges = getEdges(coordinates);
    const unsharedEdges = lotEdges.filter(
      (edge) => edgeUsageMap.get(edgeKey(edge)) === 1,
    );

    const nearestRoad = findClosestRoad(coordinates, roads);
    const selectedUnsharedEdge = nearestRoad
      ? chooseEdgeClosestToRoad(unsharedEdges, nearestRoad)
      : chooseLongestEdge(unsharedEdges);

    const fallbackRoadEdge = nearestRoad
      ? findFrontSideByRoad(coordinates, nearestRoad)?.frontSide ?? null
      : null;

    const selectedFrontageEdge =
      selectedUnsharedEdge ??
      (fallbackRoadEdge as Edge | null) ??
      chooseLongestEdge(lotEdges);

    const data: LotSeedPayload = {
      blockKey: lot.blockKey,
      blockNumber: lot.blockNumber,
      sectionNumber: lot.sectionNumber,
      areaSqm: calculateArea(coordinates),
      zoning: lot.zoning,
      address: lot.address,
      district: lot.district,
      division: lot.division,
      lifecycleStage: lot.lifecycleArea,
      estateId: lot.estateId,
      geojson: {},
      geometry: toPolygon(coordinates.map((c) => c.join(' ')).toString()),
      frontageCoordinate: selectedFrontageEdge
        ? edgeToLineString(selectedFrontageEdge)
        : null,
    };

    const properties: { [key: string]: number }[] = [];
    for (let i = 0; i < coordinates.length - 1; i += 1) {
      const distance = Number(
        calculateDistance(coordinates[i], coordinates[i + 1]).toFixed(2),
      );
      properties.push({ [`s${i + 1}`]: distance });
    }
    const { width, height } = getWidthHeight(coordinates);

    data.geojson = { properties, width, depth: height };
    try {
      const sql = `
            INSERT INTO lot (
              "blockKey", "blockNumber", "sectionNumber", "areaSqm", "zoning", "address",
              "district", "division", "lifecycleStage", "estateId", "geojson", "geometry", "frontageCoordinate", "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10, $11,
              ST_GeomFromText($12, 4326), ST_GeomFromText($13, 4326), now(), now()
            )
            ON CONFLICT ("estateId", "blockKey")
            DO UPDATE SET
              "blockNumber" = $2,
              "sectionNumber" = $3,
              "areaSqm" = $4,
              "zoning" = $5,
              "address" = $6,
              "district" = $7,
              "division" = $8,
              "lifecycleStage" = $9,
              "estateId" = $10,
              "geojson" = $11,
              "geometry" = ST_GeomFromText($12, 4326),
              "frontageCoordinate" = ST_GeomFromText($13, 4326),
              "updatedAt" = now()
      `;

      await prisma.$executeRawUnsafe(
        sql,
        data.blockKey,
        data.blockNumber,
        data.sectionNumber,
        data.areaSqm,
        data.zoning,
        data.address,
        data.district,
        data.division,
        data.lifecycleStage,
        data.estateId,
        data.geojson,
        data.geometry,
        data.frontageCoordinate,
      );
    } catch (error) {
      console.error('Error: ' + error);
    }
  }
  console.log('Lots added successfully.');
}

function toPolygon(coordString) {
  const coords = coordString
    .trim()
    .split(',')
    .map((p) => p.trim());

  if (coords[0] !== coords[coords.length - 1]) {
    coords.push(coords[0]);
  }

  return `POLYGON((${coords.join(', ')}))`;
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
