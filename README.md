# Pier Gestão

Sistema para controlar os itens do setor de manutenção: entradas (compras), saídas, trocas de peças, empréstimos de ferramentas com devolução, histórico e painel para a administração.

- **Site:** publicado pelo GitHub Pages a partir deste repositório.
- **Dados:** ficam na planilha do Google "Estoque da Manutenção" (abas Itens, Movimentacoes, Emprestimos e Config).
- **Ligação entre os dois:** o código em `apps-script/Codigo.gs`, instalado na planilha em Extensões → Apps Script.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html`, `estilo.css`, `app.js` | O site |
| `config.js` | Endereço do Apps Script (link do App da Web, termina em `/exec`) |
| `apps-script/Codigo.gs` | Código que lê e grava na planilha |

## Usuários e permissões

Os logins e perfis são gerenciados no próprio site, na aba **Usuários** (só aparece para quem tem essa permissão). Também ficam visíveis na planilha:

- **Aba Usuarios:** usuário, nome do colaborador, senha, perfil e se está ativo. O nome é o que aparece em "Registrado por" no histórico.
- **Aba Perfis:** o que cada perfil pode fazer (Sim ou Não em cada permissão). O perfil **Administração** sempre tem acesso total.

O servidor confere a permissão em cada ação, então esconder um botão não é a única proteção.

## Dashboard

A aba **Dashboard** mostra, para o período escolhido: retiradas, compras, empréstimos, estoque crítico, valor estimado do estoque (pelo último preço de compra de cada item), itens parados, gráficos por dia ou mês, itens mais retirados, destinos, colaboradores, categorias, fornecedores, trocas e o consumo detalhado por item, com exportação em CSV.

Os dados do estoque e as senhas não ficam neste repositório, só na planilha.

## Setores do estoque (Manutenção e Limpeza)

Cada item pertence a um setor (coluna **Setor** da aba Itens; em branco = Manutenção). O setor é escolhido na tela de entrada (menu **Setor**, acima do usuário e da senha) e aparece no topo, ao lado do nome; quem tem acesso aos dois setores troca pelo link **trocar**. Painel, Registrar, Itens, Histórico, Empréstimos e Dashboard passam a mostrar só o setor escolhido. O acesso a cada setor é uma permissão do perfil (Setor Manutenção / Setor Limpeza, na aba Perfis). A função `autorizar` cria o perfil **Limpeza** e o login `limpeza` (a senha aparece no registro de execução e em Usuários). A importação de inventário vale só para o setor escolhido: "tirar da lista" nunca apaga itens do outro setor. Itens novos da limpeza recebem códigos LIM-001, LIM-002…

Um item está **para repor** quando o estoque chega ao mínimo (igual ou abaixo).

## Itens: filtro por data

Na aba **Itens**, o campo **Filtrar por data** mostra só os itens cadastrados, com entrada, com saída ou troca, ou com qualquer movimento num **mês** ou num **dia**. A coluna **No período** soma o que entrou e saiu de cada item naquele período.

## Ordens de serviço

A aba **OS** registra pedidos de serviço: local, categoria, prioridade com prazo, responsável, fotos de antes e depois (salvas na pasta "Fotos das OS - Estoque da Manutenção", ao lado da planilha) e os materiais retirados do estoque pela OS. O andamento fica numa linha do tempo e na coluna Andamento da aba **OS** da planilha. As permissões Ver, Abrir, Atender e Gerenciar OS ficam na aba **Perfis**.

## Demandas

A aba **Demandas** é onde a administração delega tarefas para a equipe da manutenção: o que fazer, onde, prioridade, prazo e responsável. Quem recebe vê um destaque ao entrar no site e confirma com **Dar ciente**; a administração vê quem leu e quando. Depois o responsável inicia e conclui, descrevendo o que foi feito. Se a demanda precisar de material ou de fotos, vira uma OS com um clique (**Abrir OS**) e as duas ficam ligadas.

O botão **Avisar no WhatsApp** abre o WhatsApp com a mensagem pronta e o link do sistema. O número de cada colaborador fica em **Usuários** (coluna Telefone da aba Usuarios).

**Preventivas** são tarefas que se repetem (toda semana, todo mês, a cada 6 meses…). Na data marcada, o sistema cria a demanda sozinho na primeira vez que alguém abre o site no dia. Se o site ficar dias sem uso, cria só uma demanda atrasada e passa para a próxima data.

Os dados ficam nas abas **Demandas** e **Preventivas** da planilha. As permissões Ver, Executar e Delegar demandas ficam na aba **Perfis**.

## Menu Administração

Na tela de entrada, o campo **Setor** tem três opções, e cada uma mostra só o que é dela:

- **Manutenção**: Painel, Demandas, OS, Registrar (saída, entrada, troca e empréstimo), Itens, Histórico, Empréstimos, Dashboard e Usuários.
- **Limpeza**: Painel, Registrar (só saída e entrada), Itens e Histórico, com os materiais da limpeza.
- **Administração**: nenhuma aba do estoque, só o menu suspenso **Administração ▾** (no celular, **Adm. ▾**) no fim da barra.

Quem tem acesso a mais de uma opção troca pelo botão **Setor** no cabeçalho, que abre um menu com os setores disponíveis (cada um com ícone, cor e descrição); para quem só tem um setor, o botão apenas mostra qual é. A opção Administração só aceita perfis com pelo menos uma permissão do grupo **Administração** na aba **Perfis**; o perfil Administração tem todas. A escolha fica lembrada no aparelho. Para pôr uma tela nova no menu: um botão com `data-adm-tab` em `#adm-menu` (index.html), a aba em `ABAS_PERM` e `ABAS_ADM` (app.js) e a permissão em `PERMISSOES`, grupo `'Administração'` (Codigo.gs).

### Controle de pendências

Em **Administração → Controle de pendências** fica a lista de pendências cobrada pelo síndico, dividida nas mesmas seções do e-mail dele. Em cada linha dá para mudar a situação (Pendente, A cotar, Em andamento, Aguardando entrega, Aguardando síndico, Concluído), o responsável, o prazo e a observação; tudo é gravado na hora na aba **Pendencias** da planilha, com quem alterou e quando. Prazo vencido fica em vermelho. Há busca, filtros, resumo por situação, **+ Adicionar item** em cada seção (a seção **Outras demandas da administração** é para o que a administração toca e não está na lista do síndico) e o botão **Gerar texto para e-mail**, que monta o status de tudo no formato do e-mail do síndico para colar no corpo da resposta.

Cada pendência tem **criticidade** (Baixa, Média ou Alta), escolhida na própria linha ou ao incluir. As de criticidade alta ainda em aberto ficam marcadas com um ponto vermelho, aparecem contadas no resumo e podem ser filtradas; no texto do e-mail a criticidade vai junto de cada item.

**Tarefa constante.** Uma pendência pode ser *Pontual* (tem fim e é concluída) ou *Tarefa constante* (rotina que se repete, como a verificação mensal do deck). A tarefa constante tem frequência (diária a anual) e, no lugar da situação, mostra a frequência e o botão **✓ Feito hoje**, que registra a execução e agenda a próxima data (campo de prazo = próxima execução; vencida fica em vermelho). As últimas execuções ficam na coluna Execuções e aparecem ao editar. Tarefas constantes não entram na porcentagem de concluídas.

**Subitens.** Cada pendência tem **+ subitem**: o subitem recebe o número N.1, N.2… e fica logo abaixo do item. Não há subitem de subitem. Excluir um item exclui também os subitens dele, e mudar a seção leva os subitens junto.

**Prazo bloqueado e data de conclusão.** Em pendência pontual, o prazo fica **bloqueado** depois de definido: na linha, ao escolher a data aparece a confirmação **Bloquear prazo**; ao incluir (formulário ou **+ Adicionar item**) o prazo informado já entra bloqueado. Bloqueado, ele aparece com um cadeado e o servidor recusa qualquer mudança; correção só direto na coluna Prazo da aba Pendencias. Ficam registrados **Prazo definido em** e **Prazo definido por**. A coluna **Concluída em** recebe a data de hoje quando a situação vira Concluído (dá para corrigir; não aceita data futura), é apagada se a pendência for reaberta, e preenchê-la à mão conclui a pendência. A linha concluída mostra "Concluída no prazo" ou "Concluída N dias após o prazo", e o texto do e-mail leva "concluída em dd/mm". Tarefa constante não tem bloqueio (o prazo dela é a próxima execução) nem data de conclusão.

**Editar.** O link **editar** de cada linha abre todos os campos: seção, descrição, detalhes, tipo e frequência, criticidade, situação, prazo e responsável.

Para incluir, use **+ Incluir pendência** (no topo da tela ou em **Administração → Incluir pendência**): seção, descrição, detalhes, prazo e responsável.

**Síndico.** A função `autorizar` cria o perfil **Síndico**, só com a permissão Pendências (acesso completo à lista). Crie o login dele em **Usuários** com esse perfil; ele entra escolhendo **Administração** no campo Setor (logins sem setor do estoque são orientados a usar essa opção). O que o síndico inclui chega para a equipe destacado como **Nova do síndico**, com contador vermelho no menu Administração e no resumo; o destaque some quando alguém da equipe clica em **Ciente** ou altera a pendência. Na aba Pendencias da planilha ficam as colunas Incluída por, Origem, Vista em e Vista por.

**Usuários e Histórico de acessos.** Usuários e permissões ficam no menu Administração (saíram da barra da Manutenção). O **Histórico de acessos** registra na aba Acessos cada entrada com senha, cada volta ao sistema com a sessão salva e cada tentativa com senha errada (a senha nunca é gravada), com data, hora, setor escolhido e aparelho. Só quem tem a permissão **Histórico de acessos** vê essa tela; por padrão, só o perfil Administração.

O link do Apps Script aberto no navegador mostra a versão do código instalado (campo `versao`), o que ajuda a conferir se a implantação nova entrou.

A permissão é **Pendências** (grupo Administração). Na primeira vez que a aba Pendencias é aberta, ela recebe os 74 itens da lista de 13/10/2026 com a situação do relatório de 14/10; isso acontece uma vez só.

## Inventário com aprovação da Administração (branch `homologacao`)

Nenhuma correção de saldo entra sem aprovação. Fluxo:

1. Quem tem a permissão **Registrar contagens** (por padrão a Manutenção; a Limpeza e a Portaria não) abre **Contagem**, digita a quantidade encontrada em cada item e envia.
2. Quantidade igual ao sistema: vira **Conferência** no Histórico (responsável, data, hora, item e quantidade), sem aprovação e sem mexer no saldo.
3. Quantidade diferente: exige justificativa e vira uma solicitação **Pendente** na aba **Contagens** (número CT-0001…, saldo no momento da contagem, última movimentação do item, quantidade contada, diferença, justificativa, quem contou e quando). O saldo não muda.
4. Em **Administração → Aprovações de estoque**, alguém do perfil **Administração** que **não** seja quem contou aprova, rejeita ou devolve para **Reconferir** (com motivo), um por um ou em lote. A quantidade aprovada é sempre a contada.
5. Na aprovação o servidor confere, dentro do bloqueio que já existe: perfil, quem contou (pelo **identificador fixo da conta**, veja abaixo), versão da solicitação, saldo atual e última movimentação do item. Se o item mudou depois da contagem, a solicitação vai para Reconferir sem alterar nada. Aprovada, grava um **Ajuste** no Histórico (saldo anterior, saldo final, nº da contagem, quem contou, quem aprovou) e o saldo novo.
6. Situações: Pendente, Aprovada, Rejeitada, Reconferir, Cancelada (quem contou cancela enquanto está pendente). Decidida, não muda mais.

**Aprovação independente.** Cada conta tem um **ID da conta** (coluna nova na aba Usuarios, `C-` + 16 caracteres), gerado pelo sistema uma vez e nunca reaproveitado: não muda quando o login ou o nome mudam, e um login apagado e recriado com o mesmo nome recebe outro ID (a sessão antiga cai). A contagem guarda o ID de quem contou e a decisão, o de quem decidiu. Quem contou não decide a própria contagem, sem exceção: o bloqueio vale pelo ID e, por segurança, também pelo login. O nome de exibição não é usado. Linha copiada à mão na aba Usuarios (ID repetido) recebe ID novo na hora, com registro na Auditoria. Para funcionar, cada pessoa da Administração precisa de **login individual**: com um login só, as contagens dele ficam pendentes (a tela de Aprovações avisa). Login compartilhado anula a separação e não deve ser usado.

**Recuperação de falhas.** A aprovação grava em etapas com um identificador de operação: marca a solicitação, grava o histórico, grava o saldo (valor absoluto) e conclui. Se o script parar no meio, a operação é terminada (ou desfeita, se nada foi gravado) sem aplicar duas vezes, de dois jeitos: antes de qualquer gravação de qualquer pessoa e pela **verificação automática** (abaixo). A resposta só diz "aprovado" depois de conferir saldo e solicitação.

**Verificação automática (`recuperarOperacoesPendentes`).** Roda por um acionador de tempo a cada 10 minutos, dentro do mesmo bloqueio das gravações (se o sistema estiver ocupado, espera até 30 s e, sem conseguir, tenta na rodada seguinte sem mexer em nada). Em cada rodada:
- procura toda solicitação em etapa "aplicando" (mesmo se a marca de operação aberta tiver se perdido) e termina ou desfaz pelo identificador da operação;
- confere se alguma importação parou no meio e avisa a Administração;
- compara o saldo de cada item com o último saldo gravado pelo próprio sistema (guardado nas propriedades do script, fora da planilha). Diferença = edição direta na planilha ou gravação interrompida;
- grava o resultado (Administração → Aprovações de estoque → "Verificação automática") e, quando há novidade, a Auditoria.

Quando a consistência não pode ser restabelecida (saldo que não bate nem com o antes nem com o aprovado, ou saldo mudado fora do sistema), o item fica **bloqueado**: nenhuma saída, entrada, troca, empréstimo, devolução, estorno, contagem, edição, exclusão, aprovação ou importação é aceita nele. A equipe vê "Bloqueado" no item. A Administração revisa em **Aprovações de estoque → Itens bloqueados** e libera, sempre descrevendo o que conferiu: **Manter o saldo atual** (a diferença feita fora do sistema entra no Histórico como Ajuste decidido por ela) ou **Restaurar o saldo do sistema** (volta ao último valor gravado pelo sistema). Item apagado direto na planilha vira alerta. Tudo vai para a Auditoria.

O acionador **não** é instalado sozinho. Pelo editor do Apps Script: `instalarRecuperacao()` instala (e já roda uma vez), `removerRecuperacao()` tira só esse acionador. Antes de remover ou criar qualquer acionador, `instalarRecuperacao()` confere o ambiente e, se algo falhar, para sem mexer em nada:
- **planilha oficial**: só com a propriedade `LIBERAR_ACIONADOR_OFICIAL` = `sim` (criada à mão, com autorização) e sem `AMBIENTE` = `homologacao`;
- **qualquer outra planilha**: só a cópia de homologação, com `AMBIENTE` exatamente `homologacao`, `HOMOLOG_PLANILHA_ID` igual ao ID da planilha ativa, nome com "HOMOLOGAÇÃO" e ID diferente do da oficial.

A instalação fica registrada na Auditoria. A rotina `recuperarOperacoesPendentes()` em si não depende dessas propriedades (roda igual na produção). Sem o acionador, a recuperação continua acontecendo antes de cada gravação.

**Caminhos fechados.** Editar um item não muda o estoque (o campo fica travado; a quantidade nova vira solicitação). Item novo nasce com 0 e a quantidade inicial vai para aprovação. **Importar inventário** atualiza só o cadastro (nome, local, categoria, mínimo) e manda as diferenças para aprovação; linhas iguais viram Conferência; itens novos entram com 0; no modo "substituir", itens fora da lista com saldo vão para aprovação de zerar e só saem do cadastro depois de aprovados. O histórico antigo da planilha (compras e retiradas) fica guardado na solicitação e entra com a aprovação, com as datas originais e sem repetir (regras em **Importar inventário**). Ajustes e conferências não podem ser estornados (se houver erro, nova contagem). Só item com estoque 0 pode ser excluído.

**Auditoria.** Cada envio, aprovação, rejeição, reconferência, cancelamento, tentativa negada e recuperação vai para a aba Auditoria com item, solicitação, quem contou, quem decidiu, saldo, contado, diferença, quantidade final, justificativa e resultado.

**Planilha.** Aba nova **Contagens** (criada por `autorizar`), com as colunas "Contado por (ID da conta)" e "Decidido por (ID da conta)" no fim. Colunas novas no fim de **Movimentacoes**: Contagem, Operação, Saldo anterior, Saldo final, Aprovado por. Coluna nova em **Usuarios**: ID da conta. Coluna nova em **Perfis**: Registrar contagens. Nada existente é apagado.

## Proteção da planilha (configuração manual)

O site grava pelo Apps Script, que roda como o **dono da planilha** (implantação "Executar como: eu"). Por isso, proteger as abas deixando só o dono como editor **não atrapalha** o sistema, e impede qualquer outra pessoa de mexer em saldos, histórico, contagens, usuários e auditoria. O dono continua podendo editar tudo; essas edições do dono no saldo são detectadas pela verificação automática e bloqueiam o item.

1. **Implantação**: em Implantar → Gerenciar implantações, confira "Executar como: **eu** (dono)". Se outra conta implantar, as gravações falham nas abas protegidas.
2. **Compartilhamento da planilha**: deixe **só o dono** como Editor. Quem é Editor da planilha também edita o Apps Script dela (pode mudar o código e ler as propriedades do script, onde ficam o segredo das senhas e as sessões). Em Compartilhar → engrenagem, desmarque "Editores podem mudar permissões e compartilhar" e "Leitores e comentaristas podem ver a opção de baixar, imprimir e copiar". Evite dar acesso de leitura: o leitor vê todas as abas, inclusive as ocultas (Usuarios com códigos de senha e telefones, Auditoria, Acessos). A equipe e o síndico usam o site.
3. **Abas protegidas**: rode `protegerPlanilha()` pelo editor (ou faça à mão em Dados → Proteger páginas e intervalos → cada aba → "Restringir quem pode editar" → **Somente você**). Não use "Mostrar um aviso": ele não impede a edição. Abas: Itens, Movimentacoes, Contagens, Emprestimos, Usuarios, Perfis, Config, OS, Demandas, Preventivas, Pendencias, Auditoria, Acessos e as cópias "Itens (cópia de …)".
4. **Conferir**: `verificarProtecao()` só lê e lista quem tem acesso, abas sem proteção e proteções que só avisam.
5. **Ocultar aba não protege** nada.
6. **Conta do dono**: verificação em duas etapas ligada. Para investigar um item bloqueado, Arquivo → Histórico de versões mostra quem mudou a célula.


## Segurança

- **Senhas protegidas.** A coluna Senha da aba Usuarios guarda só um código (hash `h1$…` com sal próprio por pessoa, 3.000 rodadas de HMAC-SHA256 e um segredo que fica nas propriedades do script, fora da planilha). A tela de usuários não mostra mais senhas: ao editar, o campo **Nova senha** em branco mantém a atual. Senhas novas têm no mínimo 6 caracteres. Se for preciso redefinir uma senha direto na planilha, basta digitá-la na coluna Senha: ela vale uma vez em texto e vira código na primeira entrada. A função `autorizar` converte todas as senhas antigas.
- **Sessões.** Ao entrar, o servidor devolve um código de sessão; o aparelho guarda só esse código, nunca a senha. A sessão termina depois de 24 h sem uso ou 7 dias depois da entrada. **Sair** encerra a sessão no servidor. Trocar a senha ou bloquear o login encerra os acessos abertos daquela pessoa, e em Usuários há o botão **Encerrar acessos abertos**. A tabela de colaboradores mostra quantos aparelhos estão conectados.
- **Permissões no servidor.** Toda ação confere a permissão no Apps Script. Perfil sem nenhuma permissão do estoque (como o Síndico) não recebe itens nem movimentações. Só login do perfil Administração cria ou altera logins de acesso total e dá a um perfil acesso a Usuários ou ao Histórico de acessos.
- **Proteção de login.** 5 senhas erradas seguidas bloqueiam o login por 15 minutos (cada erro também demora quase 1 s para responder). A tela de usuários mostra **Bloqueado por tentativas** e o botão **Liberar o login**. Os ajustes ficam no objeto `SEG` do Codigo.gs.
- **Histórico de auditoria.** A aba **Auditoria** registra cada alteração (quem, perfil, ação, detalhe, data e hora), as tentativas sem permissão (resultado Negado), bloqueios de login, saídas e cada nota fiscal aberta. Senhas nunca são gravadas. Em **Administração → Histórico de acessos**, a opção **Alterações** mostra esse registro com busca e filtro por pessoa. As abas Auditoria e Acessos ficam protegidas: só o dono da planilha edita.
- **Arquivos.** Fotos das OS e notas fiscais só saem pelo sistema, para quem tem permissão. A função `autorizar` confere o compartilhamento da planilha, das duas pastas e de cada arquivo, fecha qualquer link aberto e registra o resultado na Auditoria.

## Nota fiscal das compras

Em **Registrar → Entrada**, o campo **Foto da nota fiscal** anexa a foto (ou o PDF) da nota da compra, até 4 arquivos. Os arquivos ficam na pasta "Notas fiscais - Pier Gestão" no Drive, ao lado da planilha, e o link vai na coluna **Foto da NF** da aba Movimentacoes. Para lançar outros itens da mesma nota, o fornecedor e o número continuam preenchidos e a mesma foto vai junto, sem enviar de novo. No **Histórico**, o link **ver nota** abre o arquivo.

### Leitura automática da nota (PDF ou foto)

Ao anexar o **PDF da nota** (a DANFE que a loja envia), o site lê fornecedor, número, data e a lista de produtos (descrição, quantidade e valor). O botão **Conferir e registrar** abre a lista: para cada linha o sistema sugere o item do estoque mais parecido (ou cadastrar como item novo), e a pessoa confere antes de gravar todas as entradas de uma vez, com a nota anexada. A escolha feita para cada produto de cada fornecedor fica lembrada naquele aparelho. A leitura usa o pdf.js (cdnjs) e o arquivo `nfe.js`.

Sem PDF, o site lê a **foto** da nota com reconhecimento de texto (Tesseract.js, carregado do jsDelivr só quando há foto; na primeira vez baixa o idioma português, depois fica guardado no aparelho). A foto é reduzida para até 3000 px, passa para tons de cinza e é endireitada (inclinação de até 6° e nota deitada). Cada linha de produto só é aceita quando quantidade × valor unitário = total, o que corrige vírgulas perdidas e letras trocadas por números; o que não fecha a conta aparece marcado como "Confira qtd e valor". Na conferência, o nome do item novo pode ser corrigido antes de cadastrar. O PDF continua sendo o mais preciso.

## Importar inventário

Em **Itens → Importar inventário**, envie a planilha da contagem (.xlsx ou .csv). O sistema acha as colunas pelo título (Código, Item, Especificação, Categoria, Tipo, Un., Saldo atual ou Quantidade, Estoque mínimo, Localização, Observações) e mostra uma prévia. **Nenhum saldo muda na importação**: diferenças vão para aprovação, iguais viram Conferência, itens novos entram com 0. Antes de gravar, guarda uma cópia oculta (e protegida) da aba Itens.

Regras de integridade:
- **Saldo**: o saldo final é sempre a quantidade contada e aprovada (valor absoluto). O histórico antigo entra só como registro; o Ajuste completa a diferença (para item novo, é o "Saldo inicial", na data mais antiga do histórico). Por isso o saldo nunca soma nada duas vezes.
- **Datas**: cada linha do histórico precisa de uma data real (dia que existe no calendário, de 2000 até hoje). Linha sem data, com data impossível ou futura fica de fora e é contada na mensagem; nunca vira "hoje".
- **Sem duplicar**: um lançamento antigo (item, compra ou retirada, data, quantidade) não entra se já existir no histórico, seja de importação anterior ou registrado à mão no sistema; a conferência é feita na importação e de novo na aprovação. Duas compras iguais no mesmo dia na planilha entram as duas, uma vez cada. Estornados não contam.
- **Itens**: linha com código usa o código; linha sem código reconhece o item do setor com o mesmo nome (assim reimportar não cria item repetido). Nome repetido sem código, ou o mesmo item duas vezes na planilha, recusa a importação inteira sem gravar nada. Histórico com nome que aparece em duas linhas fica de fora (ambíguo).
- **Repetição**: a mesma planilha enviada de novo pede confirmação. Item com ajuste pendente ou bloqueado é pulado (não ganha segunda solicitação). Aprovação parcial do lote é segura: o que foi aprovado não volta, o que foi rejeitado volta na próxima importação, o pendente é pulado.
- **Falha no meio**: tudo é validado antes da primeira gravação; a aba Itens é gravada numa única escrita (sem apagar antes); solicitações e conferências, cada uma numa escrita. Se o script parar no meio, a verificação automática avisa e basta importar a mesma planilha de novo: os itens já criados são reconhecidos, as solicitações não se repetem e nada é lançado em dobro.

## Carga de dados fictícios da homologação (`apps-script/Homologacao.gs`)

Arquivo **só para o Apps Script da planilha "PIER GESTÃO - HOMOLOGAÇÃO"**. Nunca cole no Apps Script oficial e não leve para a produção. O site não consegue chamar essas funções: elas rodam só pelo editor.

O que faz: esvazia Itens, Movimentacoes, Emprestimos, Contagens, OS, Demandas, Preventivas, Pendencias, Auditoria e Acessos (fica o cabeçalho, os formatos, as validações e as proteções), apaga as abas ocultas "Itens (cópia de …)", troca os locais da Config por "Almoxarifado Teste", "Área Técnica Teste" e "Oficina Teste", zera o estado interno (retrato de saldos, bloqueios, sessões, tentativas de login, marcas de importação) e cadastra três materiais fictícios no setor Manutenção (MAN-0001 20 un, MAN-0002 10 un, MAN-0003 15 un), cada um com o lançamento "Saldo inicial da carga de homologação" e registro na Auditoria. Não mexe em Usuarios, Perfis, outras linhas da Config, no segredo das senhas (`SEG_SEGREDO`), nas pastas configuradas nem em arquivo nenhum do Drive. Grava `PEND_SEMEADA` para a lista de pendências embutida no código não ser recriada.

Travas (todas precisam passar): ID diferente do da planilha oficial; nome com "HOMOLOGAÇÃO"; propriedade `AMBIENTE` = `homologacao`; propriedade `HOMOLOG_PLANILHA_ID` = ID da própria planilha; na aba Usuarios só `admin.teste1`, `admin.teste2`, `manut.teste` (ativos, senha já protegida, ID da conta, sem telefone) e `limpeza.teste` (desativado, opcional); cabeçalhos de todas as abas completos; `SEG_SEGREDO` e as duas pastas de teste presentes.

Uso: `simularCargaHomologacao()` só lê e mostra no registro o que será feito e um código (vale 15 minutos) → crie a propriedade `CONFIRMAR_CARGA` com o código → `executarCargaHomologacao()`. Se a planilha mudar depois da simulação, o código deixa de valer. Concluída, a marca `HOMOLOG_CARGA_FEITA` recusa novas execuções (para repetir de propósito, apague a marca). Se parar no meio, fica `HOMOLOG_CARGA_ANDAMENTO`: simule e execute de novo; a rotina limpa antes de carregar e usa IDs fixos, sem duplicar saldos nem lançamentos.

## Levar a homologação para a produção (só com autorização expressa)

Teste antes numa **cópia** da planilha:
1. Arquivo → Fazer uma cópia da planilha oficial (o Apps Script vem junto). Na cópia, apague a coluna Telefone da aba Usuarios (para não mandar WhatsApp à equipe) e digite senhas novas de teste na coluna Senha (a cópia tem outro segredo, as senhas antigas não funcionam lá).
2. No Apps Script da **cópia**, cole o `apps-script/Codigo.gs` da branch `homologacao`, rode `autorizar` e depois `instalarRecuperacao` e `protegerPlanilha`. Implante como App da Web (Executar como: eu; Qualquer pessoa) e use esse link /exec só no `config.js` de teste.
3. Teste: contagem e aprovação com dois logins de Administração, edição direta de um saldo na cópia (o item deve bloquear em até 10 min), liberação, importação da planilha antiga duas vezes.

Na produção, com autorização:
1. Faça uma cópia de segurança da planilha oficial e guarde o código atual do Apps Script.
2. Leve a branch para a `main` mantendo o `config.js` da `main` e **sem** o arquivo `apps-script/Homologacao.gs`.
3. Cole o `Codigo.gs` novo no Apps Script oficial e rode `autorizar` (cria a aba Contagens, as colunas novas, os IDs das contas e o primeiro retrato dos saldos). O Google vai pedir autorização nova, porque o código agora pode criar acionadores.
4. Implantar → Gerenciar implantações → editar → Nova versão (o link não muda).
5. Acionador e proteções: só se autorizados. Crie a propriedade do script `LIBERAR_ACIONADOR_OFICIAL` = `sim`, rode `instalarRecuperacao`; rode `protegerPlanilha` e `verificarProtecao`.
6. Para voltar atrás: Gerenciar implantações → editar → escolher a versão anterior; `removerRecuperacao`; reverter o commit na `main`. Abas e colunas novas podem ficar, não atrapalham a versão antiga.

## Se mudar o código do Apps Script

Depois de colar uma versão nova, rode a função `autorizar` uma vez pelo editor (quando o código pedir uma permissão nova, como o Drive das fotos) e use **Implantar → Gerenciar implantações → editar (lápis) → Versão: Nova versão → Implantar**. Assim o link continua o mesmo e o `config.js` não precisa mudar.
