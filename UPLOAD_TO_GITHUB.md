# 上传到 GitHub

1. 下载并解压 `football-career-v20-source.zip`。
2. 打开 GitHub 仓库 `Ethanhui6/zuqiu1`。
3. 建议先备份当前 `main` 分支，或新建 `backup-before-v20` 分支。
4. 删除仓库中旧版源码后，选择 **Add file → Upload files**。
5. 上传解压后的全部文件和文件夹；不要上传外层压缩包本身。
6. 提交到 `main`。GitHub Actions 会运行 `npm test`、`npm run build` 并部署 Cloudflare Pages。
7. 仓库 Secrets 名称必须保持：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

注意：GitHub 网页不会自动解压 ZIP，因此必须先解压，再上传里面的内容。
