function hitLine(pt, pt1, pt2, width) {
  if ((pt1.x - pt.x) * (pt.x - pt2.x) < 0) {
    return false
  }
  if ((pt1.y - pt.y) * (pt.y - pt2.y) < 0) {
    return false
  }
  let dy = pt2.y - pt1.y
  let dx = pt2.x - pt1.x
  let dl2 = Math.sqrt(dx * dx + dy * dy)
  if (dl2 < 0.1) {
    return false
  }
  let d =
    Math.abs(dy * pt.x - dx * pt.y + pt2.x * pt1.y - pt1.x * pt2.y) / dl2 - 2
  return width >= d * 2
}

function hitRect(pt, r) {
  if ((r.x + r.width - pt.x) * (pt.x - r.x) < 0) {
    return false
  }
  if ((r.y + r.height - pt.y) * (pt.y - r.y) < 0) {
    return false
  }
  return true
}

function normalizeRect(rect) {
  let x = rect.pt1.x
  let y = rect.pt1.y
  let width = rect.pt2.x - x
  let height = rect.pt2.y - y
  if (width < 0) {
    x = rect.pt2.x
    width = -width
  }
  if (height < 0) {
    y = rect.pt2.y
    height = -height
  }
  return { x: x, y: y, width: width, height: height }
}

function fill(ctx, fillColor) {
  if (fillColor != "null") {
    ctx.fillStyle = fillColor
    ctx.fill()
  }
}

function deleteItem(array, item) {
  let index = array.indexOf(item)
  if (index !== -1) {
    array.splice(index, 1)
  }
}

//

class QSerializer {
  constructor() {
    this.creators = {}
  }

  register(name, creator) {
    this.creators[name] = creator
  }

  create(json) {
    for (let key in json) {
      if (key != "id") {
        let creator = this.creators[key]
        if (creator) {
          return creator[json]
        }
        break
      }
    }
    alert("unsupport shape: " + JSON.stringify(json))
    return null
  }
}

var qshapes = new QSerializer()

// ------------------------------------

function _getNextID(key) {
  let dgBase = localStorage.getItem(key)
  if (dgBase == null) {
    dgBase = 10000
  } else {
    dgBase = parseInt(dgBase)
  }
  dgBase++
  return dgBase.toString()
}

function _makeLocalDrawingID() {
  let val = _getNextID("dgBase")
  localStorage_setItem("dgBase", val)
  return val
}

function localStorage_setItem(key, val) {
  try {
    localStorage.setItem(key, val)
  } catch (e) {
    if (e.name == "QuotaExceededError") {
      removeSomeCache()
      localStorage.setItem(key, val)
    }
  }
}

function removeSomeCache() {
  let clearID = _getNextID("dgClear")
  for (let i = 0; i < 32; i++) {
    let key = "dg:" + clearID
    let doc = localStorage.getItem(key)
    if (doc != null) {
      let o = JSON.parse(doc)
      for (let i in o.shapes) {
        localStorage.removeItem(o.id + ":" + o.shapes[i])
      }
      localStorage.removeItem(key)
      localStorage.setItem("dgClear", clearID)
      return
    }
    clearID++
  }
}

function loadDrawing(localID) {
  let val = localStorage.getItem("dg:" + localID)
  return JSON.parse(val)
}

function documentChanged(doc) {
  if (doc.localID != "") {
    let val = doc._stringify()
    localStorage_setItem("dg:" + doc.localID, val)
  }
}

function loadShape(parent, id) {
  let val = localStorage.getItem(parent.localID + ":" + id)
  let o = JSON.parse(val)
  if (o == null) {
    return null
  }
  return qshapes.create(o)
}

function shapeChanged(shape) {
  if (shape.id != "") {
    let parent = shape.type
    shape.type = shape.constructor.name
    let val = JSON.stringify(shape)
    shape.type = parent
    localStorage_setItem(parent.localID + ":" + shape.id, val)
  }
}

// ----------------------------------

class QShapeStyle {
  constructor(lineWidth, lineColor, fillColor) {
    this.lineWidth = lineWidth
    this.lineColor = lineColor
    this.fillColor = fillColor
  }
  setProp(key, val) {
    this[key] = val
  }

  clone() {
    return new QShapeStyle(this.lineWidth, this.lineColor, this.fillColor)
  }
}

function newShapeStyle(sty) {
  return new QShapeStyle(sty.lineWidth, sty.lineColor, sty.fillColor)
}

class QLine {
  constructor(point1, point2, style) {
    if (style) {
      this.pt1 = point1
      this.pt2 = point2
      this.style = style
      this.ver = 0
      this.id = ""
    } else {
      let o = point1.line
      this.id = point1.id
      this.pt1 = o.pt1
      this.pt2 = o.pt2
      this.style = newShapeStyle(o.style)
      this.ver = o.ver
    }
  }

  bound() {
    return normalizeRect(this)
  }

  hitTest(pt) {
    if (hitLine(pt, this.pt1, this.pt2, this.style.lineWidth)) {
      return { hitCode: 1, hitShape: this }
    }
    return { hitCode: 0, hitShape: null }
  }

  move(dx, dy) {
    this.pt1.x += dx
    this.pt1.y += dy
    this.pt2.x += dx
    this.pt2.y += dy
    shapeChanged(this)
  }

  setProp(key, val) {
    this.style.setProp(key, val)
    shapeChanged(this)
  }

  onpaint(ctx) {
    let style = this.style
    ctx.lineWidth = style.lineWidth
    ctx.strokeStyle = style.lineColor
    ctx.beginPath()
    ctx.moveTo(this.pt1.x, this.pt1.y)
    ctx.lineTo(this.pt2.x, this.pt2.y)
    ctx.stroke()
  }
}

qshapes.register("line", function(json) {
  return new QLine(json)
})

class QRect {
  constructor(r, style) {
    if (style) {
      this.x = r.x
      this.y = r.y
      this.width = r.width
      this.height = r.height
      this.style = style
      this.ver = 0
      this.id = ""
    } else {
      let o = r.rect
      this.id = r.id
      this.x = o.x
      this.y = o.y
      this.width = o.width
      this.height = o.height
      this.style = newShapeStyle(o.style)
      this.ver = o.ver
    }
  }

  bound() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    }
  }

  hitTest(pt) {
    if (hitRect(pt, this)) {
      return {
        hitCode: 1,
        hitShape: this
      }
    }
    return {
      hitCode: 0,
      hitShape: null
    }
  }

  move(dx, dy) {
    this.x += dx
    this.y += dy
    shapeChanged(this)
  }

  setProp(key, val) {
    this.style.setProp(key, val)
    shapeChanged(this)
  }

  onpaint(ctx) {
    let style = this.style
    ctx.lineWidth = style.lineWidth
    ctx.strokeStyle = style.lineColor
    ctx.beginPath()
    ctx.rect(this.x, this.y, this.width, this.height)
    fill(ctx, style.fillColor)
    ctx.stroke()
  }
}

qshapes.register("rect", function(json) {
  return new QRect(json)
})

class QEllipse {
  constructor(x, y, radiusX, radiusY, style) {
    if (style) {
      this.x = x
      this.y = y
      this.radiusX = radiusX
      this.radiusY = radiusY
      this.style = style
      this.ver = 0
      this.id = ""
    } else {
      let o = x.ellipse
      this.id = x.id
      this.x = o.x
      this.y = o.y
      this.radiusX = o.radiusX
      this.radiusY = o.radiusY
      this.style = newShapeStyle(o.shape)
      this.ver = o.ver
    }
  }

  bound() {
    return {
      x: this.x - this.radiusX,
      y: this.y - this.radiusY,
      width: this.radiusX * 2,
      height: this.radiusY * 2
    }
  }

  hitTest(pt) {
    let dx = pt.x - this.x
    let dy = pt.y - this.y
    let a = this.radiusX
    let b = this.radiusY
    if ((dx * dx) / a / a + (dy * dy) / b / b <= 1) {
      return {
        hitCode: 1,
        hitShape: this
      }
    }
    return {
      hitCode: 0,
      hitShape: null
    }
  }

  move(dx, dy) {
    this.x += dx
    this.y += dy
    shapeChanged(this)
  }

  setProp(key, val) {
    this.style.setProp(key, val)
    shapeChanged(this)
  }

  onpaint(ctx) {
    let style = this.style
    ctx.lineWidth = style.lineWidth
    ctx.strokeStyle = style.lineColor
    ctx.beginPath()
    ctx.ellipse(this.x, this.y, this.radiusX, this.radiusY, 0, 0, 2 * Math.PI)
    fill(ctx, style.fillColor)
    ctx.stroke()
  }
}

qshapes.register("ellipse", function(json) {
  return new QEllipse(json)
})

class QPath {
  constructor(points, close, style) {
    if (style) {
      this.points = points
      this.clone = close
      this.style = style
      this.id = ""
    } else {
      let o = points.path
      this.id = points.id
      this.points = o.points
      this.close = o.close
      this.style = newShapeStyle(o.style)
      this.ver = o.ver
    }
  }

  bound() {
    let points = this.points
    let n = points.length
    if (n < 1) {
      return
    }
    let x1 = points[0].x
    let y1 = points[0].y
    let x2 = x1
    let y2 = y1
    for (let i = 1; i < n; i++) {
      let tx = points[i].x
      let ty = points[i].y
      if (tx < x1) {
        x1 = tx
      } else if (tx > x2) {
        x2 = tx
      }
      if (ty < y1) {
        y1 = ty
      } else if (ty > y2) {
        y2 = ty
      }
    }
    return {
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1
    }
  }

  hitTest(pt) {
    if (hitRect(pt, this.bound())) {
      let points = this.points
      let n = points.length
      if (n > 1) {
        let lineWidth = this.style.lineWidth
        for (let i = 1; i < n; i++) {
          if (hitLine(pt, points[i - 1], points[i], lineWidth)) {
            return { hitCode: 1, hitShape: this }
          }
        }
      }
    }
    return { hitCode: 0, hitShape: null }
  }

  move(dx, dy) {
    let points = this.points
    for (let i in points) {
      points[i].x += dx
      points[i].y += dy
    }
    shapeChanged(this)
  }

  setProp(key, val) {
    this.style.setProp(key, val)
    shapeChanged(this)
  }

  onpaint(ctx) {
    let points = this.points
    let n = points.length
    if (n < 1) {
      return
    }
    let style = this.style
    ctx.lineWidth = style.lineWidth
    ctx.strokeStyle = style.lineColor
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < n; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    if (this.close) {
      ctx.closePath()
    }
    ctx.stroke()
  }
}

qshapes.register("path", function(json) {
  return new QPath(json)
})

class QPaintDoc {
  constructor() {
    this._reset()
  }

  _reset() {
    this._shapes = []
    this._idShapeBase = 0
    this.localID = ""
    this.displayID = ""
  }

  _load(localID) {
    this.localID = localID
    let o = loadDrawing(this.localID)
    if (o == null) {
      return
    }
    let shapes = []
    for (let i in o.shapes) {
      let shapeID = o.shapes[i]
      let shape = loadShape(this, shapeID)
      if (shape == null) {
        continue
      }
      shape.id = shapeID
      shape.type = this
      shapes.push(shape)
    }
    this._shapes = shapes
    this._idShapeBase = o.shapeBase
  }

  _stringify() {
    let shapeIDs = []
    let shapes = this._shapes
    for (let i in shapes) {
      shapeIDs.push(shapes[i].id)
    }
    return JSON.stringify({
      id: this.localID,
      shapeBase: this._idShapeBase,
      shapes: shapeIDs
    })
  }

  _initShape(shape) {
    if (shape.id != "") {
      alert("Can't init shape twich! shape.id = " + shape.id)
      return shape
    }
    this._idShapeBase++
    shape.id = this._idShapeBase.toString()
    shape.type = this
    return shape
  }

  init() {
    if (this.displayID != "") {
      alert("Can't init drawing twice! doc.id = " + this.displayID)
      return
    }
    let hash = window.location.hash
    if (hash != "") {
      this.displayID = hash.substring(1)
      this.localID = this.displayID.substring(1)
      this._load(this.localID)
      return
    }
    this.localID = _makeLocalDrawingID()
    this.displayID = "t" + this.localID
    window.location.hash = "#" + this.displayID
  }

  reload() {
    this._reset()
    this.init()
  }

  addShape(shape) {
    if (shape != null) {
      this._shapes.push(this._initShape(shape))
      shapeChanged(shape)
      documentChanged(this)
    }
  }

  deleteShape(shape) {
    deleteItem(this._shapes, shape)
    documentChanged(this)
  }

  hitTest(pt) {
    let shapes = this._shapes
    let n = shapes.length
    for (let i = n - 1; i >= 0; i--) {
      let ret = shapes[i].hitTest(pt)
      if (ret.hitCode > 0) {
        return ret
      }
    }
    return { hitCode: 0, hitShape: null }
  }

  onpaint(ctx) {
    let shapes = this._shapes
    for (let i in shapes) {
      shapes[i].onpaint(ctx)
    }
  }
}
