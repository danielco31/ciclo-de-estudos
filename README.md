# Ciclo de Estudos - Gestão Vertical de Estudos

Aplicativo web moderno para criação, organização e acompanhamento de **ciclos de estudos verticais baseados em pesos e repetições automáticas**.

---

## 🎯 Como Funciona o Algoritmo Vertical por Pesos

Ao cadastrar suas matérias e definir seus respectivos pesos, o sistema gera uma trilha linear vertical dividida em rodadas de passagem:

1. **1ª Passagem (Coluna Principal):**
   - Lista todas as matérias cadastradas que possuem peso $\ge 1$.
   - Cada matéria é numerada sequencialmente (1, 2, 3...).
2. **2ª Passagem (Abaixo da 1ª Coluna):**
   - Lista todas as matérias que possuem peso $\ge 2$ (reaparecem para a sua 2ª revisão).
   - Seguem a numeração sequencial contínua (ex: 4, 5...).
3. **Passagens Seguintes (Peso $\ge 3$):**
   - Continua empilhando verticalmente as matérias de maior peso até contemplar todos os pesos configurados.

### Exemplo Prático:
- **Português (Peso 2)**
- **Matemática (Peso 1)**
- **Direito Constitucional (Peso 1)**

**Resultado na Trilha Vertical:**
- `1.` Português *(1ª vez)*
- `2.` Matemática *(1ª vez)*
- `3.` Direito Constitucional *(1ª vez)*
- `4.` Português *(2ª vez)*

---

## 🚀 Funcionalidades

- **Avanço Automático:** Clique em **"Concluir e Próxima"** para finalizar a matéria atual e ir direto para o próximo bloco da trilha.
- **Alternar Status Livre:** Clique em qualquer cartão da lista vertical para marcar ou desmarcar como concluído manualmente.
- **Persistência Total (LocalStorage):** Seus dados, matérias, progresso e número do ciclo ficam salvos automaticamente no seu navegador. Não precisa de login.
- **Gestão de Matérias:** Adicione novas matérias com pesos de 1 a 10 e cores personalizadas; remova matérias quando quiser.
- **Contador de Ciclos & Reinício:** Conclua o ciclo completo e avance para o Ciclo #2, #3, etc., ou reinicie o ciclo atual a qualquer momento.

---

## 💻 Como Executar Localmente

### Opção 1: Abrir direto no navegador
Basta dar um duplo clique ou abrir o arquivo `index.html` em qualquer navegador moderno.

### Opção 2: Servidor Local
Execute no terminal da pasta do projeto:
```bash
python3 -m http.server 3000
```
E acesse no navegador: [http://localhost:3000](http://localhost:3000)
