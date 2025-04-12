# [BOTI DAST]()

BOTI é uma empresa de segurança de software independente, construindo software de segurança para sua equipe.

Use BOTI para escanear seu software em busca de vulnerabilidades e problemas de licenças de código aberto. Gere e ingira SBOMs. Exporte relatórios para padrões da indústria. Governe suas dependências de código aberto. Execute o escaneador de vulnerabilidades BOTI DAST contra suas aplicações web ou APIs. Escaneie seus contêineres Docker em busca de vulnerabilidades. Verifique seu código-fonte em busca de problemas com análise SAST.

## Requisitos
- [Docker](https://www.docker.com/get-started)
- Ter sua aplicação ou site acessível via URL.

## Como Usar
Para iniciar a varredura, você precisa executar este comando de um terminal:
``` shell
docker run -it --rm boti/dast <parâmetros>
```

O comando básico para executar uma varredura de linha de base seria assim:
`docker run -it --rm boti/dast --clientId=<SEU_CLIENT_ID> --apiKey=<SUA_API_KEY> --projectName="<NOME_DO_SEU_PROJETO>" <URL_DO_SEU_ALVO>`

### Argumentos

| Argumento | Obrigatório | Descrição |
| --- | --- | --- |
| `targetURL` | Sim | URL Alvo - URL do site ou API a ser escaneada. A URL deve incluir o protocolo. Ex: https://www.exemplo.com |

### Parâmetros do Cliente

| Argumento | Padrão | Descrição |
| --- | --- | --- |
| `--ajaxSpider` |  | Ajax Spider - Usa o spider ajax além do tradicional. Informações adicionais: https://www.zaproxy.org/docs/desktop/addons/ajax-spider/ |
| `--authDelayTime` | `5` | Tempo de atraso em segundos para aguardar o carregamento da página após realizar ações no formulário. (Usado apenas em authFormType: wait_for_password e multi_page) |
| `--authFormType` | `simple` | simple (todos os campos são exibidos de uma vez), wait_for_password (campo de senha é exibido somente após o nome de usuário ser preenchido) ou multi_page (campo de senha é exibido somente após o nome de usuário ser preenchido e o envio ser clicado) |
| `--authLoginURL` |  | URL de login a ser usada quando a autenticação é necessária |
| `--authPassword` |  | Senha a ser usada quando a autenticação é necessária |
| `--authPasswordField` |  | ID do campo de entrada de senha a ser usado quando a autenticação é necessária |
| `--authSecondSubmitField` |  | ID/nome/XPath do segundo botão de envio a ser usado quando a autenticação é necessária (para formulários de várias páginas) |
| `--authSubmitAction` |  | Ação de envio a ser realizada no formulário preenchido. Opções: click ou submit |
| `--authSubmitField` |  | ID/nome/XPath do botão de envio a ser usado quando a autenticação é necessária |
| `--authUsername` |  | Nome de usuário a ser usado quando a autenticação é necessária |
| `--authUsernameField` |  | ID do campo de entrada de nome de usuário a ser usado quando a autenticação é necessária |
| `--authVerificationURL` |  | URL usada para verificar o sucesso da autenticação, deve ser uma URL que se espera que lance 200/302 durante qualquer autenticação authFormType. Se a autenticação falhar quando esta URL for fornecida, a varredura será terminada. Suporta URL simples ou URL regex.|
| `--bearerToken` |  | Token bearer para autenticar |
| `--branchName` |  | O nome da ramificação do Sistema SCM |
| `--branchURI` |  | O URI para a ramificação do Sistema SCM |
| `--buildURI` |  | URI para informações de compilação CI |
| `--buildVersion` |  | Versão dos artefatos de compilação do aplicativo |
| `--commitHash` |  | O valor do hash de commit do Sistema SCM |
| `--contextFile` |  | Arquivo de contexto que será carregado antes de escanear o alvo |
| `--debug` |  | Ativa o registro de depuração para ZAP. |
| `--excludeUrlsFile` | | Caminho para um arquivo contendo URLs regex para excluir, um por linha. por exemplo `--excludeUrlsFile=exclude_urls.txt`
| `--disableRules` |  | Lista separada por vírgula de IDs de regras ZAP para desabilitar. Lista para referência https://www.zaproxy.org/docs/alerts/ |
| `--exportFormat`   |  | Escreva o resultado da varredura neste formato de arquivo. Opções: CsafVex, CycloneDx, Sarif, Spdx, BotiIssues, BotiLicenses, BotiPackages, BotiVulnerabilities |
| `--exportFileType` |  | Escreva o resultado da varredura neste tipo de arquivo (quando usado com exportFormat). Opções: Csv, Html, Json, Text, Xml                                       |
| `--fullScanMinutes` |  | Número de minutos para o spider executar |
| `--logLevel` |  | Nível mínimo para mostrar logs: DEBUG INFO, WARN, FAIL, ERROR. |
| `--oauthParameters` |  | Parâmetros a serem adicionados à requisição de token OAuth. (por exemplo --oauthParameters="client_id:clientID, client_secret:clientSecret, grant_type:client_credentials") |
| `--oauthTokenUrl` |  | A URL de autenticação que concede o access_token. |
| `--onFailure` | `continue_on_failure` | Ação a ser realizada quando a varredura falha. Opções: fail_the_build, continue_on_failure |
| `--operatingEnvironment` |  | Definir ambiente operacional apenas para fins de informação |
| `--otherOptions` |  | Argumentos adicionais de linha de comando para itens não suportados pelo conjunto de parâmetros acima |
| `--projectName` |  | Nome do Projeto - isso é o que será exibido no aplicativo BOTI |
| `--requestHeaders` |  | Definir solicitações de cabeçalho extras |
| `--scanMode` | `baseline` | Modo de Varredura - Modos disponíveis: baseline, fullscan e apiscan (para mais informações sobre modos de varredura, visite https://github.com/boti/boti-dast#scan-modes) |

## Modos de Varredura

### Baseline

Ele executa o spider [ZAP](https://www.zaproxy.org/docs/docker/about/) contra o alvo especificado por (por padrão) 1 minuto e depois espera que a varredura passiva seja concluída antes de relatar os resultados.

Isso significa que o script não executa nenhum 'ataque' real e será executado por um período relativamente curto (alguns minutos no máximo).

Por padrão, ele relata todos os alertas como AVISOs, mas você pode especificar um arquivo de configuração que pode alterar qualquer regra para `FAIL` ou `IGNORE`.

Este modo é destinado a ser ideal para execução em um ambiente `CI/CD`, mesmo contra sites de produção.

### Full Scan

Ele executa o spider [ZAP](https://www.zaproxy.org/docs/docker/about/) contra o alvo especificado (por padrão sem limite de tempo) seguido por uma varredura opcional de ajax spider e, em seguida, uma `Varredura Ativa` completa antes de relatar os resultados.

Isso significa que o script executa 'ataques' reais e pode potencialmente ser executado por um longo período de tempo. Você NÃO deve usá-lo em aplicativos web que não sejam de sua propriedade. `Varredura Ativa` pode encontrar apenas certos tipos de vulnerabilidades. Vulnerabilidades lógicas, como controle de acesso quebrado, não serão encontradas por qualquer varredura ativa ou automatizada de vulnerabilidade. Testes manuais de penetração devem sempre ser realizados além da varredura ativa para encontrar todos os tipos de vulnerabilidades.

Por padrão, ele relata todos os alertas como AVISOs, mas você pode especificar um arquivo de configuração que pode alterar qualquer regra para FAIL ou IGNORE. A configuração funciona de maneira muito semelhante ao [Modo Baseline](#baseline)

### API Scan

Ele é ajustado para realizar varreduras contra APIs definidas por `openapi`, `soap` ou `graphql` por meio de um arquivo local ou uma URL.

Para apontar para um arquivo local, use a seguinte sintaxe:
```
docker run -v <caminho-absoluto-para-arquivo-local>:/zap/wrk/:rw -it --rm boti/dast --clientId=<cliente>--apiKey=<apiKey> --projectName=<nome do projeto api> --scanMode=apiscan --apiScanFormat=openapi swagger.yaml
```

Certifique-se de que o arquivo local ainda aponte para o endpoint ao vivo de sua API. Por exemplo, para YAML `openapi`, você definiria a seção `servers`:
```
servers:
  - url: https://minhaapi.exemplo.com
```

NOTA: O nome DNS da API sendo escaneada deve ser resolvido pelo contêiner Docker. Use um endereço IP se isso não for possível.

Ele importa a definição que você especifica e, em seguida, executa uma `Varredura Ativa` contra as URLs encontradas. A `Varredura Ativa` é ajustada para APIs, então não se preocupa em procurar coisas como `XSSs`.

Ele também inclui 2 scripts que:
- Levantam alertas para quaisquer códigos de resposta de erro do servidor HTTP
- Levantam alertas para quaisquer URLs que retornem tipos de conteúdo que não são geralmente associados a APIs

## Referências
 - [ZAP](https://www.zaproxy.org/)
 - [Docker](https://docs.docker.com/)


### Notas
Certifique-se de usar o registro público para instalação de pacotes NPM:
 `npm install --registry https://registry.npmjs.org/` 

Certifique-se de aguardar que todas as ações sejam concluídas antes de marcar, liberar, etc.
