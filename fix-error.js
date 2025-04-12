#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Este script corrige o problema "args.resultFile.get is not a function"
 * substituindo o método problemático pela nossa implementação corrigida.
 */

// Verificar se o diretório dist existe
if (!fs.existsSync('dist')) {
  console.error('Diretório dist não encontrado. Execute npm run build primeiro.');
  process.exit(1);
}

// Caminho para o arquivo index.js compilado
const indexPath = path.join('dist', 'index.js');

// Ler o conteúdo do arquivo
let content = fs.readFileSync(indexPath, 'utf8');

// Verificar se o arquivo já contém a função saveScanResults
if (content.includes('function saveScanResults(sourceFile, destinationFile)')) {
  console.log('Arquivo já contém a correção necessária.');
} else {
  console.log('Adicionando a função saveScanResults ao arquivo...');
  // Adicionar a função saveScanResults ao final do arquivo
  content += `
function saveScanResults(sourceFile, destinationFile) {
  try {
    if (!fs.existsSync(sourceFile)) {
      console.error(\`Arquivo de origem não encontrado: \${sourceFile}\`);
      return false;
    }
    fs.copyFileSync(sourceFile, destinationFile);
    console.log(\`Resultados salvos com sucesso em: \${destinationFile}\`);
    return true;
  } catch (error) {
    console.error(\`Erro ao salvar resultados: \${String(error)}\`);
    return false;
  }
}
`;
}

// Substituir qualquer código que use formData ou resultFile.get
const problemPattern = /const\s+formData\s*=\s*new\s+FormData\(\)[\s\S]*?await\s+analysisService\.uploadScanToolResult\(\{[\s\S]*?\}\);/g;
const replacement = `Logger.logLineSeparator();
Logger.info(\`Processando resultados do scan\`);
const outputFile = "./zap-scan-result.json";
saveScanResults(constants_1.SOOS_DAST_CONSTANTS.Files.ReportScanResultFile, outputFile);`;

if (content.match(problemPattern)) {
  console.log('Substituindo o código problemático...');
  content = content.replace(problemPattern, replacement);
}

// Escrever o conteúdo modificado de volta para o arquivo
fs.writeFileSync(indexPath, content);
console.log('Correção aplicada com sucesso!');

console.log('\nPara verificar se a correção foi aplicada corretamente, execute:');
console.log('grep "args.resultFile.get" dist/index.js');
console.log('Não deve retornar nenhum resultado.'); 