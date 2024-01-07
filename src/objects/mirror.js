import Phaser from "phaser"
import { pointsEqual } from "../utils/point"

const COLOR = 0xFFFFFF
const WIDTH = 10

class Mirror extends Phaser.GameObjects.Container {

    constructor(scene, line, onDestroy) {
        super(scene, 0, 0)
        this.line = line
        this.pointsOfIntersection = []
        let [point1, point2] = this.line
        this.renderedLine = this.scene.add.line(0, 0, point1[0], point1[1], point2[0], point2[1], COLOR)
        this.renderedLine.setOrigin(0, 0)
        this.renderedLine.setLineWidth(WIDTH)
        this.renderedLine.setDepth(1)
        this.onDestroy = onDestroy
        this.isFading = false
        this.opacity = 1
    }

    getLine() {
        return this.line
    }

    collideWithBeam(at) {
        this.pointsOfIntersection.push(at)
    }

    update(time, delta) {
        if (this.isFading) {
            this.opacity -= delta / 1000
            this.renderedLine.setAlpha(this.opacity)
            if (this.opacity === 0) {
                this.renderedLine.destroy()
                this.destroy()
            }
        }
    }

    unCollideWithBeam(at) {
        this.pointsOfIntersection = this.pointsOfIntersection.filter((point) => {
            return !pointsEqual(at, point)
        })
        if (this.pointsOfIntersection.length == 0) {
            this.isFading = true
            this.onDestroy(this)
        }
    }

}

export default Mirror