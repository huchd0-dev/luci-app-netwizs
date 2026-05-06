/*
 * Copyright (C) 2026 huchd0 <https://github.com/huchd0/luci-app-netwiz>
 * Licensed under the GNU General Public License v3.0
 */
'use strict';
'require view';
'require dom';
'require rpc';

// 调用后端的接口
var callDeviceList = rpc.declare({ object: 'netwiz_dev', method: 'get_list', expect: { devices: [] } });
var callDeviceBind = rpc.declare({ object: 'netwiz_dev', method: 'bind', params: ['mac', 'ip', 'name'], expect: { result: 0 } });
var callDeviceUnbind = rpc.declare({ object: 'netwiz_dev', method: 'unbind', params: ['mac'], expect: { result: 0 } });

return view.extend({
    // 屏蔽默认的保存和重置按钮
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,

    render: function () {
        // 确保手机端视口缩放正常
        if (!document.querySelector('meta[name="viewport"]')) {
            var meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
            document.head.appendChild(meta);
        }

        var container = dom.create('div', { id: 'netwiz-dev-container' });

        var htmlTemplate = [
            '<style>',
            '/* === 极简设备管家 UI === */',
            '#maincontent, .main-right { background: #f8fafc; overflow-y: auto !important; }',
            '#netwiz-dev-container { max-width: 850px; margin: 0 auto; padding: 20px 10px 80px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }',
            '.nd-header { display: flex; align-items: center; background: #5e72e4; color: #fff; padding: 20px 25px; border-radius: 16px; margin-bottom: 25px; box-shadow: 0 10px 25px rgba(94, 114, 228, 0.15); }',
            '.nd-back-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 12px; margin-right: 20px; cursor: pointer; transition: all 0.2s ease; }',
            '.nd-back-btn:hover { background: rgba(255,255,255,0.3); transform: translateX(-3px); }',
            '.nd-title { font-size: 22px; font-weight: 600; margin: 0; letter-spacing: 1px; }',
            '.nd-subtitle { font-size: 13.5px; opacity: 0.85; margin-top: 4px; font-weight: normal; }',
            '.nd-refresh-btn { margin-left: auto; display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(255,255,255,0.15); border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.2); }',
            '.nd-refresh-btn:hover { background: rgba(255,255,255,0.25); }',
            
            '.nd-list { display: flex; flex-direction: column; gap: 15px; }',
            '.nd-card { display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 20px 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; transition: all 0.2s ease; flex-wrap: wrap; gap: 15px; }',
            '.nd-card:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.06); transform: translateY(-2px); border-color: #e2e8f0; }',
            
            '.nd-info { flex: 2; min-width: 220px; display: flex; flex-direction: column; gap: 6px; }',
            '.nd-name { font-size: 16.5px; font-weight: 600; color: #0f172a; display: flex; align-items: center; gap: 8px; word-break: break-all; }',
            '.nd-mac { font-size: 13px; color: #64748b; font-family: monospace; letter-spacing: 0.5px; background: #f8fafc; padding: 2px 6px; border-radius: 6px; display: inline-block; width: fit-content; border: 1px solid #e2e8f0; }',
            
            '.nd-ip-wrap { flex: 1.5; min-width: 160px; display: flex; flex-direction: column; gap: 6px; }',
            '.nd-ip { font-size: 16px; font-weight: bold; color: #3b82f6; font-family: monospace; letter-spacing: 0.5px; }',
            '.nd-status { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }',
            
            '.nd-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }',
            '.nd-badge-online { background: #d1fae5; color: #059669; }',
            '.nd-badge-offline { background: #f1f5f9; color: #64748b; }',
            '.nd-badge-static { background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; }',
            
            '.nd-actions { flex: 1; min-width: 160px; display: flex; justify-content: flex-end; gap: 10px; }',
            '.nd-btn { appearance: none; border: none; padding: 10px 18px; border-radius: 8px; font-size: 14.5px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; }',
            '.nd-btn-green { background: #10b981; color: #fff; }',
            '.nd-btn-green:hover { background: #059669; box-shadow: 0 4px 12px rgba(16,185,129,0.3); transform: translateY(-1px); }',
            '.nd-btn-red { background: #fee2e2; color: #ef4444; }',
            '.nd-btn-red:hover { background: #fca5a5; color: #b91c1c; }',
            '.nd-btn-gray { background: #f1f5f9; color: #475569; }',
            '.nd-btn-gray:hover { background: #e2e8f0; color: #0f172a; }',

            '.nd-empty { text-align: center; padding: 50px 20px; color: #64748b; font-size: 15px; background: #fff; border-radius: 16px; border: 1px dashed #cbd5e1; }',
            '.nd-spinner { width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid #fff; border-radius: 50%; animation: nd-spin 1s linear infinite; }',
            '@keyframes nd-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }',

            '@media screen and (max-width: 768px) {',
            '  .nd-header { padding: 20px 15px; margin-bottom: 15px; border-radius: 12px; }',
            '  .nd-title { font-size: 19px; }',
            '  .nd-card { flex-direction: column; align-items: flex-start; padding: 18px 15px; gap: 12px; }',
            '  .nd-info, .nd-ip-wrap, .nd-actions { width: 100%; min-width: 0; }',
            '  .nd-actions { justify-content: flex-start; flex-wrap: wrap; margin-top: 5px; }',
            '  .nd-btn { flex: 1; text-align: center; }',
            '}'
            ].join('\n') + '</style>',

            '<div class="nd-header">',
            '   <div class="nd-back-btn" id="dev-back" title="返回主界面">',
            '      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
            '   </div>',
            '   <div>',
            '       <h2 class="nd-title">设备网络管家</h2>',
            '       <div class="nd-subtitle">终端设备状态监控与固定 IP 管理</div>',
            '   </div>',
            '   <div class="nd-refresh-btn" id="dev-refresh">',
            '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path></svg> 刷新',
            '   </div>',
            '</div>',

            '<div id="nd-loading" style="display:flex; flex-direction:column; align-items:center; padding:50px 0; gap:15px; color:#64748b; font-weight:bold;">',
            '   <div class="nd-spinner" style="border-color:#e2e8f0; border-top-color:#3b82f6; width:40px; height:40px; border-width:4px;"></div>',
            '   <span>正在启动三维雷达探测...</span>',
            '</div>',

            '<div id="nd-list-container" class="nd-list" style="display: none;"></div>'
        ].join('');

        container.innerHTML = htmlTemplate;
        this.bindEvents(container);
        return container;
    },

    bindEvents: function(container) {
        // 返回 netwiz 界面
        container.querySelector('#dev-back').addEventListener('click', function() {
            var backUrl = window.location.pathname.replace('/netwiz_dev', '/netwiz');
            window.location.href = backUrl;
        });

        var loadingEl = container.querySelector('#nd-loading');
        var listEl = container.querySelector('#nd-list-container');
        var refreshBtn = container.querySelector('#dev-refresh');

        var loadDevices = function() {
            loadingEl.style.display = 'flex';
            listEl.style.display = 'none';
            
            // 调用后端的三维扫描
            callDeviceList().then(function(res) {
                loadingEl.style.display = 'none';
                listEl.style.display = 'flex';
                
                var devices = res || [];
                
                // 在线的在前面，已固定的在前面，然后再按 IP 排序
                devices.sort(function(a, b) {
                    if (a.online !== b.online) return a.online ? -1 : 1;
                    if (a.is_static !== b.is_static) return (a.is_static === 'true') ? -1 : 1;
                    return a.ip.localeCompare(b.ip, undefined, {numeric: true, sensitivity: 'base'});
                });

                if (devices.length === 0) {
                    listEl.innerHTML = '<div class="nd-empty">当前局域网内未发现任何设备记录。</div>';
                    return;
                }

                var html = "";
                devices.forEach(function(dev) {
                    var isOnline = dev.online === true || dev.online === 'true';
                    var isStatic = dev.is_static === true || dev.is_static === 'true';
                    
                    var badgeStatus = isOnline 
                        ? '<span class="nd-badge nd-badge-online"><span style="display:inline-block;width:8px;height:8px;background:#10b981;border-radius:50%;margin-right:2px;"></span>在线</span>' 
                        : '<span class="nd-badge nd-badge-offline">离线</span>';
                        
                    var badgeStatic = isStatic 
                        ? '<span class="nd-badge nd-badge-static">🔒 静态 IP</span>' 
                        : '';

                    var actions = "";
                    if (isStatic) {
                        actions = '<button class="nd-btn nd-btn-gray btn-edit" data-mac="'+dev.mac+'" data-ip="'+dev.ip+'" data-name="'+dev.name+'">修改</button>' +
                                  '<button class="nd-btn nd-btn-red btn-unbind" data-mac="'+dev.mac+'">解绑</button>';
                    } else {
                        actions = '<button class="nd-btn nd-btn-green btn-bind" data-mac="'+dev.mac+'" data-ip="'+dev.ip+'" data-name="'+dev.name+'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> 一键固定</button>';
                    }

                    // 避免 Unknown 显示得太丑，稍加美化
                    var displayName = dev.name === 'Unknown' ? '<i style="color:#94a3b8;">未知设备</i>' : dev.name;

                    html += [
                        '<div class="nd-card">',
                        '   <div class="nd-info">',
                        '       <div class="nd-name"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg> ' + displayName + '</div>',
                        '       <div class="nd-mac">' + (dev.mac).toUpperCase() + '</div>',
                        '   </div>',
                        '   <div class="nd-ip-wrap">',
                        '       <div class="nd-ip">' + dev.ip + '</div>',
                        '       <div class="nd-status">' + badgeStatus + badgeStatic + '</div>',
                        '   </div>',
                        '   <div class="nd-actions">',
                        '       ' + actions,
                        '   </div>',
                        '</div>'
                    ].join('');
                });

                listEl.innerHTML = html;
                
                // 绑定真实点击事件
                container.querySelectorAll('.btn-bind').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        var mac = this.getAttribute('data-mac');
                        var ip = this.getAttribute('data-ip');
                        var name = this.getAttribute('data-name');
                        
                        this.innerHTML = '<div class="nd-spinner" style="width:16px;height:16px;border-width:2px;border-top-color:#fff;"></div> 处理中';
                        this.disabled = true;
                        
                        // 调用后端的绑定接口
                        callDeviceBind(mac, ip, name).then(function() {
                            loadDevices(); // 绑定成功，无感刷新列表
                        }).catch(function(e) {
                            alert("固定失败，请检查网络: " + e);
                            loadDevices();
                        });
                    });
                });

                container.querySelectorAll('.btn-edit').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        var mac = this.getAttribute('data-mac');
                        var name = this.getAttribute('data-name');
                        var currentIp = this.getAttribute('data-ip');
                        
                        // 弹出一个系统极简输入框让用户修改 IP
                        var newIp = window.prompt("请输入您要为该设备指定的新静态 IP 地址：", currentIp);
                        
                        // 用户点击了取消，或者输入为空、未修改，则不操作
                        if (newIp === null || newIp.trim() === "" || newIp.trim() === currentIp) return;
                        
                        this.innerHTML = "修改中...";
                        this.disabled = true;
                        
                        callDeviceBind(mac, newIp.trim(), name).then(function() {
                            loadDevices();
                        }).catch(function(e) {
                            alert("IP 格式有误或保存失败: " + e);
                            loadDevices();
                        });
                    });
                });

                container.querySelectorAll('.btn-unbind').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        if(confirm("解除后，该设备将会在租期到期后重新获取随机 IP。\n\n确定要解除静态 IP 绑定吗？")) {
                            var mac = this.getAttribute('data-mac');
                            this.innerHTML = "解绑中...";
                            this.disabled = true;
                            
                            callDeviceUnbind(mac).then(function() {
                                loadDevices();
                            }).catch(function(e) {
                                alert("解除失败: " + e);
                                loadDevices();
                            });
                        }
                    });
                });

            }).catch(function(e) {
                loadingEl.style.display = 'none';
                listEl.style.display = 'block';
                listEl.innerHTML = '<div class="nd-empty" style="color:#ef4444;">❌ 扫描失败：无法获取底层数据 ('+e+')</div>';
            });
        };

        refreshBtn.addEventListener('click', function() {
            var icon = this.querySelector('svg');
            icon.style.animation = 'nd-spin 1s linear infinite';
            setTimeout(function(){ icon.style.animation = ''; }, 1000);
            loadDevices();
        });

        // 页面打开时自动加载一次
        loadDevices();
    }
});
