function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // Esperar hasta 30 segundos

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const timestamp = new Date();

    // --- MANEJO DEL FORMULARIO DE AFILIADOS ---
    // Revisa si vienen los campos del formulario de afiliados (usamos 'message' como identificador)
    if (e.parameter.message) {
      var sheet = doc.getSheetByName("Programa Afiliados");

      var socialPlatforms = {
        instagram: { name: "Instagram", url: "https://instagram.com/" },
        facebook: { name: "Facebook", url: "https://facebook.com/" },
        tiktok: { name: "TikTok", url: "https://tiktok.com/@" },
        x: { name: "X", url: "https://x.com/" },
        linkedin: { name: "LinkedIn", url: "https://linkedin.com/in/" },
        youtube: { name: "YouTube", url: "https://youtube.com/" },
      };

      if (!sheet) {
        sheet = doc.insertSheet("Programa Afiliados");
        var headers = [
          "Fecha y Hora",
          "Nombre",
          "Email",
          "Teléfono",
          "País",
          "Región",
          "Ciudad",
          "Sitio Web",
          "Mensaje",
          "Foto de Perfil",
        ].concat(Object.values(socialPlatforms).map((p) => p.name));
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }

      var headers = sheet
        .getRange(1, 1, 1, sheet.getLastColumn())
        .getValues()[0];
      if (headers.join("").length === 0) {
        var newHeaders = [
          "Fecha y Hora",
          "Nombre",
          "Email",
          "Teléfono",
          "País",
          "Región",
          "Ciudad",
          "Sitio Web",
          "Mensaje",
          "Foto de Perfil",
        ].concat(Object.values(socialPlatforms).map((p) => p.name));
        sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
      }

      var name = e.parameter.name || "";
      var email = e.parameter.email || "";
      var phone = e.parameter.phone || "";
      var country = e.parameter.country || "";
      var region = e.parameter.region || "";
      var city = e.parameter.city || "";
      var originalWebsite = e.parameter.website || "";
      var website = originalWebsite; // Initialize with original value
      var message = e.parameter.message || "";
      var profilePictureUrl = e.parameter.profilePictureUrl || "";

      var socialValues = {};
      for (var platformId in socialPlatforms) {
        socialValues[platformId] = e.parameter[platformId] || "";
      }

      if (
        website &&
        !website.startsWith("http://") &&
        !website.startsWith("https://")
      ) {
        website = "https://" + website;
      }

      var newRowData = [
        timestamp, // Use the common timestamp
        name,
        email,
        phone,
        country,
        region,
        city,
        originalWebsite ? originalWebsite : "", // Use originalWebsite here
        message,
        profilePictureUrl ? "Ver Foto" : "",
      ];

      var socialColumns = Object.keys(socialPlatforms).map(function (
        platformId
      ) {
        return socialValues[platformId] || "";
      });

      sheet.appendRow(newRowData.concat(socialColumns));

      var lastRow = sheet.getLastRow();

      if (originalWebsite) {
        // Use originalWebsite for the check
        sheet
          .getRange(lastRow, 8)
          .setFormula(
            '=HYPERLINK("' + website + '";"' + originalWebsite + '")'
          );
      }

      if (profilePictureUrl) {
        sheet
          .getRange(lastRow, 10)
          .setFormula('=HYPERLINK("' + profilePictureUrl + '";"Ver Foto")');
      }

      var headerList = sheet
        .getRange(1, 1, 1, sheet.getLastColumn())
        .getValues()[0];
      Object.keys(socialPlatforms).forEach(function (platformId) {
        var username = socialValues[platformId];
        if (username) {
          var platformInfo = socialPlatforms[platformId];
          var colIndex = headerList.indexOf(platformInfo.name) + 1;
          if (colIndex > 0) {
            var url = platformInfo.url + username;
            sheet
              .getRange(lastRow, colIndex)
              .setFormula('=HYPERLINK("' + url + '";"' + username + '")');
          }
        }
      });
    }
    // --- MANEJO DEL FORMULARIO DE LA TIENDA ---
    // Revisa si solo viene el campo de email (del formulario de la tienda)
    else if (e.parameter.email) {
      const SHEET_NAME = "Notificacion Tienda";
      const sheet = doc.getSheetByName(SHEET_NAME);

      if (!sheet) {
        // If the sheet doesn't exist, create it and add headers.
        const newSheet = doc.insertSheet(SHEET_NAME);
        newSheet.appendRow(["Fecha y Hora", "Email", "Subscripcion"]);
      } else if (sheet.getLastRow() === 0) {
        // If the sheet exists but is empty, add headers.
        sheet.appendRow(["Fecha y Hora", "Email", "Subscripcion"]);
      }

      const newRow = [timestamp, e.parameter.email, e.parameter.subscribe];
      sheet.appendRow(newRow);
    }
    // Si no coincide con ninguno de los formularios
    else {
      throw new Error("Datos de formulario no válidos.");
    }

    return ContentService.createTextOutput(
      JSON.stringify({ result: "success" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
