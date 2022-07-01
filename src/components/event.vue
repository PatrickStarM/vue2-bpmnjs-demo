<template>
  <div class="containers">
    <!-- 加载中 -->
    <div class="loading" v-if="loading">
      Loading...
    </div>
    <!-- 加载完成 -->
    <template v-else>
      <div class="canvas" ref="canvas"></div>
      <div id="js-properties-panel" class="panel"></div>
      <!-- 按钮区 -->
      <ul class="buttons">
        <li>
          <a ref="saveDiagram" href="javascript:" title="保存为bpmn">保存为bpmn</a>
        </li>
        <li>
          <a ref="saveSvg" href="javascript:" title="保存为svg">保存为svg</a>
        </li>
      </ul>
    </template>
  </div>
</template>

<script>
// 引入相关bpmn-js依赖
import BpmnModeler from 'bpmn-js/lib/Modeler'
import { xmlStr } from '../mock/xmlStr'
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule, CamundaPlatformPropertiesProviderModul } from 'bpmn-js-properties-panel';
import CamundaBpmnModdle from 'camunda-bpmn-moddle/resources/camunda.json'
export default {
  name: 'bpmn-basic',
  mounted() {
    this.init()
    // this.getXmlUrl()
  },
  data() {
    return {
      // bpmn建模器
      bpmnModeler: null,
      container: null,
      canvas: null,
      // 加载状态
      loading: true,
      xmlUrl: '',
      defaultXmlStr: xmlStr
    }
  },
  methods: {
    async init() {
      this.loading = true
      this.xmlUrl = await this.getXmlUrl()
      this.loading = false
      this.$nextTick(() => {
        this.initBpmn()
      })
    },
    getXmlUrl () {
      return new Promise(resolve => {
          setTimeout(() => {
              const url = 'https://hexo-blog-1256114407.cos.ap-shenzhen-fsi.myqcloud.com/bpmnMock.bpmn' // 模拟网络请求的一个地址
              resolve(url)
          }, 1000)
      })
    },
    initBpmn() {
      // 获取属性到ref为“canvas”的DOM节点
      const canvas = this.$refs.canvas
      // bpmn建模
      this.bpmnModeler = new BpmnModeler({
        container: canvas,
        // 添加控制板
        propertiesPanel: {
          parent: '#js-properties-panel'
        },
        additionalModules: [
          // 右边的属性栏
          BpmnPropertiesPanelModule,
          BpmnPropertiesProviderModule
        ],
        moddleExtensions: {
          camunda: CamundaBpmnModdle        
        }
      })
      this.createNewDiagram()
    },
    async createNewDiagram() {
      const that = this
      // 定义xml字符串
      let bpmnXmlStr = ''
      // 若是后台没有数据则使用默认的一个xml
      if (this.xmlUrl === '') {
        bpmnXmlStr = this.defaultXmlStr
        this.transformCanvas(bpmnXmlStr)
      } else {
        let res = await this.$axios.get(that.xmlUrl)
        bpmnXmlStr = res.data
        this.transformCanvas(bpmnXmlStr)
      }
    },
    transformCanvas(bpmnXmlStr) {
      // 将字符串转换成图显示出来
      this.bpmnModeler.importXML(bpmnXmlStr, err => {
        if (err) {
          console.error(err)
        } else {
          this.success()
        }
        // 让图能自适应屏幕
        var canvas = this.bpmnModeler.get('canvas')
        canvas.zoom('fit-viewport')
      })
    },
    success() {
      console.log('创建成功!')
      this.addBpmnListener()
      this.addModelerListener()
      this.addEventBusListener()
    },
    // 添加绑定事件
    addBpmnListener() {
      const that = this
      // 获取a标签dom节点
      const downloadLink = this.$refs.saveDiagram
      const downloadSvgLink = this.$refs.saveSvg
      // 给图绑定事件，当图有发生改变就会触发这个事件
      this.bpmnModeler.on('commandStack.changed', function() {
        that.saveSVG(function(err, svg) {
          that.setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg)
        })
        that.saveDiagram(function(err, xml) {
          that.setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml)
        })
      })
    },
    addModelerListener() {
      // 监听 modeler
      const bpmnjs = this.bpmnModeler
      const that = this
      // 'shape.removed', 'connect.end', 'connect.move'
      const events = ['shape.added', 'shape.move.end', 'shape.removed']
      events.forEach(function(event) {
        that.bpmnModeler.on(event, e => {
          var elementRegistry = bpmnjs.get('elementRegistry')
          var shape = e.element ? elementRegistry.get(e.element.id) : e.shape
          console.log(shape)
          if (event === 'shape.added') {
            console.log('新增了shape')
          } else if (event === 'shape.move.end') {
            console.log('移动了shape')
          } else if (event === 'shape.removed') {
            console.log('删除了shape')
          }
        })
      })
    },
    addEventBusListener() {
      // 监听 element
      let that = this
      const eventBus = this.bpmnModeler.get('eventBus')
      const modeling = this.bpmnModeler.get('modeling')
      const elementRegistry = this.bpmnModeler.get('elementRegistry')
      const eventTypes = ['element.click', 'element.changed']
      eventTypes.forEach(function(eventType) {
        eventBus.on(eventType, function(e) {
          console.log(e)
          if (!e || e.element.type == 'bpmn:Process') return
          if (eventType === 'element.changed') {
            that.elementChanged(e)
          } else if (eventType === 'element.click') {
            console.log('点击了element')
            var shape = e.element ? elementRegistry.get(e.element.id) : e.shape
            if (shape.type === 'bpmn:StartEvent') {
              modeling.updateProperties(shape, {
                name: '我是修改后的虚线节点',
                isInterrupting: false,
                customText: '我是自定义的text属性'
              })
              // modeling.setColor(shape, {
              //   fill: '#ff0000',
              //   stroke: null
              // })
            }
          }
        })
      })
    },
    isInvalid(param) {
      // 判断是否是无效的值
      return param === null || param === undefined || param === ''
    },
    isSequenceFlow(type) {
      // 判断是否是线
      return type === 'bpmn:SequenceFlow'
    },
    elementChanged(e) {
      var shape = this.getShape(e.element.id)
      console.log(shape)
      if (!shape) {
        // 若是shape为null则表示删除, 无论是shape还是connect删除都调用此处
        console.log('无效的shape')
        // 上面已经用 shape.removed 检测了shape的删除, 要是删除shape的话这里还会被再触发一次
        console.log('删除了shape和connect')
        return
      }
      if (!this.isInvalid(shape.type)) {
        if (this.isSequenceFlow(shape.type)) {
          console.log('改变了线')
        }
      }
    },
    getShape(id) {
      var elementRegistry = this.bpmnModeler.get('elementRegistry')
      return elementRegistry.get(id)
    },
    // 下载为SVG格式,done是个函数，调用的时候传入的
    saveSVG(done) {
      // 把传入的done再传给bpmn原型的saveSVG函数调用
      this.bpmnModeler.saveSVG(done)
    },
    // 下载为bpmn格式,done是个函数，调用的时候传入的
    saveDiagram(done) {
      // 把传入的done再传给bpmn原型的saveXML函数调用
      this.bpmnModeler.saveXML({ format: true }, function(err, xml) {
        done(err, xml)
      })
    },
    // 当图发生改变的时候会调用这个函数，这个data就是图的xml
    setEncoded(link, name, data) {
      // 把xml转换为URI，下载要用到的
      const encodedData = encodeURIComponent(data)
      // 下载图的具体操作,改变a的属性，className令a标签可点击，href令能下载，download是下载的文件的名字
      //   console.log(link, name, data)
      let xmlFile = new File([data], 'test.bpmn')
      //   console.log(xmlFile)
      if (data) {
        link.className = 'active'
        link.href = 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData
        link.download = name
      }
    }
  },
}
</script>

<style scoped>
.loading {
    font-size: 26px;
}
.containers{
	background-color: #ffffff;
	width: 100%;
	height: calc(100vh - 52px);
}
.canvas{
	width: 100%;
	height: 100%;
}
.panel{
	position: absolute;
	right: 0;
	top: 0;
	width: 300px;
}
.buttons {
    position: absolute;
    left: 20px;
    bottom: 20px;
}
.buttons li {
    display: inline-block;
    margin: 5px;
}
.buttons li a {
    color: #999;
    background: #eee;
    cursor: not-allowed;
    padding: 8px;
    border: 1px solid #ccc;
    text-decoration: none;
}
.buttons li a.active {
    color: #333;
    background: #fff;
    cursor: pointer;
}
</style>