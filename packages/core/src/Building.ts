import { IGraphic } from './interfaces/IGraphic'
import { IMap } from './interfaces/IMap'
import { Player } from './Player'
import { UnitInfo, Unit } from './Unit'
import { Point2d } from '@webrts/math2d'
import { MobileUnit } from './MobileUnit'
import { UnitManager } from './UnitManager'

enum BuildingStatus {
  WAITING,
  PROCESSING
}

export class BaseBuildingUnit extends Unit {
  status: BuildingStatus = BuildingStatus.WAITING
  count: number
  queue: any[]
  processingJob: any

  constructor(
    id: string,
    graphic: IGraphic,
    info: UnitInfo,
    map: IMap,
    unitManager: UnitManager,
    player: Player
  ) {
    super(id, graphic, info, map, unitManager, player)
    this.queue = []
    this.processingJob = null
    this.count = 0
  }

  main() {
    switch (this.status) {
      case BuildingStatus.WAITING: {
        const newUnit = this.queue.shift()
        this.processingJob = newUnit
        this.status = BuildingStatus.PROCESSING
        this.count = 100
        break
      }
      case BuildingStatus.PROCESSING: {
        this.count--
        if (this.count <= 0) {
          if (this.processingJob) {
            const unit = this.unitManager.create(
              this.processingJob.id,
              'villager',
              this.player
            ) as MobileUnit
            if (unit) {
              unit.setPos(new Point2d(this.pos.x - 100, this.pos.y))
              const pos = new Point2d(this.pos.x - 100, this.pos.y + 120)
              unit.moveToPos(pos)
            }
          }
          this.status = BuildingStatus.WAITING
        }
        break
      }
    }
  }

  addUnitCreationQueue(id: string) {
    this.queue.push({ id })
  }

  getInfo() {
    return '<div>' + this.queue.length + '</div>'
  }

  getPallet() {
    return '<div></div>'
  }
}
