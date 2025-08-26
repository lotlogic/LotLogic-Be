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
