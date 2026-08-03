# Goal Description
Migrar a interface gráfica (UI) do Charactermancer nativo do projeto 5etools para que tenha 100% de fidelidade visual e de usabilidade com a versão do módulo Plutonium do FoundryVTT. Isso será feito consumindo o motor de regras de D&D (statgen) que já existe nativamente no 5etools e reescrevendo apenas a camada de renderização visual.

## User Review Required
> [!IMPORTANT]
> O motor de regras do 5etools (`js/statgen`) e o controle de estado do charactermancer (`js/charactermancer/state`) são muito complexos e funcionais. Nós NÃO vamos refatorá-los profundamente. Nossa meta é focar nos arquivos da pasta `js/charactermancer/app` (especialmente o `wizard-shell.js` e as abas) para moldar o HTML no formato de duas colunas e utilizar os componentes de UI avançados (`ve-ui-sel2`).

## Open Questions
> [!WARNING]
> Você gostaria que a navegação atual do Wizard (os botões Previous / Next no rodapé) seja mantida, ou devemos removê-la para deixar apenas a navegação superior livre (clicando diretamente nas abas de "Class", "Origin"), exatamente como ocorre no Plutonium?

## Proposed Changes

### 1. Refatoração do Layout Principal (WizardShell)
O arquivo base da interface, que atualmente agrupa o layout inteiro em fluxo contínuo, será redesenhado.
*   **[MODIFY]** `js/charactermancer/app/wizard-shell.js` (e `wizard-tab-host.js` se aplicável):
    *   Remover o layout vertical atual (`cmchr__tabs-mount` com largura total).
    *   Implementar a estrutura base do Plutonium: Abas de cabeçalho (`.ve-ui-tab__wrp-tab-heads`) e contêineres de corpo ocultáveis (`.ve-hidden`).
    *   Estabelecer o grid flexbox pai que será herdado por todas as abas.

### 2. Migração da Aba de Classe (Class Tab)
Adaptar os formulários e a injeção do componente de busca para seleção de classe.
*   **[MODIFY]** `js/charactermancer/app/` (arquivos de UI de Classe):
    *   Implementar o Layout de 2 Colunas (`ve-col-6` para formulário e preview).
    *   Substituir `<select>` nativos pelo componente `ve-ui-sel2__wrp` (Searchable Select).
    *   Implementar a lista zebrada (`stripe-even`) com Flexbox para as opções de Perícias.
    *   Adicionar um *listener* que, ao alterar a classe, forneça o ID da classe ao motor do 5etools (`Renderer.get()`) para injetar o statblock no lado Direito.
    *   Substituir o campo numérico de Nível por uma tabela clicável (`.veapp__list`) de 1 a 20.

### 3. Migração da Aba de Origem / Espécie (Origin / Background)
Conectar a rica lógica de estado de atributos (ASI) ao visual do Foundry.
*   **[MODIFY]** `js/charactermancer/app/` (arquivos de UI de Espécie/Race/Background):
    *   Replicar o Grid de 2 Colunas.
    *   Conectar o componente `StatGenUiRenderLevelOneRace` que encontramos (responsável por Tasha e ASI) dentro da Coluna Esquerda, garantindo que suas condicionais continuem funcionando.
    *   Criar o layout das tabelas "View Table" ocultáveis e os `textareas` de características de personalidade (Ideais, Vínculos, etc).

### 4. Nossa Metodologia de Trabalho
1. **Inspeção Constante:** Como o visual é o objetivo principal, eu usarei a ferramenta `browser_subagent` frequentemente na sua instância do Foundry (`localhost:30000`) para extrair a árvore DOM (HTML) e as classes CSS exatas das partes em que tivermos dúvidas.
2. **Reutilização Extrema:** Evitaremos escrever HTML cru de estatísticas. Vamos instanciar os métodos do 5etools (`Renderer`, `ComponentUiUtil`) para gerar o HTML sempre que possível, garantindo manutenção a longo prazo.

## Verification Plan

### Manual Verification
Após aplicarmos as alterações por etapas (ex: terminando a Aba de Classe), eu pedirei a você para:
1. Abrir a versão local do 5etools no seu navegador.
2. Acessar o Charactermancer.
3. Verificar visualmente se a aba está idêntica à do FoundryVTT.
4. Testar uma regra condicionada (ex: selecionar *Tabaxi* e ver se as opções de ASI atualizam magicamente no lado esquerdo).
