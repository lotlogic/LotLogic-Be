type Pt = [number, number];


function findCoordinateIndex(
    coords: number[][],
    target: number[],
    epsilon = 1e-6  // Increased epsilon for better tolerance
): number {
    return coords.findIndex(
    ([x, y]) =>
        Math.abs(x - target[0]) < epsilon &&
        Math.abs(y - target[1]) < epsilon
    );
}

function findClosestCoordinateIndex(coords: number[][], target: number[]): number {
    let closestIndex = -1;
    let minDistance = Infinity;
    
    coords.forEach((coord, index) => {
        if (coord && coord.length >= 2) {
            const distance = Math.sqrt(
                Math.pow(coord[0] - target[0], 2) + 
                Math.pow(coord[1] - target[1], 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        }
    });
    
    return closestIndex;
}

export function reorderPolygonByFrontage(coords, frontageEdge) {
    // Add debugging information
    
    // Validate inputs
    if (!coords || !Array.isArray(coords) || coords.length === 0) {
        throw new Error('Invalid polygon coordinates provided');
    }
    
    if (!frontageEdge || !Array.isArray(frontageEdge) || frontageEdge.length < 2) {
        throw new Error('Invalid frontage edge provided');
    }

    let index = findCoordinateIndex(coords, frontageEdge) ?? -1;

	if (index === -1) {
        // Enhanced error message with debugging info
        
        coords.slice(0, 5).forEach((coord, i) => {
            if (coord && coord.length >= 2) {
                const diff = [
                    Math.abs(coord[0] - frontageEdge[0]),
                    Math.abs(coord[1] - frontageEdge[1])
                ];
                console.error(`  Coord ${i}: [${coord[0]}, ${coord[1]}] - diff: [${diff[0]}, ${diff[1]}]`);
            }
        });
        
        // Try to find the closest coordinate as a fallback
        
        const closestIndex = findClosestCoordinateIndex(coords, frontageEdge);
        if (closestIndex !== -1) {
            const closestCoord = coords[closestIndex];
            const distance = Math.sqrt(
                Math.pow(closestCoord[0] - frontageEdge[0], 2) + 
                Math.pow(closestCoord[1] - frontageEdge[1], 2)
            );
            
            // Use closest coordinate if distance is reasonable (less than 1 meter)
            if (distance < 1.0) {
                index = closestIndex;
                
            } else {
                throw new Error(`Frontage start point not found in polygon coordinates. Frontage: [${frontageEdge[0]}, ${frontageEdge[1]}]. Closest point is ${distance.toFixed(6)} units away.`);
            }
        } else {
            throw new Error(`Frontage start point not found in polygon coordinates. Frontage: [${frontageEdge[0]}, ${frontageEdge[1]}]`);
        }
	}

	const reordered = [
		...coords.slice(index, coords.length - 1),
		...coords.slice(0, index),
		coords[index],
	];

	return reordered;
}
