# Exportador da Costa da Espada

Ferramenta local e autocontida para gerar um corpus Markdown sobre a Costa da Espada a partir dos dados estruturados do 5etools.

## Uso

Na raiz do repositório:

```bash
npm run export:sword-coast
```

A saída é recriada em `tools/sword-coast-export/output/`. Todos os arquivos ficam em uma única pasta para facilitar o upload em lote no NotebookLM.

Envie `00-DIRETRIZES-PROMPT.md` com os demais arquivos e use `00-INDICE.md` como mapa do corpus. `00-MANIFESTO.md` registra precisamente as obras, os recortes e os arquivos gerados.

## Escopo

- Livros integrais: SCAG, Acquisitions Incorporated e Minsc and Boo's Journal of Villainy.
- Campanhas regionais integrais: Phandelver, Essentials Kit, Waterdeep, Tyranny of Dragons, Storm King's Thunder e Dragons of Stormwreck Isle.
- Recortes curados: Dessarin Valley, Candlekeep, Baldur's Gate, Icewind Dale, Gauntlgrym, Phandalin/Neverwinter e Neverdeath.
- Anexos: NPCs/monstros, itens, backgrounds, facções e organizações provenientes das fontes selecionadas.

Campanhas e anexos podem conter spoilers para jogadores.

## Manutenção

O escopo editorial fica em `corpus-manifest.js`. Cada recorte valida índice, nome do catálogo e ID raiz; mudanças nos dados causam falha explícita em vez de uma exportação silenciosamente incorreta.

Esta ferramenta não importa módulos de `tools/notebooklm-export` e pode evoluir independentemente dela.
