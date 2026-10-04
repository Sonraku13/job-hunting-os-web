function generateSingleCoverLetter(jobId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const jobsSheet = ss.getSheetByName("JOBS");
  const profileSheet = ss.getSheetByName("PROFILE");
  const appSheet = setupApplicationsSheet(ss);

  if (!profileSheet || !jobsSheet) return { success: false, message: "Sheet tidak ditemukan" };

  const profileRows = profileSheet.getDataRange().getValues();
  const targetRole = profileRows[1][1] || "Creative Professional";
  const skills = profileRows[1][2] || "";
  const candidateProfile = `Target Role: ${targetRole} | Skills: ${skills}`;

  const jobsData = jobsSheet.getDataRange().getValues();
  for (let i = 1; i < jobsData.length; i++) {
    if (jobsData[i][0] === jobId) {
      const company = jobsData[i][3];
      const jobTitle = jobsData[i][2];
      const jobDesc = jobsData[i][4];

      const systemPrompt = "Kamu adalah copywriter profesional. Buatlah draf Cover Letter dalam Bahasa Indonesia yang profesional, ringkas (maksimal 3 paragraf), dan persuasif.";
      const userPrompt = `Profil Kandidat:\n${candidateProfile}\n\nPerusahaan: ${company}\nPosisi: ${jobTitle}\nDeskripsi: ${(jobDesc || "").substring(0, 1000)}`;

      const clResponse = callZapiAIWithFallback(systemPrompt, userPrompt);

      let found = false;
      const appData = appSheet.getDataRange().getValues();
      for (let j = 1; j < appData.length; j++) {
        if (appData[j][0] === jobId) {
          appSheet.getRange(j + 1, 5).setValue(clResponse);
          found = true;
          break;
        }
      }
      if (!found) {
        appSheet.appendRow([jobId, "DRAFT_READY", new Date().toISOString(), "Manual generated", clResponse, "FALSE"]);
      }
      return { success: true, cover_letter: clResponse };
    }
  }
  return { success: false, message: "Job ID tidak ditemukan" };
}

function setupApplicationsSheet(ss) {
  let sheet = ss.getSheetByName("APPLICATIONS");
  if (!sheet) {
    sheet = ss.insertSheet("APPLICATIONS");
    sheet.getRange(1, 1, 1, 6).setValues([["job_id", "status", "applied_date", "notes", "cover_letter", "email_sent"]]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}