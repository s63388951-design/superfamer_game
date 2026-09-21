/* 服务器权威的游戏规则引擎。所有随机结算都在这里完成。 */

export const ANIMAL_INFO = {
  rabbit: { name: '兔子', color: '#f2ede2' },
  sheep:  { name: '羊',   color: '#f5f5f5' },
  pig:    { name: '猪',   color: '#f7a8b8' },
  cow:    { name: '牛',   color: '#ffffff' },
  horse:  { name: '马',   color: '#c89a6b' },
  dog:    { name: '小狗', color: '#d9a066' },
  bigDog: { name: '大狗', color: '#8a8f99' },
  fox:    { name: '狐狸', color: '#f08a3c' },
  wolf:   { name: '狼',   color: '#6b7280' },
};

export const FARM_ANIMALS = ['rabbit', 'sheep', 'pig', 'cow', 'horse'];
export const PLAYER_COLORS = ['#e8843a', '#3a7bd5', '#3f9e4d', '#9b59b6', '#e74c3c', '#16a085'];

export const DIE_A = ['rabbit','rabbit','rabbit','rabbit','rabbit','rabbit','sheep','sheep','sheep','pig','cow','wolf'];
export const DIE_B = ['rabbit','rabbit','rabbit','rabbit','rabbit','rabbit','sheep','sheep','pig','pig','horse','fox'];

export const EXCH_ACTIONS = [
  { give: 'sheep',  giveN: 1, from: 'rabbit', fromN: 6 },
  { give: 'pig',    giveN: 1, from: 'sheep',  fromN: 2 },
  { give: 'cow',    giveN: 1, from: 'pig',    fromN: 3 },
  { give: 'horse',  giveN: 1, from: 'cow',    fromN: 2 },
  { give: 'dog',    giveN: 1, from: 'sheep',  fromN: 1 },
  { give: 'bigDog', giveN: 1, from: 'cow',    fromN: 1 },
  { give: 'rabbit', giveN: 6, from: 'sheep',  fromN: 1 },
  { give: 'sheep',  giveN: 2, from: 'pig',    fromN: 1 },
  { give: 'pig',    giveN: 3, from: 'cow',    fromN: 1 },
  { give: 'cow',    giveN: 2, from: 'horse',  fromN: 1 },
];

export const CARDS = [
  { id: 'horn', name: '丰收号角', icon: '🌾', desc: '本回合繁殖数量 +2', kind: 'buff', b: { breedBonus: 2 } },
  { id: 'double', name: '双倍丰收', icon: '✌️', desc: '本回合繁殖结果 ×2', kind: 'buff', b: { breedMultiplier: 2 } },
  { id: 'fort', name: '固若金汤', icon: '🛡️', desc: '本回合狐狸与狼都不会来袭', kind: 'buff', b: { disasterImmune: true } },
  { id: 'gift', name: '万能补给', icon: '🎁', desc: '获得 1 只随机动物', kind: 'giveAny' },
  { id: 'charm', name: '幸运护符', icon: '🍀', desc: '本回合雪天不会走失动物', kind: 'buff', b: { snowImmune: true } },
  { id: 'taxfree', name: '免税之日', icon: '💰', desc: '本回合银行兑换付出减半', kind: 'buff', b: { exchangeCostHalf: true } },
  { id: 'vet', name: '紧急兽医', icon: '🐶', desc: '立即免费得 1 只小狗', kind: 'give', gives: { dog: 1 } },
  { id: 'guard', name: '忠实护卫', icon: '🦮', desc: '立即免费得 1 只大狗', kind: 'give', gives: { bigDog: 1 } },
  { id: 'spring', name: '春回大地', icon: '🌸', desc: '本回合每类已拥有动物繁殖 +1', kind: 'buff', b: { extraAll: 1 } },
  { id: 'neighbor', name: '慷慨邻居', icon: '🐑', desc: '立即免费得 2 只羊', kind: 'give', gives: { sheep: 2 } },
  { id: 'pigrun', name: '小猪快跑', icon: '🐷', desc: '立即免费得 2 只猪', kind: 'give', gives: { pig: 2 } },
  { id: 'cow', name: '母牛赐福', icon: '🐮', desc: '立即免费得 1 头牛', kind: 'give', gives: { cow: 1 } },
  { id: 'rabbit', name: '招财兔', icon: '🐰', desc: '立即免费得 3 只兔子', kind: 'give', gives: { rabbit: 3 } },
  { id: 'bargain', name: '集市淘货', icon: '🛒', desc: '本回合银行兑换所得 ×2', kind: 'buff', b: { exchangeGainDouble: true } },
  { id: 'weather', name: '天气预报', icon: '🌤️', desc: '立即驱散当前天气', kind: 'weatherClear' },
];

export const EVENT_CHANCE = 0.35;

export const EVENTS = [
  { r:'common', name:'迷路的小兔子', desc:'一只兔子钻出了篱笆。', icon:'🐰', type:'bad',
    apply:(p)=>{ loseAnimal(p,'rabbit',1); return '兔子 -1（至少保留 1 只）'; } },
  { r:'common', name:'小羊蹭痒', desc:'小羊靠栅栏蹭羊毛，不小心溜了出去。', icon:'🐑', type:'bad',
    apply:(p)=>{ loseAnimal(p,'sheep',1); return '羊 -1（至少保留 1 只）'; } },
  { r:'common', name:'小猪拱篱笆', desc:'调皮的小猪跑去隔壁玩了。', icon:'🐷', type:'bad',
    apply:(p)=>{ loseAnimal(p,'pig',1); return '猪 -1（至少保留 1 只）'; } },
  { r:'common', name:'胡萝卜丰收', desc:'田地里的胡萝卜熟了。', icon:'🥕', type:'good',
    apply:(p,b)=>{ if(b.rabbit>0){p.animals.rabbit++;b.rabbit--;return '兔子 +1';} return '银行兔子不足，无事发生'; } },
  { r:'common', name:'走失的小羊', desc:'路边捡到一只小羊。', icon:'🐑', type:'good',
    apply:(p,b)=>{ if(b.sheep>0){p.animals.sheep++;b.sheep--;return '羊 +1';} return '银行羊不足，无事发生'; } },
  { r:'common', name:'忠犬守门', desc:'一只流浪小狗愿意留下看家。', icon:'🐶', type:'good',
    apply:(p,b)=>{ if(b.dog>0){p.animals.dog++;b.dog--;return '小狗 +1';} return '银行小狗不足，无事发生'; } },
  { r:'common', name:'青草茂盛', desc:'牧草长得特别好。', icon:'🌿', type:'good',
    apply:(p)=>{ p.buffs.extraBreed.sheep+=1; return '下回合：羊繁殖额外 +1'; } },
  { r:'common', name:'橡果满地', desc:'小猪吃得特别欢。', icon:'🌰', type:'good',
    apply:(p)=>{ p.buffs.extraBreed.pig+=1; return '下回合：猪繁殖额外 +1'; } },
  { r:'common', name:'三叶草田', desc:'兔子爱吃的三叶草长满了田埂。', icon:'🍀', type:'good',
    apply:(p)=>{ p.buffs.extraBreed.rabbit+=1; return '下回合：兔子繁殖额外 +1'; } },
  { r:'common', name:'农夫打盹', desc:'农夫中午打瞌睡。', icon:'😴', type:'neutral',
    apply:(p)=>{ p.buffs.noPlayerTrade=true; return '下回合：无法与其他玩家交易'; } },
  { r:'common', name:'修补栅栏', desc:'农夫把栅栏修得结结实实。', icon:'🪵', type:'good',
    apply:(p)=>{ p.buffs.disasterResist=true; return '下回合：遇到灾难时额外保留动物'; } },
  { r:'common', name:'微风正好', desc:'动物们都懒洋洋的。', icon:'🍃', type:'bad',
    apply:(p)=>{ p.buffs.breedPenalty+=1; return '下回合：所有繁殖数量 -1'; } },
  { r:'special', name:'狐狸夜访', desc:'狐狸叼走了两只兔子。', icon:'🦊', type:'bad',
    apply:(p)=>{ loseAnimal(p,'rabbit',2); return '兔子 -2（至少保留 1 只）'; } },
  { r:'special', name:'野狼巡山', desc:'野狼吓跑了一只羊和一头猪。', icon:'🐺', type:'bad',
    apply:(p)=>{ loseAnimal(p,'sheep',1); loseAnimal(p,'pig',1); return '羊 -1，猪 -1'; } },
  { r:'special', name:'邻居送礼', desc:'隔壁农场主送来礼物。', icon:'🎁', type:'good',
    apply:(p,b)=>{ const m=[]; if(b.sheep>0){p.animals.sheep++;b.sheep--;m.push('羊 +1');} if(b.pig>0){p.animals.pig++;b.pig--;m.push('猪 +1');} return m.length?m.join('，'):'银行库存不足，无事发生'; } },
  { r:'special', name:'牧场丰年', desc:'今年风调雨顺。', icon:'🌾', type:'good',
    apply:(p)=>{ p.buffs.breedMultiplier=2; return '下回合：所有繁殖数量翻倍！'; } },
  { r:'special', name:'走失的奶牛', desc:'捡到一头走失的奶牛。', icon:'🐮', type:'good',
    apply:(p,b)=>{ if(b.cow>0){p.animals.cow++;b.cow--;return '牛 +1';} return '银行牛不足，无事发生'; } },
  { r:'special', name:'狗妈妈生崽', desc:'家里的大狗生了一窝小狗。', icon:'🐕', type:'good',
    apply:(p,b)=>{ const add=Math.min(2,b.dog); p.animals.dog+=add; b.dog-=add; return add?`小狗 +${add}`:'银行小狗不足，无事发生'; } },
  { r:'epic', name:'幸运四叶草', desc:'好运降临农场！', icon:'🍀', type:'good',
    apply:(p,b)=>{ const m=[]; ['rabbit','sheep','pig','cow'].forEach(a=>{ if(b[a]>0){p.animals[a]++;b[a]--;m.push(ANIMAL_INFO[a].name+' +1');} }); return m.length?m.join('，'):'银行库存不足，无事发生'; } },
  { r:'epic', name:'轻度瘟疫', desc:'部分牲畜生病了。', icon:'🤒', type:'bad',
    apply:(p)=>{ loseAnimal(p,'sheep',2); loseAnimal(p,'pig',2); return '羊 -2，猪 -2'; } },
  { r:'epic', name:'白马降临', desc:'一匹白色的野马跑来农场。', icon:'🐴', type:'good',
    apply:(p,b)=>{ if(b.horse>0){p.animals.horse++;b.horse--;return '马 +1！';} return '银行马不足，无事发生'; } },
];

export function makeBuffs() {
  return {
    extraBreed: { rabbit:0, sheep:0, pig:0, cow:0, horse:0 },
    breedPenalty: 0,
    breedMultiplier: 1,
    noPlayerTrade: false,
    disasterResist: false,
    breedBonus: 0,
    disasterImmune: false,
    snowImmune: false,
    exchangeCostHalf: false,
    exchangeGainDouble: false,
  };
}

export function emptyAnimals() {
  return { rabbit:0, sheep:0, pig:0, cow:0, horse:0, dog:0, bigDog:0 };
}

export function createRoom(code, phone) {
  return {
    code,
    phase: 'lobby',
    hostPhone: null,
    players: [],
    bank: null,
    cur: 0,
    lastDice: null,
    weather: { type: null, turns: 0 },
    bankSnapshot: null,
    log: [],
    events: [],
    eventSeq: 0,
    pending: null,
    winner: null,
    version: 0,
  };
}

export function addPlayer(room, phone) {
  let p = room.players.find(x => x.phone === phone);
  if (!p) {
    if (room.phase !== 'lobby') return { ok:false, error:'游戏已开始，不能加入' };
    if (room.players.length >= 6) return { ok:false, error:'房间已满' };
    p = {
      phone,
      seat: room.players.length,
      name: `玩家${room.players.length + 1}`,
      color: null,
      theme: null,
      avatar: null,
      animals: null,
      buffs: null,
      cards: [],
      used: {},
      online: true,
    };
    room.players.push(p);
    if (!room.hostPhone) room.hostPhone = phone;
  } else {
    p.online = true;
    const host = room.players.find(x => x.phone === room.hostPhone);
    if (room.phase === 'lobby' && host && !host.online && p.online) room.hostPhone = p.phone;
  }
  if (!room.hostPhone && room.players.length) room.hostPhone = room.players[0].phone;
  return { ok:true, player:p };
}

export function markOffline(room, phone) {
  const p = room.players.find(x => x.phone === phone);
  if (p) p.online = false;
  if (room.phase === 'lobby' && room.hostPhone === phone) {
    const next = room.players.find(x => x.online && x.phone !== phone);
    if (next) room.hostPhone = next.phone;
  }
}

function currentPlayer(room) {
  return room.players[room.cur];
}

function pushLog(room, msg) {
  room.log.push(msg);
  if (room.log.length > 200) room.log.shift();
}

function addEvent(room, event) {
  room.eventSeq += 1;
  event.id = room.eventSeq;
  room.events.push(event);
  if (room.events.length > 20) room.events.shift();
  room.lastEvent = event;
}

function bankInfinite(room) {
  return room.weather && room.weather.type === 'snow';
}

function hasBank(room, type, n) {
  return bankInfinite(room) || room.bank[type] >= n;
}

function takeFromBank(room, type, n) {
  if (bankInfinite(room)) return n;
  const got = Math.min(n, room.bank[type]);
  room.bank[type] -= got;
  return got;
}

function loseAnimal(p, key, n, keep = 1) {
  if (p.animals[key] > 0) {
    p.animals[key] = Math.max(keep, p.animals[key] - n);
  }
}

function clearBuffs(p) {
  p.buffs = makeBuffs();
}

function generateCardOptions() {
  const pool = [...CARDS];
  const options = [];
  for (let i = 0; i < 5 && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    options.push(pool.splice(idx, 1)[0]);
  }
  return options;
}

function startTurn(room, idx = 0) {
  room.cur = idx;
  room.phase = 'exchange';
  room.pending = null;
  room.lastDice = null;
  pushLog(room, `轮到 ${room.players[idx].name}`);
}

function tickAndMaybeStartWeather(room, events = []) {
  const w = room.weather;
  if (w && w.type) {
    w.turns--;
    if (w.turns <= 0) {
      if (w.type === 'snow' && room.bankSnapshot) room.bank = { ...room.bankSnapshot };
      room.weather = { type: null, turns: 0 };
    }
  }
  if (!room.weather.type && Math.random() < 0.20) {
    const types = ['rain', 'sun', 'snow'];
    const type = types[Math.floor(Math.random() * types.length)];
    if (type === 'snow') room.bankSnapshot = { ...room.bank };
    room.weather = { type, turns: 2 + Math.floor(Math.random() * 3) };
    const ev = { kind:'weather', weather:type };
    events.push(ev);
    addEvent(room, ev);
  }
}

function resolveRoll(room, a, b) {
  const p = currentPlayer(room);
  const logs = [];
  const bred = [];
  const lost = [];
  const guards = [];
  const diceCount = {};
  [a, b].forEach(t => { diceCount[t] = (diceCount[t] || 0) + 1; });

  FARM_ANIMALS.forEach(t => {
    if (!diceCount[t]) return;
    const have = p.animals[t];
    const total = have + diceCount[t];
    let babies = Math.floor(total / 2) * p.buffs.breedMultiplier
      + (p.buffs.extraBreed[t] || 0) + p.buffs.breedBonus - p.buffs.breedPenalty;
    if (room.weather.type === 'rain') babies -= 1;
    babies = Math.max(0, babies);
    if (babies > 0) {
      const give = bankInfinite(room) ? babies : Math.min(babies, room.bank[t]);
      if (give > 0) {
        p.animals[t] += give;
        if (!bankInfinite(room)) room.bank[t] -= give;
        bred.push({ type:t, n:give });
      }
      if (give < babies) logs.push(`银行${ANIMAL_INFO[t].name}不足，少繁殖${babies - give}只`);
    }
  });

  if (room.weather.type === 'sun' && bred.length) {
    const weights = { rabbit:40, sheep:20, pig:10, cow:3, horse:1, dog:15, bigDog:5 };
    const sum = Object.values(weights).reduce((x,y) => x+y, 0);
    let r = Math.random() * sum;
    let picked = null;
    for (const k in weights) { r -= weights[k]; if (r <= 0) { picked = k; break; } }
    if (picked && hasBank(room, picked, 1)) {
      p.animals[picked]++;
      if (!bankInfinite(room)) room.bank[picked]--;
      logs.push(`晴天里一只野生${ANIMAL_INFO[picked].name}跑来投奔！+1`);
    }
  }

  if (room.weather.type === 'snow' && !p.buffs.snowImmune) {
    const prob = { rabbit:.30, sheep:.15, pig:.08, cow:.04, horse:.02, dog:.08, bigDog:.05 };
    Object.keys(prob).forEach(t => {
      if (p.animals[t] > 0 && Math.random() < prob[t]) {
        p.animals[t]--;
        logs.push(`大雪中一只${ANIMAL_INFO[t].name}走失了…`);
      }
    });
  }

  const hasFox = diceCount.fox > 0;
  const hasWolf = diceCount.wolf > 0;
  if (hasFox) {
    if (p.buffs.disasterImmune) logs.push('固若金汤，狐狸被挡在栅栏外！');
    else if (p.animals.dog > 0) {
      p.animals.dog -= 1;
      guards.push({ type:'dog', n:1 });
      logs.push('小狗挺身而出，保全了所有兔子！');
    } else {
      const keepRabbit = p.buffs.disasterResist ? 2 : 1;
      const lostN = p.animals.rabbit - keepRabbit;
      if (lostN > 0) {
        p.animals.rabbit = keepRabbit;
        room.bank.rabbit += lostN;
        lost.push({ type:'rabbit', n:lostN });
      }
      logs.push(`狐狸叼走了兔子，仅幸存 ${keepRabbit} 只！`);
    }
  }
  if (hasWolf) {
    if (p.buffs.disasterImmune) logs.push('固若金汤，狼不敢靠近！');
    else if (p.animals.bigDog > 0) {
      p.animals.bigDog -= 1;
      guards.push({ type:'bigDog', n:1 });
      logs.push('大狗狗吠赶跑了狼，保全了羊猪牛！');
    } else {
      const keepOne = p.buffs.disasterResist ? 1 : 0;
      ['sheep','pig','cow'].forEach(t => {
        if (p.animals[t] > 0) {
          const lostN = p.animals[t] - keepOne;
          room.bank[t] += lostN;
          if (lostN > 0) lost.push({ type:t, n:lostN });
          p.animals[t] = keepOne;
        }
      });
      logs.push(p.buffs.disasterResist
        ? '狼袭击了农场，幸好栅栏牢固，羊猪牛各保住了 1 只！'
        : '狼袭击了农场，羊猪牛全被夺走！');
    }
  }

  room.phase = 'resolved';
  let clip = null;
  if (hasWolf) clip = 'wolf';
  else if (hasFox) clip = 'fox';
  else if (bred.length) clip = 'breed';

  const win = FARM_ANIMALS.every(t => p.animals[t] >= 1);
  if (win) {
    room.phase = 'over';
    room.winner = p.seat;
    pushLog(room, `${p.name} 获胜！`);
  }

  const event = { kind:'result', bred, lost, guards, logs, dice:[a,b], clip, winner: win ? p.seat : null };
  addEvent(room, event);
  return event;
}

function applyCard(room, card) {
  const p = currentPlayer(room);
  if (!p.cards.includes(card.id) || p.used[card.id]) return { ok:false, error:'这张卡不可用' };

  if (card.kind === 'give') {
    for (const t in card.gives) {
      const got = takeFromBank(room, t, card.gives[t]);
      if (got > 0) p.animals[t] += got;
    }
  } else if (card.kind === 'giveAny') {
    const weights = { rabbit:30, sheep:25, pig:18, dog:12, bigDog:7, cow:5, horse:3 };
    const sum = Object.values(weights).reduce((a,b) => a+b, 0);
    let r = Math.random() * sum;
    let type = null;
    for (const k in weights) { r -= weights[k]; if (r <= 0) { type = k; break; } }
    const got = type ? takeFromBank(room, type, 1) : 0;
    if (got > 0) p.animals[type] += got;
    addEvent(room, { kind:'gift', type, got:got > 0, player:p.seat });
  } else if (card.kind === 'weatherClear') {
    if (room.weather.type === 'snow' && room.bankSnapshot) room.bank = { ...room.bankSnapshot };
    room.weather = { type:null, turns:0 };
  } else if (card.kind === 'buff') {
    for (const k in card.b) {
      if (k === 'extraAll') FARM_ANIMALS.forEach(t => p.buffs.extraBreed[t] += card.b[k]);
      else if (k === 'breedBonus') p.buffs.breedBonus += card.b[k];
      else p.buffs[k] = card.b[k];
    }
  }

  p.used[card.id] = true;
  pushLog(room, `${p.name} 使用了农夫卡【${card.name}】`);
  return { ok:true };
}

export function applyAction(room, phone, action) {
  const p = room.players.find(x => x.phone === phone);
  if (!p) return { ok:false, error:'你不是本房间玩家' };
  const isHost = room.hostPhone === phone;
  const cur = currentPlayer(room);
  const type = action.type || action;

  if (type === 'start_game') {
    if (!isHost) return { ok:false, error:'只有房主可以开始游戏' };
    if (room.phase !== 'lobby') return { ok:false, error:'游戏已经开始' };
    if (room.players.length < 2) return { ok:false, error:'至少需要 2 名玩家' };
    const themeOrder = [0,1,2,3,4,5].sort(() => Math.random() - 0.5);
    const avatarOrder = [0,1,2,3,4,5].sort(() => Math.random() - 0.5);
    room.players = room.players.map((pl, i) => ({
      ...pl,
      seat:i,
      name:`玩家${i + 1}`,
      color:PLAYER_COLORS[i],
      theme:themeOrder[i],
      avatar:avatarOrder[i],
      animals:{ ...emptyAnimals(), rabbit:1 },
      buffs:makeBuffs(),
      cards:[],
      used:{},
    }));
    room.bank = { rabbit:80, sheep:24, pig:16, cow:10, horse:6, dog:12, bigDog:6 };
    room.cur = 0;
    room.phase = 'draft';
    room.lastDice = null;
    room.weather = { type:null, turns:0 };
    room.bankSnapshot = null;
    room.log = ['游戏开始'];
    room.events = [];
    room.lastEvent = null;
    room.winner = null;
    room.pending = { type:'draft', idx:0, options:generateCardOptions() };
    pushLog(room, '请选择农夫卡');
    return { ok:true };
  }

  if (type === 'choose_cards') {
    if (!room.pending || room.pending.type !== 'draft') return { ok:false, error:'当前不是选卡阶段' };
    if (room.players[room.pending.idx].phone !== phone) return { ok:false, error:'还没轮到你选卡' };
    const ids = Array.isArray(action.cardIds) ? action.cardIds : [];
    const valid = ids.length === 2 && new Set(ids).size === 2 && ids.every(id => room.pending.options.some(c => c.id === id));
    if (!valid) return { ok:false, error:'请选择 2 张不同的农夫卡' };
    const pl = room.players[room.pending.idx];
    pl.cards = [...ids];
    pl.used = {};
    room.pending.idx += 1;
    room.cur = room.pending.idx;
    if (room.pending.idx >= room.players.length) {
      startTurn(room, 0);
    } else {
      room.pending = { type:'draft', idx:room.pending.idx, options:generateCardOptions() };
    }
    return { ok:true };
  }

  if (room.phase !== 'exchange' && !['choose_cards','resolve_trade','cancel_trade','end_turn'].includes(type)) {
    return { ok:false, error:'当前阶段不能执行该操作' };
  }

  if (room.pending && !['resolve_trade','cancel_trade'].includes(type)) {
    return { ok:false, error:'有待处理的操作，请先完成' };
  }

  if (type === 'exchange') {
    if (cur.phone !== phone) return { ok:false, error:'还没轮到你' };
    const a = EXCH_ACTIONS.find(x => x.from === action.fromType && x.give === action.giveType);
    if (!a) return { ok:false, error:'无效的兑换' };
    let costN = a.fromN;
    let gainN = a.giveN;
    if (cur.buffs.exchangeCostHalf) costN = Math.max(1, Math.floor(a.fromN / 2));
    if (cur.buffs.exchangeGainDouble) gainN *= 2;
    if (cur.animals[a.from] < costN || !hasBank(room, a.give, gainN)) return { ok:false, error:'条件不足或银行缺货' };
    cur.animals[a.from] -= costN;
    if (!bankInfinite(room)) room.bank[a.from] += costN;
    cur.animals[a.give] += gainN;
    if (!bankInfinite(room)) room.bank[a.give] -= gainN;
    pushLog(room, `${cur.name} 用 ${costN} 只${ANIMAL_INFO[a.from].name} 换了 ${gainN} 只${ANIMAL_INFO[a.give].name}`);
    return { ok:true };
  }

  if (type === 'use_card') {
    if (cur.phone !== phone) return { ok:false, error:'还没轮到你' };
    const card = CARDS.find(c => c.id === action.cardId);
    if (!card) return { ok:false, error:'无效的农夫卡' };
    return applyCard(room, card);
  }

  if (type === 'offer_trade') {
    if (cur.phone !== phone) return { ok:false, error:'还没轮到你' };
    if (cur.buffs.noPlayerTrade) return { ok:false, error:'本回合无法与其他玩家交易' };
    const to = Number(action.to);
    if (!Number.isInteger(to) || to < 0 || to >= room.players.length || to === room.cur) return { ok:false, error:'无效的交易对象' };
    const other = room.players[to];
    const giveType = action.giveType;
    const getType = action.getType;
    const giveN = Math.max(1, Number(action.giveN) || 1);
    const getN = Math.max(1, Number(action.getN) || 1);
    if (!cur.animals[giveType] || !other.animals[getType]) return { ok:false, error:'无效的动物类型' };
    if (cur.animals[giveType] < giveN) return { ok:false, error:'你没有足够的动物' };
    if (other.animals[getType] < getN) return { ok:false, error:'对方没有足够的动物' };
    room.pending = { type:'trade', from:room.cur, to, giveType, giveN, getType, getN };
    pushLog(room, `${cur.name} 向 ${other.name} 发起交易`);
    return { ok:true };
  }

  if (type === 'cancel_trade') {
    const pending = room.pending;
    if (!pending || pending.type !== 'trade') return { ok:false, error:'没有待处理交易' };
    const from = room.players[pending.from];
    if (from.phone !== phone) return { ok:false, error:'只有发起者可以取消' };
    room.pending = null;
    pushLog(room, `${from.name} 取消了交易`);
    return { ok:true };
  }

  if (type === 'resolve_trade') {
    const pending = room.pending;
    if (!pending || pending.type !== 'trade') return { ok:false, error:'没有待处理交易' };
    const target = room.players[pending.to];
    if (target.phone !== phone) return { ok:false, error:'只有交易对象可以处理' };
    if (action.accept) {
      if (room.players[pending.from].animals[pending.giveType] < pending.giveN || target.animals[pending.getType] < pending.getN) {
        return { ok:false, error:'资源不足，交易失败' };
      }
      const from = room.players[pending.from];
      from.animals[pending.giveType] -= pending.giveN;
      target.animals[pending.giveType] += pending.giveN;
      target.animals[pending.getType] -= pending.getN;
      from.animals[pending.getType] += pending.getN;
      pushLog(room, `${from.name} 与 ${target.name} 完成交易`);
    } else {
      pushLog(room, `${target.name} 拒绝了交易`);
    }
    room.pending = null;
    return { ok:true };
  }

  if (type === 'roll_dice') {
    if (cur.phone !== phone) return { ok:false, error:'还没轮到你' };
    room.phase = 'rolling';
    const a = DIE_A[Math.floor(Math.random() * DIE_A.length)];
    const b = DIE_B[Math.floor(Math.random() * DIE_B.length)];
    room.lastDice = [a, b];
    resolveRoll(room, a, b);
    return { ok:true };
  }

  if (type === 'end_turn') {
    if (cur.phone !== phone) return { ok:false, error:'还没轮到你' };
    if (room.phase !== 'resolved') return { ok:false, error:'请先完成本回合' };
    if (room.pending) return { ok:false, error:'请先完成待处理操作' };
    const events = [];
    clearBuffs(cur);
    if (Math.random() < EVENT_CHANCE) {
      const roll = Math.random() * 100;
      const rkey = roll < 70 ? 'common' : (roll < 92 ? 'special' : 'epic');
      const pool = EVENTS.filter(e => e.r === rkey);
      const ev = pool[Math.floor(Math.random() * pool.length)];
      const effect = ev.apply(cur, room.bank);
      const evData = { kind:'random_event', name:ev.name, desc:ev.desc, effect, icon:ev.icon, type:ev.type };
      events.push(evData);
      addEvent(room, evData);
    }
    tickAndMaybeStartWeather(room, events);
    const next = (room.cur + 1) % room.players.length;
    room.cur = next;
    room.phase = 'exchange';
    pushLog(room, `轮到 ${room.players[next].name}`);
    return { ok:true, events };
  }

  return { ok:false, error:'未知操作' };
}








