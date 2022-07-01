export default function PaletteProvider(palette, create, elementFactory, globalConnect) {
  this.create = create
  this.elementFactory = elementFactory
  this.globalConnect = globalConnect

  palette.registerProvider(this)
}

PaletteProvider.$inject = [
  'palette',
  'create',
  'elementFactory',
  'globalConnect'
]

PaletteProvider.prototype.getPaletteEntries = function(element) { // 此方法和上面案例的一样
  const {
      create,
      elementFactory
  } = this;
  function createTask() {
      return function(event) {
          const shape = elementFactory.createShape({
              type: 'bpmn:Task'
          });
          console.log(shape) // 只在拖动或者点击时触发
          create.start(event, shape);
      }
  }
  return {
      'create.patrick-task': {
          group: 'model',
          className: 'icon-custom patrick-task',
          title: '创建一个类型为patrick-task的任务节点',
          action: {
              dragstart: createTask(),
              click: createTask()
          }
      }
  }
}