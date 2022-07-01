export default class CustomPalette {
  constructor(bpmnFactory, create, elementFactory, palette, translate) {
    this.bpmnFactory = bpmnFactory
    this.create = create
    this.elementFactory = elementFactory
    this.translate = translate
    // 在类中使用palette.registerProvider(this)指定这是一个palette
    palette.registerProvider(this)
  }
  // 这个函数是挥之palette的核心
  getPaletteEntries(element) {
    const { bpmnFactory, create, elementFactory, translate } = this;

    function createTask() {
      return function(event) {
        const businessObject = bpmnFactory.create('bpmn:Task'); // 其实这个也可以不要
        const shape = elementFactory.createShape({
            type: 'bpmn:Task',
            businessObject
        });
        console.log(shape) // 只在拖动或者点击时触发
        create.start(event, shape);
      }
    }

    return {
      'create.patrick-task': {
        group: 'model', //分组名
        className: 'icon-custom patrick-task', // 样式类名
        title: this.translate('创建一个类型为patrick-task的任务节点'),
        action: {
          dragstart: createTask(), // 开始拖拽时调用的事件
          click: createTask() // 点击时调用的事件
        }
      }
    }
  }
}

// 使用$inject注入一些需要的变量
CustomPalette.$inject = [
  'bpmnFactory',
  'create',
  'elementFactory',
  'palette',
  'translate'
]