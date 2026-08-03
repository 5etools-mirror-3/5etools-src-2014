# Migração do Charactermancer: Plutonium para 5eTools

Este documento detalha a estrutura do DOM (HTML) encontrada no Charactermancer original do módulo Plutonium (FoundryVTT) e fornece instruções técnicas para adaptar a implementação nativa do 5etools (`js/charactermancer.js` e `wizard-shell.js`) para alcançar fidelidade visual e funcional.

---

## 1. Estrutura e Layout do Plutonium (DOM)

A investigação do DOM do Charactermancer no Plutonium revelou que ele utiliza maciçamente as classes e convenções do próprio 5etools, com uma organização muito específica:

### 1.1. Estrutura Geral (Abas e Contêiner)
* **Contêiner Principal:** Roda em uma janela padrão `.application.ve-app`.
* **Sistema de Abas:** Utiliza `.ve-ui-tab__wrp-tab-heads` para os botões superiores e `.ve-ui-tab__wrp-tab-body` para o conteúdo. A navegação ocorre adicionando/removendo a classe `.ve-hidden`.
* **Layout Interno de Duas Colunas:** **Este é o maior diferencial**. Cada aba (`tab-body`) usa um container Flexbox (`.ve-flex.ve-w-100.ve-h-100`) dividido em duas metades:
  * **Coluna Esquerda (Configurações):** Onde o usuário escolhe classes, marca perícias, etc.
  * **Coluna Direita (Preview):** Uma área de leitura que renderiza o texto/statblock correspondente à escolha atual da esquerda, usando as classes padrão `.ve-rd__b`, `.ve-rd__h`.

### 1.2. Aba de Seleção de Classe (Class)
* **Dropdown de Escolha:** Em vez de usar a tag nativa `<select>`, usa o componente avançado de busca do 5etools chamado `.ve-ui-sel2__wrp` (que possui um `.ve-ui-sel2__ipt-search` embutido).
* **Seleção de Perícias:** Renderizadas como uma lista zebrada (`stripe-even`), com a seguinte estrutura:
  ```html
  <label class="ve-flex-v-center ve-py-1 stripe-even">
     <div class="ve-col-1"><input type="checkbox" /></div>
     <div class="ve-col-11">Acrobatics (Dex)</div>
  </label>
  ```
* **Progresso de Nível (1 a 20):** Não é um dropdown numérico, mas sim uma tabela `.veapp__list` onde cada nível possui um *radio button* para seleção do nível desejado/alvo.

### 1.3. Aba de Origem (Background)
* **Opções de Background:** Usa `<select>` tradicional para escolher entre características padrão ou customizadas, além do `ve-ui-sel2` para escolher o background principal.
* **Textos e Tabelas:** Utiliza as classes do renderizador (`ve-rd__b`) para injetar descrições. Traços de Personalidade, Ideais e Vínculos escondem as tabelas originais (`table.ve-rd__table`) sob um botão "View Table".
* **Inputs Customizados:** Exibe textareas (`textarea.ve-form-control`) logo abaixo das tabelas para o preenchimento/registro definitivo pelo jogador.

---

## 2. Análise da Implementação Atual no 5etools

Ao analisar a sua implementação atual em `js/charactermancer/app/wizard-shell.js`, notamos que:
1. O `WizardShell` engloba tudo em um único container de fluxo vertical (`.cmchr__shell ve-flex-col`).
2. O container das abas (`.cmchr__tabs-mount`) atualmente ocupa 100% da largura, sem o padrão de "Preview Side-by-Side" (Duas Colunas).
3. A navegação usa botões no rodapé (`.cmchr__footer-nav`) com botões "Previous / Next", o que é um fluxo estilo *Wizard* (passo-a-passo), enquanto o Plutonium permite navegação livre via *Tab Heads* superiores combinada com o Wizard.

---

## 3. Instruções Técnicas para Migração e Fidelidade

Para que as suas telas do Charactermancer nativo fiquem fiéis à versão do Plutonium, implemente as seguintes alterações nas suas abas (como `WizardTabClass` ou no próprio `WizardTabHost`):

### Passo 1: Implementar o Layout de Duas Colunas (Split View)
Nos métodos de renderização de cada aba (dentro de `cmchr__tabs-mount`), você deve abandonar o fluxo de coluna única.
**Exemplo de refatoração para o interior de cada Aba:**
```javascript
// Dentro do seu componente de renderização da Aba (ex: wizard-tab-class.js)
const $content = ee`<div class="ve-flex ve-w-100 ve-h-100 min-h-0">
    <!-- Coluna Esquerda: Formulários e Inputs -->
    <div class="ve-col-6 ve-flex-col ve-p-2 overflow-y-auto">
        <!-- Renderize aqui o dropdown de classes, checkboxes de perícias -->
    </div>
    
    <!-- Coluna Direita: Preview do Conteúdo -->
    <div class="ve-col-6 ve-flex-col ve-p-2 overflow-y-auto" style="border-left: 1px solid var(--border-color);">
        <div class="cmchr__preview-mount ve-rd__b">
            <i>Selecione uma classe para ver os detalhes...</i>
        </div>
    </div>
</div>`;
```

### Passo 2: Atualizar os Componentes de Dropdown
Substitua os `<select class="ve-form-control">` genéricos pelos componentes `Searchable Select` do 5etools nas seleções primárias (como Classe e Background).
* Procure por classes utilitárias no repositório do 5etools que expõem o comportamento `.ve-ui-sel2`. Geralmente, isso é feito instanciando classes UI específicas do projeto e passando os dados (`dataset`).

### Passo 3: Fidelizar as Checkboxes de Perícias
Quando mapear as opções de *Skill Proficiencies* (`skillProficiencyChoices` do seu `class-build-state.js`), gere a UI usando o flexbox zebrado exato do Plutonium:
```javascript
const $lblSkill = ee`<label class="ve-flex-v-center ve-py-1 stripe-even">
    <div class="ve-col-1">
        <input type="checkbox" name="\${skillId}" class="cmchr__skill-cb">
    </div>
    <div class="ve-col-11">\${skillName}</div>
</label>`;
```

### Passo 4: Sincronizar o Renderizador com o Preview
Crie *listeners* de estado. No seu `CharacterBuildState` ou `ClassEntryState`, sempre que a classe for alterada (`classRef`), invoque o renderizador principal de classes do 5etools para popular o container `.cmchr__preview-mount` da coluna direita com o *statblock* da classe.

### Passo 5: Alterar a Seleção de Nível
No seu `class-build-state.js`, existe o `targetLevel`. Em vez de um input `number` ou select, renderize uma lista `.veapp__list` onde o usuário possa clicar na linha correspondente ao nível desejado, atualizando o state de `targetLevel`.
