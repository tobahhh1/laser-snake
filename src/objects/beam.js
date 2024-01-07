import Phaser from "phaser"
import { length, direction, intersect, point_of_intersection, normal, dot, normalize } from "../utils/line"
import { pointsEqual, pointsSimilar } from "../utils/point"

const THICKNESS = 10
const COLOR = 0xFF0000

class Beam extends Phaser.GameObjects.Container {

    constructor(scene, points, direction, velocity, onLose) {
        super(scene, 0, 0)
        this.points = points.map((val) => {
            return [...val]
        })
        this.renderedLines = []
        this.direction = [...direction]
        this.velocity = velocity
        this.desiredLength = this.getCurrentLength()
        this.currentLength = this.getCurrentLength()
        this.onLose = onLose
        this.mirrorCollisions = []
        for(let i = 0; i < this.points.length - 1; i++) {
             let point1 = this.points[i]
             let point2 = this.points[i + 1]
             this.addLine(point1, point2)
        }
    }

    update(time, delta) {
        //Move the start point in the direction of the point after it to simulate movement.
        let startPoint = this.points[0]
        let secondPoint = this.points[1]
        let firstLineDirection = direction(startPoint, secondPoint)
        //If the snake is growing, then don't move the end point
        if (this.currentLength >= this.desiredLength) {
            startPoint[0] += this.velocity * firstLineDirection[0] * delta / 1000
            startPoint[1] += this.velocity * firstLineDirection[1] * delta / 1000
            this.desiredLength = this.currentLength
        } 

        //If the sign on either coordinate of the direction has changed, we've passed our original point, 
        //so we should delete our last point and shorten the next line.
        let newFirstLineDirection = direction(startPoint, secondPoint)
        while (newFirstLineDirection[0] * firstLineDirection[0] < 0 ||
            newFirstLineDirection[1] * firstLineDirection[1] < 0) {
            let extraDistance = length(startPoint, secondPoint)
            //Let the mirror know we are no longer colliding with it
            this.mirrorCollisions = this.mirrorCollisions.filter((record) => {
                if (pointsEqual(secondPoint, record.at)) {
                    record.mirror.unCollideWithBeam(record.at)
                    return false
                }
                return true
            })
            this.points.splice(0, 1)
            this.renderedLines[0].destroy()
            this.renderedLines.splice(0, 1)
            startPoint = this.points[0]
            secondPoint = this.points[1]
            firstLineDirection = direction(startPoint, secondPoint)
            startPoint[0] += extraDistance * firstLineDirection[0]
            startPoint[1] += extraDistance * firstLineDirection[1]
            newFirstLineDirection = direction(startPoint, secondPoint)
        }

        //Move the end point in the direction specified in state.
        let endPoint = this.points[this.points.length - 1]
        endPoint[0] += this.velocity * this.direction[0] * delta / 1000
        endPoint[1] += this.velocity * this.direction[1] * delta / 1000
        this.updateRenderedLines()

        //Check if we've intersected with ourself. If so, then lose the game.
        let lines = this.getLines()
        lines.slice(0, lines.length - 2).forEach((line) => {
            let headLine = lines[lines.length - 1]
            if (intersect(headLine[0], headLine[1], line[0], line[1])) {
                this.velocity = 0
                this.onLose()
            }  
        })

        //If the snake is currently growing, update its current length
        if(this.currentLength < this.desiredLength) {
            this.currentLength = this.getCurrentLength()
        }
    }

    updateRenderedLines() {
        for(let i = 0; i < this.points.length - 1; i++) {
            let point1 = this.points[i]
            let point2 = this.points[i + 1]
            this.renderedLines[i].setTo(point1[0], point1[1], point2[0], point2[1])
        }
    }

    addLine(point1, point2) {
        let line = this.scene.add.line(0, 0, point1[0], point1[1], point2[0], point2[1], COLOR)
        line.setLineWidth(THICKNESS)
        line.setOrigin(0, 0)
        this.renderedLines.push(line)
    }

    getCurrentLength() {
        let dist = 0
        let prev_point = this.points[0]
        this.points.slice(1).forEach((point) => {
            dist += length(point, prev_point)
            prev_point = point
        })
        return dist
    }

    getFirstLine() {
        return [this.points[this.points.length- 2], this.points[this.points.length - 1]]
    }

    collide(mirror, at) {
        let line
        if (!Array.isArray(mirror)) {
            line = mirror.getLine()
        } else {
            line = mirror
        }
        let endPoint = this.points[this.points.length - 1]
        let extraDistance = length(endPoint, at)  
        this.points[this.points.length - 1] = at 
        endPoint = [...at]
        let n = normal(line[0], line[1], this.direction)
        n = [-n[0], -n[1]]
        let coeff = dot(this.direction, n) / dot(n, n)
        this.direction = [this.direction[0] - 2 * n[0] * coeff, this.direction[1] - 2 * n[1] * coeff]
        endPoint[0] += extraDistance * this.direction[0]
        endPoint[1] += extraDistance * this.direction[1]
        this.points.push(endPoint)
        this.addLine(at, endPoint)
        if (!Array.isArray(mirror)) {
            this.mirrorCollisions.push({
                mirror: mirror,
                at: at
            })
        }
        this.updateRenderedLines()
    }

    getLines() {
        let result = []
        for(let i = 0; i < this.points.length - 1; i++) {
            result.push([this.points[i], this.points[i + 1]])
        }
        return result
    }

    grow(length) {
        this.desiredLength += length
    }

}

export default Beam