#!/bin/sh
# NetWiz 全自动一键安装脚本

echo "========================================="
echo "   正在开始安装 NetWiz 网络向导..."
echo "========================================="

# 你的 GitHub 仓库名
REPO="huchd0/luci-app-netwiz"

# 智能判断包管理器：优先检测有没有 apk (代表是新系统)
if command -v apk >/dev/null 2>&1; then
    echo "[检测结果] 当前系统为 OpenWrt 25.x 或更高版本 (apk)"
    echo "📥 正在拉取最新版 .apk 安装包..."
    wget -qO /tmp/luci-app-netwiz.apk "https://github.com/${REPO}/releases/download/latest/luci-app-netwiz.apk"
    
    echo "📦 正在执行免检安装..."
    apk add --allow-untrusted /tmp/luci-app-netwiz.apk

# 如果没有 apk，检测有没有 opkg (代表是老系统)
elif command -v opkg >/dev/null 2>&1; then
    echo "[检测结果] 当前系统为 OpenWrt 23.05 或更早版本 (opkg)"
    echo "📥 正在拉取最新版 .ipk 安装包..."
    wget -qO /tmp/luci-app-netwiz.ipk "https://github.com/${REPO}/releases/download/latest/luci-app-netwiz.ipk"
    
    echo "📦 正在执行常规安装..."
    opkg install /tmp/luci-app-netwiz.ipk

# 都不符合，直接报错拦截
else
    echo "❌ 错误: 未知系统环境，找不到 apk 或 opkg 命令！"
    exit 1
fi

# 安装成功的收尾工作
echo "🧹 正在清理系统界面缓存..."
rm -f /tmp/luci-indexcache /tmp/luci-modulecache/*
/etc/init.d/rpcd restart

echo "========================================="
echo " 🎉 NetWiz 安装成功！请刷新浏览器界面。"
echo "========================================="
