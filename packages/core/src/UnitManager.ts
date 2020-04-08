import { EventEmitter } from 'events'
import SVG from 'svg.js'
import { Unit } from './Unit'
import { IMap } from './interfaces/IMap'
import { Player } from './Player'
import { Point2d } from '@webrts/math2d'
import { NatureUnit } from './NatureUnit'
import { BaseBuildingUnit } from './Building'
import { MobileUnit } from './MobileUnit'
import { UnitGraphic } from './UnitGraphic'
import { ClickHandler } from './types'

export interface UnitDef {
  id: string
}

/**
 * @name UnitManager
 */
export class UnitManager extends EventEmitter {
  private metaUnits: Map<string, UnitDef> = new Map<string, UnitDef>()
  private units: Map<string, Unit> = new Map<string, Unit>()
  public group: SVG.G
  private selected: Unit[]
  private cursors: SVG.Circle[]
  private map: IMap | null = null
  clickHandler: null | ClickHandler = null
  constructor(readonly doc: SVG.Doc) {
    super()
    this.group = doc.group()
    this.selected = []
    this.cursors = []
  }

  setMap(map: IMap) {
    this.map = map
  }

  setClickHandler(clickHandler: ClickHandler) {
    this.clickHandler = clickHandler
  }

  load(units: UnitDef[]) {
    units.map(unit => {
      this.metaUnits[unit.id] = unit
    })
  }

  main() {
    for (const unit of this.units.values()) {
      unit.main()
    }
  }

  create(metaUnitId: string, player: Player) {
    if (!this.map) {
      throw new Error('map must not be null')
    }
    const metaUnit = this.metaUnits[metaUnitId]
    const ug = new UnitGraphic(this.doc, this.group, {
      path: metaUnit.graphic.path,
      width: metaUnit.graphic.width,
      height: metaUnit.graphic.height
    })
    let person: Unit
    if (metaUnit.unitinfo.type == 'nature') {
      person = new NatureUnit(ug, metaUnit.unitinfo, this.map, player)
    } else if (metaUnit.unitinfo.type == 'building') {
      person = new BaseBuildingUnit(ug, metaUnit.unitinfo, this.map, player)
    } else {
      person = new MobileUnit(ug, metaUnit.unitinfo, this.map, player)
    }
    person.on('click', e => {
      if (this.clickHandler) {
        this.clickHandler(
          e,
          () => {
            this.select([person])
            this.emit('click', { unit: person, event: e })
          },
          () => {
            this.emit('target', { unit: person, event: e })
          }
        )
      }
    })
    this.units.set(person.id, person)
    return person
  }

  remove(id: string) {
    this.units.get(id)?.remove()
    this.units.delete(id)
  }

  getUnits() {
    return Array.from(this.units.values())
  }

  getTrainableUnits() {
    return this.getUnits().filter(unit => {
      return unit.info.type == 'trainable'
    })
  }

  getCollUnits() {
    return this.getUnits()
  }

  getNearNature(): NatureUnit[] {
    return this.getUnits().filter(unit => {
      return unit.info.type == 'nature'
    }) as NatureUnit[]
  }

  getNearBuilding() {
    return this.getUnits().filter(unit => {
      return unit.info.type == 'building'
    }) as BaseBuildingUnit[]
  }

  getNearTrainableUnits(selfUnit: Unit, player: Player) {
    const units: Unit[] = this.getUnits()
    return units
      .filter(unit => {
        return unit.info.type == 'trainable' && unit.player.type != player.type
      })
      .filter(unit => {
        const dis = Point2d.distance(selfUnit.pos, unit.pos)
        return dis < 18 * 18
      })
  }

  select(target: Unit[]) {
    this.selected = target
    this.cursors.forEach(c => {
      c.remove()
    })
    if (this.selected) {
      this.cursors = this.selected.map(u => {
        const circle = this.doc.circle(50).move(40, 40)
        circle.attr({
          fill: 'none',
          stroke: '#1010f0',
          strokeWidth: 3
        })
        u.graphic.addSVGElement(circle)
        return circle
      })
    }
  }
}
