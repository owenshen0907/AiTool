# AiTool 网站自动发布

网站代码和公开笔记分开发布。网站仓库 `AiTool` 的 `main` 在 CI 成功后生成
`linux/amd64` 镜像，按不可变 digest 部署到 `owenshen.top`；笔记仓库
`AiTool-content` 已有自己的 `deploy-content.yml`，继续独立同步到服务器的
`/home/AiTool-content`，网站只以只读挂载读取它。

## 发布门禁

1. 功能改动通过 PR 和当前 head 的 `CI`；合并前按仓库 review 门禁处理。
2. 合并到 `main` 后，`CI` 再验证主线提交。只有成功的 `main` push 会触发
   `Publish and deploy`；PR 的 CI 结果不能触发发布。
3. 发布工作流再次核对该 SHA 仍是 `main` 最新提交，构建镜像并推至 GHCR，
   标记 OCI revision，输出不可变 digest。部署前再次核对主线 SHA。
4. 服务器仅接受精确 SHA + digest 的受限 SSH 命令，拉取镜像后检查 revision，
   再切换容器；本机 `/`、`/notes` 健康检查失败会自动恢复旧容器。
5. GitHub 再检查公网 `/`、`/notes`；失败时调用同一受限 SSH 入口回滚，
   并将工作流标为失败。部署工作流使用 `production` environment，
   仅允许 `main`，不与 PR 共享密钥。

`AITOOL_RELEASE_READY` 仓库变量必须先设为 `true` 才会自动部署；缺省时仅
发布镜像，不改线上。首次切换前应先完成下列引导和生产验证。

## 一次性引导

- 在 GitHub 仓库创建 `production` environment，限定部署分支为 `main`。
  保存 environment secret `AITOOL_WEB_DEPLOY_KEY`（新生成的专用
  Ed25519 私钥），environment vars `AITOOL_DEPLOY_HOST`（服务器 IP）
  和 `AITOOL_DEPLOY_HOST_KEY`（已从可信来源核验的
  `[host]:322 ssh-ed25519 ...` 完整 known_hosts 行）。
  不复用个人 root key、Notes 的 `aitooldeploy` key 或生产 `.env.local`。
- 服务器创建单独的 `aitoolwebdeploy` 用户，锁定密码。以 root 拥有并安装
  `scripts/ci-deploy-entry.sh` 到
  `/usr/local/libexec/aitool-deploy-entry`，
  `scripts/ci-deploy-root.sh` 到 `/usr/local/sbin/aitool-release`，
  权限均为 0755。验证文件散列等于本次已 review 的 PR 内容。
- 该用户的 `authorized_keys` 只放专用公钥，前缀为
  `restrict,command="/usr/local/libexec/aitool-deploy-entry"`。
  在 `/etc/sudoers.d/aitool-release` 仅授权
  `aitoolwebdeploy ALL=(root) NOPASSWD: /usr/local/sbin/aitool-release`，
  用 `visudo -cf` 验证。受限脚本不接受任意 shell 命令或镜像仓库。
- 检查 `/home/AiTool/.env.local`、`/home/AiTool-content/posts` 都存在，
  `aitool` 当前容器健康，Nginx 指向 `127.0.0.1:3000`。现有
  `/home/AiTool` 工作树可继续保留；自动发布不对其 `git pull`、
  stash 或覆盖它的未提交文件。生产 env 文件仅需 root 读取，核对原有
  启动方式后收紧为 root 拥有、0600，避免新部署账户或其他本地用户读取。
- 核验新镜像的生产依赖安全问题已处理、本地 `linux/amd64` 镜像构建和
  Notes 读取通过。再设仓库变量 `AITOOL_RELEASE_READY=true`，
  由下一次合入后的主线 CI 自动发布并检查公网。

GitHub Actions 的 `GITHUB_TOKEN` 仅在当次工作流中作为短期 GHCR 凭据通过
SSH 标准输入传入；服务器拉取后清理临时 Docker 登录配置。服务器不保存 GitHub
长期 PAT。受限账户不能直接使用 Docker 或其他 sudo 命令。

## 回滚和排障

GitHub Actions 的 `Publish and deploy` 可手工运行，选择 `rollback`，
恢复上一枚镜像并复查公网路由。容器切换失败会自动恢复旧容器。
回滚保留当前镜像作为下一次的 previous，便于定位；如上一次镜像本身不健康，
不要反复切换，应先看 Nginx、容器日志和内容挂载。

审计时记录 CI run、发布 run、主线 SHA、镜像 digest、服务器输出的镜像 ID、
公网检查结果和 Notes 仓库自己的同步 run。不要把部署私钥、GHCR token、
生产 env 值或服务器备份放进仓库或日志。
