/**
 * Gamificação: XP e nível.
 * Envolve (sem alterar) as funções do app.js para somar/remover XP.
 * +10 XP por matéria concluída; 100 XP por nível. O XP é salvo junto do estado.
 */
const XP_PER_STEP = 10;
const XP_PER_LEVEL = 100;

function countCompleted() {
  return appState.cycleList.filter(s => s.completed).length;
}

function renderXp() {
  const xp = Math.max(0, parseInt(appState.xp, 10) || 0);
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const inLevel = xp % XP_PER_LEVEL;
  const lvlEl = document.getElementById('xpLevel');
  const txtEl = document.getElementById('xpText');
  const fillEl = document.getElementById('xpFill');
  if (lvlEl) lvlEl.textContent = level;
  if (txtEl) txtEl.textContent = `${inLevel} / ${XP_PER_LEVEL} XP`;
  if (fillEl) fillEl.style.width = `${(inLevel / XP_PER_LEVEL) * 100}%`;
}

function floatXp(delta) {
  const el = document.createElement('div');
  el.textContent = (delta > 0 ? '+' : '') + delta + ' XP';
  el.style.cssText = `position:fixed;left:50%;top:40%;transform:translateX(-50%);z-index:200;
    font-family:'Roboto',sans-serif;font-size:18px;pointer-events:none;
    color:${delta > 0 ? '#ffd23f' : '#ff4d6d'};text-shadow:3px 3px 0 #0b0618;
    transition:all 0.9s steps(9);`;
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.top = '25%';
    el.style.opacity = '0';
  });
  setTimeout(() => el.remove(), 1000);
}

function withXp(fn) {
  return function (...args) {
    const before = countCompleted();
    const levelBefore = Math.floor((appState.xp || 0) / XP_PER_LEVEL);
    const result = fn.apply(this, args);
    const diff = (countCompleted() - before) * XP_PER_STEP;
    if (diff !== 0) {
      appState.xp = Math.max(0, (appState.xp || 0) + diff);
      saveState();
      floatXp(diff);
      if (Math.floor(appState.xp / XP_PER_LEVEL) > levelBefore) {
        setTimeout(alertLevelUp, 400);
      }
    }
    renderXp();
    return result;
  };
}

function alertLevelUp() {
  const el = document.createElement('div');
  el.textContent = '★ LEVEL UP! ★';
  el.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:200;
    font-family:'Roboto',sans-serif;font-size:22px;color:#5bff6e;pointer-events:none;
    text-shadow:4px 4px 0 #0b0618;background:#0b0618;padding:18px 24px;border:4px solid #5bff6e;`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

// Envolve as funções globais do app.js (o reset de ciclo não remove XP)
completeCurrentStep = withXp(completeCurrentStep);
toggleStepCompleted = withXp(toggleStepCompleted);

const _renderAllOriginal = renderAll;
renderAll = function () {
  _renderAllOriginal();
  renderXp();
};

document.addEventListener('DOMContentLoaded', renderXp);
