# 🐱 Pycthoant Android

喵化你的 Python 输出——Android 版本。

## 下载

**最新版本 APK：**

👉 [点击下载 APK](https://github.com/lzd4442/pycthoant-android/releases/latest)

下载后直接安装（Android 7.0+），无需 Python 环境。

## 功能

- 自动检测 GitHub 最新版本
- 一键下载最新 APK
- 自动调用系统安装器安装

## 安装说明

1. 下载 APK 文件
2. 点击安装
3. 若提示「安装来源未知」，前往：**设置 → 安全 → 允许未知来源应用**
4. 打开 App，享用法术 🐱

## 技术栈

- 前端：Vite + TypeScript + Capacitor
- 打包：GitHub Actions 自动编译 APK
- 版本检测：GitHub Releases API

## 源码

```bash
git clone https://github.com/lzd4442/pycthoant-android.git
cd pycthoant-android
npm install
npm run build
npx cap sync android
```

## 自动构建

每次推送到 `main` 分支，GitHub Actions 自动编译 APK。

发布新版本：
```bash
git tag v1.0.1
git push origin v1.0.1
```
