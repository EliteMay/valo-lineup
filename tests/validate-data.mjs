import { readFile } from 'node:fs/promises';

const raw = await readFile(new URL('../data/lineups.json', import.meta.url), 'utf8');
let items;
try {
  items = JSON.parse(raw);
} catch (error) {
  fail(`data/lineups.json がJSONとして読めません: ${error.message}`);
}

if (!Array.isArray(items)) fail('data/lineups.json はトップレベル配列である必要があります');

const ids = new Set();
const errors = [];
const validSides = new Set(['attack','defense','both']);
const validDifficulties = new Set(['easy','medium','hard']);

items.forEach((item,index) => {
  const prefix = `#${index + 1}`;
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    errors.push(`${prefix}: オブジェクトではありません`);
    return;
  }
  for (const key of ['id','title','map','agent','ability']) {
    if (typeof item[key] !== 'string' || !item[key].trim()) errors.push(`${prefix}: ${key} がありません`);
  }
  if (item.id) {
    if (ids.has(item.id)) errors.push(`${prefix}: id が重複しています (${item.id})`);
    ids.add(item.id);
  }
  if (!validCoord(item.start)) errors.push(`${prefix}: start 座標が0〜100の範囲ではありません`);
  if (!validCoord(item.end)) errors.push(`${prefix}: end 座標が0〜100の範囲ではありません`);
  if (item.bounces != null) {
    if (!Array.isArray(item.bounces)) errors.push(`${prefix}: bounces は配列である必要があります`);
    else if (item.bounces.some(point => !validCoord(point))) errors.push(`${prefix}: bounces に不正な座標があります`);
  }
  if (item.side != null && !validSides.has(item.side)) errors.push(`${prefix}: side が不正です (${item.side})`);
  if (item.difficulty != null && !validDifficulties.has(item.difficulty)) errors.push(`${prefix}: difficulty が不正です (${item.difficulty})`);
  if (item.tags != null && (!Array.isArray(item.tags) || item.tags.some(tag => typeof tag !== 'string'))) errors.push(`${prefix}: tags は文字列配列である必要があります`);
  if (item.videoUrl && !/^https?:\/\//i.test(String(item.videoUrl))) errors.push(`${prefix}: videoUrl は http(s) URL である必要があります`);
  if (item.images != null) {
    if (!item.images || typeof item.images !== 'object' || Array.isArray(item.images)) errors.push(`${prefix}: images が不正です`);
    else for (const key of ['standing','aim','result']) {
      const value = item.images[key];
      if (value != null && typeof value !== 'string') errors.push(`${prefix}: images.${key} は文字列である必要があります`);
      if (typeof value === 'string' && /^data:image\//i.test(value)) errors.push(`${prefix}: images.${key} にBase64画像を埋め込まないでください`);
      if (typeof value === 'string' && value.replace(/^\.\//,'').startsWith('_lineup-media/')) errors.push(`${prefix}: images.${key} にローカル専用参照が入っています`);
    }
  }
});

if (errors.length) {
  console.error(`Lineup data validation failed (${errors.length})`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`OK: ${items.length} lineups / ${ids.size} unique ids`);

function validCoord(point){
  return point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y)) && Number(point.x) >= 0 && Number(point.x) <= 100 && Number(point.y) >= 0 && Number(point.y) <= 100;
}
function fail(message){
  console.error(message);
  process.exit(1);
}