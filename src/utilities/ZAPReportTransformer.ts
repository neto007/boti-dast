import * as fs from "fs";
import { BOTI_DAST_CONSTANTS } from "../constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportData = Record<string, any>;

// Função auxiliar para salvar os resultados do scan
export function saveScanResults(sourceFile: string, targetFile: string): void {
  try {
    // Se o arquivo de origem existir, copie para o destino
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`Resultados salvos em ${targetFile}`);
    } else {
      console.error(`Arquivo de origem ${sourceFile} não encontrado`);
    }
  } catch (error) {
    console.error(`Erro ao salvar resultados: ${error}`);
  }
}

export class ZAPReportTransformer {
  public static transformReport(reportData: ReportData): void {
    this.addDiscoveredUrls(reportData);
    this.obfuscateFields(reportData);
    this.saveReportContent(reportData);
    // Salvar URLs descobertas em arquivo separado
    this.writeLinesFile(
      reportData,
      "discoveredUrls",
      BOTI_DAST_CONSTANTS.Files.DiscoveredUrlsFile
    );
  }

  public static addDiscoveredUrls(reportData: ReportData): void {
    this.addArrayPropertyToReportFromFile(
      reportData,
      "discoveredUrls",
      BOTI_DAST_CONSTANTS.Files.DiscoveredUrlsFile,
    );
  }

  public static obfuscateFields(reportData: ReportData): void {
    for (const key in reportData) {
      if (typeof reportData[key] === "object" && reportData[key] !== null) {
        this.obfuscateFields(reportData[key]);
      } else {
        if (key === "request-header") {
          reportData[key] = this.obfuscateBearerToken(reportData[key]);
        }
      }
    }
  }

  private static addArrayPropertyToReportFromFile(
    reportData: ReportData,
    name: string,
    file: string,
  ): void {
    const lines =
      fs.existsSync(file) && fs.statSync(file).isFile()
        ? fs
            .readFileSync(file, "utf-8")
            .split("\n")
            .filter((line) => line.trim() !== "")
        : [];

    reportData[name] = lines;
  }

  private static obfuscateBearerToken(field: string): string {
    return field.replace(/(Authorization:\s*)[^\r\n]+/, "$1****");
  }

  private static writeLinesFile(
    reportData: ReportData,
    property: string,
    filename: string
  ): void {
    const urls: string[] = reportData[property] || [];
    fs.writeFileSync(filename, urls.join("\n"));
  }

  private static saveReportContent(reportData: ReportData): void {
    fs.writeFileSync(
      BOTI_DAST_CONSTANTS.Files.ReportScanResultFile,
      JSON.stringify(reportData, null, 4),
    );
  }
}
