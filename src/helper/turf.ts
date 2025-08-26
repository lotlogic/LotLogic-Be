import * as turf from '@turf/turf';
import { Feature, Polygon, LineString, Point } from "geojson";

const toPolygon = (coords: number[][]) => {
    return turf.polygon([coords]);
};

export const calculateDistance = (start, end) => {
    return turf.distance(start, end, { units: "meters" });
};

export const calculateArea = (coords: number[][]) => {
    const polygon = toPolygon(coords);
    return Number(turf.area(polygon).toFixed(2));
};

export const getWidthHeight = (coords: number[][]) => {
    const feature = toPolygon(coords)
    const bbox = turf.bbox(feature);

    const [minX, minY, maxX, maxY] = bbox;

    const west = turf.point([minX, minY]);
    const east = turf.point([maxX, minY]);
    const south = turf.point([minX, minY]);
    const north = turf.point([minX, maxY]);

    const width = Number(turf.distance(west, east, { units: "meters" }).toFixed(2));
    const height = Number(turf.distance(south, north, { units: "meters" }).toFixed(2));
    return { width, height };
};

export const findClosestRoad = (
    polygonData: [number, number][],
    roadsData: [number, number][][] 
) => {
    let closestRoad: Feature<LineString> | null = null;
    let minDistance = Infinity;
    let nearestPoint: Feature<Point> | null = null;

    const polygon: Feature<Polygon> = turf.polygon([polygonData]);
    const roads: Feature<LineString>[] = roadsData.map(coords => turf.lineString(coords));
    for (const road of roads) {
        const centroid = turf.centroid(polygon);
        const np = turf.nearestPointOnLine(road, centroid);
        const dist = turf.distance(centroid, np, { units: "meters" });

        if (dist < minDistance) {
            minDistance = dist;
            closestRoad = road;
            nearestPoint = np;
        }
    }

    return closestRoad ? (closestRoad.geometry.coordinates as [number, number][]) : null;
};

export const findFrontSideByRoad = (
    polygon: [number, number][],
    roadsData: [number, number][]
) => {

    let closestEdge: [number[], number[]] = [polygon[0], polygon[1]];
    let minDistance = Infinity;
    const road: Feature<LineString> = turf.lineString(roadsData);

    for (let i = 0; i < polygon.length - 1; i++) {
        const from = turf.point(polygon[i]);
        const to = turf.point(polygon[i + 1]);
        
        const midpoint = turf.midpoint(from, to);
        const nearest = turf.nearestPointOnLine(road, midpoint);
        const dist = turf.distance(midpoint, nearest, { units: "meters" });

        if (dist < minDistance) {
            minDistance = dist;
            closestEdge = [polygon[i], polygon[i + 1]];
        }
    }

    return { frontSide: closestEdge };
};



type Pt = [number, number];

type SetbackValues = {
	front: number;
	side: number;
	rear: number;
};

export function polygonOrientation(points: Pt[]): number {
	let sum = 0;
	for (let i = 0; i < points.length - 1; i++) {
		const [x1, y1] = points[i];
		const [x2, y2] = points[i + 1];
		sum += (x2 - x1) * (y2 + y1);
	}
	return sum; // >0 CCW, <0 CW
}

export function unit(vec: Pt): Pt {
	const len = Math.hypot(vec[0], vec[1]) || 1;
	return [vec[0] / len, vec[1] / len];
}

export function offsetEdge(p1: Pt, p2: Pt, inwardNormal: Pt, d: number): [Pt, Pt] {
	return [
		[p1[0] + inwardNormal[0] * d, p1[1] + inwardNormal[1] * d],
		[p2[0] + inwardNormal[0] * d, p2[1] + inwardNormal[1] * d],
	];
}

export function intersectLines(a1: Pt, a2: Pt, b1: Pt, b2: Pt): Pt {
	const x1 = a1[0], y1 = a1[1], x2 = a2[0], y2 = a2[1];
	const x3 = b1[0], y3 = b1[1], x4 = b2[0], y4 = b2[1];
	const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
	if (Math.abs(den) < 1e-9) return a2;
	const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / den;
	const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / den;
	return [px, py];
}

export function insetQuadPerSideLL(
	ringLL: Pt[], // closed ring [p0,p1,p2,p3,p0]
	sides: SetbackValues
): Pt[] | null {
	if (!ringLL || ringLL.length < 5) return null;

	const ringMerc = (turf.toMercator(turf.polygon([ringLL])) as any)
		.geometry.coordinates[0] as Pt[];

	const p0 = ringMerc[0], p1 = ringMerc[1], p2 = ringMerc[2], p3 = ringMerc[3];

	const ori = polygonOrientation([p0, p1, p2, p3, p0]); // >0 CCW, <0 CW
	const sign = ori > 0 ? -1 : 1; // inward normal direction

	const v01 = unit([p1[0] - p0[0], p1[1] - p0[1]]);
	const v12 = unit([p2[0] - p1[0], p2[1] - p1[1]]);
	const v23 = unit([p3[0] - p2[0], p3[1] - p2[1]]);
	const v30 = unit([p0[0] - p3[0], p0[1] - p3[1]]);

	const n01: Pt = [sign * -v01[1], sign * v01[0]]; // front (S1)
	const n12: Pt = [sign * -v12[1], sign * v12[0]]; // side  (S2)
	const n23: Pt = [sign * -v23[1], sign * v23[0]]; // side  (S3)
	const n30: Pt = [sign * -v30[1], sign * v30[0]]; // rear  (S4)

	const [a0, a1] = offsetEdge(p0, p1, n01, sides.front);
	const [b0, b1] = offsetEdge(p1, p2, n12, sides.side);
	const [c0, c1] = offsetEdge(p2, p3, n23, sides.side);
	const [d0, d1] = offsetEdge(p3, p0, n30, sides.rear);

	const q0 = intersectLines(d0, d1, a0, a1);
	const q1 = intersectLines(a0, a1, b0, b1);
	const q2 = intersectLines(b0, b1, c0, c1);
	const q3 = intersectLines(c0, c1, d0, d1);

	const innerMerc = [q0, q1, q2, q3, q0] as Pt[];
	const innerLL = (turf.toWgs84(turf.polygon([innerMerc])) as any)
		.geometry.coordinates[0] as Pt[];

	return innerLL;
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
	let timeout: NodeJS.Timeout;
	return ((...args: any[]) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	}) as T;
}
