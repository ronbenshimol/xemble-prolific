// Configuration
const sheetName = 'Sheet1'
const scriptProp = PropertiesService.getScriptProperties()

/**
 * Initial setup function to save the spreadsheet ID and verify sheet exists.
 * Must be run manually before using the web app.
 */
function initialSetup () {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const id = activeSpreadsheet.getId()
  scriptProp.setProperty('key', id)
  console.log('Spreadsheet ID saved:', id)
  
  // Verify the sheet exists
  const sheet = activeSpreadsheet.getSheetByName(sheetName)
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found. Please check the sheet name.`)
  }
  console.log('Sheet verified:', sheetName)
}

/**
 * Checks if a submission with the given prolificPid already exists
 * @param {Sheet} sheet - The Google Sheet to check
 * @param {string} prolificPid - The Prolific participant ID
 * @returns {boolean} True if a duplicate exists, false otherwise
 */
function checkForDuplicate(sheet, prolificPid) {
  // Get all data from the sheet
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  
  // Find prolificPid column index
  const pidIndex = headers.indexOf('PROLIFIC_PID')
  
  // If column doesn't exist, return false
  if (pidIndex === -1) {
    return false
  }
  
  // Check each row (excluding header row)
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (String(row[pidIndex]) === String(prolificPid)) {
      return true
    }
  }
  
  return false
}

/**
 * Handles POST requests to the web app.
 * Writes form submission data to the spreadsheet.
 * @param {Object} e - The event object containing form data
 * @returns {TextOutput} JSON response indicating success or error
 */
function doPost (e) {
  const lock = LockService.getScriptLock()
  lock.tryLock(10000)

  try {
    // First verify we have the spreadsheet key
    const savedKey = scriptProp.getProperty('key')
    if (!savedKey) {
      throw new Error('Spreadsheet key not found. Please run initialSetup first.')
    }

    const doc = SpreadsheetApp.openById(savedKey)
    if (!doc) {
      throw new Error('Could not open spreadsheet. Invalid ID: ' + savedKey)
    }

    const sheet = doc.getSheetByName(sheetName)
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found in spreadsheet.`)
    }

    // Check for required prolificPid
    if (!e.parameter.PROLIFIC_PID) {
      throw new Error('Missing required field: prolificPid')
    }

    // Check for duplicate prolificPid
    const isDuplicate = checkForDuplicate(sheet, e.parameter.PROLIFIC_PID)
    if (isDuplicate) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          'result': 'error', 
          'error': 'Duplicate submission: This prolificPid already exists'
        }))
        .setMimeType(ContentService.MimeType.JSON)
    }

    // Get headers and prepare new row
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    const nextRow = sheet.getLastRow() + 1

    const newRow = headers.map(function(header) {
      return header === 'Timestamp' ? new Date() : e.parameter[header]
    })

    // Write the new row
    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow])

    return ContentService
      .createTextOutput(JSON.stringify({
        'result': 'success', 
        'row': nextRow,
        'data': e.parameter,
        'version':'1.3',
      }))
      .setMimeType(ContentService.MimeType.JSON)
  }
  catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        'result': 'error', 
        'error': error.toString(),
        'stack': error.stack,
        'parameters': e ? e.parameter : 'no parameters',
        'savedKey': scriptProp.getProperty('key') || 'no key found'
      }))
      .setMimeType(ContentService.MimeType.JSON)
  }
  finally {
    lock.releaseLock()
  }
}