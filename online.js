/* 联网模式客户端。所有权威状态都来自服务器 snapshot。 */
(function () {
  const online = {
    ws: null,
    active: false,
    phone: localStorage.getItem('superFarmerPhone') || '',
    code: '',
    creating: false,
    lastShownEventId: 0,
    closing: false,
  };

  const defaultBase = location.protocol.startsWith('http') ? location.origin : 'http://127.0.0.1:8787';
  const serverBase = String(window.GAME_API_URL || localStorage.getItem('superFarmerApiUrl') || defaultBase).replace(/\/+$/, '');

  function randomCode(len = 6) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  }

  function send(obj) {
    if (online.ws && online.ws.readyState === WebSocket.OPEN) online.ws.send(JSON.stringify(obj));
  }

  function sendAction(action, payload = {}) {
    send({ type:'game_action', action:{ type:action, ...payload } });
  }

  function ensureStyles() {
    if (document.getElementById('onlineStyles')) return;
    const style = document.createElement('style');
    style.id = 'onlineStyles';
    style.textContent = `
      .online-overlay{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:24px;
        background:linear-gradient(180deg,#bfe9ff,#90ee90);overflow:auto;}
      .online-card{background:var(--card);border:4px solid #fff;border-radius:26px;padding:24px;width:min(430px,94vw);box-shadow:var(--shadow);}
      .online-card h2{margin:0 0 16px;color:var(--ink);}
      .online-input{width:100%;padding:14px;border-radius:16px;border:3px solid #f0d9a8;font-size:17px;margin-bottom:14px;}
      .online-btn{width:100%;padding:15px;border-radius:18px;font-size:17px;font-weight:800;color:#fff;margin-bottom:10px;
        background:linear-gradient(180deg,#ffc65c,var(--accent));box-shadow:0 5px 0 var(--accent-d);}
      .online-btn.secondary{background:#fff;color:var(--ink);box-shadow:0 4px 0 #e6cf9a;}
      .online-btn:disabled{opacity:.55;}
      .online-tip{font-size:12px;color:var(--ink-soft);line-height:1.6;margin:8px 0 0;}
      .room-code{font-size:36px;font-weight:900;letter-spacing:6px;text-align:center;color:var(--accent-d);margin:10px 0 14px;}
      .player-list{display:flex;flex-direction:column;gap:8px;margin:14px 0;}
      .player-row{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:16px;background:#fff6e6;font-weight:800;}
      .online-dot{width:10px;height:10px;border-radius:50%;background:#a8e6cf;}
      .online-dot.off{background:#e0e0e0;}
      .modal-center{display:flex;align-items:center;justify-content:center;min-height:40vh;font-weight:800;color:var(--ink);}
    `;
    document.head.appendChild(style);
  }

  function getOverlay() {
    ensureStyles();
    let el = document.getElementById('onlineOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'onlineOverlay';
      el.className = 'online-overlay hidden';
      document.body.appendChild(el);
    }
    return el;
  }

  function showOverlay() { getOverlay().classList.remove('hidden'); }
  function hideOverlay() { getOverlay().classList.add('hidden'); }

  function clearOverlay() {
    const el = getOverlay();
    el.innerHTML = '';
    return el;
  }

  function showOnlineHome() {
    const el = clearOverlay();
    el.innerHTML = `
      <div class="online-card">
        <h2>联网模式</h2>
        <input class="online-input" id="onlinePhone" inputmode="numeric" maxlength="20" placeholder="请输入手机号" value="${online.phone || ''}">
        <button class="online-btn" id="createRoomBtn">创建房间</button>
        <input class="online-input" id="joinCode" maxlength="8" placeholder="输入联网码加入" value="" style="text-transform:uppercase">
        <button class="online-btn secondary" id="joinRoomBtn">加入房间</button>
        <p class="online-tip">同一手机号是同一个用户 ID。创建后可以把联网码分享给其他玩家。</p>
      </div>
    `;
    showOverlay();
    const lastRoom = localStorage.getItem('superFarmerRoom');
    if (lastRoom) $('joinCode').value = lastRoom;
    $('createRoomBtn').onclick = () => {
      const phone = $('onlinePhone').value.replace(/\D/g, '');
      if (!phone) { toast('请填写手机号'); return; }
      online.phone = phone;
      localStorage.setItem('superFarmerPhone', phone);
      connect(phone, randomCode(), true);
    };
    $('joinRoomBtn').onclick = () => {
      const phone = $('onlinePhone').value.replace(/\D/g, '');
      const code = $('joinCode').value.trim().toUpperCase();
      if (!phone) { toast('请填写手机号'); return; }
      if (!code) { toast('请填写联网码'); return; }
      online.phone = phone;
      localStorage.setItem('superFarmerPhone', phone);
      connect(phone, code, false);
    };
  }

  function showLobby(room) {
    const el = clearOverlay();
    const isHost = room.hostPhone === online.phone;
    const rows = room.players.map(p => `
      <div class="player-row"><span class="online-dot ${p.online ? '' : 'off'}"></span>
        <span>${p.name}</span><span style="margin-left:auto">${p.phone === room.hostPhone ? '房主' : ''}</span>
      </div>`).join('');
    el.innerHTML = `
      <div class="online-card">
        <h2>房间大厅</h2>
        <div class="room-code">${room.code}</div>
        <div class="player-list">${rows}</div>
        <button class="online-btn" id="startOnlineBtn" ${isHost && room.players.length >= 2 ? '' : 'disabled'}>开始游戏</button>
        <button class="online-btn secondary" id="leaveRoomBtn">离开房间</button>
        <p class="online-tip">${isHost ? '点击开始后进入农夫卡选择阶段。' : '等待房主开始游戏。'}</p>
      </div>
    `;
    showOverlay();
    $('startOnlineBtn').onclick = () => sendAction('start_game');
    $('leaveRoomBtn').onclick = () => disconnect(true);
  }

  function showModalInner(html, closeable = false) {
    closeModal();
    const mask = document.createElement('div');
    mask.className = 'mask';
    mask.innerHTML = `<div class="modal">${html}${closeable ? '' : '<div class="modal-center">请稍候…</div>'}</div>`;
    document.body.appendChild(mask);
    return mask;
  }

  function showWaiting(text) {
    showModalInner(`<h2>${text}</h2>`, false);
  }

  function showRandomEvent(ev) {
    showModalInner(`
      <h2>随机事件</h2>
      <div class="event-modal ${ev.type || 'neutral'}" style="box-shadow:none">
        <div class="event-icon">${ev.icon}</div>
        <div class="event-title">${ev.name}</div>
        <div class="event-desc">${ev.desc}</div>
        <div class="event-effect">效果：${ev.effect}</div>
      </div>
      <button class="modal-close">知道啦</button>
    `, true).querySelector('.modal-close').onclick = closeModal;
  }

  function showWeatherEvent(ev) {
    const info = WEATHER_INFO[ev.weather];
    showModalInner(`
      <h2>天气变化</h2>
      <div class="event-modal neutral" style="box-shadow:none">
        <div class="event-title">${info.name}</div>
        <div class="event-desc">${info.desc}</div>
      </div>
      <button class="modal-close">知道啦</button>
    `, true).querySelector('.modal-close').onclick = closeModal;
  }

  function showGift(ev) {
    const type = ev.type;
    showModalInner(`
      <h2>万能补给</h2>
      <div style="text-align:center;margin:8px 0">${type ? animalSVG(type, 72) : ''}</div>
      <div class="event-title">${ev.got && type ? `开出了 ${ANIMAL_INFO[type].name}！` : '银行暂时缺货，这次什么也没领到。'}</div>
      <button class="modal-close">收下</button>
    `, true).querySelector('.modal-close').onclick = closeModal;
  }

  function showResult(ev) {
    let html = '';
    if (ev.clip && V_VIDEO[ev.clip]) {
      html += `<video src="${V_VIDEO[ev.clip]}" poster="${V_POSTER[ev.clip]}" autoplay playsinline muted
        style="width:100%;border-radius:16px;border:3px solid #fff;margin-bottom:10px"></video>`;
    }
    html += `<div class="result-block"><b>骰子结果：</b> <span style="display:inline-flex;gap:10px;vertical-align:middle">
      <span class="die final-die">${animalSVG(ev.dice[0],46)}</span>
      <span class="die final-die">${animalSVG(ev.dice[1],46)}</span></span></div>`;
    if (ev.bred.length) html += `<div class="result-block good"><b>繁殖成功：</b><br>${ev.bred.map(b=>`+${b.n} 只${ANIMAL_INFO[b.type].name}`).join('，')}</div>`;
    if (ev.guards.length) html += `<div class="result-block good"><b>守卫消耗：</b><br>${ev.guards.map(g=>`-${g.n} 只${ANIMAL_INFO[g.type].name}`).join('，')}</div>`;
    if (ev.lost.length) html += `<div class="result-block bad"><b>灾难损失：</b><br>${ev.lost.map(l=>`-${l.n} 只${ANIMAL_INFO[l.type].name}`).join('，')}</div>`;
    ev.logs.forEach(l => { html += `<div class="result-block">${l}</div>`; });
    if (ev.winner != null) {
      const p = state.players[ev.winner];
      html += `<div class="winner-cup">🏆</div><div style="text-align:center;font-size:22px;font-weight:900;color:var(--accent)">${p.name} 获胜！</div>`;
    }
    showModalInner(`<h2>回合结算</h2>${html}<button class="modal-close">看完了</button>`, true).querySelector('.modal-close').onclick = closeModal;
  }

  function showTradeModal(pending) {
    const from = state.players[pending.from];
    const target = state.players[pending.to];
    showModalInner(`
      <h2>${target.name}，是否接受交易？</h2>
      <div class="result-block">
        你将付出：<b>${pending.getN} 只${ANIMAL_INFO[pending.getType].name}</b><br>
        你将获得：<b>${pending.giveN} 只${ANIMAL_INFO[pending.giveType].name}</b>
      </div>
      <div class="primary-actions">
        <button class="pa-btn pa-next" id="acceptTradeBtn">接受交易</button>
        <button class="pa-btn" style="background:#d9534f" id="rejectTradeBtn">拒绝</button>
      </div>
    `, true);
    $('acceptTradeBtn').onclick = () => { closeModal(); sendAction('resolve_trade', { accept:true }); };
    $('rejectTradeBtn').onclick = () => { closeModal(); sendAction('resolve_trade', { accept:false }); };
  }

  function renderOnlineModals() {
    if (!state) return;
    closeModal();
    const pend = state.pending;
    if (pend && pend.type === 'draft') {
      const p = state.players[pend.idx];
      if (p.phone === online.phone) {
        _draft = { idx:pend.idx, p, options:pend.options, chosen:[] };
        showDraft();
      } else {
        showWaiting(`等待 ${p.name} 选择农夫卡`);
      }
      return;
    }
    if (pend && pend.type === 'trade') {
      const target = state.players[pend.to];
      const from = state.players[pend.from];
      if (target.phone === online.phone) {
        showTradeModal(pend);
      } else if (from.phone === online.phone) {
        const mask = showModalInner(`<h2>等待 ${target.name} 处理交易</h2><button class="modal-close" id="cancelTradeBtn">取消交易</button>`, true);
        mask.querySelector('#cancelTradeBtn').onclick = () => {
          closeModal();
          sendAction('cancel_trade');
        };
      } else {
        showWaiting(`等待 ${target.name} 处理交易`);
      }
      return;
    }
    const ev = state.lastEvent;
    if (!ev) return;
    if (ev.kind === 'random_event') showRandomEvent(ev);
    else if (ev.kind === 'weather') showWeatherEvent(ev);
    else if (ev.kind === 'gift') showGift(ev);
    else if (ev.kind === 'result') showResult(ev);
  }

  function patchTopbar() {
    if (!online.active) return;
    const btn = $('restartBtn');
    btn.textContent = '退出';
    btn.onclick = () => {
      if (confirm('确定退出房间？')) {
        disconnect(true);
        location.reload();
      }
    };
  }

  function patchActionPanel() {
    if (!online.active || !state || state.phase === 'lobby') return;
    const panel = document.querySelector('.action-panel');
    if (!panel) return;
    const isMe = state.players[state.cur].phone === online.phone;
    if (!isMe) {
      panel.querySelectorAll('button.pa-btn').forEach(b => { b.disabled = true; b.style.opacity = '.5'; });
      document.querySelectorAll('.slot.filled').forEach(el => { el.onclick = null; el.style.cursor = 'default'; });
      const hint = document.createElement('div');
      hint.style.cssText = 'margin-top:10px;font-size:13px;color:var(--ink-soft);font-weight:800';
      hint.textContent = `等待 ${state.players[state.cur].name} 操作`;
      panel.appendChild(hint);
    }
  }

  const localRenderAll = renderAll;
  renderAll = function () {
    localRenderAll();
    if (online.active) {
      patchTopbar();
      patchActionPanel();
    }
  };

  const localOpenAnimalActions = openAnimalActions;
  openAnimalActions = function (type) {
    if (online.active && state.players[state.cur].phone !== online.phone) return;
    localOpenAnimalActions(type);
  };

  const localApplyExchange = applyExchange;
  applyExchange = function (fromType, giveType) {
    if (online.active) {
      closeModal();
      sendAction('exchange', { fromType, giveType });
    } else localApplyExchange(fromType, giveType);
  };

  const localOpenTrade = openTrade;
  openTrade = function () {
    if (online.active && state.players[state.cur].phone !== online.phone) return;
    localOpenTrade();
  };

  const localSubmitTrade = submitTrade;
  submitTrade = function () {
    if (online.active) {
      if (tradeSel.giveType == null || tradeSel.getType == null) { toast('请选择交换的动物'); return; }
      closeModal();
      sendAction('offer_trade', { ...tradeSel });
    } else localSubmitTrade();
  };

  const localAcceptTrade = acceptTrade;
  acceptTrade = function () {
    if (online.active) {
      closeModal();
      sendAction('resolve_trade', { accept:true });
    } else localAcceptTrade();
  };

  const localUseCard = useCard;
  useCard = function (id) {
    if (online.active) {
      closeModal();
      sendAction('use_card', { cardId:id });
    } else localUseCard(id);
  };

  const localRollDice = rollDice;
  rollDice = function () {
    if (online.active) sendAction('roll_dice');
    else localRollDice();
  };

  const localEndTurn = endTurn;
  endTurn = function () {
    if (online.active) sendAction('end_turn');
    else localEndTurn();
  };

  const localConfirmDraft = confirmDraft;
  confirmDraft = function () {
    if (online.active) {
      if (!_draft || _draft.chosen.length < 2) return;
      const ids = [..._draft.chosen];
      closeModal();
      _draft = null;
      sendAction('choose_cards', { cardIds:ids });
    } else localConfirmDraft();
  };

  const localStartGame = startGame;
  startGame = function () {
    if (online.active) sendAction('start_game');
    else localStartGame();
  };

  function connect(phone, code, create) {
    if (online.ws) { online.closing = true; online.ws.close(); }
    online.closing = false;
    online.active = true;
    online.code = code;
    online.creating = create;
    localStorage.setItem('superFarmerRoom', code);
    const wsBase = serverBase.replace(/^http/, 'ws');
    const url = `${wsBase}/ws?code=${encodeURIComponent(code)}`;
    const ws = new WebSocket(url);
    online.ws = ws;
    ws.onopen = () => {
      send({ type:'login', phone });
      send(create ? { type:'create_room', code } : { type:'join_room', code });
    };
    ws.onmessage = event => {
      let msg;
      try { msg = JSON.parse(event.data); } catch (_) { return; }
      if (msg.type === 'snapshot') {
        state = msg.state;
        if (state.phase === 'lobby') {
          $('home').classList.add('hidden');
          $('game').classList.add('hidden');
          showLobby(state);
        } else {
          hideOverlay();
          $('home').classList.add('hidden');
          $('game').classList.remove('hidden');
          renderAll();
          renderOnlineModals();
        }
      } else if (msg.type === 'error') {
        toast(msg.message);
      }
    };
    ws.onclose = () => {
      if (!online.closing) toast('连接已断开，请刷新页面重试');
      online.ws = null;
    };
    ws.onerror = () => toast('服务器连接失败');
  }

  function disconnect(userRequested) {
    if (online.ws) {
      online.closing = !!userRequested;
      online.ws.close();
    }
    online.ws = null;
    online.active = false;
    hideOverlay();
  }

  const homeCard = document.querySelector('#home .home-card');
  if (homeCard) {
    const onlineBtn = document.createElement('button');
    onlineBtn.className = 'big-btn';
    onlineBtn.textContent = '联网模式';
    onlineBtn.style.marginTop = '12px';
    onlineBtn.onclick = showOnlineHome;
    homeCard.appendChild(onlineBtn);
  }
})();







