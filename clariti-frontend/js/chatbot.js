function appendChatMessage(log, text, type) {
  const message = document.createElement("div");
  message.className = `chat-msg ${type}`;
  message.textContent = text;
  log.appendChild(message);
  log.scrollTop = log.scrollHeight;
  return message;
}

function initChatPage() {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const log = document.getElementById("chat-log");
  if (!form || !input || !log) return;

  document.querySelectorAll(".prompt-chip").forEach((prompt) => {
    prompt.addEventListener("click", () => {
      input.value = prompt.textContent;
      input.focus();
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;

    appendChatMessage(log, question, "user");
    input.value = "";
    input.disabled = true;
    const waiting = appendChatMessage(log, "Consultando os dados...", "bot");

    try {
      waiting.textContent = await askClaritiAI(question);
    } catch {
      waiting.textContent = "Não consegui consultar agora. Tente novamente em instantes.";
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
}

document.addEventListener("DOMContentLoaded", initChatPage);
