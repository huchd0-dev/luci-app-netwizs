/*
 * Copyright (C) 2026 huchd0 <https://github.com/huchd0/luci-app-netwiz>
 * Licensed under the GNU General Public License v3.0
 */
'use strict';
'require view';
'require dom';
'require rpc';

var callDeviceList = rpc.declare({ object: 'netwiz_dev', method: 'get_list', expect: { '': {} } });
var callDeviceBind = rpc.declare({ object: 'netwiz_dev', method: 'bind', params: ['mac', 'ip', 'name'], expect: { result: 0 } });
var callDeviceUnbind = rpc.declare({ object: 'netwiz_dev', method: 'unbind', params: ['mac'], expect: { result: 0 } });

return view.extend({
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,

    render: function () {
        if (!document.querySelector('meta[name="viewport"]')) {
            var meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
            document.head.appendChild(meta);
        }

        var container = dom.create('div', { id: 'netwiz-dev-container' });

        var htmlTemplate = [
            '<link rel="stylesheet" type="text/css" href="' + L.resource('view/netwiz.css') + '?v=' + Date.now() + '">',

            '<style>',
            '.nd-control-bar { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 860px; margin: 0 auto 25px auto; background: #6366f1; padding: 15px 25px; border-radius: 16px; color: #fff; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.2); box-sizing: border-box; }',
            '.nd-cb-back { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; }',
            '.nd-cb-back:hover { background: rgba(255,255,255,0.3); transform: translateX(-3px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }',
            '.nd-cb-title-wrap { flex: 1; margin: 0 20px; text-align: left; }',
            '.nd-cb-title { font-size: 19px; font-weight: bold; line-height: 1.2; margin-bottom: 4px; color: #fff !important; border: none !important; padding: 0 !important; }',
            '.nd-cb-sub { font-size: 13.5px; opacity: 0.85; margin: 0 !important; }',
            '.nd-cb-refresh { padding: 8px 16px; background: transparent; border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; font-size: 14px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; flex-shrink: 0; }',
            '.nd-cb-refresh:hover { background: rgba(255,255,255,0.15); }',
            '.nd-refresh-icon { transition: transform 0.8s ease; }',

            '.nd-list { display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 860px; margin: 0 auto; padding: 0; }',
            '.nd-card { display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 22px 25px; border-radius: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); border: 1px dashed #cbd5e1; transition: all 0.2s ease; gap: 15px; box-sizing: border-box; }',
            '.nd-card:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.06); transform: translateY(-2px); border-color: #3b82f6; }',
            
            '.nd-card-left { flex: 2; min-width: 200px; display: flex; flex-direction: column; gap: 8px; }',
            '.nd-card-name { font-size: 16px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }',
            '.nd-card-mac { font-size: 13px; font-family: monospace; color: #64748b; background: #f8fafc; padding: 3px 8px; border-radius: 6px; width: fit-content; border: 1px dashed #cbd5e1; letter-spacing: 0.5px; }',
            
            '.nd-card-mid { flex: 1.2; min-width: 150px; display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }',
            '.nd-card-ip { font-size: 16.5px; font-weight: bold; color: #3b82f6; font-family: monospace; letter-spacing: 0.5px; }',
            '.nd-lease-info { font-size: 12px; color: #94a3b8; font-family: monospace; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px; }',

            '.nd-status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 11.5px; font-weight: bold; margin-left: 2px; }',
            '.nd-status-online { background: #d1fae5; color: #059669; }',
            '.nd-status-offline { background: #f1f5f9; color: #64748b; }',
            '.nd-dot-online { width: 6px; height: 6px; background: #10b981; border-radius: 50%; box-shadow: 0 0 6px #10b981; }',
            '.nd-dot-offline { width: 6px; height: 6px; background: #94a3b8; border-radius: 50%; }',
            
            '.nd-badge { padding: 2px 6px; border-radius: 4px; font-size: 11.5px; border: 1px solid transparent; white-space: nowrap; margin-left: 4px; font-weight: bold; }',
            '.nd-badge-static { background: #e0f2fe; color: #0284c7; border-color: #bae6fd; }',
            '.nd-badge-gw { background: #fef08a; color: #854d0e; border-color: #fde047; }',
            '.nd-badge-local { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }',
            
            '.nd-card-right { flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 12px; }',
            '.nd-btn { appearance: none; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14.5px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; font-family: inherit; }',
            '.nd-btn-green { background: #10b981; color: #fff; }',
            '.nd-btn-green:hover { background: #059669; box-shadow: 0 4px 12px rgba(16,185,129,0.3); transform: translateY(-1px); }',
            '.nd-btn-blue { background: #3b82f6; color: #fff; }',
            '.nd-btn-blue:hover { background: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.3); }',
            '.nd-btn-red { background: #fee2e2; color: #ef4444; }',
            '.nd-btn-red:hover { background: #fca5a5; color: #b91c1c; }',
            '.nd-btn-gray { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }',
            '.nd-btn-gray:hover { background: #e2e8f0; color: #0f172a; }',

            '#nd-modal-overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:2000000; align-items:center; justify-content:center; backdrop-filter: blur(4px); }',
            '.nd-modal-box { background:#fff; width:90%; max-width:420px; border-radius:16px; padding:30px; box-sizing:border-box; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); text-align:center; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }',
            '.nd-modal-title { font-size:22px; color:#0f172a; margin:0 0 15px 0 !important; font-weight:600; border: none !important; }',
            '.nd-input-group { text-align: left; margin-bottom: 18px; }',
            '.nd-input-label { display: block; font-size: 14px; color: #64748b; margin-bottom: 8px; font-weight: bold; }',
            '.nd-input { width: 100%; padding: 14px 16px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; outline: none; font-size: 15px; background: #f8fafc; transition: all 0.2s; font-family: inherit; }',
            '.nd-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }',
            '.nd-empty { text-align: center; padding: 60px 20px; color: #64748b; font-size: 15px; background: #fff; border-radius: 16px; border: 1px dashed #cbd5e1; width: 100%; box-sizing: border-box; margin-top: 15px; }',
            '.nd-spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid #6366f1; border-radius: 50%; animation: nd-spin 1s linear infinite; }',
            '@keyframes nd-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }',
            '@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }',

            '@media screen and (max-width: 768px) {',
            '  .nd-control-bar { padding: 15px; border-radius: 12px; max-width: 320px; margin: 0 auto 15px auto; flex-wrap: wrap; gap: 10px; }',
            '  .nd-cb-back { width: 36px; height: 36px; }',
            '  .nd-cb-title-wrap { margin: 0 10px; }',
            '  .nd-cb-title { font-size: 16px !important; }',
            '  .nd-cb-sub { display: none; }',
            '  .nd-card { flex-direction: column; align-items: flex-start; padding: 18px 15px; gap: 12px; max-width: 320px; margin: 0 auto; }',
            '  .nd-card-left, .nd-card-mid, .nd-card-right { width: 100%; }',
            '  .nd-card-right { justify-content: flex-start; margin-top: 5px; flex-wrap: wrap; }',
            '  .nd-btn { flex: 1; text-align: center; }',
            '}',
            '</style>',

            '<div class="nw-wrapper">',
            '   <div class="nw-header">',
            '      <div class="nw-title-wrap">',
            '         <div class="nw-main-title">Netwiz 网络设置向导</div>',
            '         <div class="nw-version-tag">v1.4.0</div>',
            '      </div>',
            '      <p>纯粹 · 安全 · 无损的极简配置</p>',
            '   </div>',

            '   <div class="nd-control-bar">',
            '      <div class="nd-cb-back" id="dev-back" title="返回主界面">',
            '         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
            '      </div>',
            '      <div class="nd-cb-title-wrap">',
            '          <div class="nd-cb-title">设备网络管家</div>',
            '          <p class="nd-cb-sub">终端设备状态监控与固定 IP 管理</p>',
            '      </div>',
            '      <div class="nd-cb-refresh" id="dev-refresh" title="重新扫描网络">',
            '         <svg class="nd-refresh-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path></svg> 刷新',
            '      </div>',
            '   </div>',

            '   <div id="nd-loading" style="display:flex; flex-direction:column; align-items:center; padding:50px 0; gap:15px; color:#64748b; font-weight:bold; width: 100%;">',
            '      <div class="nd-spinner"></div>',
            '      <span id="nd-loading-text">正在启动三维雷达探测...</span>',
            '   </div>',

            '   <div id="nd-list-container" class="nd-list" style="display: none;"></div>',
            '</div>', 

            '<div id="nd-modal-overlay">',
            '   <div class="nd-modal-box">',
            '       <div id="nd-m-title" class="nd-modal-title"></div>',
            '       <div id="nd-m-content" style="color:#475569; font-size:15px; margin-bottom:20px; text-align:left; line-height:1.5;"></div>',
            '       <div id="nd-m-form" style="display:none;">',
            '           <div class="nd-input-group">',
            '               <label class="nd-input-label">设备备注名</label>',
            '               <input type="text" id="nd-inp-name" class="nd-input" placeholder="例如: 小明的电脑" autocomplete="off">',
            '           </div>',
            '           <div class="nd-input-group">',
            '               <label class="nd-input-label">分配固定 IP</label>',
            '               <input type="text" id="nd-inp-ip" class="nd-input" placeholder="例如: 192.168.1.50" autocomplete="off">',
            '           </div>',
            '       </div>',
            '       <div style="display:flex; gap:15px; width:100%;">',
            '           <button id="nd-m-cancel" class="nd-btn nd-btn-gray" style="flex:1;">取消</button>',
            '           <button id="nd-m-ok" class="nd-btn nd-btn-blue" style="flex:1;">确定</button>',
            '       </div>',
            '   </div>',
            '</div>'
        ].join('\n');

        container.innerHTML = htmlTemplate;
        this.bindEvents(container);
        return container;
    },

    bindEvents: function(container) {
        container.querySelector('#dev-back').addEventListener('click', function() {
            window.location.href = window.location.pathname.replace('/netwiz_dev', '/netwiz');
        });

        var modalOverlay = container.querySelector('#nd-modal-overlay');
        var mTitle = container.querySelector('#nd-m-title');
        var mContent = container.querySelector('#nd-m-content');
        var mForm = container.querySelector('#nd-m-form');
        var mInpName = container.querySelector('#nd-inp-name');
        var mInpIp = container.querySelector('#nd-inp-ip');
        var mBtnOk = container.querySelector('#nd-m-ok');
        var mBtnCancel = container.querySelector('#nd-m-cancel');

        var openModal = function(options) {
            mTitle.innerText = options.title || '';
            if (options.content) { mContent.innerHTML = options.content; mContent.style.display = 'block'; } else { mContent.style.display = 'none'; }
            if (options.showForm) { mForm.style.display = 'block'; mInpName.value = options.defName || ''; mInpIp.value = options.defIp || ''; } else { mForm.style.display = 'none'; }
            mBtnOk.className = 'nd-btn ' + (options.danger ? 'nd-btn-red' : 'nd-btn-blue');
            mBtnOk.innerText = options.okText || '确定';
            mBtnOk.onclick = function() { var res = options.showForm ? { name: mInpName.value.trim(), ip: mInpIp.value.trim() } : true; if (options.onOk) options.onOk(res); modalOverlay.style.display = 'none'; };
            mBtnCancel.onclick = function() { modalOverlay.style.display = 'none'; };
            modalOverlay.style.display = 'flex';
            if (options.showForm) setTimeout(function(){ mInpName.focus(); }, 100);
        };

        var loadingEl = container.querySelector('#nd-loading');
        var loadingText = container.querySelector('#nd-loading-text');
        var listEl = container.querySelector('#nd-list-container');
        var refreshBtn = container.querySelector('#dev-refresh');

        var loadDevices = function() {
            loadingEl.style.display = 'flex';
            loadingText.innerText = "正在启动三维雷达探测...";
            listEl.style.display = 'none';
            
            callDeviceList().then(function(res) {
                // ==========================================
                // 前端调试：打印后端发来的数据
                console.log("================ Netwiz Debug ================");
                console.log("后端传来的原始数据: ", res);
                // ==========================================

                loadingEl.style.display = 'none';
                listEl.style.display = 'flex';
                
                var devices = (res && Array.isArray(res.devices)) ? res.devices : [];
                
                // 排序：网关优先 -> 本机优先 -> 静态优先 -> 在线优先
                devices.sort(function(a, b) {
                    if (a.is_gw !== b.is_gw) return (a.is_gw === 'true') ? -1 : 1;
                    if (a.is_local !== b.is_local) return (a.is_local === 'true') ? -1 : 1;
                    if (a.is_static !== b.is_static) return (a.is_static === 'true') ? -1 : 1;
                    if (a.online !== b.online) return (a.online === 'true' || a.online === true) ? -1 : 1;
                    return a.ip.localeCompare(b.ip, undefined, {numeric: true, sensitivity: 'base'});
                });

                if (devices.length === 0) {
                    listEl.innerHTML = '<div class="nd-empty">当前局域网内未发现任何设备记录</div>';
                    return;
                }

                var html = "";
                devices.forEach(function(dev) {
                    var isOnline = dev.online === true || dev.online === 'true';
                    var isStatic = dev.is_static === true || dev.is_static === 'true';
                    
                    var statusBadgesHtml = isOnline 
                        ? '<span class="nd-status-badge nd-status-online"><span class="nd-dot-online"></span>在线</span>' 
                        : '<span class="nd-status-badge nd-status-offline"><span class="nd-dot-offline"></span>离线</span>';
                        
                    if (isStatic) statusBadgesHtml += '<span class="nd-badge nd-badge-static">🔒 静态</span>';
                    if (dev.is_gw === 'true') statusBadgesHtml += '<span class="nd-badge nd-badge-gw">🌐 上级网关</span>';
                    if (dev.is_local === 'true') statusBadgesHtml += '<span class="nd-badge nd-badge-local">💻 本机系统</span>';

                    var leaseText = dev.lease || '-';
                    if (isStatic && leaseText === '-') leaseText = '静态分配 (Static)';
                    if (dev.is_gw === 'true') leaseText = '系统网关路由';

                    var actions = "";
                    if (isStatic) {
                        actions = '<button class="nd-btn nd-btn-gray btn-edit" data-mac="'+dev.mac+'" data-ip="'+dev.ip+'" data-name="'+dev.name+'">修改</button>' +
                                  '<button class="nd-btn nd-btn-red btn-unbind" data-mac="'+dev.mac+'">解绑</button>';
                    } else {
                        actions = '<button class="nd-btn nd-btn-green btn-bind" data-mac="'+dev.mac+'" data-ip="'+dev.ip+'" data-name="'+dev.name+'"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> 一键固定</button>';
                    }

                    var displayName = dev.name === 'Unknown' ? '<i style="color:#94a3b8; font-weight:normal;">未知设备</i>' : dev.name;

                    html += [
                        '<div class="nd-card">',
                        '   <div class="nd-card-left">',
                        '       <div class="nd-card-name"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg> ',
                        '           <span style="word-break:break-all;">' + displayName + '</span>',
                        '           ' + statusBadgesHtml, 
                        '       </div>',
                        '       <div class="nd-card-mac">' + (dev.mac).toUpperCase() + '</div>',
                        '   </div>',
                        
                        '   <div class="nd-card-mid">',
                        '       <div class="nd-card-ip">' + dev.ip + '</div>',
                        '       <div class="nd-lease-info"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ' + leaseText + '</div>',
                        '   </div>',
                        
                        '   <div class="nd-card-right">',
                        '       ' + actions,
                        '   </div>',
                        '</div>'
                    ].join('\n');
                });

                listEl.innerHTML = html;
                
                container.querySelectorAll('.btn-bind, .btn-edit').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        var mac = this.getAttribute('data-mac');
                        var ip = this.getAttribute('data-ip');
                        var rawName = this.getAttribute('data-name');
                        var isEdit = this.classList.contains('btn-edit');
                        
                        openModal({
                            title: isEdit ? '修改设备信息' : '一键固定 IP',
                            content: '正在为 MAC: <span style="font-family:monospace; color:#3b82f6; font-weight:bold;">' + mac.toUpperCase() + '</span> 进行配置。',
                            showForm: true,
                            defName: rawName === 'Unknown' ? '' : rawName,
                            defIp: ip,
                            okText: isEdit ? '保存修改' : '绑定此设备',
                            onOk: function(data) {
                                if (!data.ip) { alert("IP 地址不能为空！"); return; }
                                listEl.style.display = 'none';
                                loadingEl.style.display = 'flex';
                                loadingText.innerText = "正在安全写入并无感重启服务...";
                                
                                callDeviceBind(mac, data.ip, data.name).then(function() {
                                    setTimeout(loadDevices, 1000);
                                }).catch(function() { setTimeout(loadDevices, 1000); });
                            }
                        });
                    });
                });

                container.querySelectorAll('.btn-unbind').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        var mac = this.getAttribute('data-mac');
                        openModal({
                            title: '解除 IP 绑定',
                            content: '确定要解除对该设备 (<b style="font-family:monospace;">'+mac.toUpperCase()+'</b>) 的静态 IP 绑定吗？<br><br>解除后它将在下次请求网络时重新获取随机 IP。',
                            danger: true,
                            okText: '确认解绑',
                            onOk: function() {
                                listEl.style.display = 'none';
                                loadingEl.style.display = 'flex';
                                loadingText.innerText = "正在释放静态绑定...";
                                callDeviceUnbind(mac).then(function() {
                                    setTimeout(loadDevices, 1000);
                                }).catch(function() { setTimeout(loadDevices, 1000); });
                            }
                        });
                    });
                });

            }).catch(function(e) {
                loadingEl.style.display = 'none';
                listEl.style.display = 'block';
                listEl.innerHTML = '<div class="nd-empty" style="color:#ef4444;">❌ 扫描失败：无法获取底层数据 ('+e+')</div>';
            });
        };

        refreshBtn.addEventListener('click', function() {
            var icon = this.querySelector('.nd-refresh-icon');
            icon.style.transform = 'rotate(360deg)';
            setTimeout(function(){ icon.style.transform = 'none'; }, 800);
            loadDevices();
        });

        loadDevices();
    }
});
