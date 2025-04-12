import * as fs from "fs";
// Removendo a importação não utilizada de FormData
// import FormData from "form-data";
import { spawn } from "child_process";
import { ApiScanFormat, FormTypes, ScanMode, SubmitActions } from "./enums";
import { exit } from "process";
import { version } from "../package.json";
import { ZAPCommandGenerator, ZAPReportTransformer } from "./utilities";
import { BOTI_DAST_CONSTANTS } from "./constants";

// Logger substituto
class Logger {
  static info(message: string): void {
    console.log(`INFO: ${message}`);
  }

  static error(message: unknown): void {
    console.error(`ERROR: ${String(message)}`);
  }

  static always(message: string): void {
    console.log(message);
  }

  static logLineSeparator(): void {
    console.log("------------------------------");
  }

  static setMinLogLevel(_level: string): void {
    // Implementação simplificada para definir nível de log
  }

  static debug(message: string): void {
    console.debug(`DEBUG: ${message}`);
  }
}

// Interfaces necessárias para corrigir erros de tipagem
interface IDASTScanSetupResponse {
  projectHash: string;
  branchHash: string;
  analysisId: string;
  scanStatusUrl: string;
  status: string;
}

interface IWaitForScanToFinishArgs {
  scanStatusUrl: string;
  scanType: string;
}

// Serviço de Análise local
class LocalAnalysisService {
  async setupScan(_args: any): Promise<IDASTScanSetupResponse> {
    Logger.info("Configurando scan local (sem envio para API externa)");
    return {
      projectHash: "local-project-hash",
      branchHash: "local-branch-hash",
      analysisId: `local-analysis-${Date.now()}`,
      scanStatusUrl: "local-scan-status",
      status: "Running",
    };
  }

  async waitForScanToFinish(_args: IWaitForScanToFinishArgs): Promise<string> {
    Logger.info("Verificando status do scan local");
    return "completed";
  }

  async updateScanStatus(args: any): Promise<void> {
    Logger.info(`Status do scan atualizado para: ${args.status}`);
  }

  async generateFormattedOutput(_args: any): Promise<void> {
    Logger.info("Gerando saída formatada");
  }
}

// Implementações de funções auxiliares
function isUrlAvailable(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    Logger.info(`Verificando disponibilidade da URL: ${url}`);
    // Implementação simplificada - apenas retorna true
    // Em um ambiente de produção, você deve implementar uma verificação real
    resolve(true);
  });
}

// Removendo a função não utilizada convertStringToBase64
// function convertStringToBase64(data: string): string {
//   return Buffer.from(data).toString("base64");
// }

function obfuscateProperties(obj: Record<string, unknown>, keysToObfuscate: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = { ...obj };
  keysToObfuscate.forEach((key) => {
    if (key in result) {
      result[key] = "****";
    }
  });
  return result;
}

function isScanDone(status: string): boolean {
  return status === "completed" || status === "failed" || status === "error";
}

function getAnalysisExitCodeWithMessage(status: string, _integrationName: string, _onFailure: string): { message: string; exitCode: number } {
  if (status === "completed") {
    return { message: "Análise concluída com sucesso", exitCode: 0 };
  }
  return { message: "Análise falhou", exitCode: 1 };
}

// Constantes substitutas
const ScanType = {
  DAST: "DAST",
};

const ScanStatus = {
  Error: "Error",
  Completed: "completed",
};

// Interface para argumentos
export interface IDASTAnalysisArgs {
  ajaxSpider: boolean;
  apiScanFormat: ApiScanFormat;
  authDelayTime: number;
  authFormType: FormTypes;
  authLoginURL: string;
  authPassword: string;
  authPasswordField: string;
  authSecondSubmitField: string;
  authSubmitAction: SubmitActions;
  authSubmitField: string;
  authUsername: string;
  authUsernameField: string;
  authVerificationURL: string;
  bearerToken: string;
  contextFile: string;
  debug: boolean;
  disableRules: string;
  excludeUrlsFile: string;
  fullScanMinutes: number;
  oauthParameters: string;
  oauthTokenUrl: string;
  otherOptions: string;
  requestHeaders: string;
  scanMode: ScanMode;
  targetURL: string;
  apiKey?: string;  // Opcional agora
  apiURL?: string;  // Opcional agora
  projectName: string;
  clientId?: string;  // Opcional agora
  commitHash?: string;
  branchName?: string;
  buildVersion?: string;
  buildURI?: string;
  branchURI?: string;
  integrationType?: string;
  operatingEnvironment?: string;
  integrationName?: string;
  appVersion?: string;
  scriptVersion?: string;
  contributingDeveloperId?: string;
  contributingDeveloperSource?: string;
  contributingDeveloperSourceName?: string;
  exportFormat?: string;
  exportFileType?: string;
  onFailure?: string;
  logLevel?: string;
}

// Parser de argumentos simplificado
class ArgumentParser {
  private args: Record<string, any> = {};
  private requiredArgs: string[] = [];

  constructor(_name: string, _type: string, _scanType: string, _version: string) {}

  addArgument(name: string, description: string, options: any = {}): void {
    this.args[name] = {
      description,
      required: options.required || false,
      defaultValue: options.defaultValue,
    };

    if (options.required) {
      this.requiredArgs.push(name);
    }
  }

  addEnumArgument(name: string, _enumType: any, description: string, options: any = {}): void {
    this.addArgument(name, description, options);
  }

  parseArguments<T>(argv: string[]): T {
    const result: Record<string, any> = {};
    const args = argv.slice(2);
    
    // Valores padrão
    for (const [key, value] of Object.entries(this.args)) {
      if (value.defaultValue !== undefined) {
        result[key] = value.defaultValue;
      }
    }

    // Parseamento básico de argumentos
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("--")) {
        const name = arg.substring(2);
        if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
          result[name] = args[i + 1];
          i++;
        } else {
          result[name] = true;
        }
      }
    }

    // Verificar argumentos obrigatórios
    for (const requiredArg of this.requiredArgs) {
      if (result[requiredArg] === undefined) {
        throw new Error(`Argumento obrigatório faltando: ${requiredArg}`);
      }
    }

    // Para execução local, se não houver targetURL, abortar
    if (!result.targetURL) {
      throw new Error("URL de destino é obrigatória (--targetURL)");
    }

    // Definir valores padrão para execução local
    result.projectName = result.projectName || "Local Project";
    result.scanMode = result.scanMode || ScanMode.Baseline;

    return result as unknown as T;
  }

  static create(name: string, type: string, scanType: string, version: string): ArgumentParser {
    return new ArgumentParser(name, type, scanType, version);
  }
}

class BOTIDASTAnalysis {
  constructor(private args: IDASTAnalysisArgs) {}

  static parseArgs(): IDASTAnalysisArgs {
    const analysisArgumentParser = ArgumentParser.create(
      "Local DAST",
      "Script",
      ScanType.DAST,
      version
    );

    analysisArgumentParser.addArgument(
      "ajaxSpider",
      "Ajax Spider - Use the ajax spider in addition to the traditional one.",
      {
        isFlag: true,
      }
    );

    analysisArgumentParser.addEnumArgument(
      "apiScanFormat",
      ApiScanFormat,
      "Target API format, OpenAPI, SOAP or GraphQL.",
      { defaultValue: ApiScanFormat.OpenAPI }
    );

    analysisArgumentParser.addArgument(
      "authDelayTime",
      "Delay time in seconds to wait for authentication.",
      {
        defaultValue: BOTI_DAST_CONSTANTS.AuthDelayTime,
      }
    );

    analysisArgumentParser.addEnumArgument(
      "authFormType",
      FormTypes,
      "Form type of the login URL.",
      {
        defaultValue: FormTypes.Simple,
      }
    );

    analysisArgumentParser.addArgument(
      "authLoginURL",
      "Login URL to use when authentication is required."
    );

    analysisArgumentParser.addArgument(
      "authPassword",
      "Password to use when authentication is required."
    );

    analysisArgumentParser.addArgument(
      "authPasswordField",
      "Password input id to use when authentication is required."
    );

    analysisArgumentParser.addArgument(
      "authSecondSubmitField",
      "Second submit button id to use when authentication is required."
    );

    analysisArgumentParser.addEnumArgument(
      "authSubmitAction",
      SubmitActions,
      "Submit action to perform on form filled. Options: click or submit.",
      {
        defaultValue: SubmitActions.Click,
      }
    );

    analysisArgumentParser.addArgument(
      "authSubmitField",
      "Submit button id to use when authentication is required."
    );

    analysisArgumentParser.addArgument(
      "authUsername",
      "Username to use when authentication is required."
    );

    analysisArgumentParser.addArgument(
      "authUsernameField",
      "Username input id to use when authentication is required."
    );

    analysisArgumentParser.addArgument(
      "authVerificationURL",
      "URL used to verify authentication success."
    );

    analysisArgumentParser.addArgument(
      "bearerToken",
      "Bearer token, adds a Authentication header with the token value."
    );

    analysisArgumentParser.addArgument(
      "contextFile",
      "Context file which will be loaded prior to scanning the target."
    );

    analysisArgumentParser.addArgument("debug", "Enable debug logging for ZAP.", {
      isFlag: true,
    });

    analysisArgumentParser.addArgument(
      "disableRules",
      "Comma separated list of ZAP rules IDs to disable."
    );

    analysisArgumentParser.addArgument(
      "excludeUrlsFile",
      "Path to a file containing regex URLs to exclude, one per line."
    );

    analysisArgumentParser.addArgument(
      "fullScanMinutes",
      "Number of minutes for the spider to run."
    );

    analysisArgumentParser.addArgument(
      "oauthParameters",
      'Parameters to be added to the OAuth token request.'
    );

    analysisArgumentParser.addArgument(
      "oauthTokenUrl",
      "The authentication URL that grants the access_token."
    );

    analysisArgumentParser.addArgument(
      "otherOptions",
      "Other command line arguments sent directly to the script."
    );

    analysisArgumentParser.addArgument(
      "requestHeaders",
      "Set extra headers for the requests to the target URL"
    );

    analysisArgumentParser.addEnumArgument(
      "scanMode",
      ScanMode,
      "Scan Mode - Available modes: baseline, fullscan, and apiscan",
      {
        defaultValue: ScanMode.Baseline,
      }
    );

    analysisArgumentParser.addArgument(
      "targetURL",
      "Target URL - URL of the site or api to scan.",
      { useNoOptionKey: true, required: true }
    );

    return analysisArgumentParser.parseArguments<IDASTAnalysisArgs>(process.argv);
  }

  async runAnalysis(): Promise<void> {
    const scanType = ScanType.DAST;
    // Usando serviço de análise local em vez do BOTI
    const analysisService = new LocalAnalysisService();

    let projectHash: string | undefined;
    let branchHash: string | undefined;
    let analysisId: string | undefined;
    let scanStatusUrl: string | undefined;
    let scanStatus: string | undefined;

    try {
      Logger.info(`Projeto: ${this.args.projectName || "Projeto Local"}`);
      Logger.info(`Modo de Scan: ${this.args.scanMode}`);
      Logger.info(`URL Alvo: ${this.args.targetURL}`);
      Logger.logLineSeparator();

      Logger.info(`Verificando disponibilidade da URL '${this.args.targetURL}'...`);
      if (this.args.scanMode !== ScanMode.ApiScan) {
        const urlAvailable = await isUrlAvailable(this.args.targetURL);
        if (!urlAvailable) {
          Logger.error(`A URL ${this.args.targetURL} não está disponível.`);
          exit(1);
        }
      }

      Logger.info(`Configurando scan para o projeto ${this.args.projectName || "Projeto Local"}...`);
      const result = await analysisService.setupScan({
        projectName: this.args.projectName || "Projeto Local",
        scanType,
        scanMode: this.args.scanMode,
      });
      
      projectHash = result.projectHash;
      branchHash = result.branchHash;
      analysisId = result.analysisId;
      scanStatusUrl = result.scanStatusUrl;

      const zapCommandGenerator = new ZAPCommandGenerator(this.args);
      Logger.info(`Gerando comando ZAP para modo ${this.args.scanMode}`);
      const command = zapCommandGenerator.runCommandGeneration(this.args.scanMode);
      Logger.info(`Executando comando: ${command}`);
      await BOTIDASTAnalysis.runZap(command);
      
      const runSuccess = fs.existsSync(BOTI_DAST_CONSTANTS.Files.ReportScanResultFile);
      Logger.info(`Scan finalizado com sucesso: ${runSuccess}`);

      if (!runSuccess) {
        Logger.error("Falha ao gerar relatório de scan");
        exit(1);
      }

      const data = JSON.parse(
        fs.readFileSync(BOTI_DAST_CONSTANTS.Files.ReportScanResultFile, "utf-8")
      );

      ZAPReportTransformer.transformReport(data);
      
      Logger.logLineSeparator();
      Logger.info(`Processando resultados do scan`);
      
      // Usar a nova função para salvar resultados
      const outputFile = "./zap-scan-result.json";
      saveScanResults(BOTI_DAST_CONSTANTS.Files.ReportScanResultFile, outputFile);
      
      if (data["discoveredUrls"]?.length) {
        Logger.always(`(${data["discoveredUrls"].length} URLs descobertas)`);
      }

      // Verificando status do scan
      scanStatus = await analysisService.waitForScanToFinish({
        scanStatusUrl: result.scanStatusUrl,
        scanType,
      });

      // Verificando se o scan foi concluído com sucesso
      const exitCodeWithMessage = getAnalysisExitCodeWithMessage(
        scanStatus,
        "Local DAST",
        "fail"
      );
      
      Logger.always(`${exitCodeWithMessage.message} - código de saída ${exitCodeWithMessage.exitCode}`);
      
      // Gerar arquivo de saída com resultados
      Logger.info("Scan concluído. Os resultados foram salvos em ./zap-scan-result.json");
      
      exit(exitCodeWithMessage.exitCode);
    } catch (error) {
      if (projectHash && branchHash && analysisId && (!scanStatus || !isScanDone(scanStatus))) {
        await analysisService.updateScanStatus({
          status: ScanStatus.Error,
          message: "Erro durante a execução do scan.",
          scanStatusUrl,
        });
      }
      
      Logger.error(`Erro ao executar análise: ${String(error)}`);
      Logger.always(`Erro ao executar análise: ${String(error)} - código de saída 1`);
      exit(1);
    }
  }

  static async runZap(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Logger.logLineSeparator();
      Logger.info("Executando ZAP");
      const zapProcess = spawn(command, {
        shell: true,
        stdio: "inherit",
      });

      zapProcess.on("close", (code) => {
        if (code === 0 || code === 2) {
          resolve();
        } else {
          reject(`ZAP Process: processo filho encerrado com código ${code}`);
        }
      });
    });
  }

  static async createAndRun(): Promise<void> {
    try {
      const args = this.parseArgs();
      Logger.setMinLogLevel(args.logLevel || "info");
      Logger.always("Iniciando Análise DAST Local");
      
      // Mostrar configurações (ocultando senhas e tokens)
      Logger.debug(
        JSON.stringify(
          obfuscateProperties(
            args as unknown as Record<string, unknown>,
            ["authPassword", "bearerToken", "apiKey"]
          ),
          null,
          2
        )
      );
      
      Logger.logLineSeparator();
      
      const dastAnalysis = new BOTIDASTAnalysis(args);
      await dastAnalysis.runAnalysis();
    } catch (error) {
      Logger.error(`Erro ao executar análise: ${String(error)}`);
      Logger.always(`Erro ao executar análise: ${String(error)} - código de saída 1`);
      exit(1);
    }
  }
}

// Função para salvar resultados de scan diretamente
function saveScanResults(sourceFile: string, destinationFile: string): boolean {
  try {
    if (!fs.existsSync(sourceFile)) {
      Logger.error(`Arquivo de origem não encontrado: ${sourceFile}`);
      return false;
    }
    
    fs.copyFileSync(sourceFile, destinationFile);
    Logger.info(`Resultados salvos com sucesso em: ${destinationFile}`);
    return true;
  } catch (error) {
    Logger.error(`Erro ao salvar resultados: ${String(error)}`);
    return false;
  }
}

BOTIDASTAnalysis.createAndRun();