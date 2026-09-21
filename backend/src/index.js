import { createRoom, addPlayer, applyAction, markOffline } from './game.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(len = 6) {
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

function normalizePhone(raw) {
  return String(raw || '').replace(/\D/g, '');
}

export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.room = null;
    this.loaded = false;
    this.sessions = new Map();
  }

  async ensureLoaded() {
    if (this.loaded) return;
    this.room = await this.state.storage.get('room') || null;
    this.loaded = true;
  }

  async save() {
    if (!this.room) return;
    this.room.version += 1;
    await this.state.storage.put('room', this.room);
    this.broadcast({ type: 'snapshot', state: this.room });
  }

  send(ws, obj) {
    try { ws.send(JSON.stringify(obj)); } catch (_) {}
  }

  broadcast(obj) {
    const text = JSON.stringify(obj);
    for (const ws of this.sessions.keys()) {
      try { ws.send(text); } catch (_) {}
    }
  }

  snapshotFor(ws) {
    this.send(ws, { type:'snapshot', state:this.room });
  }

  takeOverOldSessions(ws, phone) {
    for (const [oldWs, meta] of this.sessions.entries()) {
      if (oldWs !== ws && meta.phone === phone) {
        try { oldWs.close(4001, 'session_replaced'); } catch (_) {}
        this.sessions.delete(oldWs);
      }
    }
  }

  async fetch(request) {
    await this.ensureLoaded();
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Super Farmer online room server', { status: 200 });
    }
    const pair = new WebSocketPair();
    const server = pair[1];
    const client = pair[0];
    server.accept();
    this.sessions.set(server, { phone: null });
    server.addEventListener('message', event => this.webSocketMessage(server, event.data));
    server.addEventListener('close', () => this.webSocketClose(server));
    server.addEventListener('error', () => this.webSocketError(server));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    await this.ensureLoaded();
    let msg;
    try { msg = JSON.parse(message); } catch (_) { this.send(ws, { type:'error', message:'消息格式错误' }); return; }

    if (msg.type === 'login') {
      const phone = normalizePhone(msg.phone);
      if (!phone) { this.send(ws, { type:'error', message:'请填写手机号' }); return; }
      const meta = this.sessions.get(ws);
      if (meta) meta.phone = phone;
      this.takeOverOldSessions(ws, phone);
      this.send(ws, { type:'login_ok', phone });
      if (this.room) this.snapshotFor(ws);
      return;
    }

    const meta = this.sessions.get(ws) || {};
    const phone = meta.phone;
    if (!phone) { this.send(ws, { type:'error', message:'请先登录' }); return; }

    if (msg.type === 'create_room') {
      let code = String(msg.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (code && (code.length < 4 || code.length > 8)) { this.send(ws, { type:'error', message:'房间码需为 4-8 位字母数字' }); return; }
      if (!this.room || !this.room.players.length) {
        code = code || randomCode();
        this.room = createRoom(code, phone);
        this.loaded = true;
      } else {
        this.send(ws, { type:'error', message:'房间码已存在' });
        return;
      }
      const added = addPlayer(this.room, phone);
      if (!added.ok) { this.send(ws, { type:'error', message:added.error }); return; }
      await this.save();
      this.snapshotFor(ws);
      return;
    }

    if (msg.type === 'join_room') {
      if (!this.room || !this.room.players.length) { this.send(ws, { type:'error', message:'房间不存在' }); return; }
      const added = addPlayer(this.room, phone);
      if (!added.ok) { this.send(ws, { type:'error', message:added.error }); return; }
      await this.save();
      this.snapshotFor(ws);
      return;
    }

    if (msg.type === 'game_action') {
      if (!this.room) { this.send(ws, { type:'error', message:'房间不存在' }); return; }
      const result = applyAction(this.room, phone, msg.action || {});
      if (!result.ok) { this.send(ws, { type:'error', message:result.error }); return; }
      await this.save();
      if (result.events && result.events.length) this.broadcast({ type:'event', events:result.events });
      return;
    }

    this.send(ws, { type:'error', message:'未知消息' });
  }

  async webSocketClose(ws) {
    const meta = this.sessions.get(ws);
    this.sessions.delete(ws);
    if (meta && meta.phone && this.room) {
      const before = this.room.version;
      markOffline(this.room, meta.phone);
      if (this.room.version === before) this.room.version += 1;
      await this.state.storage.put('room', this.room);
      this.broadcast({ type:'snapshot', state:this.room });
    }
  }

  async webSocketError(ws) {
    await this.webSocketClose(ws);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/ws') {
      const code = url.searchParams.get('code');
      if (!code) return new Response('Missing room code', { status: 400 });
      const id = env.ROOM.idFromName(code.toUpperCase());
      const stub = env.ROOM.get(id);
      return stub.fetch(request);
    }
    return new Response('Super Farmer online server is running.', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  },
};


