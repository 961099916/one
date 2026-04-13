import { ref } from 'vue'

export function useSurgeDragScroll() {
  const panoramaRef = ref<HTMLElement | null>(null)
  const isDraggingTimeline = ref(false)
  
  let dragStartX = 0
  let dragStartScrollLeft = 0
  let dragHasMoved = false

  const onTimelineMouseMove = (e: MouseEvent) => {
    if (!isDraggingTimeline.value || !panoramaRef.value) return
    
    const x = e.pageX - panoramaRef.value.offsetLeft
    const walk = (x - dragStartX) * 1.5 
    
    if (Math.abs(walk) > 5) {
      dragHasMoved = true
    }
    
    panoramaRef.value.scrollLeft = dragStartScrollLeft - walk
  }

  const onTimelineMouseUp = () => {
    isDraggingTimeline.value = false
    window.removeEventListener('mousemove', onTimelineMouseMove)
    window.removeEventListener('mouseup', onTimelineMouseUp)
  }

  const onTimelineMouseDown = (e: MouseEvent) => {
    if (!panoramaRef.value || e.button !== 0) return 
    
    // 排除掉卡片点击，只有点击空白或包裹层才触发
    isDraggingTimeline.value = true
    dragHasMoved = false
    dragStartX = e.pageX - panoramaRef.value.offsetLeft
    dragStartScrollLeft = panoramaRef.value.scrollLeft
    
    window.addEventListener('mousemove', onTimelineMouseMove)
    window.addEventListener('mouseup', onTimelineMouseUp)
  }
  
  const getDragHasMoved = () => dragHasMoved

  return {
    panoramaRef,
    isDraggingTimeline,
    getDragHasMoved,
    onTimelineMouseDown
  }
}
