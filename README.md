# GZ Parking Assistant Pro

广州停车助手 Pro：地图找车位 + 智能推荐 + 客户需求提交的开源静态网站项目。

## 功能

- 广州停车地图，基于 Leaflet 和 OpenStreetMap
- JSON 数据管理：`data/parking.json`
- 智能推荐车位，基于可解释规则打分
- 客户需求提交单，支持一键复制和 localStorage 临时保存
- 车位列表、区域筛选、价格筛选、关键词搜索
- 微信号复制、电话咨询
- FAQ 和开源说明
- 手机端适配
- GitHub Pages 免费部署

## 新增停车场

编辑 `data/parking.json`，复制一条数据并修改字段。

## 部署

上传全部文件到 GitHub 仓库，进入 Settings → Pages，选择：

- Source: Deploy from a branch
- Branch: main
- Folder: / (root)

## Roadmap

- 地图导航
- 在线预约后台
- 微信小程序
- 管理后台
- 多城市停车数据

## License

MIT
