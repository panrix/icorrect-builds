(() => {
  const state = {
    conversationId: null,
    initialDraft: "",
    loaded: false,
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(text, stateName = "loading") {
    els.connectionPill.textContent = text;
    els.connectionPill.dataset.state = stateName;
  }

  function setError(message) {
    if (!message) {
      els.errorBox.hidden = true;
      els.errorBox.textContent = "";
      return;
    }
    els.errorBox.hidden = false;
    els.errorBox.textContent = message;
  }

  function characters(value) {
    return `${value.length.toLocaleString()} characters`;
  }

  function conversationLabelFromPayload(payload) {
    const name = payload?.customer_name || payload?.customerName || payload?.name;
    const id = payload?.conversation_id || payload?.id || state.conversationId || "unknown";
    return name ? `${name} • ${id}` : id;
  }

  function bootstrapTelegram() {
    const webapp = window.Telegram?.WebApp;
    if (!webapp) {
      setStatus("Browser preview", "ready");
      return null;
    }

    webapp.ready();
    webapp.expand();
    webapp.disableVerticalSwipes?.();
    webapp.setHeaderColor?.("#0b1020");
    webapp.setBackgroundColor?.("#0b1020");
    return webapp;
  }

  function getConversationId() {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("id") ||
      params.get("conversation_id") ||
      params.get("conversationId") ||
      window.location.hash.replace(/^#/, "")
    );
  }

  function buildApiUrl() {
    const url = new URL(`/api/draft/${encodeURIComponent(state.conversationId)}`, window.location.origin);
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const tgWebAppData = params.get("tgWebAppData");

    if (token) {
      url.searchParams.set("token", token);
    }

    if (tgWebAppData) {
      url.searchParams.set("tgWebAppData", tgWebAppData);
    }

    return url.toString();
  }

  async function loadDraft() {
    if (!state.conversationId) {
      throw new Error("Missing conversation id in the URL.");
    }

    setStatus("Loading draft...", "loading");
    setError("");

    const response = await fetch(buildApiUrl(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(detail || `Failed to load draft (${response.status})`);
    }

    const payload = await response.json();
    const draftText = typeof payload === "string" ? payload : payload.draft_text || payload.draft || "";
    const reasonText = typeof payload === "object" && payload ? payload.reason || "" : "";

    state.initialDraft = draftText;
    els.draftInput.value = draftText;
    els.reasonInput.value = reasonText;
    els.pageTitle.textContent = payload.customer_name ? `Edit Reply - ${payload.customer_name}` : "Edit Reply";
    els.pageSubtitle.textContent = payload.customer_name
      ? "Review the reply for this conversation and adjust the wording if needed."
      : "Review the reply and adjust the wording if needed.";
    els.conversationLabel.textContent = conversationLabelFromPayload(payload);
    els.draftCount.textContent = characters(draftText);
    els.reasonCount.textContent = characters(reasonText);
    els.draftMeta.textContent = payload.category ? `Category: ${payload.category}` : "Draft loaded";

    state.loaded = true;
    setStatus("Ready", "ready");
  }

  function syncCounters() {
    els.draftCount.textContent = characters(els.draftInput.value);
    els.reasonCount.textContent = characters(els.reasonInput.value);
  }

  async function submitDraft(event) {
    event.preventDefault();

    if (!state.loaded) {
      return;
    }

    const editedText = els.draftInput.value.trim();
    const reason = els.reasonInput.value.trim();

    if (!editedText) {
      setError("Draft text cannot be empty.");
      return;
    }

    const submitButton = els.submitButton;
    submitButton.disabled = true;
    setStatus("Submitting...", "loading");
    setError("");

    try {
      const response = await fetch(buildApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          edited_text: editedText,
          reason,
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(detail || `Submit failed (${response.status})`);
      }

      setStatus("Saved", "ready");
      try {
        window.Telegram?.WebApp?.showPopup?.({
          title: "Saved",
          message: "Your edit has been saved.",
          buttons: [{ type: "ok" }],
        });
      } catch {
        // showPopup not supported in this client
      }
      window.Telegram?.WebApp?.close?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to submit edit.");
      setStatus("Error", "error");
      submitButton.disabled = false;
    }
  }

  function cancelEdit() {
    const webapp = window.Telegram?.WebApp;
    if (webapp?.close) {
      webapp.close();
      return;
    }
    window.history.back();
  }

  function bindEvents() {
    els.form.addEventListener("submit", submitDraft);
    els.cancelButton.addEventListener("click", cancelEdit);
    els.draftInput.addEventListener("input", syncCounters);
    els.reasonInput.addEventListener("input", syncCounters);
  }

  async function init() {
    els.connectionPill = $("connection-pill");
    els.draftMeta = $("draft-meta");
    els.pageTitle = $("page-title");
    els.pageSubtitle = $("page-subtitle");
    els.draftInput = $("draft-input");
    els.reasonInput = $("reason-input");
    els.draftCount = $("draft-count");
    els.reasonCount = $("reason-count");
    els.conversationLabel = $("conversation-label");
    els.submitButton = $("submit-button");
    els.cancelButton = $("cancel-button");
    els.errorBox = $("error-box");
    els.form = $("editor-form");

    bootstrapTelegram();
    bindEvents();

    state.conversationId = getConversationId();
    if (!state.conversationId) {
      setStatus("Missing conversation id", "error");
      setError("Open this editor from Telegram or include ?id=<conversation_id> in the URL.");
      els.submitButton.disabled = true;
      return;
    }

    els.conversationLabel.textContent = state.conversationId;
    syncCounters();

    try {
      await loadDraft();
    } catch (error) {
      setStatus("Failed to load", "error");
      setError(error instanceof Error ? error.message : "Failed to load draft.");
      els.submitButton.disabled = true;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
