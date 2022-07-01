<template>
  <div class="containers">
    <div class="canvas" ref="canvas"></div>
  </div>
</template>

<script>
// 引入相关bpmn-js依赖
import BpmnModeler from 'bpmn-js/lib/Modeler'
import { xmlStr } from '../mock/xmlStr'
import customModule from './custom'
export default {
  name: 'bpmn-basic',
  mounted() {
    this.init()

  },
  data() {
    return {
      // bpmn建模器
      bpmnModeler: null,
      container: null,
      canvas: null
    }
  },
  methods: {
    init() {
      // 获取属性到ref为“canvas”的DOM节点
      const canvas = this.$refs.canvas
      // 建模
      this.bpmnModeler = new BpmnModeler({
        container: canvas,
        additionalModules: [
          // 自定义的节点
          customModule
        ],
      })
      this.createNewDiagram()
    },
    createNewDiagram() {
      // 将字符串转换成图显示出来
      this.bpmnModeler.importXML(xmlStr, (err) => {
        if (err) {
          console.log(err)
        } else {
          // 成功之后的回调
          this.success()
        }
       })
    },
    success() {
      console.log("创建成功")
    }
  }

}
</script>

<style scoped>
.containers{
	position: absolute;
	background-color: #ffffff;
	width: 100%;
	height: 100%;
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
</style>