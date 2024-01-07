function pointsEqual(point1, point2) {
    return point1[0] == point2[0] && point1[1] == point2[1]
}

//Returns true if the points are within 0.05 of each other, therefore accounting for floating point errors
function pointsSimilar(point1, point2) {
    return Math.abs(point1[0] - point2[0]) <= 0.05 && Math.abs(point1[1] - point2[1]) <= 0.05
}

export { pointsEqual, pointsSimilar }