# GitHub Actions CI/CD + 超管部署管理 设计文档

日期：2026-09-23
状态：已批准（方案 A）
作者：zhaoyunhan + Qoder

## 1. 背景与目标

项目（智语同航）目前部署完全手动：代码推到 GitHub 后，需要 SSH 登录部署服务器手工更新。本次建设：

1. 用 GitHub Actions 搭建 CI/CD 流水线：push 到绑定分支（默认 `dev`）自动构建并部署到生产服务器。
2. 在超管控制台新增"部署管理"页：一键触发部署、查看运行状态/历史/日志，不再依赖 SSH 和 GitHub 网页。
3. 把部署定义（Dockerfile / docker-compose / nginx）从服务器收进仓库，基础设施即代码。
4. 设计上为多项目复用留口，作为将来"个人流水线平台"的雏形。

## 2. 范围

**包含**：
- `.github/workflows/deploy.yml` 流水线（后端 jar + Web 前端 dist 的构建与部署）
- 仓库新增 `deploy/` 目录：docker-compose.yml、backend.Dockerfile、web.Dockerfile、nginx.conf
- 后端新增超管部署代理模块（5 个端点，仅新增文件 + ResultCodeEnum 加错误码）
- 前端超管控制台新增"部署管理"页

**不包含**：
- 桌面端 Electron 安装包（维持 electron-builder 手动发 GitHub Release 现状）
- 一键回滚（v3 演进方向，依赖镜像仓库）
- 部署记录落库（v1 以 GitHub 为事实源，不落自己数据库）
- 单元测试基建（项目当前无测试体系，本次验证以端到端手测为准）

## 3. 现状摘要

- 仓库：github.com/shiningCloud2025/aI-simultaneous-interpretation-assistant，无任何 CI/CD 文件
- 服务器两台：数据库服务器（MySQL/Redis/Nacos/Sentinel）；部署服务器（Docker，docker-compose 本地构建，镜像不经过仓库）
- 仓库内没有 Dockerfile / docker-compose.yml / nginx 配置——它们只存在于部署服务器上，实施时需要对齐
- `prod` 分支荒废（仅初始 commit，落后 main 281 个提交），不启用
- 后端：Spring Boot 3.3.6 + JDK 21，配置走 Nacos，超管鉴权体系已存在
- 前端超管：`features/superadmin/`（antd v6 + adminApi.ts 封装）

## 4. 总体架构

两条独立链路：

```
写链路（部署）：
push dev → GitHub Actions [build-backend → build-web → deploy]
         → SSH(scp 产物 + ssh 执行) → 部署服务器 docker compose up -d --build

读链路（观测）：
超管页面 → 后端代理 (/sys/superadmin/deploy/*) → GitHub REST API → 返回状态/历史/日志
```

- 服务器全程不访问 GitHub（国内网络拉取慢且不稳），产物由 Actions 构建后推送过去。
- 部署记录以 GitHub 为事实源，系统不落库。

## 5. 流水线设计（.github/workflows/deploy.yml）

### 触发器

```yaml
on:
  push:
    branches: [dev]        # 自动部署分支；GitHub 平台约束：push 触发分支必须写死在 YAML
  workflow_dispatch:       # 手动触发，超管页面"一键部署"的落点
    inputs:
      branch: { default: dev }
```

> 平台约束：`workflow_dispatch` 要求工作流文件已存在于仓库默认分支（main）。
> 实施顺序上：deploy.yml 先合入 main，之后手动触发 API 才可用；push dev 触发要求该文件也存在于 dev。

### Jobs

| Job | 内容 | 要点 |
|---|---|---|
| `build-backend` | setup-java(temurin 21) + Maven 缓存 + `mvn -B -DskipTests package` + 上传 jar artifact | 后端模块目录 `backend/aI-assistant-server` |
| `build-web` | setup-node(24) + npm 缓存 + `npm ci && npm run build` + 上传 dist artifact | 目录 `frontend/web`；CI 必用 `npm ci` 按 lock 精确安装 |
| `deploy` | `needs` 前两者 → 下载 artifacts → 与 `deploy/` 打包 → scp 到服务器 → ssh 执行 `docker compose up -d --build` → 健康检查 | `concurrency: deploy-production` 防并发部署 |

### 健康检查

部署后重试轮询（最多 ~2 分钟）：web 容器 `curl -fsS http://127.0.0.1/` 返回 200；`docker compose ps` 确认 backend 容器 Up。失败则流水线标红，超管页面可见。

### 可复用性

服务器地址、部署目录、端口等用 GitHub `vars`/`secrets` 注入，不硬编码；其他项目复制 YAML 改配置即可复用。将来可抽 `workflow_call` 可复用工作流（v1 不抽）。

## 6. 服务器与部署定义

仓库新增：

```
deploy/
├── docker-compose.yml    # backend + web 两服务
├── backend.Dockerfile    # FROM eclipse-temurin:21-jre，COPY 预构建 jar
├── web.Dockerfile        # FROM nginx，COPY 预构建 dist + nginx.conf
└── nginx.conf            # /api 反代 backend；/asr WebSocket 反代（含 Upgrade 头）
```

- Dockerfile 为薄壳：构建在 Actions 完成，镜像只 COPY 产物，服务器秒级重建。
- 后端运行时配置（Nacos 地址/namespace 等）经 compose 引用的服务器本地 `.env` 注入，`.env` 不进仓库。
- 服务器一次性准备：建部署目录、为 Actions 生成专用 SSH 密钥对并加入 `authorized_keys`、迁移现有 compose 到新结构。

**待用户提供（实施第 3 步时）**：服务器现有 docker-compose.yml、Dockerfile、nginx 配置，用于对齐端口/目录/数据卷，不破坏在跑服务。

## 7. 后端改动清单（已授权范围）

严格只新增，唯一例外是 ResultCodeEnum 追加错误码。零新增 Maven 依赖（JDK 内置 HttpClient + Jackson）。

```
config/DeployGithubProperties.java                 # @ConfigurationProperties("deploy.github") + @RefreshScope
controller/superadmin/SuperAdminDeployController.java
service/superadmin/SuperAdminDeployService.java
service/superadmin/impl/SuperAdminDeployServiceImpl.java
domain/dto/DeployTriggerDTO.java
domain/vo/DeployConfigVO.java
domain/vo/DeployRunVO.java
domain/vo/DeployJobVO.java
domain/vo/DeployLogVO.java
common/enums/ResultCodeEnum.java                   # 追加：GitHub Token 失效、GitHub API 调用失败
```

端点（前缀 `/sys/superadmin/deploy`，走现有超管 JWT 鉴权）：

| 端点 | 作用 | 背后的 GitHub API |
|---|---|---|
| `GET /config` | 返回 owner/repo、绑定分支、workflow 名（Token 不回传） | 读 Nacos 配置 |
| `POST /trigger {branch}` | 一键部署 | `POST /repos/{o}/{r}/actions/workflows/{id}/dispatches` |
| `GET /runs?pageNum&pageSize&branch?` | 运行历史分页 | `GET .../workflows/{id}/runs` |
| `GET /runs/{runId}/jobs` | 某次运行的 Job/步骤状态 | `GET .../actions/runs/{id}/jobs` |
| `GET /jobs/{jobId}/logs` | 日志文本，tail 截断为最后 1000 行 | `GET .../actions/jobs/{id}/logs` |

Nacos 新增配置（`deploy.github.*`）：owner、repo、workflow-id、default-branch、token（fine-grained PAT，权限：Actions Read and write + Contents Read + Metadata Read）。

错误处理：Token 失效/限流/404 workflow 分别映射为明确业务异常，前端可见中文提示。

## 8. 前端改动（超管"部署管理"页）

- `features/superadmin/` 新增部署管理组件，复用 `adminApi.ts` 封装与 antd v6。
- 页面结构：
  - 配置卡片区：仓库、绑定分支、workflow 名 + "手动触发部署"按钮（可选分支，默认绑定分支）
  - 运行历史表格：状态 Tag、#编号、分支、commit 短 SHA+信息、触发人、耗时；运行中的行 15 秒轮询自动刷新（沿用项目现有模式）
  - 日志抽屉：点击运行 → Drawer 展示 Jobs 步骤状态 → 点击 Job 查看日志文本；附"去 GitHub 查看"深链兜底

## 9. 密钥与配置矩阵

| 密钥/配置 | 存放位置 | 用途 |
|---|---|---|
| `SERVER_HOST` / `SERVER_SSH_KEY` / `SERVER_USER` | GitHub 仓库 Secrets | Actions SSH 部署 |
| `deploy.github.token` | Nacos | 后端代理调 GitHub API |
| `deploy.github.owner/repo/workflow-id/default-branch` | Nacos | 代理目标配置，@RefreshScope 热更新 |
| 后端运行时配置（Nacos 地址等） | 服务器本地 `.env` | compose 注入，不进仓库 |

## 10. 验证计划（分五步，步步可回退）

1. `actionlint` 本地校验 YAML 语法
2. 手动 dispatch 只跑 build-backend / build-web 两个 Job（不接服务器），确认构建绿
3. 服务器一次性准备（目录、SSH key、对齐 compose）
4. dispatch 端到端部署验证 + 健康检查通过
5. 超管页面联通验证（触发/列表/日志）+ push dev 自动触发验证

前置：deploy.yml 先合入 main（workflow_dispatch 平台约束）。

## 11. 用户动手清单（边做边学）

1. 提供服务器现有 compose/Dockerfile/nginx 配置（5 分钟）
2. 生成 SSH 密钥对 + 配置 GitHub Secrets（15 分钟）
3. 创建 fine-grained PAT 并写入 Nacos（10 分钟）
4. 跟随验证计划执行五步，重点参与第 3、4 步（约 1 小时整块时间）

## 12. 演进路线

- v1（本次）：单 repo，push 自动部署 + 超管观测/触发
- v2：`deploy.github` 配置改为多 repo map，超管页支持多项目 → 流水线平台雏形
- v3：引入镜像仓库（TCR/ACR）+ 镜像 tag → 一键回滚
- v4：部署记录落库 + 飞书通知（已有现成 webhook 服务可复用）

## 13. 约束与偏好

- 前端可自由修改；后端仅可修改本清单（第 7 节）列出的内容，超出需再次授权
- 绑定分支默认 `dev`，最终确定后再改（YAML 一行 + Nacos 一项）
- 协作风格：轻流程，方案对话内精炼呈现，用户以练代学，动手步骤需带讲解
