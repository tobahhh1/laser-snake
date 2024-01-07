//Returns the length of the line
function length(startPoint, endPoint) {
    return Math.sqrt(Math.pow(startPoint[0] - endPoint[0], 2) + Math.pow(startPoint[1] - endPoint[1], 2))
}

//Returns the normalized direction vector between the two points
function direction(startPoint, endPoint) {
    let l = length(startPoint, endPoint)
    return [(endPoint[0] - startPoint[0]) / l, (endPoint[1] - startPoint[1]) / l]
}

//helper function for intersect - idk ask stack overflow
function ccw(a, b, c) {
    return (c[1]-a[1]) * (b[0]-a[0]) > (b[1]-a[1]) * (c[0]-a[0])
}

//Checks if the lines between l1p1 and l1p, and l2p1 and l2p2, intersect.
function intersect(l1p1, l1p2, l2p1, l2p2) {
    return ccw(l1p1,l2p1,l2p2) != ccw(l1p2,l2p1,l2p2) && ccw(l1p1,l1p2,l2p1) != ccw(l1p1,l1p2,l2p2)
}

//Returns the point of intersection between two lines.
function point_of_intersection(l1p1, l1p2, l2p1, l2p2) {
    let ua = 0
    let ub = 0 
    let denom = (l2p2[1] - l2p1[1])*(l1p2[0] - l1p1[0]) - (l2p2[0] - l2p1[0])*(l1p2[1] - l1p1[1])
    if (denom == 0) {
        return null
    }
    ua = ((l2p2[0] - l2p1[0])*(l1p1[1] - l2p1[1]) - (l2p2[1] - l2p1[1])*(l1p1[0] - l2p1[0]))/denom
    ub = ((l1p2[0] - l1p1[0])*(l1p1[1] - l2p1[1]) - (l1p2[1] - l1p1[1])*(l1p1[0] - l2p1[0]))/denom
    return [l1p1[0] + ua * (l1p2[0] - l1p1[0]), l1p1[1] + ua * (l1p2[1] - l1p1[1])]
}

//Returns the dot product of the two vectors
function dot(v1, v2) {
    return v1[0]*v2[0] + v1[1]*v2[1]
}

//Returns the normalized normal vector to the line between point1 and point2
//This vector should point in the perpendicular direction (clockwise/counterclockwise) closest to dir.
function normal(point1, point2, dir=null) {
    let v = direction(point1, point2)
    if (!dir || dot([-v[1], v[0]], dir) >= 0) {
        return [-v[1], v[0]]
    }
    else {
        return [v[1], -v[0]]
    }
}
//Returns the magnitude of the given vector
function magnitude(v) {
    return Math.sqrt(v[0]*v[0] + v[1]*v[1])
}

//Returns the normalized version of the given vector
function normalize(v) {
    let mag = magnitude(v)
    return [v[0]/mag, v[1]/mag]
}

export { length, direction, intersect, point_of_intersection, normal, normalize, dot }