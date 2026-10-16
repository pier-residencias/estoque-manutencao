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

Em **Itens → Importar inventário**, envie a planilha da contagem (.xlsx ou .csv). O sistema acha as colunas pelo título (Código, Item, Especificação, Categoria, Tipo, Un., Saldo atual ou Quantidade, Estoque mínimo, Localização, Observações), mostra uma prévia e grava a diferença de cada item como ajuste no histórico. Antes de gravar, guarda uma cópia oculta da aba Itens.

## Se mudar o código do Apps Script

Depois de colar uma versão nova, rode a função `autorizar` uma vez pelo editor (quando o código pedir uma permissão nova, como o Drive das fotos) e use **Implantar → Gerenciar implantações → editar (lápis) → Versão: Nova versão → Implantar**. Assim o link continua o mesmo e o `config.js` não precisa mudar.
