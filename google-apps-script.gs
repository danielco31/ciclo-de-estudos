// Cole este código em Extensões > Apps Script de uma Planilha Google.
// Depois: Implantar > Nova implantação > App da Web
//   Executar como: Eu | Quem tem acesso: Qualquer pessoa

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);

  var backup = ss.getSheetByName('Dados') || ss.insertSheet('Dados');
  backup.getRange('A1').setValue(JSON.stringify(data.state));

  var sh = ss.getSheetByName('Progresso') || ss.insertSheet('Progresso');
  sh.clear();
  sh.appendRow(['Ordem', 'Matéria', 'Passagem', 'Bloco', 'Concluído', 'Concluído em']);
  if (data.rows.length) {
    sh.getRange(2, 1, data.rows.length, 6).setValues(data.rows);
  }
  sh.getRange(1, 1, 1, 6).setFontWeight('bold');

  return ContentService.createTextOutput('ok');
}

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var backup = ss.getSheetByName('Dados');
  var txt = backup ? backup.getRange('A1').getValue() : '{}';
  return ContentService.createTextOutput(txt || '{}')
    .setMimeType(ContentService.MimeType.JSON);
}
