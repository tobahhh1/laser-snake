import Phaser from 'phaser';
import { length, direction, intersect, point_of_intersection, normal, dot, normalize } from "../utils/line"
import { pointsEqual, pointsSimilar } from '../utils/point';
import Beam from "../objects/beam"
import Apple from "../objects/apple"
import Mirror from "../objects/mirror"

const MIRRORTHICKNESS = 10
const MIRRORUNADDEDCOLOR = 0xFFFFFF
const MIRRORUNADDEDINVALIDCOLOR = 0x880000
const MIRRORUNADDEDALPHA = 0.5
const STARTINGBEAMPOINTS = [[50, 500], [250, 300]]
const STARTINGBEAMDIRECTION = [Math.sqrt(2) / 2, -Math.sqrt(2) / 2]
const STARTINGBEAMVELOCITY = 350
const GROWTHPERAPPLE = 60

let firstTimeRunning = true

class Game extends Phaser.Scene
{
    create() {

        const WIDTH = this.cameras.main.width
        const HEIGHT = this.cameras.main.height

        this.state = {
            gameObjects: this.add.group({
                runChildUpdate: true
            }),
            //The beam gameobject.
            beam: new Beam(this, STARTINGBEAMPOINTS, STARTINGBEAMDIRECTION, STARTINGBEAMVELOCITY, () => {
                this.showLoseScreen()
            }),
            //The lines that the beam should reflect off of
            permanentMirrors: [
                [[0, 0], [800, 0]],
                [[800, 0], [800, 600]],
                [[0, 600], [800, 600]],
                [[0, 0], [0, 600]]
            ],
            //The mirrors that the beam should reflect off of, and that should disappear once the beam
            //is done colliding with them.
            mirrors: [],
            //The mirror that is currently being added
            mirrorBeingAdded: null,
            //The rendered version of the mirror that is currently being added
            renderedMirrorBeingAdded: null,
            //The apple currently on-screen.
            apple: null,
            //The menu currently being displayed
            menu: null,
            
            score: 0,
            
            scoreText: this.add.text(15, 15, "0", {
                fontFamily: "Arial",
                fontSize: 30
            }),

            //The tutorial text currently being displayed at the bottom
            tutorialText: this.add.text(WIDTH / 2, HEIGHT - 50, "Click and drag to place a mirror", {
                fontSize: 30,
                fontFamily: "Arial"
            })
        }
        this.state.apple = new Apple(this, this.state.beam.getLines())
        this.state.gameObjects.add(this.state.beam)
        this.state.gameObjects.add(this.state.apple)
        this.input.on("pointerdown", (pointer) => {
            this.state.tutorialText.setAlpha(0)
            if (pointer.leftButtonDown() && this.state.mirrorBeingAdded == null) {
                let downPoint = [this.input.activePointer.worldX, this.input.activePointer.worldY]
                this.state.mirrorBeingAdded = [downPoint, downPoint]
                this.state.renderedMirrorBeingAdded = this.addLine(downPoint, downPoint, MIRRORUNADDEDCOLOR, MIRRORTHICKNESS, MIRRORUNADDEDALPHA)
            }
        })

        this.input.on("pointerup", (pointer) => {
            if (pointer.leftButtonReleased()) {
                if(this.checkIfMirrorBeingAddedIsValid()) {
                    let newMirror = new Mirror(this, this.state.mirrorBeingAdded, (mirror) => {
                        this.state.mirrors.splice(this.state.mirrors.indexOf(mirror), 1)
                    })
                    this.state.mirrors.push(newMirror)
                    this.state.gameObjects.add(newMirror)
                }
                this.state.renderedMirrorBeingAdded.destroy()
                this.state.renderedMirrorBeingAdded = null
                this.state.mirrorBeingAdded = null
            }
        })

        //Lose screen 
        this.loseScreen = {
            backdrop: this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.75),
            foreground: this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH / 2, HEIGHT / 2, 0x000000, 1),
            text: this.add.text(WIDTH / 2, HEIGHT / 2 - 90, "You Lose!", {
                fontSize: 30,
                fontFamily: "Arial",
            }),
            scoreDisplay: this.add.text(WIDTH / 2, HEIGHT / 2, "Score: ", {
                fontSize: 20,
                fontFamily: "Arial"
            }),
            button: this.add.rectangle(WIDTH / 2, HEIGHT / 2 + 90, 250, 40, 0x000000, 1),
            buttonText: this.add.text(WIDTH / 2, HEIGHT / 2 + 90, "Play Again", {
                fontSize: 25,
                fontFamily: "Arial"
            }),
        }
        this.loseScreen.foreground.setStrokeStyle(5, 0xFFFFFF, 1)
        this.loseScreen.text.setOrigin(0.5, 0.5)
        this.loseScreen.scoreDisplay.setOrigin(0.5, 0.5)
        this.loseScreen.buttonText.setOrigin(0.5, 0.5)
        this.loseScreen.button.setStrokeStyle(3, 0xFFFFFF, 1)
        this.loseScreen.button.setInteractive()
        this.loseScreen.button.on("pointerup", () => {
            firstTimeRunning = false
            this.scene.restart()
        })
        Object.entries(this.loseScreen).forEach(([key, child]) => {
            child.setVisible(false)
            child.setDepth(2)
        })

        this.state.tutorialText.setOrigin(0.5, 0.5)
        if(!firstTimeRunning) {
            this.state.tutorialText.setAlpha(0)
        }
    }

    update(time, delta) {
        //MIRROR ADDING
        if (this.input.activePointer.leftButtonDown()) {
            if (this.state.mirrorBeingAdded) {
                let startPoint = this.state.mirrorBeingAdded[0]
                let currentPoint = [this.input.activePointer.worldX, this.input.activePointer.worldY]
                this.state.mirrorBeingAdded[1] = currentPoint
                this.state.renderedMirrorBeingAdded.setTo(startPoint[0], startPoint[1], currentPoint[0], currentPoint[1])
                if (!this.checkIfMirrorBeingAddedIsValid()) {
                    this.state.renderedMirrorBeingAdded.strokeColor = MIRRORUNADDEDINVALIDCOLOR
                } else {
                    this.state.renderedMirrorBeingAdded.strokeColor = MIRRORUNADDEDCOLOR
                }
            }
        }
        //MIRROR COLLIDING
        //Get the current first line of the beam.
        let firstBeamLine = this.state.beam.getFirstLine()
        //Check and see if the beam has moved through any mirrors
        this.state.mirrors.forEach((mirror) => {
            let line = mirror.getLine()
            if(intersect(firstBeamLine[0], firstBeamLine[1], line[0], line[1])) {
                //If we have, then find the point of intersection and add it to the beam.
                let collision_point = point_of_intersection(firstBeamLine[0], firstBeamLine[1], line[0], line[1])
                if(pointsSimilar(collision_point, firstBeamLine[0]) || pointsSimilar(collision_point, firstBeamLine[1])) 
                {
                    return
                }
                this.state.beam.collide(mirror, collision_point)
                mirror.collideWithBeam(collision_point)         
            }
        })
        this.state.permanentMirrors.forEach((mirror) => {
            if(intersect(firstBeamLine[0], firstBeamLine[1], mirror[0], mirror[1])) {
                //If we have, then find the point of intersection and add it to the beam.
                let collision_point = point_of_intersection(firstBeamLine[0], firstBeamLine[1], mirror[0], mirror[1])
                if(pointsSimilar(collision_point, firstBeamLine[0]) || pointsSimilar(collision_point, firstBeamLine[1])) 
                {
                    return
                }
                this.state.beam.collide(mirror, collision_point)      
            }
        })

        if (this.state.apple.intersects(firstBeamLine, 10)) {
            this.state.apple.move(this.state.beam.getLines().concat(this.state.mirrors.map((mirror) => {
                return mirror.getLine()
            })))
            this.state.beam.grow(GROWTHPERAPPLE)
            this.state.score += 1
            this.state.scoreText.setText(this.state.score)
        }
    }
    
    addLine(point1, point2, color, thickness, alpha) {
        let line = this.add.line(0, 0, point1[0], point1[1], point2[0], point2[1], color, alpha)
        line.setLineWidth(thickness)
        line.setOrigin(0, 0)
        return line
    }

    checkIfMirrorBeingAddedIsValid() {
        let valid = true
        if(this.state.apple.intersects(this.state.mirrorBeingAdded, 10)) {
            valid = false
        }
        else if (length(this.state.mirrorBeingAdded[0], this.state.mirrorBeingAdded[1]) < 50) {
            valid = false
        }
        this.state.beam.getLines().forEach((line) => {
            if (intersect(line[0], line[1], this.state.mirrorBeingAdded[0], this.state.mirrorBeingAdded[1])) {
                valid = false
            }
        })
        return valid
    }

    showLoseScreen() {
        Object.entries(this.loseScreen).forEach(([key, child]) => {
            child.setVisible(true)
        })
        this.loseScreen.scoreDisplay.setText("Score: " + this.state.score)
        this.state.menu = "lose"
    }

}

export default Game