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
    },
    addBpmnListener() {
      const that = this
      // 给图绑定事件，当图有发生改变就会触发这个事件
      this.bpmnModeler.on('commandStack.changed', () => {
        that.saveDiagram(function(err, xml) {
          console.log(xml)
        })
      })
    },
    // 下载为bpmn格式,done是个函数,调用的时候传入
    saveDiagram(done) {
      // 把传入的done再传给bpmn原型的saveXML函数调用
      this.bpmnModeler.saveXML({ format: true }, function(err, xml) {
        done(err, xml)
      })
    }
  },
}
</script>

<style scoped>
.loading {
  font-size: 26px;
}
.containers {
  background-color: #ffffff;
  width: 100%;
  height: calc(100vh - 52px);
}
.canvas {
  width: 100%;
  height: 100%;
}
.panel {
  position: absolute;
  right: 0;
  top: 0;
  width: 300px;
}
</style>