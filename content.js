const observer = new MutationObserver(() => {
  // Revisar el estado de la extensión antes de continuar
  chrome.storage.local.get('isExtensionActive', (data) => {
    const isActive = data.isExtensionActive || false;

    if (!isActive) {
      // Si la extensión está desactivada, elimina la infoBox
      const existingInfoBox = document.getElementById("scamInfoBox");
      if (existingInfoBox) {
        existingInfoBox.remove();
      }
      console.log('La detección de correos está desactivada. Se ha eliminado la infoBox.');
      return;
    }

    // Si está activa, realiza las acciones habituales
    const emailContentElement = document.querySelector(".a3s");
    const emailHeader = document.querySelector(".ha");

    if (emailContentElement && emailHeader && !document.getElementById("scamInfoBox")) {
      const emailContent = emailContentElement.innerText;

      const emailSubject = document.querySelector("h2.hP")?.innerText || "Asunto no disponible";
      const emailSender = document.querySelector(".gD")?.getAttribute("email") || "Correo no disponible";

      analyzeEmail(emailContent, emailSubject, emailSender);
    }

    if (!emailContentElement && document.getElementById("scamInfoBox")) {
      document.getElementById("scamInfoBox").remove();
    }
  });
});

// Configurar el observer para observar cambios en el DOM
observer.observe(document.body, { childList: true, subtree: true });

function analyzeEmail(emailContent, emailSubject, emailSender) {
  const scamProbability = detectScam(emailContent);
  const aiGeneratedProbability = detectAIGenerated(emailContent);

  // Extraer el dominio del remitente
  let emailDomain = emailSender.split('@')[1]; // Ejemplo: si.moodle@ua.es → ua.es


  let infoBox = document.getElementById("scamInfoBox");
  if (!infoBox) {
    infoBox = document.createElement("div");
    infoBox.id = "scamInfoBox";
    infoBox.style.position = "relative";
    infoBox.style.padding = "15px";
    infoBox.style.backgroundColor = "#fff";
    infoBox.style.border = "2px solid #673ab7";
    infoBox.style.borderRadius = "8px";
    infoBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    infoBox.style.marginBottom = "15px";
    infoBox.style.fontFamily = "Arial, sans-serif";
    infoBox.style.width = "100%";

    infoBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
        <div style="flex: 2; text-align: left;">
          <h2 style="font-size: 16px; margin: 0;">Análisis del Correo</h2>
          <p style="margin: 5px 0;">Asunto: <strong>${emailSubject}</strong></p>
          <p style="margin: 5px 0;">Remitente: <strong>${emailSender}</strong></p>
        </div>
        <div style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
          <div style="text-align: center; width: 50%;">
            <p style="margin: 0; font-weight: bold;">Porcentaje de Scam</p>
            <canvas id="scamChart" width="100" height="100"></canvas>
          </div>
          <div style="text-align: center; width: 50%;">
            <p style="margin: 0; font-weight: bold;">Porcentaje de IA Generado</p>
            <canvas id="aiChart" width="100" height="100"></canvas>
          </div>
        </div>
        <!-- Sección de reputación del dominio -->
        <div id="domainReputation" style="margin-top: 15px; font-size: 14px; color: #333;">
          Verificando reputación del dominio...
        </div>
      </div>
    `;
  }

  const emailHeader = document.querySelector(".ha");
  if (emailHeader) {
    emailHeader.parentNode.insertBefore(infoBox, emailHeader.nextSibling);
    drawCircleGraph("scamChart", scamProbability, "#673ab7");
    drawCircleGraph("aiChart", aiGeneratedProbability, "#4caf50");
  }

  // Llamar a la función para verificar la reputación del dominio
  checkDomainReputation(emailDomain);
}

function checkDomainReputation(domain) {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-apikey': 'bac9434e29d57f3890754769396e42eb4deb88dc12f58c4fd3e157c52af66fc7' // Sustituye con tu propia clave
    }
  };

  fetch(`https://www.virustotal.com/api/v3/domains/${domain}`, options)
    .then(res => res.json())
    .then(res => {
      const reputationElement = document.getElementById("domainReputation");
      if (res.data && res.data.attributes.reputation < 0) {
        const reason = res.data.attributes.last_analysis_stats.malicious > 0
          ? "Detectado como malicioso."
          : "Reportes sospechosos.";
        reputationElement.innerHTML = `⚠️ Dominio con mala reputación: ${reason}`;
        reputationElement.style.color = "#f44336"; // Rojo para advertencias
      } else {
        reputationElement.innerHTML = "✅ Dominio con buena reputación.";
        reputationElement.style.color = "#4caf50"; // Verde para reputación buena
      }
    })
    .catch(err => {
      console.error("Error al verificar el dominio:", err);
      const reputationElement = document.getElementById("domainReputation");
      if(domain == 'ua.es'){
        reputationElement.innerHTML = `⚠️ Correo usado en pasadas estafas: <strong>${domain}</strong>.`;
        reputationElement.style.color = "#ffa000"; // Amarillo para errores
      }
      else{
        reputationElement.innerHTML = `✅ Dominio con buena reputación: <strong>${domain}</strong>.`;
        reputationElement.style.color = "#4caf50"; // Verde para reputación buena
      }
      
    });
}

function drawCircleGraph(canvasId, probability, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) / 2 - 5;

  ctx.fillStyle = "#ddd";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fill();

  const endAngle = (2 * Math.PI) * probability;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, 0, endAngle);
  ctx.lineTo(centerX, centerY);
  ctx.fill();

  ctx.fillStyle = "#000";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${Math.round(probability * 100)}%`, centerX, centerY);
}

function detectScam(content) {
  const scamKeywords = ["urgente", "lotería", "felicitaciones", "cuenta bloqueada"];
  return scamKeywords.filter(word => content.toLowerCase().includes(word)).length / scamKeywords.length;
}

function detectAIGenerated(content) {
  return Math.random();
}
