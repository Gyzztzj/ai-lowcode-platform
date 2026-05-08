# 贡献指南

## 分支规范

- **main** - 主分支，用于生产部署
- **dev** - 开发分支，日常开发使用
- **feat/* - 新功能分支
- **fix/* - 修复分支
- **docs/* - 文档分支

## 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>
```

### Type 类型

| 类型 | 说明 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `docs` | 文档更新 |
| `style` | 代码格式调整 |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` | 构建相关 |
| `ci` | CI/CD 相关 |
| `chore` | 其他 |
| `revert` | 回滚 |

### 示例

```
feat(auth): add social login
fix(server): handle null case in API
docs: update README
```

## 设置提交规范

项目已配置好提交规范，只需安装根目录依赖即可：

```bash
# 安装根目录依赖 (husky + commitlint)
pnpm install
```

Husky 钩子会在每次 commit 时自动运行。

## 工作流程

1. 创建分支 `git checkout -b feat/my-feature dev`
2. 编写代码
3. 提交 `git commit -m "feat: 描述"`
4. 推送到远程 `git push origin feat/my-feature`
5. 创建 Pull Request 到 `dev`
