import * as turf from '@turf/turf';

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

