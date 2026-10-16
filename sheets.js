/**
 * Sincronização com Google Planilhas (via Google Apps Script).
 * A URL do Web App fica salva no navegador. Veja o README para o passo a passo.
 */
const SHEET_URL_KEY = 'ciclo_sheet_url';
let sheetPushTimer = null;

function getSheetUrl() {
  return localStorage.getItem(SHEET_URL_KEY) || '';
}

function buildSheetPayload() {
  const goal = getDailyGoal();
  return {
    state: appState,
    rows: appState.cycleList.map((s, i) => [
      s.globalOrder,
      s.subjectName,
      s.round,
      Math.floor(i / goal) + 1,
      s.completed ? 'Sim' : 'Não',
      s.completedAt || ''
    ])
  };
}

function scheduleSheetPush() {
  if (!getSheetUrl()) return;
  clearTimeout(sheetPushTimer);
  sheetPushTimer = setTimeout(pushToSheet, 1500);
}

async function pushToSheet(showMsg) {
  const url = getSheetUrl();
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(buildSheetPayload())
    });
    if (showMsg) alert('Progresso enviado para a planilha!');
  } catch (err) {
    if (showMsg) alert('Falha ao enviar para a planilha: ' + err.message);
  }
}

async function pullFromSheet() {
  const url = getSheetUrl();
  if (!url) return;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data || !Array.isArray(data.subjects)) {
      alert('A planilha ainda não tem dados salvos.');
      return;
    }
    appState = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    const goalInput = document.getElementById('dailyGoal');
    if (goalInput) goalInput.value = getDailyGoal();
    renderAll();
    alert('Dados carregados da planilha!');
  } catch (err) {
    alert('Falha ao carregar da planilha: ' + err.message);
  }
}

function openSheetMenu() {
  const current = getSheetUrl();
  if (!current) {
    const url = prompt('Cole a URL do Web App do Google Apps Script (termina em /exec):');
    if (!url) return;
    localStorage.setItem(SHEET_URL_KEY, url.trim());
    pushToSheet(true);
    return;
  }
  const opt = prompt('Planilha conectada.\n1 = Enviar agora\n2 = Carregar da planilha (substitui dados locais)\n3 = Trocar URL\n4 = Desconectar');
  if (opt === '1') pushToSheet(true);
  else if (opt === '2') pullFromSheet();
  else if (opt === '3') {
    const url = prompt('Nova URL do Web App:', current);
    if (url) localStorage.setItem(SHEET_URL_KEY, url.trim());
  } else if (opt === '4') {
    localStorage.removeItem(SHEET_URL_KEY);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnSheets');
  if (btn) btn.addEventListener('click', openSheetMenu);
});
