import u from './utils'

const POINTER_START_EVENTS = ['mousedown', 'touchstart']
const POINTER_MOVE_EVENTS = ['mousemove', 'touchmove']
const POINTER_END_EVENTS = ['mouseup', 'touchend']
const MOUSE_WHEEL_EVENTS = ['mousewheel']

const init = function (el, binding, vnode) {
  // Default parameters
  const target = el // the element to apply the dragscroll on
  target.style.position = 'relative'
  let active = true
  let transX = 0; let transY = 0; let scale = 1
  let lastFullWheelTime = 0
  let maxScale = 8; let minScale = 0.2
  // config type: boolean
  // Example: v-dragscroll="true" or v-dragscroll="false"
  if (typeof binding.value === 'boolean') {
    active = binding.value
  } else if (typeof binding.value === 'object') {
    // parameter: maxScale
    if (typeof binding.value.maxScale === 'number') {
      maxScale = binding.value.maxScale
    } else if (typeof binding.value.maxScale !== 'undefined') {
      console.error('The parameter "maxScale" should be either \'undefined\' or \'number\'.')
    }
    if (typeof binding.value.minScale === 'number') {
      minScale = binding.value.minScale
    } else if (typeof binding.value.minScale !== 'undefined') {
      console.error('The parameter "minScale" should be either \'undefined\' or \'number\'.')
    }
    // parameter: scale
    if (typeof binding.value.scale === 'number') {
      scale = binding.value.scale
    } else if (typeof binding.value.scale !== 'undefined') {
      console.error('The parameter "scale" should be be either \'undefined\' or \'number\'.')
    }
    // parameter: transX
    if (typeof binding.value.transX === 'number') {
      transX = binding.value.transX
    } else if (typeof binding.value.transX !== 'undefined') {
      console.error('The parameter "transX" should be be either \'undefined\' or \'number\'.')
    }
    // parameter: transY
    if (typeof binding.value.transY === 'number') {
      transY = binding.value.transY
    } else if (typeof binding.value.transY !== 'undefined') {
      console.error('The parameter "transY" should be be either \'undefined\' or \'number\'.')
    }
  } else if (typeof binding.value !== 'undefined') {
    // Throw an error if invalid parameters
    console.error('The passed value should be either \'undefined\', \'true\' or \'false\' or \'object\'.')
  }

  setTimeout(() => {
    target.children[0].style.transform = `scale(${scale})`
    target.children[0].style['transform-origin'] = '0 0'
    target.children[0].style.top = transY + 'px'
    target.children[0].style.left = transX + 'px'
    target.children[0].style.position = 'absolute'
  }, 0)

  var reset = function () {
    let lastClientX, lastClientY, pushed
    let isDragging = false
    // let isClick = false // workaround to handle click event from touch

    target.md = function (e) {
      const isMouseEvent = e instanceof window.MouseEvent
      const ignoreLeft = binding.modifiers.noleft
      const ignoreRight = binding.modifiers.noright
      const ignoreMiddle = binding.modifiers.nomiddle
      const ignoreBack = binding.modifiers.noback
      const ignoreForward = binding.modifiers.noforward

      if (e.which === 1 && ignoreLeft) {
        return
      } else if (e.which === 2 && ignoreMiddle) {
        return
      } else if (e.which === 3 && ignoreRight) {
        return
      } else if (e.which === 4 && ignoreBack) {
        return
      } else if (e.which === 5 && ignoreForward) {
        return
      }

      pushed = 1
      lastClientX = isMouseEvent ? e.clientX : e.touches[0].clientX
      lastClientY = isMouseEvent ? e.clientY : e.touches[0].clientY
    }

    target.mu = function (e) {
      pushed = 0
      if (isDragging) {
        u.emitEvent(vnode, 'dragscrollend')
      }
      isDragging = false
    }

    target.mm = function (e) {
      const isMouseEvent = e instanceof window.MouseEvent
      let newScrollX, newScrollY
      if (pushed) {
        e.preventDefault()
        if (!isDragging) {
          u.emitEvent(vnode, 'dragscrollstart')
        }
        isDragging = true
        const moveX = isMouseEvent ? e.clientX : e.touches[0].clientX
        const moveY = isMouseEvent ? e.clientY : e.touches[0].clientY
        newScrollX = moveX - lastClientX
        newScrollY = moveY - lastClientY
        lastClientX = moveX
        lastClientY = moveY
        transX += newScrollX
        transY += newScrollY
        target.children[0].style.top = transY + 'px'
        target.children[0].style.left = transX + 'px'
        target.children[0].style.position = 'absolute'
        const eventDetail = {}
        // Emit events
        eventDetail.deltaX = transX
        eventDetail.deltaY = transY
        eventDetail.scale = scale
        u.emitEvent(vnode, 'dragscrollmove', eventDetail)
      }
    }
    target.mw = function (e) {
      e.preventDefault()
      const currentElement = target
      const currTime = Date.now()
      if (currTime - lastFullWheelTime > 20) {
        lastFullWheelTime = currTime
        const offsetX = e.x
        const offsetY = e.y
        const containerTop = offsetY - currentElement.offsetTop // 鼠标距容器顶部距离
        const containerLeft = offsetX - currentElement.offsetLeft // 鼠标距容器左侧距离
        let newScale
        if (e.wheelDelta > 0) {
          newScale = scale + 0.1
        } else {
          newScale = scale - 0.1
        }
        if (newScale >= maxScale) {
          newScale = maxScale
        }
        if (newScale <= minScale) {
          newScale = minScale
        }
        const moveEleLeft = (containerLeft - transX) / scale * newScale
        const moveEleTop = (containerTop - transY) / scale * newScale
        scale = newScale
        transX = containerLeft - moveEleLeft
        transY = containerTop - moveEleTop
        target.children[0].style.transform = `scale(${scale})`
        target.children[0].style['transform-origin'] = '0 0'
        target.children[0].style.top = transY + 'px'
        target.children[0].style.left = transX + 'px'
        target.children[0].style.position = 'absolute'
        const eventDetail = {}
        eventDetail.deltaX = transX
        eventDetail.deltaY = transY
        eventDetail.scale = scale
        u.emitEvent(vnode, 'dragscrollmove', eventDetail)
      }
    }

    u.addEventListeners(target, POINTER_START_EVENTS, target.md)

    u.addEventListeners(window, POINTER_END_EVENTS, target.mu)

    u.addEventListeners(window, POINTER_MOVE_EVENTS, target.mm)

    u.addEventListeners(target, MOUSE_WHEEL_EVENTS, target.mw)
  }
  // if value is undefined or true we will init
  if (active) {
    if (document.readyState === 'complete') {
      reset()
    } else {
      window.addEventListener('load', reset)
    }
  } else {
    // if value is false means we disable
    // window.removeEventListener('load', reset)
    u.removeEventListeners(target, POINTER_START_EVENTS, target.md)
    u.removeEventListeners(window, POINTER_END_EVENTS, target.mu)
    u.removeEventListeners(window, POINTER_MOVE_EVENTS, target.mm)
    u.removeEventListeners(target, MOUSE_WHEEL_EVENTS, target.mw)
  }
}

export default {
  inserted: function (el, binding, vnode) {
    init(el, binding, vnode)
  },
  update: function (el, binding, vnode, oldVnode) {
    // update the component only if the parameters change
    const target = el
    u.removeEventListeners(target, POINTER_START_EVENTS, target.md)
    u.removeEventListeners(window, POINTER_END_EVENTS, target.mu)
    u.removeEventListeners(window, POINTER_MOVE_EVENTS, target.mm)
    u.removeEventListeners(target, MOUSE_WHEEL_EVENTS, target.mw)
    if (binding.value !== binding.oldValue) {
      init(el, binding, vnode)
    }
  },
  unbind: function (el, binding, vnode) {
    const target = el
    u.removeEventListeners(target, POINTER_START_EVENTS, target.md)
    u.removeEventListeners(window, POINTER_END_EVENTS, target.mu)
    u.removeEventListeners(window, POINTER_MOVE_EVENTS, target.mm)
    u.removeEventListeners(target, MOUSE_WHEEL_EVENTS, target.mw)
  }
}
