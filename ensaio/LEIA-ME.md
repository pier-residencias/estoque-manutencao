# Ensaio de desempenho — Pier Gestão

Esta pasta fica **só na branch `ensaio-desempenho`**. Nada daqui vai para a `liberacao-inventario`, para a `main` nem para o GitHub Pages.

| Arquivo | Para quê |
|---|---|
| `Codigo-ensaio.gs` | O `Código.gs` da liberação com **uma única linha diferente**: a `VERSAO` termina em `· ENSAIO DE DESEMPENHO`. É assim que a implantação do ensaio se identifica. |
| `Ensaio.gs` | Carga fictícia (300 materiais, cerca de 1.500 movimentações), conferência e medição da recuperação. Só roda na planilha de ensaio. |
| `painel-ensaio.html` | Painel que mede o tempo das operações. Abra direto no Chrome ou Edge (duplo clique). |

## Travas de segurança

**Dentro do Apps Script (`Ensaio.gs`)**: a carga se recusa a rodar, sem ler nem gravar nada, se:
- a planilha for a oficial (comparação pelo ID) ou a homologação existente (comparação por impressão SHA-256);
- o nome da planilha não tiver "HOMOLOGAÇÃO" **e** "ENSAIO DE DESEMPENHO";
- faltar `AMBIENTE=homologacao` ou `ENSAIO=sim`;
- `HOMOLOG_PLANILHA_ID` ou `ENSAIO_PLANILHA_ID` não forem exatamente o ID desta planilha;
- existir `LIBERAR_ACIONADOR_OFICIAL`;
- a `VERSAO` não for a do ensaio (o `Código.gs` da produção e o da homologação não têm o sufixo);
- o `Homologacao.gs` estiver no projeto.

Antes da carga, ela também confere o conteúdo:
- só existem contas de teste ou de ensaio;
- nenhum telefone está preenchido;
- há no máximo 20 materiais sem a marca [TESTE] ou [ENSAIO];
- as pastas de fotos e NF têm "ENSAIO" no nome, estão vazias e não são as da homologação.

Depois disso, a carga ainda exige a simulação, o código `ENS-XXXXXX` copiado para `CONFIRMAR_ENSAIO` (vale 15 minutos) e a planilha sem mudanças desde a simulação.

**No painel**, nesta ordem, e para na primeira trava que falhar:
1. O endereço precisa ser um link `/exec`. Os prefixos da produção e da homologação existente são recusados sem nenhuma chamada.
2. É feita só uma **leitura** da versão (GET). Se a implantação não responder com a versão do ensaio, nenhum POST é enviado, nem mesmo um login. Isso protege também contra um endereço novo da produção ou da homologação.
3. As 7 contas de ensaio precisam entrar e voltar com o usuário e o perfil esperados. Com a senha errada, o painel para na primeira conta.
4. Todos os materiais precisam ter a marca [ENSAIO], e são pelo menos 250.
5. A rede fica travada no próprio navegador: `fetch` só chega ao endereço conferido; `XMLHttpRequest` e `sendBeacon` ficam desligados.
6. As gravações só usam materiais [ENSAIO] de Manutenção, sem ajuste pendente e sem bloqueio. Nada é guardado no navegador: nem senha, nem endereço, nem sessão.

## Medição da recuperação (no editor do Apps Script da planilha de ensaio)
- `medirRecuperacaoSemPendencias()` — 20 execuções.
- `prepararInterrompidas5()` ou `prepararInterrompidas20()` ou `prepararInterrompidasComHistorico5()` → depois `medirRecuperacaoComPendencias()`.
- `conferirEnsaio()` — só leitura, a qualquer momento.

## Ordem de uso no Google (somente depois de autorizado)
1. Fazer uma **cópia nova** da planilha de homologação com o nome `PIER GESTÃO - HOMOLOGAÇÃO - ENSAIO DE DESEMPENHO`. A homologação existente não é usada nem alterada.
2. No Apps Script da cópia:
   - colar `Codigo-ensaio.gs` no lugar do `Código.gs`;
   - apagar o `Homologacao.gs`;
   - acrescentar o `Ensaio.gs`.
3. Criar duas pastas novas com "ENSAIO" no nome.
4. Criar as propriedades `AMBIENTE`, `ENSAIO`, `HOMOLOG_PLANILHA_ID`, `ENSAIO_PLANILHA_ID`, `PASTA_FOTOS_OS`, `PASTA_NF` e `ENSAIO_SENHA`.
5. Rodar `autorizar`, depois `simularCargaEnsaio`, preencher `CONFIRMAR_ENSAIO` e rodar `executarCargaEnsaio`.
6. Implantar como app da Web e colar o `/exec` no painel.
