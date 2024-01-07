import Phaser from "phaser"
import { intersect, direction, normal } from "../utils/line"

const WIDTH = 45
const HEIGHT = 45
const COLOR = 0x00FFFF

class Apple extends Phaser.GameObjects.Container {
    
    constructor(scene, linesToAvoid) {
        super(scene, 500, 50)
        this.moveRect()
        this.sprite = this.scene.add.rectangle(this.x, this.y, WIDTH, HEIGHT, COLOR, 1)
    }

    intersects(line, thickness=1) {
        let result = false
        let boundaryLines = []
        if (thickness > 1) {
            let perp = normal(line[0], line[1])
            let topLeft = [line[0][0] - thickness * perp[0], line[0][1] - thickness * perp[1]]
            let bottomLeft = [line[0][0] + thickness * perp[0], line[0][1] + thickness * perp[1]]
            let topRight = [line[1][0] - thickness * perp[0], line[1][1] - thickness * perp[1]]
            let bottomRight = [line[1][0]  + thickness * perp[0], line[1][1] + thickness * perp[1]]
            boundaryLines = [
                [topLeft, topRight],
                [topRight, bottomRight],
                [bottomRight, bottomLeft],
                [bottomLeft, topLeft]
            ]
        } else {
            boundaryLines = [line]
        }
        this.rect.forEach((segment) => {
            boundaryLines.forEach((boundary) => {
                if(intersect(segment[0], segment[1], boundary[0], boundary[1])) {
                    result = true
                }
            })
        })
        return result
    }

    move(linesToAvoid) {
        let { x, y } = this.generateRandomPosition()
        this.setPosition(x, y)
        if (this.sprite) {
            this.sprite.setPosition(x, y)
        }
        this.moveRect()
        for(let i = 0; i < linesToAvoid.length; i++) {
            if (this.intersects(linesToAvoid[i])) {
                this.move(linesToAvoid)
                return
            }
        }
    }

    generateRandomPosition() {
        return {
            x: Math.floor(Math.random() * (this.scene.cameras.main.width - WIDTH)) + WIDTH / 2,
            y: Math.floor(Math.random() * (this.scene.cameras.main.height - HEIGHT)) + HEIGHT / 2
        }
    }

    moveRect() {
        let x = this.x
        let y = this.y
        this.rect = [
            [[x - WIDTH / 2, y - HEIGHT / 2], [x + WIDTH / 2, y - HEIGHT / 2]],
            [[x + WIDTH / 2, y - HEIGHT / 2], [x + WIDTH / 2, y + HEIGHT / 2]],
            [[x + WIDTH / 2, y + HEIGHT / 2], [x - WIDTH / 2, y + HEIGHT / 2]],
            [[x - WIDTH / 2, y + HEIGHT / 2], [x - WIDTH / 2, y - HEIGHT / 2]],
        ] 
    }

}

export default Apple