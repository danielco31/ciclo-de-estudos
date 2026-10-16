/**
 * Ciclo de Estudos - Aplicação de Gestão Vertical de Estudos
 * Algoritmo de rodadas por peso com progressão vertical e persistência LocalStorage.
 */

const STORAGE_KEY = 'ciclo_de_estudos_v1';

// Paleta pré-definida de cores elegantes para novas matérias
const DEFAULT_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Esmeralda
  '#f59e0b', // Âmbar
  '#ec4899', // Rosa
  '#8b5cf6', // Violeta
  '#14b8a6', // Teal
  '#f97316'  // Laranja
];

// Estado Inicial com o exemplo citado pelo usuário
const defaultState = {
  currentCycleNumber: 1,
  subjects: [
    { id: 'sub_1', name: 'Português', weight: 2, color: '#6366f1' },
    { id: 'sub_2', name: 'Matemática', weight: 1, color: '#06b6d4' },
    { id: 'sub_3', name: 'Direito Constitucional', weight: 1, color: '#10b981' }
  ],
  cycleList: []
};

let appState = loadState();

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.subjects && Array.isArray(parsed.subjects)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao carregar dados do LocalStorage:', err);
  }
  // Se não existir dados salvos, usa o estado inicial gerando o ciclo
  const state = JSON.parse(JSON.stringify(defaultState));
  state.cycleList = generateVerticalCycle(state.subjects);
  return state;
}

function getDailyGoal() {
  return Math.max(1, parseInt(appState.dailyGoal, 10) || 6);
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    if (typeof scheduleSheetPush === 'function') scheduleSheetPush();
  } catch (err) {
    console.error('Erro ao salvar no LocalStorage:', err);
  }
}

/**
 * Algoritmo Vertical de Ciclo de Estudos:
 * - Rodada 1: Inclui todas as matérias (1ª passagem)
 * - Rodada 2: Inclui matérias com peso >= 2 (2ª passagem, posicionadas abaixo)
 * - Rodada 3: Inclui matérias com peso >= 3 ...
 * Numeradas de 1 a N de forma linear e vertical.
 */
function generateVerticalCycle(subjects, existingCycle = []) {
  if (!subjects || subjects.length === 0) return [];

  const maxWeight = Math.max(...subjects.map(s => Number(s.weight) || 1), 1);
  const cycle = [];
  let globalOrder = 1;

  for (let round = 1; round <= maxWeight; round++) {
    for (const subj of subjects) {
      const weight = Number(subj.weight) || 1;
      if (weight >= round) {
        const stepId = `${subj.id}_r${round}`;
        
        // Mantém status concluído se já existia na mesma posição/rodada
        const prevStep = existingCycle.find(item => item.id === stepId);
        
        cycle.push({
          id: stepId,
          globalOrder: globalOrder++,
          subjectId: subj.id,
          subjectName: subj.name,
          color: subj.color,
          round: round,
          completed: prevStep ? !!prevStep.completed : false,
          completedAt: prevStep ? prevStep.completedAt : null
        });
      }
    }
  }

  return cycle;
}

function initApp() {
  // Se a lista do ciclo estiver vazia e houver matérias, gera
  if (appState.cycleList.length === 0 && appState.subjects.length > 0) {
    appState.cycleList = generateVerticalCycle(appState.subjects);
    saveState();
  }

  setupEventListeners();
  const goalInput = document.getElementById('dailyGoal');
  if (goalInput) {
    goalInput.value = getDailyGoal();
    goalInput.addEventListener('change', () => {
      appState.dailyGoal = Math.max(1, parseInt(goalInput.value, 10) || 6);
      goalInput.value = appState.dailyGoal;
      saveState();
      renderAll();
    });
  }
  renderAll();
}

function setupEventListeners() {
  // Alternância de abas (Trilha do Ciclo vs Gerenciar Matérias)
  const tabBtnCycle = document.getElementById('tabBtnCycle');
  const tabBtnSubjects = document.getElementById('tabBtnSubjects');
  const tabCycleView = document.getElementById('tabCycleView');
  const tabSubjectsView = document.getElementById('tabSubjectsView');

  function switchTab(tab) {
    if (tab === 'cycle') {
      if (tabCycleView) tabCycleView.classList.remove('hidden');
      if (tabSubjectsView) tabSubjectsView.classList.add('hidden');
      if (tabBtnCycle) {
        tabBtnCycle.classList.add('active-tab');
        tabBtnCycle.setAttribute('aria-selected', 'true');
      }
      if (tabBtnSubjects) {
        tabBtnSubjects.classList.remove('active-tab');
        tabBtnSubjects.setAttribute('aria-selected', 'false');
      }
    } else {
      if (tabCycleView) tabCycleView.classList.add('hidden');
      if (tabSubjectsView) tabSubjectsView.classList.remove('hidden');
      if (tabBtnSubjects) {
        tabBtnSubjects.classList.add('active-tab');
        tabBtnSubjects.setAttribute('aria-selected', 'true');
      }
      if (tabBtnCycle) {
        tabBtnCycle.classList.remove('active-tab');
        tabBtnCycle.setAttribute('aria-selected', 'false');
      }
    }
  }

  if (tabBtnCycle && tabBtnSubjects) {
    tabBtnCycle.addEventListener('click', () => switchTab('cycle'));
    tabBtnSubjects.addEventListener('click', () => switchTab('subjects'));
  }

  // Formulário de adicionar matéria
  const form = document.getElementById('subjectForm');
  const weightInput = document.getElementById('subjectWeight');
  const weightHint = document.getElementById('weightExplanation');
  const colorInput = document.getElementById('subjectColor');

  // Ajusta cor padrão aleatória / rotativa
  const nextColor = DEFAULT_COLORS[appState.subjects.length % DEFAULT_COLORS.length];
  if (colorInput) colorInput.value = nextColor;

  if (weightInput && weightHint) {
    weightInput.addEventListener('input', () => {
      const val = parseInt(weightInput.value, 10) || 1;
      weightHint.textContent = val === 1 
        ? 'Aparecerá 1x no ciclo' 
        : `Aparecerá ${val}x no ciclo (1ª vez na coluna base + ${val - 1}x abaixo)`;
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('subjectName');
      const name = nameInput.value.trim();
      const weight = Math.max(1, parseInt(weightInput.value, 10) || 1);
      const color = colorInput.value || '#6366f1';

      if (!name) return;

      const newSubject = {
        id: 'sub_' + Date.now(),
        name,
        weight,
        color
      };

      appState.subjects.push(newSubject);
      appState.cycleList = generateVerticalCycle(appState.subjects, appState.cycleList);
      saveState();

      // Reset form
      nameInput.value = '';
      weightInput.value = '1';
      weightHint.textContent = 'Aparecerá 1x no ciclo';
      colorInput.value = DEFAULT_COLORS[appState.subjects.length % DEFAULT_COLORS.length];
      nameInput.focus();

      renderAll();
    });
  }

  // Botão Concluir Matéria Atual
  const btnCompleteCurrent = document.getElementById('btnCompleteCurrent');
  if (btnCompleteCurrent) {
    // clique tratado por btnComplete.onclick em renderActiveFocusCard (evita disparo duplo)
  }

  // Botão Reiniciar Ciclo
  const btnReset = document.getElementById('btnResetCycle');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Deseja desmarcar todas as matérias e reiniciar o progresso deste ciclo do início?')) {
        resetCurrentCycleProgress();
      }
    });
  }

  // Modal actions
  const btnModalNext = document.getElementById('btnModalNextCycle');
  const btnModalClose = document.getElementById('btnModalClose');
  if (btnModalNext) {
    btnModalNext.addEventListener('click', () => {
      appState.currentCycleNumber += 1;
      resetCurrentCycleProgress();
      hideModal();
    });
  }
  if (btnModalClose) {
    btnModalClose.addEventListener('click', hideModal);
  }
}

/**
 * Obtém o índice do passo atualmente ativo no ciclo.
 * É o primeiro passo não concluído. Se todos estiverem concluídos, retorna -1.
 */
function getCurrentStepIndex() {
  return appState.cycleList.findIndex(step => !step.completed);
}

function completeCurrentStep() {
  const currentIndex = getCurrentStepIndex();
  if (currentIndex === -1) {
    showCongratsModal();
    return;
  }

  appState.cycleList[currentIndex].completed = true;
  appState.cycleList[currentIndex].completedAt = new Date().toISOString();
  saveState();

  const nextIndex = getCurrentStepIndex();
  if (nextIndex === -1) {
    renderAll();
    setTimeout(() => {
      showCongratsModal();
    }, 300);
  } else {
    renderAll();
    // Scroll suave para o próximo item
    scrollToActiveStep(nextIndex);
  }
}

function toggleStepCompleted(index) {
  if (!appState.cycleList[index]) return;
  const isDone = !appState.cycleList[index].completed;
  appState.cycleList[index].completed = isDone;
  appState.cycleList[index].completedAt = isDone ? new Date().toISOString() : null;
  saveState();
  renderAll();

  if (getCurrentStepIndex() === -1) {
    setTimeout(() => showCongratsModal(), 300);
  }
}

function resetCurrentCycleProgress() {
  appState.cycleList.forEach(item => {
    item.completed = false;
    item.completedAt = null;
  });
  saveState();
  renderAll();
}

function deleteSubject(subjectId) {
  const subj = appState.subjects.find(s => s.id === subjectId);
  const name = subj ? subj.name : 'esta matéria';
  if (confirm(`Remover "${name}" do ciclo de estudos?`)) {
    appState.subjects = appState.subjects.filter(s => s.id !== subjectId);
    appState.cycleList = generateVerticalCycle(appState.subjects, appState.cycleList);
    saveState();
    renderAll();
  }
}

function showCongratsModal() {
  const modal = document.getElementById('congratsModal');
  if (modal) modal.classList.remove('hidden');
}

function hideModal() {
  const modal = document.getElementById('congratsModal');
  if (modal) modal.classList.add('hidden');
}

function scrollToActiveStep(index) {
  const stepElement = document.getElementById(`step-${index}`);
  if (stepElement) {
    stepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Renderizações de Interface
 */
function renderAll() {
  renderHeader();
  renderSubjectsList();
  renderActiveFocusCard();
  renderVerticalTimeline();
}

function renderHeader() {
  const cycleBadge = document.getElementById('currentCycleNumber');
  if (cycleBadge) {
    cycleBadge.textContent = `#${appState.currentCycleNumber}`;
  }

  const countBadge = document.getElementById('subjectCountBadge');
  if (countBadge) {
    const qty = appState.subjects.length;
    countBadge.textContent = `${qty} ${qty === 1 ? 'matéria' : 'matérias'}`;
  }
}

function toggleSubjectFlag(subjectId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const subj = appState.subjects.find(s => s.id === subjectId);
  if (!subj) return;
  subj.flagged = !subj.flagged;
  saveState();
  renderAll();
}

function renderSubjectFlagButton(subjectId) {
  const subj = appState.subjects.find(s => s.id === subjectId);
  const isFlagged = subj ? !!subj.flagged : false;
  if (isFlagged) {
    return `<button type="button" class="subject-flag-btn active" onclick="toggleSubjectFlag('${subjectId}', event)" title="Matéria marcada para seu controle próprio. Clique para remover a flag.">🚩 Flag <span class="flag-remove-x">✕</span></button>`;
  } else {
    return `<button type="button" class="subject-flag-btn inactive" onclick="toggleSubjectFlag('${subjectId}', event)" title="Clique para marcar esta matéria com a flag de controle">🏳️ Marcar flag</button>`;
  }
}

function renderSubjectsList() {
  const container = document.getElementById('subjectsContainer');
  if (!container) return;

  if (appState.subjects.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nenhuma matéria cadastrada.</p>
        <span style="font-size: 0.8rem; opacity: 0.7;">Cadastre matérias acima para gerar seu ciclo.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = appState.subjects.map(subj => {
    const flagBtn = renderSubjectFlagButton(subj.id);
    return `
      <div class="subject-item">
        <div class="subject-info-col">
          <div class="subject-color-tag" style="background-color: ${subj.color || '#6366f1'}"></div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="subject-title">${escapeHtml(subj.name)}</span>
              <span class="subject-weight-tag">Peso ${subj.weight} (${subj.weight}x no ciclo)</span>
            </div>
            <div class="mt-1">${flagBtn}</div>
          </div>
        </div>
        <button class="btn-icon-danger" title="Excluir Matéria" onclick="deleteSubject('${subj.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

function renderActiveFocusCard() {
  const nameEl = document.getElementById('focusSubjectName');
  if (!nameEl) return;
  const stepNumEl = document.getElementById('focusStepNumber');
  const roundTagEl = document.getElementById('focusRoundTag');
  const btnComplete = document.getElementById('btnCompleteCurrent');
  const progressFill = document.getElementById('progressFill');
  const progressPerc = document.getElementById('progressPercentage');

  const totalSteps = appState.cycleList.length;
  const completedSteps = appState.cycleList.filter(s => s.completed).length;
  const percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressPerc) progressPerc.textContent = `${percent}% (${completedSteps}/${totalSteps} blocos)`;

  const dayTagEl = document.getElementById('focusDayTag');
  if (dayTagEl) {
    const goal = getDailyGoal();
    const idx = getCurrentStepIndex();
    const ref = idx === -1 ? Math.max(totalSteps - 1, 0) : idx;
    const dayNum = Math.floor(ref / goal) + 1;
    const dayStart = (dayNum - 1) * goal;
    const dayTotal = Math.min(goal, totalSteps - dayStart);
    const dayDone = appState.cycleList.slice(dayStart, dayStart + goal).filter(s => s.completed).length;
    dayTagEl.textContent = totalSteps ? `Dia ${dayNum} · ${dayDone}/${dayTotal}` : 'Dia 1';
  }

  const activeIndex = getCurrentStepIndex();

  if (totalSteps === 0) {
    nameEl.textContent = 'Adicione matérias para iniciar';
    stepNumEl.textContent = 'Trilha vazia';
    roundTagEl.textContent = 'Sem dados';
    btnComplete.disabled = true;
    return;
  }

  if (activeIndex === -1) {
    nameEl.textContent = '🎉 Ciclo 100% Concluído!';
    stepNumEl.textContent = `Todos os ${totalSteps} blocos finalizados`;
    roundTagEl.textContent = 'Parabéns!';
    btnComplete.disabled = false;
    btnComplete.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
      </svg>
      Iniciar Novo Ciclo
    `;
    btnComplete.onclick = () => {
      appState.currentCycleNumber += 1;
      resetCurrentCycleProgress();
    };
    return;
  }

  // Volta botão ao normal se não estiver finalizado
  btnComplete.disabled = false;
  btnComplete.onclick = completeCurrentStep;
  btnComplete.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    Concluir e Próxima
  `;

  const activeStep = appState.cycleList[activeIndex];
  nameEl.textContent = activeStep.subjectName;
  stepNumEl.textContent = `Bloco ${activeStep.globalOrder} de ${totalSteps}`;
  roundTagEl.textContent = `${activeStep.round}ª Passagem`;
}

function renderVerticalTimeline() {
  const container = document.getElementById('cycleContainer');
  if (!container) return;

  if (appState.cycleList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>Sua trilha vertical de estudos aparecerá aqui.</p>
        <p style="font-size: 0.85rem; margin-top: 4px;">Adicione disciplinas e pesos no painel ao lado.</p>
      </div>
    `;
    return;
  }

  const activeIndex = getCurrentStepIndex();
  let html = '';
  let currentRound = 0;

  appState.cycleList.forEach((step, index) => {
    if (index % getDailyGoal() === 0) {
      const dayN = index / getDailyGoal() + 1;
      const inDay = Math.min(getDailyGoal(), appState.cycleList.length - index);
      html += `
        <div class="round-separator">
          <span class="round-title-tag" style="color:#6ee7b7;background:rgba(16,185,129,0.14);border-color:rgba(16,185,129,0.3)">📅 Dia ${dayN} — bloco de ${inDay} matérias</span>
          <div class="round-line"></div>
        </div>
      `;
    }
    // Insere separador de rodada vertical
    if (step.round !== currentRound) {
      currentRound = step.round;
      const roundName = currentRound === 1 
        ? '1ª Passagem: Coluna Principal (Todas as Matérias)' 
        : `${currentRound}ª Passagem: Matérias de Peso ${currentRound}+ (Abaixo da 1ª Coluna)`;

      html += `
        <div class="round-separator">
          <span class="round-title-tag">${roundName}</span>
          <div class="round-line"></div>
        </div>
      `;
    }

    const isActive = (index === activeIndex);
    const isDone = step.completed;
    
    let statusClass = 'is-pending';
    let statusText = 'Pendente';

    if (isDone) {
      statusClass = 'is-done';
      statusText = 'Concluído';
    } else if (isActive) {
      statusClass = 'is-active';
      statusText = 'Em Estudo';
    }

    const subj = appState.subjects.find(s => s.id === step.subjectId);
    const isFlagged = subj ? !!subj.flagged : false;
    const flagBtn = renderSubjectFlagButton(step.subjectId);
    const flaggedCardClass = isFlagged ? ' is-flagged-subject' : '';

    html += `
      <div class="cycle-step-card ${statusClass}${flaggedCardClass}" id="step-${index}" onclick="toggleStepCompleted(${index})" title="Clique para alternar status concluído/pendente">
        <div class="step-order-badge">${step.globalOrder}</div>
        <div class="step-details">
          <div class="step-main-info flex-wrap">
            <div class="subject-color-tag" style="background-color: ${step.color || '#6366f1'}; width: 10px; height: 10px;"></div>
            <div>
              <span class="step-subject-name">${escapeHtml(step.subjectName)}</span>
              <span class="step-instance-tag">${step.round}ª vez no ciclo</span>
            </div>
            ${flagBtn}
          </div>
          <div class="step-status-tag">${statusText}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
