# Vercel 部署指南

## 前置条件

- 一个 [Vercel](https://vercel.com) 账号
- 项目代码推送到 GitHub 仓库

## 部署步骤

### 1. 推送代码到 GitHub

```bash
git init
git add .
git commit -m "feat: 小红书内容工厂"
git remote add origin <你的GitHub仓库地址>
git push -u origin main
```

### 2. 在 Vercel 导入项目

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"Add New"** → **"Project"**
3. 选择你的 GitHub 仓库
4. Framework Preset 选择 **Next.js**

### 3. 配置环境变量

在 Vercel 项目设置 → **Settings** → **Environment Variables** 中添加以下变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `COZE_WORKLOAD_IDENTITY_API_KEY` | Coze API 认证密钥 | 从沙箱环境获取 |
| `COZE_INTEGRATION_BASE_URL` | Coze API 基础地址 | `https://integration.coze.cn` |
| `COZE_INTEGRATION_MODEL_BASE_URL` | Coze 模型 API 地址 | `https://integration.coze.cn/api/v3` |

> **获取密钥方式**：在当前沙箱终端执行 `echo $COZE_WORKLOAD_IDENTITY_API_KEY`

### 4. 构建配置确认

Vercel 应自动检测到 Next.js 项目，确认以下配置：

- **Build Command**: `pnpm vercel-build`（已在 vercel.json 中配置）
- **Output Directory**: `.next`（自动检测）
- **Install Command**: `pnpm install --frozen-lockfile`（已在 vercel.json 中配置）

### 5. 部署

点击 **"Deploy"** 等待构建完成。

## 注意事项

### 免费版限制

- Serverless Function 执行超时：**10秒**（Pro 版 60 秒）
- 流式 SSE 接口（`/api/generate`、`/api/recommend` 等）首字节返回快，通常不受影响
- **`/api/batch`（矩阵批量生成）** 可能执行时间较长，建议：
  - Vercel Pro 版（60s 超时）
  - 或减小 `count` 参数（如生成 2 条而非 5 条）

### 不需要的文件

以下文件/目录是沙箱环境专用，Vercel 部署时会被忽略（无需删除）：

- `src/server.ts` — 自定义 Node.js 服务器，Vercel 不使用
- `scripts/` — 沙箱构建/启动脚本
- `.coze` — 沙箱项目配置
- `.cozeproj/` — 沙箱脚手架

### 自定义域名

部署完成后，可在 Vercel 项目 Settings → Domains 中绑定自定义域名。

## 快速获取环境变量

在沙箱终端中运行以下命令，复制输出结果到 Vercel 环境变量配置：

```bash
echo "COZE_WORKLOAD_IDENTITY_API_KEY=$COZE_WORKLOAD_IDENTITY_API_KEY"
echo "COZE_INTEGRATION_BASE_URL=$COZE_INTEGRATION_BASE_URL"
echo "COZE_INTEGRATION_MODEL_BASE_URL=$COZE_INTEGRATION_MODEL_BASE_URL"
```
