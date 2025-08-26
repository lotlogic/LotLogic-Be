type Pt = [number, number];


function findCoordinateIndex(
    coords: number[][],
    target: number[],
    epsilon = 1e-9
): number {
    return coords.findIndex(
    ([x, y]) =>
        Math.abs(x - target[0]) < epsilon &&
        Math.abs(y - target[1]) < epsilon
    );
}

export function reorderPolygonByFrontage(coords, frontageEdge) {
    const index = findCoordinateIndex(coords, frontageEdge) ?? -1;

	if (index === -1) {
		throw new Error('Frontage start point not found in polygon coordinates');
	}

	const reordered = [
		...coords.slice(index, coords.length - 1),
		...coords.slice(0, index),
		coords[index],
	];

	return reordered;
}
