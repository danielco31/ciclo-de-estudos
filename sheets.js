/**
 * Sincronização com Google Planilhas (via Google Apps Script).
 * Carrega automaticamente os dados da planilha ao abrir o aplicativo.
 */
const SHEET_URL_KEY = 'ciclo_sheet_url';
const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyD9FOle2dBMGmUGQ7FOw9REe9cFjT6N5CihRhol2mYhi6Y7aCLezCdUPCBNBrpDSRY/exec';

let sheetPushTimer = null;

function getSheetUrl() {
  return localStorage.getItem(SHEET_URL_KEY) || DEFAULT_SHEET_URL;
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
  appState.lastModified = Date.now();
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(buildSheetPayload())
    });
    if (showMsg) alert('Progresso enviado com sucesso para a planilha!');
  } catch (err) {
    if (showMsg) alert('Falha ao enviar para a planilha: ' + err.message);
  }
}

async function pullFromSheet(showMsg) {
  const url = getSheetUrl();
  if (!url) return;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data || !Array.isArray(data.subjects) || data.subjects.length === 0) {
      if (showMsg) alert('A planilha ainda não possui matérias cadastradas.');
      return;
    }
    appState = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    const goalInput = document.getElementById('dailyGoal');
    if (goalInput) goalInput.value = getDailyGoal();
    renderAll();
    if (showMsg) alert(`Dados carregados da planilha com sucesso! (${data.subjects.length} matérias no ciclo)`);
  } catch (err) {
    if (showMsg) alert('Falha ao carregar da planilha: ' + err.message);
  }
}

/**
 * Sincronização automática ao abrir o app:
 * Puxa os dados da planilha automaticamente para que celular e PC fiquem sempre atualizados.
 */
async function autoSyncFromSheet() {
  const url = getSheetUrl();
  if (!url) return;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data && Array.isArray(data.subjects) && data.subjects.length > 0) {
      const localCount = (appState && appState.subjects) ? appState.subjects.length : 0;
      const isLocalExample = (localCount === 3 && appState.subjects[0].name === 'Português');
      const sheetHasMore = data.subjects.length > localCount;
      const sheetLastMod = data.lastModified || 0;
      const localLastMod = (appState && appState.lastModified) || 0;

      // Atualiza se estiver no exemplo inicial, ou se a planilha tiver mais matérias, ou se a planilha for mais recente/igual
      if (isLocalExample || sheetHasMore || sheetLastMod >= localLastMod) {
        appState = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        const goalInput = document.getElementById('dailyGoal');
        if (goalInput) goalInput.value = getDailyGoal();
        renderAll();
        console.log(`[Planilha] Sincronização automática concluída: ${data.subjects.length} matérias carregadas.`);
      }
    }
  } catch (err) {
    console.warn('[Planilha] Não foi possível sincronizar em segundo plano:', err);
  }
}

function openSheetMenu() {
  const current = getSheetUrl();
  const opt = prompt(
    '📊 SINCRONIZAÇÃO COM GOOGLE PLANILHAS\n\n' +
    '1 = Carregar da planilha agora (atualizar este aparelho)\n' +
    '2 = Enviar dados deste aparelho para a planilha\n' +
    '3 = Trocar URL da planilha\n' +
    '4 = Desconectar planilha\n\n' +
    'Digite o número da opção desejada:'
  );

  if (opt === '1') pullFromSheet(true);
  else if (opt === '2') pushToSheet(true);
  else if (opt === '3') {
    const url = prompt('Cole a nova URL do Web App (termina em /exec):', current);
    if (url) {
      localStorage.setItem(SHEET_URL_KEY, url.trim());
      pullFromSheet(true);
    }
  } else if (opt === '4') {
    localStorage.removeItem(SHEET_URL_KEY);
    alert('Planilha desconectada deste aparelho.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnSheets');
  if (btn) btn.addEventListener('click', openSheetMenu);
  
  // Executa a sincronização automática com a planilha ao abrir
  setTimeout(autoSyncFromSheet, 600);
});
